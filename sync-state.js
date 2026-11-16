/* Durable sync metadata. Authoring sources and portable files do not contain this state. */
(function (root) {
  'use strict';
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const canonical = value => JSON.stringify(value,(_key,item) => object(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
  const equal = (a,b) => canonical(a) === canonical(b);
  const token = value => {
    if (!value) return '';
    const match = String(value).match(/^(\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(Z|[+-]\d\d:\d\d)$/);
    if (!match) return String(value);
    const seconds = Date.parse(match[1] + match[3]);
    return Number.isFinite(seconds) ? `${seconds/1000}.${(match[2] || '').padEnd(6,'0')}` : String(value);
  };
  const compareTokens = (a,b) => {
    const left = token(a), right = token(b);
    if (left === right) return 0;
    if (!/^-?\d+\.\d{6}$/.test(left) || !/^-?\d+\.\d{6}$/.test(right)) return null;
    const [ls,lf] = left.split('.'), [rs,rf] = right.split('.');
    return Number(ls) === Number(rs) ? (lf < rf ? -1 : 1) : (Number(ls) < Number(rs) ? -1 : 1);
  };
  const uuid = () => {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    if (!root.crypto?.getRandomValues) throw new Error('Este navegador não consegue identificar envios recuperáveis. Salve o projeto em arquivo.');
    const bytes = root.crypto.getRandomValues(new Uint8Array(16)); bytes[6] = bytes[6]&15|64; bytes[8] = bytes[8]&63|128;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2,'0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  };
  function attempt(value) {
    if (!value) return null;
    if (!object(value) || value.schema_version !== 1 || typeof value.operationId !== 'string' || !object(value.content) || typeof value.projectId !== 'string') throw new Error('Um envio pendente usa um formato desconhecido; a recuperação foi preservada.');
    return clone(value);
  }
  function recordState(value = {}) {
    return {remoteCreateId:typeof value.remoteCreateId === 'string' ? value.remoteCreateId : '',syncAttempt:attempt(value.syncAttempt),remoteMissing:value.remoteMissing === true,syncError:typeof value.syncError === 'string' ? value.syncError : ''};
  }
  function registryState(value = {}) {
    if (value.schema_version !== undefined && value.schema_version !== 1) throw new Error('O estado de sincronização dos recursos usa uma versão desconhecida.');
    return {schema_version:1,known:value.known === true,token:typeof value.token === 'string' ? value.token : '',dirty:value.dirty === true,
      editRevision:Number.isSafeInteger(value.editRevision) ? value.editRevision : 0,conflict:value.conflict === true,
      remote:object(value.remote) ? clone(value.remote) : null,attempt:attempt(value.attempt),error:typeof value.error === 'string' ? value.error : ''};
  }
  function workspace(value = {}) {
    if (value.schema_version !== undefined && value.schema_version !== 1) throw new Error('O estado de sincronização usa uma versão desconhecida.');
    if (value.recovery !== undefined && !Array.isArray(value.recovery)) throw new Error('As versões protegidas estão em formato inválido.');
    if ((value.recovery || []).some(item => !object(item) || typeof item.id !== 'string' || typeof item.label !== 'string' || typeof item.savedAt !== 'string' || !['document','registry','book'].includes(item.kind) || !object(item.resources) || item.kind === 'document' && !object(item.record) || item.kind === 'book' && (!object(item.book) || !Array.isArray(item.records)))) throw new Error('Uma versão protegida não pôde ser reconhecida; o armazenamento foi preservado.');
    return {schema_version:1,registry:registryState(value.registry),books:clone(value.books || {}),recovery:clone(value.recovery || [])};
  }
  function observe(local,remote,{focused = false} = {}) {
    if (!local) return remote;
    if (compareTokens(remote.remoteUpdatedAt,local.remoteUpdatedAt) === -1) return local;
    if (local.remoteVersion && compareTokens(remote.remoteUpdatedAt,local.remoteVersion.remoteUpdatedAt) === -1) return local;
    // An unresolved request must be replayed with its operation ID, not rebased by polling.
    if (local.syncAttempt) { local.remoteVersion = remote; local.remoteMissing = false; return local; }
    const changed = token(local.remoteUpdatedAt) !== token(remote.remoteUpdatedAt);
    if (local.dirty || local.remoteConflict || focused) {
      local.remoteMissing = false;
      if (changed) { local.remoteConflict = true; local.remoteVersion = remote; }
      else if (local.remoteConflict && !local.remoteVersion) { local.remoteConflict = false; local.syncError = ''; }
      return local;
    }
    remote.favorite = local.favorite;
    if ((remote.narrativeSequences || []).some(item => item.id === local.activeNarrativeSequenceId)) remote.activeNarrativeSequenceId = local.activeNarrativeSequenceId;
    return remote;
  }
  const api = Object.freeze({clone,equal,token,compareTokens,uuid,attempt,recordState,registryState,workspace,observe});
  root.HeartspaceDocsSync = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
