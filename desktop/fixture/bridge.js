(() => {
  const loopbackHost = location.hostname === 'localhost'
    || location.hostname === '127.0.0.1'
    || location.hostname === '::1'
    || location.hostname === '[::1]';
  if (!loopbackHost) return;

  const IDS = Object.freeze({
    instance: '11111111-1111-4111-8111-111111111111',
    context: '22222222-2222-4222-8222-222222222222',
    epoch: '33333333-3333-4333-8333-333333333333',
    account: '44444444-4444-4444-8444-444444444444',
    studio: '55555555-5555-4555-8555-555555555555',
    project: '66666666-6666-4666-8666-666666666666',
    document: '77777777-7777-4777-8777-777777777777',
  });
  const API_HOST = 'yhjetfilhsjtjfvgqfod.supabase.co';
  const STORE_KEY = 'heartspace-docs-desktop-fixture-remote-v1';
  const listeners = new Set();
  const binaryObjects = new Map();
  let revision = 1;
  let permissions = ['read', 'edit', 'comment', 'publish'];
  let documentState = { dirty: false, pending_writes: 0 };
  let controls = null;

  const now = () => new Date().toISOString();
  const initialContent = () => ({
    format: 'heartspace-html-v1',
    title: 'Documento da fixture',
    subtitle: 'Ambiente local para validar a integração desktop.',
    body: '<p>Edite este documento para testar a ponte, o salvamento e os eventos do Core.</p>',
    is_notebook: false,
    status: 'draft',
    tags: ['fixture'],
    title_align: 'left',
    subtitle_align: 'left',
    layout: 'canvas',
    page: { size: 'a4', orientation: 'portrait', margin: 'normal' },
    trash: null,
  });
  const makeInitialStore = () => {
    const timestamp = now();
    return { documents: [{
      id: IDS.document,
      project_id: IDS.project,
      title: 'Documento da fixture',
      content: initialContent(),
      author: 'Fixture desktop',
      type: 'page',
      status: 'draft',
      created_at: timestamp,
      updated_at: timestamp,
    }], order: [] };
  };
  const loadStore = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (value && Array.isArray(value.documents) && Array.isArray(value.order)) return value;
    } catch (_) {}
    return makeInitialStore();
  };
  let store = loadStore();
  const persistStore = () => localStorage.setItem(STORE_KEY, JSON.stringify(store));
  persistStore();

  const context = () => ({
    protocol_version: 1,
    app_id: 'docs',
    instance_id: IDS.instance,
    context_id: IDS.context,
    account_epoch: IDS.epoch,
    account: { id: IDS.account, email: 'fixture@heartspace.local', name: 'Fixture desktop' },
    studio: { id: IDS.studio, name: 'Estúdio local' },
    project: { id: IDS.project, name: 'Projeto da fixture' },
    permissions: [...permissions],
    intent: { kind: 'home' },
  });
  const session = () => ({
    protocol_version: 1,
    context_id: IDS.context,
    account_epoch: IDS.epoch,
    revision,
    access_token: `fixture-access-token-${revision}`,
    expires_at_unix: Math.floor(Date.now() / 1000) + 3600,
  });
  const emit = event => {
    const payload = { protocol_version: 1, context_id: IDS.context, account_epoch: IDS.epoch, ...event };
    for (const listener of listeners) listener(payload);
  };
  const updateControls = () => {
    if (!controls) return;
    controls.querySelector('[data-role="session"]').textContent = `sessão r${revision}`;
    controls.querySelector('[data-role="access"]').textContent = permissions.includes('edit') ? 'edição' : permissions.includes('read') ? 'somente leitura' : 'revogado';
    controls.querySelector('[data-role="state"]').textContent = documentState.dirty || documentState.pending_writes
      ? `${documentState.pending_writes} gravação(ões) pendente(s)`
      : 'documento sincronizado';
  };

  window.heartspaceDesktop = Object.freeze({
    protocolVersion: 1,
    ready: async () => context(),
    getSession: async () => session(),
    setDocumentState: async state => {
      documentState = { dirty: Boolean(state?.dirty), pending_writes: Math.max(0, Number(state?.pending_writes) || 0) };
      updateControls();
    },
    onEvent: listener => {
      if (typeof listener !== 'function') throw new TypeError('listener inválido');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });

  const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
  const bodyJson = async request => {
    try { return await request.clone().json(); } catch (_) { return {}; }
  };
  const eqValue = (url, key) => {
    const value = url.searchParams.get(key) || '';
    return value.startsWith('eq.') ? value.slice(3) : value;
  };
  const touch = row => { row.updated_at = now(); return row; };
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url, location.href);
    if (url.origin === location.origin || url.protocol === 'blob:' || url.protocol === 'data:') return nativeFetch(input, init);
    if (url.hostname !== API_HOST) return json({ message: 'A fixture bloqueou uma conexão externa.' }, 403);

    const method = request.method.toUpperCase();
    const path = url.pathname;
    const authorized = (request.headers.get('Authorization') || '').startsWith('Bearer fixture-access-token-');
    if (!authorized) return json({ message: 'Fixture: sessão ausente.' }, 401);

    if (path === '/rest/v1/rpc/heartspace_project_access' && method === 'POST') {
      return json({ capabilities: {
        docs_view: permissions.includes('read'),
        docs_edit: permissions.includes('edit'),
        docs_comment: permissions.includes('comment'),
        manage_publications: permissions.includes('publish'),
      } });
    }
    if (path === '/rest/v1/docs' && method === 'GET') {
      const projectId = eqValue(url, 'project_id');
      return json(store.documents.filter(row => !projectId || row.project_id === projectId));
    }
    if (path === '/rest/v1/docs' && method === 'POST') {
      if (!permissions.includes('edit')) return json({ message: 'Fixture em somente leitura.' }, 403);
      const value = await bodyJson(request);
      const timestamp = now();
      const row = { ...value, id: crypto.randomUUID(), created_at: timestamp, updated_at: timestamp };
      store.documents.push(row); persistStore();
      return json([row], 201);
    }
    if (path === '/rest/v1/docs' && method === 'PATCH') {
      if (!permissions.includes('edit')) return json({ message: 'Fixture em somente leitura.' }, 403);
      const id = eqValue(url, 'id');
      const value = await bodyJson(request);
      const row = store.documents.find(item => item.id === id);
      if (!row) return json([]);
      Object.assign(row, value); touch(row); persistStore();
      return json([row]);
    }
    if (path === '/rest/v1/docs' && method === 'DELETE') {
      if (!permissions.includes('edit')) return json({ message: 'Fixture em somente leitura.' }, 403);
      const id = eqValue(url, 'id');
      const removed = store.documents.filter(item => item.id === id);
      store.documents = store.documents.filter(item => item.id !== id);
      persistStore();
      return json(removed);
    }
    if (path === '/rest/v1/rpc/heartspace_save_doc_content' && method === 'POST') {
      if (!permissions.includes('edit')) return json({ success: false, reason: 'forbidden' });
      const value = await bodyJson(request);
      const row = store.documents.find(item => item.id === value.p_doc_id);
      if (!row) return json({ success: false, reason: 'not_found' });
      row.content = value.p_content;
      row.author = value.p_author_name || row.author;
      touch(row); persistStore();
      return json({ success: true, updated_at: row.updated_at });
    }
    if (path === '/rest/v1/doc_order' && method === 'GET') return json(store.order);
    if (path === '/rest/v1/doc_order' && method === 'POST') {
      if (!permissions.includes('edit')) return json({ message: 'Fixture em somente leitura.' }, 403);
      const value = await bodyJson(request);
      store.order = Array.isArray(value) ? value : [value]; persistStore();
      return new Response(null, { status: 204 });
    }
    if (path === '/rest/v1/doc_presence' && method === 'GET') return json([]);
    if (path === '/rest/v1/doc_presence' && method === 'POST') return new Response(null, { status: 204 });
    if (path === '/rest/v1/doc_activity' && method === 'GET') return json([]);
    if (path === '/rest/v1/doc_revisions' && method === 'GET') return json([]);
    if (path.startsWith('/storage/v1/object/docs-assets/')) {
      const objectPath = decodeURIComponent(path.slice('/storage/v1/object/docs-assets/'.length));
      if (method === 'POST') { binaryObjects.set(objectPath, await request.blob()); return json({ Key: objectPath }, 201); }
      if (method === 'GET' && binaryObjects.has(objectPath)) return new Response(binaryObjects.get(objectPath));
      return json({ message: 'Imagem não encontrada na fixture.' }, 404);
    }
    return json({ message: `Rota não simulada pela fixture: ${method} ${path}` }, 404);
  };

  const mountControls = () => {
    if (!document.body || document.querySelector('#desktop-fixture-controls')) return;
    controls = document.createElement('aside');
    controls.id = 'desktop-fixture-controls';
    controls.innerHTML = `
      <strong>Fixture desktop</strong>
      <span data-role="session"></span><span data-role="access"></span>
      <small data-role="state"></small>
      <div>
        <button type="button" data-action="renew">Renovar sessão</button>
        <button type="button" data-action="readonly">Somente leitura</button>
        <button type="button" data-action="restore">Restaurar edição</button>
        <button type="button" data-action="revoke">Revogar</button>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      #desktop-fixture-controls{position:fixed;right:12px;bottom:12px;z-index:100000;display:grid;gap:6px;max-width:300px;padding:12px;border:1px solid #7441a6;border-radius:10px;background:#17151bcc;color:#f2edf6;font:12px/1.3 system-ui;box-shadow:0 8px 24px #0008;backdrop-filter:blur(10px)}
      #desktop-fixture-controls>span{display:inline-block;color:#c9b7d8}#desktop-fixture-controls small{color:#9ce7bd}#desktop-fixture-controls div{display:flex;flex-wrap:wrap;gap:5px}
      #desktop-fixture-controls button{padding:5px 7px;border:1px solid #4e4657;border-radius:6px;background:#28232e;color:inherit;cursor:pointer}#desktop-fixture-controls button:hover{border-color:#b06bea}`;
    controls.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.action;
      if (action === 'renew') { revision += 1; emit({ type: 'session_changed', revision }); }
      if (action === 'readonly') { permissions = ['read', 'comment']; emit({ type: 'access_changed', permissions: [...permissions] }); }
      if (action === 'restore') { permissions = ['read', 'edit', 'comment', 'publish']; emit({ type: 'access_changed', permissions: [...permissions] }); }
      if (action === 'revoke') { permissions = []; emit({ type: 'access_revoked' }); }
      updateControls();
    });
    document.head.append(style);
    document.body.append(controls);
    updateControls();
  };
  window.HeartspaceDesktopFixture = Object.freeze({ mountControls });
  window.addEventListener('load', mountControls);
})();
