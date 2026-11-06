(() => {
  const params = new URLSearchParams(location.search);
  const normalizedPath = location.pathname.replace(/\/+$/, '');
  const loopbackHost = location.hostname === 'localhost'
    || location.hostname === '127.0.0.1'
    || location.hostname === '::1'
    || location.hostname === '[::1]';
  const fixtureMode = loopbackHost && normalizedPath === '/desktop/fixture';
  const requested = normalizedPath === '/desktop' || fixtureMode;
  const expectedQuery = params.get('desktop') === '1'
    && params.get('desktop_protocol_version') === '1'
    && params.getAll('desktop').length === 1
    && params.getAll('desktop_protocol_version').length === 1
    && location.hash === ''
    && [...params.keys()].every(key => key === 'desktop' || key === 'desktop_protocol_version');
  let bridge = null;
  let context = null;
  let access = null;
  let unsubscribe = null;
  let eventReceiver = null;
  let requestController = new AbortController();
  let documentStateTimer = 0;
  let documentStateChain = Promise.resolve();
  let pendingDocumentState = { dirty: false, pending_writes: 0 };

  const fail = (code, message, retryable = false) => Object.assign(new Error(message), { code, retryable });
  const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
  const validPermissions = new Set(['read', 'edit', 'comment', 'publish']);
  const waitForBridge = async () => {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const candidate = window.heartspaceDesktop;
      if (candidate) return candidate;
      await new Promise(resolve => window.setTimeout(resolve, 25));
    }
    return null;
  };

  const validateContext = value => {
    if (!isRecord(value)
      || value.protocol_version !== 1
      || value.app_id !== 'docs'
      || !isUuid(value.instance_id)
      || !isUuid(value.context_id)
      || !isUuid(value.account_epoch)
      || !isRecord(value.account)
      || !isUuid(value.account.id)
      || typeof value.account.email !== 'string'
      || value.account.email.length > 320
      || !isRecord(value.studio)
      || !isUuid(value.studio.id)
      || typeof value.studio.name !== 'string'
      || value.studio.name.length > 200
      || !isRecord(value.project)
      || !isUuid(value.project.id)
      || typeof value.project.name !== 'string'
      || value.project.name.length > 200
      || !Array.isArray(value.permissions)
      || !value.permissions.includes('read')
      || value.permissions.some(permission => !validPermissions.has(permission))
      || new Set(value.permissions).size !== value.permissions.length
      || !isRecord(value.intent)
      || value.intent.kind !== 'home') {
      throw fail('CONTEXT_INVALIDATED', 'O contexto fornecido pelo HeartSpace é inválido.');
    }
    return value;
  };

  const validateAccess = value => {
    if (!context || !isRecord(value)
      || value.protocol_version !== 1
      || value.context_id !== context.context_id
      || value.account_epoch !== context.account_epoch
      || !Number.isSafeInteger(value.revision)
      || value.revision < 1
      || typeof value.access_token !== 'string'
      || !value.access_token
      || value.access_token.length > 16384
      || !Number.isSafeInteger(value.expires_at_unix)
      || value.expires_at_unix <= Math.floor(Date.now() / 1000)
      || value.expires_at_unix > Math.floor(Date.now() / 1000) + 86400) {
      throw fail('CONTEXT_INVALIDATED', 'A sessão fornecida pelo HeartSpace é inválida.');
    }
    return value;
  };

  const replaceRequestController = () => {
    requestController.abort();
    requestController = new AbortController();
  };

  const refreshSession = async () => {
    if (!bridge || !context) throw fail('BRIDGE_UNAVAILABLE', 'A ponte do HeartSpace não está disponível.');
    const next = validateAccess(await bridge.getSession());
    if (!access || next.revision >= access.revision) access = next;
    return access;
  };

  const handleEvent = event => {
    if (!context || !isRecord(event) || event.protocol_version !== 1
      || event.context_id !== context.context_id || event.account_epoch !== context.account_epoch) return;
    if (event.type === 'session_changed') {
      if (!Number.isSafeInteger(event.revision) || (access && event.revision <= access.revision)) return;
      access = null;
      replaceRequestController();
    } else if (event.type === 'access_changed') {
      if (!Array.isArray(event.permissions) || !event.permissions.includes('read')
        || event.permissions.some(permission => !validPermissions.has(permission))) return;
      context = { ...context, permissions: [...new Set(event.permissions)] };
    } else if (event.type === 'session_ended' || event.type === 'access_revoked') {
      access = null;
      replaceRequestController();
    } else return;
    eventReceiver?.(event, context);
  };

  const start = async receiver => {
    if (!requested || !expectedQuery || window.top !== window) {
      throw fail('INVALID_REQUEST', 'Abra o Docs pelo HeartSpace.');
    }
    bridge = await waitForBridge();
    if (!bridge || bridge.protocolVersion !== 1
      || typeof bridge.ready !== 'function'
      || typeof bridge.getSession !== 'function'
      || typeof bridge.setDocumentState !== 'function'
      || typeof bridge.onEvent !== 'function') {
      throw fail('BRIDGE_UNAVAILABLE', 'Abra o Docs pelo HeartSpace.');
    }
    eventReceiver = typeof receiver === 'function' ? receiver : null;
    unsubscribe = bridge.onEvent(handleEvent);
    if (typeof unsubscribe !== 'function') throw fail('BRIDGE_UNAVAILABLE', 'A ponte do HeartSpace não pôde ser iniciada.');
    try {
      context = validateContext(await bridge.ready());
      access = await refreshSession();
      return { context, access };
    } catch (error) {
      unsubscribe();
      unsubscribe = null;
      eventReceiver = null;
      context = null;
      access = null;
      throw error;
    }
  };

  const reportDocumentState = state => {
    if (!bridge || !context || !isRecord(state)) return;
    const pendingWrites = Math.max(0, Math.min(1024, Number.isInteger(state.pending_writes) ? state.pending_writes : 0));
    pendingDocumentState = { dirty: Boolean(state.dirty), pending_writes: pendingWrites };
    clearTimeout(documentStateTimer);
    documentStateTimer = window.setTimeout(() => {
      const snapshot = { ...pendingDocumentState };
      documentStateChain = documentStateChain.catch(() => {}).then(() => bridge.setDocumentState(snapshot));
    }, 80);
  };

  const destroy = () => {
    clearTimeout(documentStateTimer);
    unsubscribe?.();
    unsubscribe = null;
    eventReceiver = null;
    access = null;
    replaceRequestController();
  };

  window.HeartspaceDocsDesktopAdapter = Object.freeze({
    requested,
    fixtureMode,
    expectedQuery,
    start,
    refreshSession,
    reportDocumentState,
    destroy,
    get context() { return context; },
    get access() { return access; },
    get requestSignal() { return requestController.signal; },
  });
})();
