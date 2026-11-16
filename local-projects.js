/* Project file UI. The admitted desktop v1 window keeps its authorized project. */
(function (root) {
  'use strict';
  const signature = source => { const text = JSON.stringify(source); return `${text.length}:${root.HeartspaceNarrativeHtml.fingerprint(text)}`; };
  const filename = name => `${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').trim().slice(0,100) || 'projeto'}.hdocs`;
  function mount(options) {
    const doc = options.document, files = root.HeartspaceDocsProjectFiles;
    let contextKey = options.context().key, handle = null, attached = false, dirty = false, busy = false, edits = 0;
    let lastSignature = signature(options.snapshot().source), mode = 'save';
    const node = (tag,text) => { const result = doc.createElement(tag); if (text !== undefined) result.textContent = text; return result; };
    const button = (text,action) => { const result = node('button',text); result.type = 'button'; result.addEventListener('click',action); return result; };
    const menu = doc.querySelector('#actions-menu');
    const closeMenu = () => { menu.open = false; };
    const notice = node('aside'); notice.className = 'project-file-notice'; notice.hidden = true;
    const noticeText = node('span'); noticeText.setAttribute('role','status'); noticeText.setAttribute('aria-live','polite');
    let noticeTimer = 0;
    const dismissNotice = button('Fechar',() => { notice.hidden = true; });
    notice.append(noticeText,dismissNotice); doc.body.append(notice);
    function report(message,state = '') {
      options.status(message,state); noticeText.textContent = message; notice.hidden = false;
      root.clearTimeout(noticeTimer);
      if (!state) noticeTimer = root.setTimeout(() => { notice.hidden = true; },10000);
    }

    const current = context => { const now = options.context(); return context.key === now.key && context.epoch === now.epoch && !now.blocked; };
    function reset() { contextKey = options.context().key; handle = null; attached = false; dirty = false; edits = 0; lastSignature = signature(options.snapshot().source); }
    function changed(source) {
      if (contextKey !== options.context().key) { reset(); return; }
      const next = signature(source);
      if (next !== lastSignature) { lastSignature = next; edits++; if (attached) dirty = true; }
    }
    function edited() { if (contextKey !== options.context().key) reset(); edits++; if (attached) dirty = true; }
    const input = node('input'); input.type = 'file'; input.accept = '.hdocs,application/json'; input.hidden = true; doc.body.append(input);
    const dialog = node('dialog'); dialog.className = 'narrative-rules-dialog'; dialog.setAttribute('aria-labelledby','local-project-title');
    const form = node('form'); form.className = 'narrative-rules-form story-export-form';
    const heading = node('div'); heading.className = 'narrative-rules-heading';
    const title = node('h2','Salvar projeto'); title.id = 'local-project-title'; heading.append(title,button('Fechar',() => dialog.close()));
    const label = node('label','Nome do projeto'); const name = node('input'); name.type = 'text'; name.required = true; name.maxLength = 120; label.append(name);
    const help = node('p'); help.className = 'narrative-rules-help';
    const actions = node('div'); actions.className = 'narrative-rules-actions';
    const submit = node('button','Salvar arquivo .hdocs'); submit.type = 'submit'; actions.append(submit);
    form.append(heading,label,help,actions); dialog.append(form); doc.body.append(dialog);

    function canOpen() {
      if (options.desktopMode) { report('Abra arquivos .hdocs no modo local do Docs pelo navegador. Esta janela está vinculada ao projeto do HeartSpace.','pending'); return false; }
      if (options.context().blocked) { report('Aguarde a abertura do projeto ou restabeleça o acesso antes de trocar de área.','pending'); return false; }
      return true;
    }
    function newProject() {
      closeMenu(); if (busy || !canOpen()) return;
      mode = 'new'; title.textContent = 'Novo projeto local'; name.value = 'Meu projeto';
      help.textContent = 'A área atual permanece na recuperação local. O novo projeto começa vazio, sem vínculo com a nuvem.';
      submit.textContent = 'Criar projeto'; dialog.showModal(); name.select();
    }
    function save(as = false) {
      closeMenu(); if (busy) return;
      if (dialog.open) { form.requestSubmit(); return; }
      if (recovery.open) recovery.close();
      if (options.context().blocked) { report('Seu acesso precisa ser restabelecido antes de salvar uma cópia.','pending'); return; }
      if (contextKey !== options.context().key) reset();
      if (!as && handle) { void writeFile(false); return; }
      mode = 'save'; title.textContent = as ? 'Salvar projeto como' : 'Salvar projeto';
      const snapshot = options.snapshot(); name.value = snapshot.source.project.name;
      help.textContent = `${snapshot.source.books.length} livro(s)/prancheta(s), ${snapshot.source.documents.length} documento(s). Inclui planejamento, traduções, cenas e mídias. Onde o navegador não oferece salvamento direto, será baixada uma cópia .hdocs.`;
      submit.textContent = 'Salvar arquivo .hdocs'; dialog.showModal(); name.select();
    }
    async function writeFile(as,projectName) {
      if (busy) return;
      busy = true;
      const context = options.context();
      try {
        let destination = !as ? handle : null;
        // Invoke the picker within the click/submit activation, before media awaits.
        if (!destination && typeof root.showSaveFilePicker === 'function') {
          try { destination = await root.showSaveFilePicker({suggestedName:filename(projectName || options.snapshot().source.project.name),types:[{description:'Projeto HeartSpace Docs',accept:{'application/json':['.hdocs']}}]}); }
          catch (error) { if (!['SecurityError','NotSupportedError'].includes(error.name)) throw error; }
        }
        if (destination?.queryPermission && await destination.queryPermission({mode:'readwrite'}) !== 'granted') {
          const permission = await destination.requestPermission({mode:'readwrite'});
          if (permission !== 'granted') throw new Error('Sem permissão para gravar neste arquivo. Use Salvar projeto como para escolher outro destino.');
        }
        if (!current(context)) throw new Error('O projeto ou seu acesso mudou. Salve novamente no destino correto.');
        if (projectName) options.rename(projectName);
        options.flush();
        const cache = options.snapshot(), capturedEdits = edits;
        if (projectName) cache.source.project.name = projectName;
        const aliases = new Map(cache.workspace.documents.filter(item => item.sync?.remoteId).map(item => [item.sync.remoteId,item.id]));
        report('Preparando o projeto e suas mídias…','pending');
        const blob = await files.build(cache.source,{document:doc,resolveImage:options.loadImage,documentAliases:aliases});
        if (!current(context)) throw new Error('O projeto ou seu acesso mudou durante o salvamento.');
        if (destination) {
          const stream = await destination.createWritable();
          try {
            if (!current(context)) throw new Error('O projeto ou seu acesso mudou durante o salvamento.');
            await stream.write(blob);
            if (!current(context)) throw new Error('O projeto ou seu acesso mudou durante o salvamento.');
            await stream.close();
          } catch (error) { try { await stream.abort(); } catch (_) {} throw error; }
        } else {
          const url = URL.createObjectURL(blob), link = node('a'); link.href = url; link.download = filename(cache.source.project.name); link.hidden = true; doc.body.append(link); link.click(); link.remove();
          root.setTimeout(() => URL.revokeObjectURL(url),60000);
        }
        if (current(context)) {
          handle = destination; attached = true; dirty = capturedEdits !== edits;
          report(`${destination ? 'Arquivo do projeto salvo' : 'Download do projeto iniciado'}${dirty ? '; há alterações mais recentes na área de trabalho' : ''}.`);
        }
      } catch (error) {
        if (error.name !== 'AbortError') report(error.message || 'Não foi possível salvar o arquivo do projeto.','pending');
      } finally { busy = false; }
    }
    async function install(prepared,fileHandle = null) {
      const result = await options.install(prepared); reset(); handle = fileHandle; attached = Boolean(fileHandle); dirty = attached && result.removed > 0;
      report(`Projeto aberto no modo local${result.removed ? '; conteúdo ativo foi removido do documento' : ''}${!result.remembered ? '. A retomada automática não pôde ser registrada; use Recuperar projeto' : ''}.`);
    }
    async function openFile(file,fileHandle = null) {
      if (!file || busy || !canOpen()) return;
      busy = true; const context = options.context();
      try {
        report('Conferindo o projeto e suas mídias…','pending');
        const prepared = await files.read(file,{document:doc});
        if (!current(context)) throw new Error('A área de trabalho mudou durante a leitura. Abra o arquivo novamente.');
        await install(prepared,fileHandle);
      } catch (error) { report(error.message || 'Não foi possível abrir o projeto. A área atual foi preservada.','pending'); }
      finally { busy = false; }
    }
    async function open() {
      closeMenu(); if (busy || !canOpen()) return;
      if (dialog.open) dialog.close();
      if (recovery.open) recovery.close();
      if (typeof root.showOpenFilePicker !== 'function') { input.click(); return; }
      try {
        const [selected] = await root.showOpenFilePicker({multiple:false,types:[{description:'Projeto HeartSpace Docs',accept:{'application/json':['.hdocs']}}]});
        await openFile(await selected.getFile(),selected);
      } catch (error) {
        if (['SecurityError','NotSupportedError'].includes(error.name)) input.click();
        else if (error.name !== 'AbortError') report(error.message || 'Não foi possível abrir o seletor de arquivos.','pending');
      }
    }
    input.addEventListener('change',() => { const file = input.files?.[0]; input.value = ''; void openFile(file); });
    form.addEventListener('submit',event => {
      event.preventDefault(); const projectName = name.value.trim(); if (!projectName || busy) return; dialog.close();
      if (mode === 'save') { void writeFile(true,projectName); return; }
      busy = true;
      const source = root.HeartspaceDocsAuthoring.fromEditor({project:root.HeartspaceDocsAuthoring.createProject({name:projectName}),documents:[],libraryFolders:[],registry:{}});
      install({source,images:new Map()}).catch(error => report(error.message,'pending')).finally(() => { busy = false; });
    });

    const recovery = node('dialog'); recovery.className = 'narrative-rules-dialog'; recovery.setAttribute('aria-labelledby','local-recovery-title');
    const recoveryPanel = node('section'); recoveryPanel.className = 'narrative-rules-form story-export-form';
    const recoveryHeading = node('div'); recoveryHeading.className = 'narrative-rules-heading';
    const recoveryTitle = node('h2','Recuperar projeto'); recoveryTitle.id = 'local-recovery-title';
    recoveryHeading.append(recoveryTitle,button('Fechar',() => recovery.close()));
    const recoveryHelp = node('p','Cópias deste navegador. Recuperar abre uma área local separada e preserva a versão existente.'); recoveryHelp.className = 'narrative-rules-help';
    const list = node('div'); list.className = 'project-recovery-list'; list.setAttribute('role','list');
    recoveryPanel.append(recoveryHeading,recoveryHelp,list); recovery.append(recoveryPanel); doc.body.append(recovery);
    const recoveryRows = [];
    function addRecovery(info,date,label,load) {
      const row = node('div'); row.className = 'project-recovery-row'; row.setAttribute('role','listitem');
      const copy = node('div'), title = node('strong',info.name), detail = node('small',`${label}${Number.isInteger(info.documents) ? ` · ${info.documents} documento(s)` : ''}${date ? ` · ${new Date(date).toLocaleString()}` : ''}`);
      copy.append(title,detail);
      row.append(copy,button('Recuperar',() => {
        if (busy) return;
        const context = options.context(); recovery.close(); busy = true;
        Promise.resolve().then(load).then(source => { if (!current(context)) throw new Error('A área de trabalho mudou. Selecione a recuperação novamente.'); return install({source,images:new Map()}); }).catch(error => report(error.message,'pending')).finally(() => { busy = false; });
      }));
      recoveryRows.push(row); list.append(row);
    }
    async function recover() {
      closeMenu(); if (busy || !canOpen()) return;
      recoveryRows.length = 0; list.replaceChildren(node('p','Buscando cópias locais…')); recovery.showModal();
      try {
        if (!options.context().blocked) { options.flush(); try { await options.wait(); } catch (_) {} }
        const entries = await options.storage.listLocal(); if (!recovery.open) return; list.replaceChildren();
        for (const entry of entries) {
          for (const [key,kind,snapshot] of [['current','Última cópia local',entry.current],['previous','Sessão anterior',entry.previous]]) {
            if (!snapshot) continue;
            addRecovery(snapshot,snapshot.savedAt,kind,async () => {
              const stored = await options.storage.read(entry.key), source = stored?.[key]?.cache?.source;
              return root.HeartspaceDocsAuthoring.validate(source);
            });
          }
          if (entry.legacy) {
            addRecovery({name:entry.current?.name || entry.previous?.name || 'Projeto local'},'','Antes da migração',async () => {
              const stored = await options.storage.read(entry.key);
              const restored = root.HeartspaceDocsAuthoring.readCache(JSON.parse(stored.legacy),{project:stored.current.cache.source.project,registry:stored.current.cache.source.resources});
              return root.HeartspaceDocsAuthoring.fromEditor(restored);
            });
          }
        }
        try { const legacy = options.legacyRecovery(); if (legacy) addRecovery({name:legacy.project.name,documents:legacy.documents.length},'','Cópia anterior do armazenamento',() => legacy); } catch (_) {}
        if (!recoveryRows.length) list.append(node('p','Nenhuma cópia recuperável foi encontrada. Você também pode abrir um arquivo .hdocs.'));
      } catch (error) { list.replaceChildren(node('p',error.message || 'Não foi possível consultar a recuperação local. Abra seu arquivo .hdocs.')); }
    }
    doc.querySelector('#open-project-placeholder').addEventListener('click',() => { void open(); });
    doc.querySelector('#save-project-placeholder').addEventListener('click',() => save());
    doc.querySelector('#new-local-project').addEventListener('click',newProject);
    doc.querySelector('#open-local-project').addEventListener('click',() => { void open(); });
    doc.querySelector('#save-local-project-as').addEventListener('click',() => save(true));
    doc.querySelector('#recover-local-project').addEventListener('click',() => { void recover(); });
    if (options.desktopMode) {
      for (const id of ['open-project-placeholder','open-local-project','new-local-project','recover-local-project','connect-heartspace']) {
        const control = doc.getElementById(id); control.disabled = true; control.title = 'Abra projetos locais no Docs pelo navegador. Esta janela está vinculada ao projeto autorizado do HeartSpace.';
      }
    }
    return {open,save,newProject,recover,changed,edited,hasUnsavedFile:() => attached && dirty,hasCurrentFileBackup:() => Boolean(handle && attached && !dirty)};
  }
  root.HeartspaceDocsLocalProjects = Object.freeze({mount});
})(globalThis);
