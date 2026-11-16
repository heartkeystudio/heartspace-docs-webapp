/* Human reconciliation. Previews are text, never executable authoring HTML. */
(function (root) {
  'use strict';
  function create(options) {
    const doc = options.document, dialog = doc.createElement('dialog');
    dialog.className = 'sync-review';
    const style = doc.createElement('style');
    style.textContent = `.sync-review{box-sizing:border-box;width:min(1120px,calc(100vw - 28px));height:min(800px,90vh);max-height:90vh;border:1px solid #ffffff26;border-radius:10px;background:#191919;color:#ddd;padding:18px;font:14px system-ui}.sync-review::backdrop{background:#000a}.sync-review[open]{display:flex;flex-direction:column;gap:12px}.sync-review header,.sync-review footer,.sync-review-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.sync-review h2{font-size:18px;margin:0;flex:1}.sync-review h3{margin:10px 0;font-size:15px}.sync-review button{font:inherit;color:inherit;border:1px solid #ffffff25;border-radius:6px;background:#242424;padding:8px 10px;cursor:pointer}.sync-review button:disabled{opacity:.4;cursor:default}.sync-review main{display:grid;grid-template-columns:230px minmax(0,1fr);gap:16px;min-height:0;flex:1}.sync-review nav,.sync-review section{min-width:0;overflow:auto}.sync-review nav button{display:block;width:100%;margin-bottom:6px;text-align:left;overflow-wrap:anywhere}.sync-review nav button[aria-pressed=true]{border-color:#8c9cac;background:#30343a}.sync-review p{line-height:1.5;margin:4px 0}.sync-review small{display:block;color:#aaa;line-height:1.5;margin:8px 0}.sync-review-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.sync-review pre{font:13px/1.6 system-ui;white-space:pre-wrap;overflow-wrap:anywhere;max-height:310px;overflow:auto;margin:8px 0;padding:10px;background:#ffffff05;border-radius:5px}.sync-review [role=status]{color:#d3bc8d;min-height:1.5em}.sync-review details pre{font-family:monospace;font-size:11px}.sync-review [hidden]{display:none!important}@media(max-width:720px){.sync-review main{grid-template-columns:1fr;overflow:auto;display:block}.sync-review nav{max-height:160px;margin-bottom:12px}.sync-review-columns{grid-template-columns:1fr}.sync-review section{overflow:visible}}`;
    doc.head.append(style);
    dialog.innerHTML = '<header><h2>Revisão e recuperação</h2><button type="button" data-close>Fechar</button></header><p role="status"></p><main><nav aria-label="Alterações e versões"></nav><section aria-label="Comparação de versões"></section></main><footer><button type="button" data-refresh>Atualizar e tentar envios</button><small>Versões guardadas ficam neste navegador. Salve em arquivo para ter uma cópia externa.</small></footer>';
    doc.body.append(dialog);
    const nav = dialog.querySelector('nav'), body = dialog.querySelector('section'), status = dialog.querySelector('[role=status]');
    let selected = '', busy = false, sessions = [], context = '';
    const node = (tag,text) => Object.assign(doc.createElement(tag),{textContent:text});
    const action = (label,work,enabled = true) => {
      const button = node('button',label); button.type = 'button'; button.disabled = !enabled;
      button.onclick = () => void run(work); return button;
    };
    const run = async work => {
      if (busy) return; busy = true; status.textContent = 'Protegendo a versão e concluindo a ação…';
      dialog.querySelectorAll('button:not([data-close])').forEach(button => button.disabled = true);
      try { await work(); status.textContent = 'Ação concluída.'; }
      catch (error) { status.textContent = error.message || 'Não foi possível concluir; a versão anterior foi mantida.'; }
      finally { busy = false; if (dialog.open) render(); }
    };
    const date = value => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('pt-BR'); };
    const showVersion = (heading,value) => {
      const column = doc.createElement('div'); column.append(node('h3',heading));
      if (!value) { column.append(node('p','A versão remota não está disponível. O conteúdo local permanece protegido.')); return column; }
      column.append(node('pre',value.text || 'Sem texto.'));
      if (value.details) { const details = doc.createElement('details'); details.append(node('summary','Estrutura e configuração'),node('pre',value.details)); column.append(details); }
      return column;
    };
    function render() {
      if (!dialog.open || busy) return;
      const state = options.state();
      dialog.querySelector('[data-refresh]').hidden = !state.connected;
      dialog.querySelector('[data-refresh]').disabled = false;
      if (context !== state.scope) { context = state.scope; selected = ''; sessions = []; }
      nav.replaceChildren(); body.replaceChildren();
      const entries = [];
      state.documents.forEach(item => entries.push({key:`document:${item.id}`,title:item.title,item,kind:'document'}));
      if (state.registry) entries.push({key:'registry',title:'Recursos compartilhados',item:state.registry,kind:'registry'});
      state.recovery.slice().reverse().forEach(item => entries.push({key:`backup:${item.id}`,title:`Guardada · ${item.label} · ${date(item.savedAt)}`,item,kind:'backup'}));
      sessions.forEach(item => entries.push({key:`session:${item.key}`,title:`${item.legacy ? 'Editor anterior' : 'Outra janela/sessão'} · ${date(item.savedAt)}`,item,kind:'session'}));
      if (state.legacy) entries.push({key:'legacy',title:'Recuperação do editor anterior',kind:'legacy'});
      if (!entries.some(entry => entry.key === selected)) selected = entries[0]?.key || '';
      entries.forEach(entry => { const button = node('button',entry.title); button.type = 'button'; button.onclick = () => { selected = entry.key; render(); }; button.setAttribute('aria-pressed',String(selected === entry.key)); nav.append(button); });
      const entry = entries.find(entry => entry.key === selected);
      if (!entry) { body.append(node('p','Não há envios ou versões protegidas para revisar nesta área.')); return; }
      if (entry.kind === 'document' || entry.kind === 'registry') {
        const item = entry.item;
        body.append(node('h3',entry.title),node('p',item.message));
        const columns = doc.createElement('div'); columns.className = 'sync-review-columns';
        columns.append(showVersion('Neste dispositivo',item.local),showVersion('No projeto',item.remote)); body.append(columns);
        const actions = doc.createElement('div'); actions.className = 'sync-review-actions';
        actions.append(action('Usar meu rascunho',() => options.resolve(entry.kind,item.id,'local'),item.canLocal),action('Usar versão do projeto',() => options.resolve(entry.kind,item.id,'remote'),item.canRemote));
        if (entry.kind === 'document') actions.append(action('Salvar rascunho em arquivo',() => options.downloadDocument(item.id)));
        if (entry.kind === 'document' && item.canHide) actions.append(action('Guardar fora da biblioteca ativa',() => options.hideLocal(item.id)));
        body.append(actions,node('small','Ao escolher uma versão, a cópia anterior é guardada fora da história ativa. A escolha local entra na fila com a versão remota esperada; uma mudança posterior volta para revisão.'));
      } else if (entry.kind === 'backup') {
        const backup = entry.item;
        body.append(node('h3',backup.label),node('p',`Guardada em ${date(backup.savedAt)}.`),showVersion('Versão protegida',options.previewBackup(backup)));
        const actions = doc.createElement('div'); actions.className = 'sync-review-actions';
        actions.append(action('Restaurar como rascunho',() => options.restoreBackup(backup.id),options.canRestore(backup)),action('Salvar em arquivo',() => options.downloadBackup(backup.id)),action('Remover cópia local',() => options.removeBackup(backup.id)));
        body.append(actions);
      } else {
        body.append(node('h3',entry.title),node('p',entry.kind === 'legacy' ? 'Esta recuperação foi criada antes da separação por conta e janela. Ela não foi incorporada automaticamente. Exporte-a para conferir o conteúdo e abrir como projeto local.' : 'Uma cópia independente foi guardada nesta outra janela ou sessão. Exporte-a para conferir o conteúdo sem substituir seu trabalho atual.'),action('Salvar recuperação em arquivo',() => options.downloadSession(entry.kind === 'legacy' ? '' : entry.item.key)));
      }
    }
    const loadSessions = async () => {
      const scope = options.state().scope;
      try { const entries = await options.sessions(); if (dialog.open && scope === options.state().scope) { sessions = entries; render(); } }
      catch (error) { if (dialog.open && scope === options.state().scope) status.textContent = error.message || 'Não foi possível listar outras recuperações.'; }
    };
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    dialog.querySelector('[data-refresh]').onclick = () => void run(async () => { await options.retry(); await loadSessions(); });
    return {open:(kind = '',id = '') => { const scope = options.state().scope; if (scope !== context) sessions = []; if (!dialog.open) dialog.showModal(); context = scope; selected = kind === 'document' ? `document:${id}` : kind; render(); void loadSessions(); },refresh:render,close:() => dialog.close()};
  }
  root.HeartspaceDocsSyncReview = Object.freeze({create});
})(globalThis);
