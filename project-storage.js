/* Durable working copies. Project files remain explicit, portable saves. */
(function (root) {
  'use strict';
  let opening;
  const chains = new Map();
  const session = root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  function open() {
    if (!opening) opening = new Promise((resolve,reject) => {
      if (!root.indexedDB) { reject(new Error('O armazenamento de recuperação não está disponível neste navegador.')); return; }
      const request = root.indexedDB.open('heartspace-docs-projects-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('projects',{keyPath:'key'});
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir a recuperação local.'));
      request.onblocked = () => reject(new Error('Feche outras janelas do Docs para abrir a recuperação local.'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); opening = null; };
        resolve(db);
      };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function read(key) {
    try { await chains.get(key); } catch (_) { /* Recovery can still return the last committed version. */ }
    const db = await open();
    return new Promise((resolve,reject) => {
      const request = db.transaction('projects','readonly').objectStore('projects').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Não foi possível ler a recuperação local.'));
    });
  }
  function write(key,cache,legacy = '') {
    // One transaction per key, in invocation order. Commit completion is the acknowledgment.
    const task = (chains.get(key) || Promise.resolve()).catch(() => {}).then(async () => {
      const db = await open();
      await new Promise((resolve,reject) => {
        const transaction = db.transaction('projects','readwrite'), store = transaction.objectStore('projects');
        const request = store.get(key);
        request.onsuccess = () => {
          const previous = request.result;
          store.put({key,session,current:{cache,savedAt:new Date().toISOString()},
            previous:previous?.session !== session ? previous?.current || previous?.previous || null : previous?.previous || null,
            legacy:previous?.legacy || legacy || ''});
        };
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('Não foi possível salvar a recuperação local.'));
      });
    });
    chains.set(key,task);
    task.finally(() => { if (chains.get(key) === task) chains.delete(key); }).catch(() => {});
    return task;
  }
  async function listLocal() {
    const db = await open();
    return new Promise((resolve,reject) => {
      const entries = [], request = db.transaction('projects','readonly').objectStore('projects').openCursor();
      const summary = snapshot => snapshot ? {savedAt:snapshot.savedAt,name:snapshot.cache?.source?.project?.name || 'Projeto local',documents:snapshot.cache?.source?.documents?.length || 0} : null;
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve(entries.sort((a,b) => String(b.current?.savedAt || b.previous?.savedAt || '').localeCompare(String(a.current?.savedAt || a.previous?.savedAt || '')))); return; }
        const entry = cursor.value;
        if (typeof entry.key === 'string' && (entry.key === 'heartspace-docs-web-prototype-v1' || entry.key.startsWith('heartspace-docs-local:'))) entries.push({key:entry.key,current:summary(entry.current),previous:summary(entry.previous),legacy:Boolean(entry.legacy)});
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error('Não foi possível listar as recuperações locais.'));
    });
  }
  async function listScope(prefix) {
    if (typeof prefix !== 'string' || !prefix) throw new Error('Contexto de recuperação inválido.');
    const db = await open();
    return new Promise((resolve,reject) => {
      const entries = [], request = db.transaction('projects','readonly').objectStore('projects').openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve(entries.sort((a,b) => b.savedAt.localeCompare(a.savedAt))); return; }
        const entry = cursor.value;
        if (typeof entry.key === 'string' && entry.key.startsWith(prefix) && entry.current?.cache) entries.push({key:entry.key,savedAt:entry.current.savedAt || '',name:entry.current.cache.source?.project?.name || 'Projeto',documents:entry.current.cache.source?.documents?.length || 0});
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error('Não foi possível listar as cópias deste projeto.'));
    });
  }
  // One confirmed publication per account/project/document, shared by windows.
  // Compare-and-set happens inside IndexedDB, so two tabs cannot overwrite intent.
  async function publicationWrite(key,value,expectedOperationId) {
    if (!key.startsWith('heartspace-docs-publication:')) throw new Error('Contexto de publicação inválido.');
    const db = await open();
    return new Promise((resolve,reject) => {
      const tx = db.transaction('projects','readwrite'), store = tx.objectStore('projects');
      let failure = null;
      const get = store.get(key);
      get.onsuccess = () => {
        const current = get.result?.current?.cache || null;
        if (current?.operation_id !== (expectedOperationId || undefined) && !(value === null && current === null)) {
          failure = new Error('O pedido foi alterado em outra janela. Feche e abra a publicação para retomar o pedido protegido.'); tx.abort(); return;
        }
        store.put({key,session,current:{cache:value,savedAt:new Date().toISOString()},previous:null,legacy:''});
      };
      tx.oncomplete = resolve;
      tx.onerror = tx.onabort = () => reject(failure || tx.error || new Error('Não foi possível proteger o pedido de publicação.'));
    });
  }
  root.HeartspaceDocsProjectStorage = Object.freeze({read,write,listLocal,listScope,publicationWrite});
})(globalThis);
