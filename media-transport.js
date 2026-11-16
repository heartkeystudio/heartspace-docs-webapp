/* Cloud-only wire adapter. The editor, portable source and players keep complete media. */
(function (root) {
  'use strict';
  const VERSION = 1, BUCKET = 'docs-media', MiB = 1024*1024;
  const extensions = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/webm':'webm','audio/mp4':'m4a'};
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  const sha = async bytes => {
    if (!root.crypto?.subtle) fail('O envio de mídias requer um navegador com verificação SHA-256. A cópia local foi preservada.');
    return [...new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes))].map(byte => byte.toString(16).padStart(2,'0')).join('');
  };
  const limit = mime => mime.startsWith('image/') ? 4*MiB : 8*MiB;
  function reference(value,project) {
    if (!object(value) || value.schema_version !== VERSION || value.bucket !== BUCKET || value.project_id !== project || !/^[a-f0-9]{64}$/.test(value.sha256 || '') || !extensions[value.mime] || !Number.isSafeInteger(value.bytes) || value.bytes < 1 || value.bytes > limit(value.mime) || value.path !== `${project}/${value.sha256}.${extensions[value.mime]}`) fail('Uma mídia remota tem referência inválida, de outro projeto ou de versão desconhecida.');
    return {schema_version:VERSION,bucket:BUCKET,project_id:project,sha256:value.sha256,path:value.path,mime:value.mime,bytes:value.bytes};
  }
  function fromData(asset) {
    const kind = asset.mime?.split('/')[0];
    if (!['image','audio'].includes(kind)) fail('O tipo da mídia não é compatível com o transporte.');
    const valid = root.HeartspaceNarrativeMedia.normalize(asset,kind);
    if (!valid?.data) fail('Uma mídia está inválida ou excede o tamanho aceito; ela continua na cópia local.');
    const encoded = valid.data.slice(valid.data.indexOf(',')+1), raw = root.atob(encoded);
    return {asset:valid,blob:new Blob([Uint8Array.from(raw,char => char.charCodeAt(0))],{type:valid.mime})};
  }
  async function dataURL(blob) {
    return new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error || new Error('Não foi possível ler a mídia.')); reader.readAsDataURL(blob); });
  }
  // Cache is scoped by account and project, never by an untrusted remote URL.
  let opening;
  async function database() {
    if (!opening) opening = new Promise((resolve,reject) => {
      if (!root.indexedDB) return reject(new Error('Cache de mídias indisponível.'));
      const request = root.indexedDB.open('heartspace-docs-media-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('media');
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('O cache de mídias está ocupado.'));
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); opening = null; }; resolve(db); };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function cached(key) {
    const db = await database();
    return new Promise((resolve,reject) => { const request = db.transaction('media','readonly').objectStore('media').get(key); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error); });
  }
  async function cache(key,blob) {
    const db = await database();
    await new Promise((resolve,reject) => { const tx = db.transaction('media','readwrite'); tx.objectStore('media').put(blob,key); tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error || new Error('Não foi possível guardar a mídia.')); });
  }
  function create(o) {
    const verified = new Map(), uploading = new Map(), reading = new Map();
    const assert = context => { if (context !== o.context() || !o.project()) fail('O projeto ou a conta mudou durante o transporte da mídia.'); };
    const url = ref => `/storage/v1/object/${BUCKET}/${ref.path.split('/').map(encodeURIComponent).join('/')}`;
    const cacheKey = (ref,scope = o.scope()) => `${scope}:${ref.sha256}:${ref.mime}:${ref.bytes}`;
    async function verify(blob,ref) {
      if (!(blob instanceof Blob) || blob.size !== ref.bytes || await sha(await blob.arrayBuffer()) !== ref.sha256) fail('Os bytes da mídia não correspondem à referência; a cópia anterior foi preservada.');
      const result = fromData({mime:ref.mime,data:await dataURL(new Blob([blob],{type:ref.mime}))});
      if (ref.mime.startsWith('image/')) await root.HeartspaceImageOptimizer.validateOriginal(result.blob);
      return result.blob;
    }
    async function get(ref,context) {
      ref = reference(ref,o.project()); assert(context);
      const key = cacheKey(ref), jobKey = `${context}:${key}`;
      if (reading.has(jobKey)) return reading.get(jobKey);
      const task = (async () => {
        let blob = null;
        try { blob = await cached(key); } catch (_) { /* Full sources still have their offline snapshot. */ }
        assert(context);
        if (blob) { try { return await verify(blob,ref); } catch (_) { /* A damaged cache never replaces verified network bytes. */ } }
        blob = await o.request(url(ref),{responseKind:'blob',maximumBytes:ref.bytes,skipMedia:true}); assert(context);
        blob = await verify(blob,ref); assert(context);
        try { await cache(key,blob); } catch (_) { /* Source persistence remains the required durability barrier. */ }
        assert(context); return blob;
      })();
      reading.set(jobKey,task);
      try { return await task; } finally { if (reading.get(jobKey) === task) reading.delete(jobKey); }
    }
    async function upload(asset,context) {
      assert(context); if (!o.editable()) fail('Sua permissão de envio mudou; a mídia continua na cópia local.');
      const decoded = fromData(asset), bytes = await decoded.blob.arrayBuffer(), hash = await sha(bytes); assert(context);
      if (decoded.asset.project_ref && decoded.asset.project_ref.sha256 !== hash) fail('A mídia mudou em relação ao recurso de projeto fixado. Atualize ou desvincule esse recurso antes de enviar.');
      const ref = reference({schema_version:VERSION,bucket:BUCKET,project_id:o.project(),sha256:hash,path:`${o.project()}/${hash}.${extensions[decoded.asset.mime]}`,mime:decoded.asset.mime,bytes:decoded.blob.size},o.project());
      if (ref.mime.startsWith('image/')) await root.HeartspaceImageOptimizer.validateOriginal(decoded.blob);
      assert(context);
      const key = `${context}:${cacheKey(ref)}`;
      if (!verified.has(key)) {
        if (!uploading.has(key)) {
          const task = (async () => {
            // A private immutable object may already exist after a lost acknowledgment.
            try {
              await o.request(url(ref),{method:'POST',headers:{'Content-Type':ref.mime,'x-upsert':'false'},body:decoded.blob,skipMedia:true});
            } catch (error) {
              if (![400,409].includes(error.status)) throw error;
              const existing = await o.request(url(ref),{responseKind:'blob',maximumBytes:ref.bytes,skipMedia:true});
              await verify(existing,ref);
            }
            assert(context);
            const registered = await o.request('/rest/v1/rpc/heartspace_register_docs_media_v1',{method:'POST',desktopSafeRetry:true,skipMedia:true,body:JSON.stringify({p_project_id:ref.project_id,p_sha256:ref.sha256,p_mime:ref.mime,p_bytes:ref.bytes})});
            assert(context);
            if (!registered?.success) fail(registered?.reason === 'forbidden' ? 'Sua permissão para enviar mídias mudou; a cópia local foi mantida.' : registered?.reason === 'metadata_mismatch' ? 'O tamanho ou formato do arquivo remoto difere da mídia local. O envio foi interrompido para preservar seu projeto.' : 'O servidor não confirmou a mídia. O documento continua na fila local.');
            verified.set(key,true);
            // Only small confirmations stay in memory; binaries live in IndexedDB/source.
            if (verified.size > 2000) verified.delete(verified.keys().next().value);
            try { await cache(cacheKey(ref),decoded.blob); } catch (_) {}
          })();
          uploading.set(key,task);
          task.finally(() => { if (uploading.get(key) === task) uploading.delete(key); }).catch(() => {});
        }
        await uploading.get(key); assert(context);
      }
      return {...decoded.asset,data:undefined,storage_ref:ref};
    }
    async function transform(input,direction,context) {
      const output = clone(input), manifest = new Map(), resolved = new Map(), packed = new Map(); let nodes = 0;
      const collect = asset => { manifest.set(asset.storage_ref.sha256,asset.storage_ref); return asset; };
      const send = async asset => {
        const kind = typeof asset.mime === 'string' ? asset.mime.split('/')[0] : '';
        const valid = ['image','audio'].includes(kind) ? root.HeartspaceNarrativeMedia.normalize(asset,kind) : null;
        if (!valid?.data) fail('Uma mídia não pôde ser preparada; a fonte local foi preservada.');
        if (!packed.has(valid.data)) packed.set(valid.data,upload(valid,context));
        const stored = await packed.get(valid.data); assert(context);
        if (valid.project_ref && valid.project_ref.sha256 !== stored.storage_ref.sha256) fail('Um recurso vinculado não corresponde aos bytes da mídia.');
        return collect({...valid,data:undefined,storage_ref:stored.storage_ref});
      };
      const resolve = ref => { const key = `${ref.sha256}:${ref.mime}:${ref.bytes}`; if (!resolved.has(key)) resolved.set(key,get(ref,context).then(dataURL)); return resolved.get(key); };
      async function html(body) {
        if (!/data-docs-media|data:image\//i.test(body)) return body;
        const template = o.document.createElement('template'); template.innerHTML = body; let changed = false;
        for (const image of template.content.querySelectorAll('img')) {
          if (direction === 'pack' && image.getAttribute('src')?.startsWith('data:image/')) {
            const src = image.getAttribute('src'), mime = src.slice(5,src.indexOf(';'));
            let project_ref; if (image.dataset.projectRef) { try { project_ref = JSON.parse(image.dataset.projectRef); } catch (_) { fail('O vínculo da imagem do documento está inválido.'); } }
            const asset = await send({name:image.alt || '',mime,data:src,...(project_ref ? {project_ref} : {})});
            image.removeAttribute('src'); image.removeAttribute('data-local-image'); image.removeAttribute('data-remote-image');
            image.dataset.docsMedia = JSON.stringify(asset.storage_ref); changed = true;
          } else if (direction === 'unpack' && image.hasAttribute('data-docs-media')) {
            let ref; try { ref = JSON.parse(image.dataset.docsMedia); } catch (_) { fail('A referência de uma imagem do documento está inválida.'); }
            ref = reference(ref,o.project()); const data = await resolve(ref); assert(context);
            if (image.dataset.projectRef) {
              let linked; try { linked = root.HeartspaceNarrativeMedia.projectRef(JSON.parse(image.dataset.projectRef)); } catch (_) {}
              if (!linked || linked.sha256 !== ref.sha256) fail('O recurso vinculado da imagem não corresponde à mídia remota.');
            }
            image.setAttribute('src',data); image.removeAttribute('data-docs-media'); image.removeAttribute('data-local-image'); image.removeAttribute('data-remote-image'); changed = true;
          }
        }
        return changed ? template.innerHTML : body;
      }
      async function walk(value,depth = 0) {
        if (++nodes > 500000 || depth > 80) fail('A fonte contém elementos demais para transportar as mídias.');
        if (!value || typeof value !== 'object') return value;
        if (direction === 'pack' && object(value) && Object.hasOwn(value,'storage_ref')) fail('A fonte local contém uma referência remota sem seus bytes. Recupere a mídia antes de enviar.');
        if (direction === 'pack' && object(value) && typeof value.data === 'string' && value.data.startsWith('data:') && (value.mime?.startsWith('image/') || value.mime?.startsWith('audio/'))) return send(value);
        if (direction === 'unpack' && object(value) && Object.hasOwn(value,'storage_ref')) {
          const ref = reference(value.storage_ref,o.project());
          if (value.mime !== ref.mime || Object.hasOwn(value,'data')) fail('O envelope da mídia remota está inconsistente.');
          if (value.project_ref !== undefined) { const linked = root.HeartspaceNarrativeMedia.projectRef(value.project_ref); if (!linked || linked.sha256 !== ref.sha256) fail('O recurso de origem não corresponde à mídia remota.'); }
          const data = await resolve(ref); assert(context);
          const result = {...value,data}; delete result.storage_ref; return result;
        }
        if (Object.hasOwn(value,'_docs_media')) {
          if (direction === 'pack' || value._docs_media?.schema_version !== VERSION || !Array.isArray(value._docs_media.assets) || value._docs_media.assets.length > 10000) fail('O manifesto remoto de mídias usa um formato desconhecido.');
          value._docs_media.assets.forEach(ref => reference(ref,o.project())); delete value._docs_media;
        }
        if (value.format === 'heartspace-html-v1' && typeof value.body === 'string') value.body = await html(value.body);
        for (const [key,child] of Object.entries(value)) {
          // A small number of older rows encoded the content object as JSON text.
          if (direction === 'unpack' && key === 'content' && typeof child === 'string') {
            let parsed; try { parsed = JSON.parse(child); } catch (_) {}
            if (parsed?.format === 'heartspace-html-v1') { value[key] = await walk(parsed,depth+1); continue; }
          }
          value[key] = await walk(child,depth+1);
        }
        return value;
      }
      const result = await walk(output); assert(context);
      if (direction === 'pack' && manifest.size) result._docs_media = {schema_version:VERSION,assets:[...manifest.values()]};
      return result;
    }
    async function commit(kind,id,attempt) {
      const context = o.context(); assert(context);
      if (String(attempt.projectId).toLowerCase() !== o.project()) fail('O envio de mídia pertence a outro projeto.');
      if (attempt.transportVersion === undefined) {
        // Before this client, the same operation may have been accepted inline.
        const old = await o.request('/rest/v1/rpc/heartspace_resume_docs_sync_v1',{method:'POST',desktopSafeRetry:true,skipMedia:true,body:JSON.stringify({p_project_id:attempt.projectId,p_kind:kind,p_entity_id:id,p_operation_id:attempt.operationId,p_content:attempt.content,p_expected_updated_at:attempt.expectedToken,p_deleted:kind === 'book' ? attempt.deleted : false})});
        assert(context);
        if (old?.accepted && object(old.result)) return old.result;
        if (old?.reason !== 'not_accepted') fail('Não foi possível conferir a confirmação antiga. O envio foi preservado para revisão.');
        attempt.transportVersion = VERSION;
      }
      if (attempt.transportVersion !== VERSION) fail('Este envio usa uma versão de transporte desconhecida.');
      if (!attempt.wireContent) {
        attempt.wireContent = await transform(attempt.content,'pack',context); assert(context);
        await o.persist(); await o.durable(); assert(context);
      }
      const endpoint = {document:'heartspace_save_doc_v3',registry:'heartspace_save_narrative_registry_v3',book:'heartspace_save_book_v2'}[kind];
      if (!endpoint) fail('Tipo de envio de mídia desconhecido.');
      const payload = {p_project_id:attempt.projectId,p_operation_id:attempt.operationId,p_expected_updated_at:attempt.expectedToken};
      if (kind === 'document') Object.assign(payload,{p_doc_id:id,p_content:attempt.wireContent,p_author_name:o.author()});
      else if (kind === 'registry') payload.p_resources = attempt.wireContent;
      else Object.assign(payload,{p_book_id:id,p_content:attempt.wireContent,p_deleted:attempt.deleted});
      assert(context);
      if (!o.editable()) fail('Sua permissão mudou. O envio e a cópia local foram preservados.');
      return o.request(`/rest/v1/rpc/${endpoint}`,{method:'POST',desktopSafeRetry:true,body:JSON.stringify(payload)});
    }
    return {commit,receive:async value => o.project() && value && typeof value === 'object' ? transform(value,'unpack',o.context()) : value};
  }
  root.HeartspaceDocsMediaTransport = Object.freeze({create,reference,version:VERSION});
})(globalThis);
