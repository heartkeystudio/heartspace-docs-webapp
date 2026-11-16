/* Independent book transport. Native authoring stays free of bindings and receipts. */
(function (root) {
  'use strict';
  const S = root.HeartspaceDocsSync;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function read(value = {}) {
    if (value.schema_version !== undefined && value.schema_version !== 1 || value.entries !== undefined && !Array.isArray(value.entries)) throw new Error('O estado dos livros usa um formato desconhecido; a cópia local foi preservada.');
    const entries = (value.entries || []).map(item => {
      if (!object(item) || typeof item.id !== 'string' || !item.id || item.deleted && !object(item.snapshot)) throw new Error('Um livro pendente não pôde ser reconhecido.');
      if (item.snapshot && (item.snapshot.schema_version !== 1 || item.snapshot.id !== item.id) || item.remote && (!object(item.remote.book) || item.remote.book.schema_version !== 1 || item.remote.book.id !== item.id)) throw new Error('Uma versão guardada do livro usa formato desconhecido.');
      return {...S.registryState(item),id:item.id,deleted:item.deleted === true,snapshot:object(item.snapshot) ? S.clone(item.snapshot) : null,remoteDeleted:item.remoteDeleted === true};
    });
    if (new Set(entries.map(item => item.id)).size !== entries.length) throw new Error('Há vínculos de livro duplicados no armazenamento.');
    return {schema_version:1,entries};
  }
  function create(o) {
    let state = read(), ready = '', loading = null, generation = 0;
    const sending = new Set(), histories = new Set();
    const close = () => { histories.forEach(dialog => dialog.close()); histories.clear(); };
    let applyCount = 0;
    const apply = (book,deleted) => { if (o.apply(book,deleted) !== false) applyCount++; };
    const entry = id => state.entries.find(item => item.id === id);
    const ensure = id => { let item = entry(id); if (!item) { item = {...S.registryState(),id,deleted:false,snapshot:null,remoteDeleted:false}; state.entries.push(item); } return item; };
    const content = id => { const item = entry(id); return item?.deleted ? item.snapshot : o.value(id); };
    const exists = context => context === o.context() && o.connected();
    const notify = () => o.changed();
    const pending = () => state.entries.filter(item => item.dirty || item.conflict || item.attempt);
    function mark(id,deleted = false,snapshot = null) {
      if (!o.connected()) return;
      const item = ensure(id);
      const before = snapshot || content(id);
      item.deleted = deleted; item.snapshot = deleted ? S.clone(before) : null;
      item.dirty = true; item.editRevision++; item.error = '';
      notify(); o.schedule();
    }
    function adopt(item,remote) {
      item.known = true; item.token = remote.token; item.remoteDeleted = remote.deleted;
      item.deleted = remote.deleted; item.snapshot = remote.deleted ? S.clone(remote.book) : null;
      item.dirty = false; item.conflict = false; item.remote = null; item.error = '';
      apply(remote.book,remote.deleted);
    }
    function observe(remote) {
      const item = ensure(remote.book.id), local = content(item.id);
      if (S.compareTokens(remote.token,item.token) === -1 || item.remote && S.compareTokens(remote.token,item.remote.token) === -1) return;
      if (item.attempt) { item.remote = remote; return; }
      const sameToken = item.known && S.token(item.token) === S.token(remote.token);
      if (sameToken) return;
      const sameContent = Boolean(local && S.equal(local,remote.book) && item.deleted === remote.deleted);
      const focused = o.focused(item.id), childrenPending = remote.deleted && o.childrenPending(item.id);
      // Old caches have no book base: compare their source before acquiring a binding.
      if (sameContent && focused && !childrenPending) {
        Object.assign(item,{known:true,token:remote.token,remoteDeleted:remote.deleted,dirty:false,conflict:false,remote:null,error:''});
        return;
      }
      if (!childrenPending && !focused && (sameContent || !local && !item.dirty || item.known && !item.dirty && !item.conflict)) adopt(item,remote);
      else {
        if (remote.deleted && childrenPending && !local) { apply(remote.book,false); item.deleted = false; item.snapshot = null; }
        item.conflict = true; item.remote = remote;
        item.error = remote.deleted ? 'Este livro foi removido do projeto. Seu planejamento e capítulos locais foram preservados para revisão.' : 'Há outra versão do livro. Compare antes de enviar o planejamento.';
      }
    }
    async function refresh() {
      if (!o.connected()) return;
      const context = o.context();
      if (loading?.context === context) return loading.promise;
      const version = generation, before = S.clone(state), booksBefore = o.books(), appliedBefore = applyCount;
      const promise = (async () => {
        try {
          const rows = [];
          for (let offset = 0;; offset += 200) {
            const page = await o.api(`/rest/v1/docs_books?${new URLSearchParams({select:'id,updated_at,deleted_at',project_id:`eq.${o.project()}`,order:'id.asc',limit:'200',offset:String(offset)})}`);
            if (!exists(context) || generation !== version) return;
            if (!Array.isArray(page)) throw new Error('O servidor não retornou o índice dos livros.');
            rows.push(...page); if (page.length < 200) break;
          }
          const seen = new Set();
          for (const header of rows) {
            seen.add(header.id);
            const item = entry(header.id);
            if (item?.known && S.token(item.token) === S.token(header.updated_at) || item?.remote && S.token(item.remote.token) === S.token(header.updated_at)) continue;
            const values = await o.api(`/rest/v1/docs_books?${new URLSearchParams({select:'id,content,updated_at,deleted_at',project_id:`eq.${o.project()}`,id:`eq.${header.id}`,limit:'1'})}`);
            if (!exists(context) || generation !== version) return;
            const row = values?.[0]; if (!row) throw new Error('Um livro mudou durante a leitura; a cópia local foi mantida.');
            if (row.content?.schema_version !== 1 || row.content.id !== row.id) throw new Error('Um livro remoto usa um formato desconhecido.');
            observe({book:o.normalize(row.content),token:row.updated_at,deleted:Boolean(row.deleted_at)});
          }
          if (!exists(context) || generation !== version) return;
          for (const item of state.entries) if (item.known && !seen.has(item.id)) {
            item.conflict = true; item.error = 'O livro não retornou do projeto. Confira o acesso; seu conteúdo local foi preservado.'; item.remote = null;
          }
          // A document read may have started before the server detached its parent.
          // Tombstones remain authoritative even when their header did not change.
          for (const item of state.entries) if (item.known && item.remoteDeleted && !item.dirty && !item.conflict && !item.attempt && item.snapshot) {
            if (o.childrenPending(item.id)) {
              const remote = {book:S.clone(item.snapshot),deleted:true,token:item.token};
              apply(remote.book,false); item.deleted = false; item.snapshot = null; item.conflict = true; item.remote = remote;
              item.error = 'Este livro foi removido; seus capítulos pendentes foram preservados. Escolha uma versão em Revisão.';
            } else apply(item.snapshot,true);
          }
          // New/local-only books, including empty books, become independent queued entities.
          for (const book of o.books()) if (!entry(book.id)) { const item = ensure(book.id); item.dirty = true; }
          const changed = appliedBefore !== applyCount || !S.equal(before,state) || !S.equal(booksBefore,o.books());
          if (changed) await o.persist();
          if (exists(context)) { ready = context; if (changed) notify(); }
        } catch (error) { if (exists(context)) { try { if (appliedBefore !== applyCount || !S.equal(before,state)) await o.persist(); } catch (_) {} o.error(error); notify(); } }
      })();
      loading = {context,promise};
      try { await promise; } finally { if (loading?.promise === promise) loading = null; }
    }
    async function save(id) {
      const item = entry(id), context = o.context(), sendKey = `${context}:${id}`;
      if (!item || !o.editable() || !exists(context) || ready !== context || item.conflict || sending.has(sendKey) || !item.dirty && !item.attempt || o.unavailable()) return false;
      sending.add(sendKey); notify();
      try {
        const value = content(id); if (!value) throw new Error('A fonte deste livro não está disponível para envio.');
        if (!item.attempt) item.attempt = {schema_version:1,transportVersion:1,operationId:S.uuid(),projectId:o.project(),expectedToken:item.known ? item.token || null : null,content:S.clone(value),deleted:item.deleted,editRevision:item.editRevision,createdAt:new Date().toISOString()};
        const attempt = item.attempt;
        if (attempt.projectId !== o.project() || attempt.content.id !== id || typeof attempt.deleted !== 'boolean') throw new Error('O envio guardado não pertence a este livro/projeto. Exporte a recuperação para conferir.');
        await o.persist(); await o.durable();
        if (!exists(context) || !o.editable()) return false;
        const result = await o.send(attempt,id);
        if (!exists(context)) return false;
        if (result?.conflict && result.remote_book) {
          const row = result.remote_book;
          if (row.content?.schema_version !== 1 || row.content.id !== id) throw new Error('A versão remota do livro usa um formato desconhecido.');
          item.attempt = null; item.conflict = true; item.remote = {book:o.normalize(row.content),deleted:Boolean(row.deleted_at),token:row.updated_at};
          throw new Error('Outra versão do livro chegou ao projeto; abra Revisão para comparar.');
        }
        if (!result?.success) {
          if (result?.reason === 'not_found') { item.conflict = true; item.attempt = null; }
          throw new Error(result?.reason === 'forbidden' ? 'Sua permissão mudou; o livro continua salvo localmente.' : 'O servidor não confirmou o livro. O envio foi preservado.');
        }
        generation++; item.known = true; item.token = result.updated_at; item.remoteDeleted = attempt.deleted;
        item.attempt = null; item.remote = null; item.conflict = false; item.error = '';
        item.dirty = item.editRevision !== attempt.editRevision || item.deleted !== attempt.deleted || !S.equal(content(id),attempt.content);
        await o.persist(); if (!exists(context)) return false;
        o.accepted(attempt.deleted); notify();
        if (item.dirty) o.schedule();
        return !item.dirty;
      } catch (error) {
        if (exists(context)) { item.dirty = true; item.error = o.error(error); try { await o.persist(); } catch (_) {} if (!item.conflict) o.schedule(); }
        return false;
      } finally { sending.delete(sendKey); if (exists(context)) notify(); }
    }
    async function drain(deleted = false) {
      if (ready !== o.context()) await refresh();
      const context = o.context();
      for (const item of pending().filter(item => item.deleted === deleted)) { if (!exists(context)) return; await save(item.id); }
    }
    async function parentReady(id) {
      if (!id) return true;
      if (ready !== o.context()) await refresh();
      const item = entry(id);
      if (!item || item.conflict || item.deleted || item.remoteDeleted && !item.dirty) return false;
      if (item.dirty || item.attempt) await save(id);
      return Boolean(item.known && !item.dirty && !item.attempt && !item.conflict && !item.remoteDeleted);
    }
    async function resolve(id,choice) {
      const item = entry(id), context = o.context(), remote = item?.remote;
      const sendKey = `${context}:${id}`;
      if (!item?.conflict || !remote || sending.has(sendKey) || choice === 'local' && !o.editable()) throw new Error('A comparação do livro mudou. Atualize a revisão.');
      const before = S.clone(content(id)), revision = item.editRevision, remoteSignature = S.clone(remote);
      await o.protect(before,remote.book,id);
      if (!exists(context) || entry(id) !== item || sending.has(sendKey) || revision !== item.editRevision || !S.equal(before,content(id)) || !S.equal(remoteSignature,item.remote)) throw new Error('O livro mudou durante a proteção. Compare novamente.');
      if (choice === 'local' && !o.editable()) throw new Error('Sua permissão mudou; as versões foram guardadas.');
      if (choice === 'remote') adopt(item,remote);
      else { item.known = true; item.token = remote.token; item.remoteDeleted = remote.deleted; item.remote = null; item.conflict = false; item.error = ''; item.dirty = true; item.editRevision++; }
      await o.persist(); if (!exists(context)) return;
      notify(); if (choice === 'local') await save(id);
    }
    async function history(id) {
      const context = o.context(), doc = o.document, dialog = doc.createElement('dialog'); dialog.className = 'sync-review';
      const heading = Object.assign(doc.createElement('h2'),{textContent:'Histórico do livro'}), status = doc.createElement('p'), list = doc.createElement('section'), close = Object.assign(doc.createElement('button'),{textContent:'Fechar'});
      close.onclick = () => dialog.close(); dialog.append(heading,status,list,close); doc.body.append(dialog); dialog.showModal(); histories.add(dialog); dialog.addEventListener('close',() => { histories.delete(dialog); dialog.remove(); },{once:true});
      let offset = 0, busy = false;
      const more = Object.assign(doc.createElement('button'),{textContent:'Carregar versões'}); dialog.insertBefore(more,close);
      const load = async () => {
        if (busy || !exists(context)) return; busy = true; more.disabled = true; status.textContent = 'Carregando…';
        try {
          const rows = await o.api(`/rest/v1/docs_book_revisions?${new URLSearchParams({select:'revision_number,created_at,origin,deleted',project_id:`eq.${o.project()}`,book_id:`eq.${id}`,order:'revision_number.desc',limit:'20',offset:String(offset)})}`);
          if (!dialog.open || !exists(context)) return;
          for (const row of rows) {
            const line = doc.createElement('p'), button = Object.assign(doc.createElement('button'),{textContent:'Guardar para recuperar'});
            line.append(doc.createTextNode(`Versão ${row.revision_number} · ${new Date(row.created_at).toLocaleString('pt-BR')} · ${row.deleted ? 'remoção' : row.origin === 'legacy-document' ? 'planejamento anterior de capítulo' : 'livro'} `),button); list.append(line);
            button.onclick = async () => {
              if (busy || !exists(context)) return; busy = true; button.disabled = true;
              try {
                const result = await o.api(`/rest/v1/docs_book_revisions?${new URLSearchParams({select:'content',project_id:`eq.${o.project()}`,book_id:`eq.${id}`,revision_number:`eq.${row.revision_number}`,limit:'1'})}`);
                if (!exists(context) || !dialog.open) return;
                if (result?.[0]?.content?.schema_version !== 1 || result[0].content.id !== id) throw new Error('A versão não está disponível neste formato.');
                await o.recoverHistory(o.normalize(result[0].content),`Livro · versão ${row.revision_number}`);
                status.textContent = 'Versão guardada nas cópias protegidas. Você pode exportá-la ou restaurar como rascunho.';
              } catch (error) { status.textContent = error.message; } finally { busy = false; button.disabled = false; }
            };
          }
          offset += rows.length; more.hidden = rows.length < 20; status.textContent = offset ? `${offset} versões carregadas.` : 'Ainda não há revisões.';
        } catch (error) { if (exists(context)) status.textContent = error.message; }
        finally { busy = false; more.disabled = false; }
      };
      more.onclick = () => void load(); await load();
    }
    return {read,refresh,save,drain,parentReady,resolve,history,mark,close,
      serialize:() => S.clone(state),reset:value => { const next = read(value); close(); state = next; ready = ''; loading = null; generation++; },
      tracked:id => Boolean(entry(id)),pending:() => pending().length,
      items:() => state.entries.map(item => ({...item,local:content(item.id),sending:sending.has(`${o.context()}:${item.id}`)})),
      block:id => Boolean(entry(id)?.deleted || entry(id)?.remoteDeleted || entry(id)?.conflict),
      restore:book => { apply(book,false); mark(book.id); }};
  }
  root.HeartspaceDocsBooks = Object.freeze({read,create});
})(globalThis);
