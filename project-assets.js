/* Explicit browser folder adapter. No native bridge, network or provider credentials. */
(function (root) {
  'use strict';
  const media = root.HeartspaceNarrativeMedia;
  const types = {png:'image',jpg:'image',jpeg:'image',webp:'image',mp3:'audio',ogg:'audio',wav:'audio',webm:'audio',m4a:'audio'};
  const kindOf = path => { const extension = path.split('.').pop().toLowerCase(); return Object.hasOwn(types,extension) ? types[extension] : ''; };
  const safePath = path => typeof path === 'string' && path.length > 0 && path.length <= 1024 && !/[\\:%?#\x00-\x1f\x7f]/.test(path) && !path.split('/').some(part => !part || part === '.' || part === '..');
  const identity = value => typeof value === 'string' && value.length > 0 && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);
  const fail = message => { throw new Error(message); };
  const digest = async bytes => {
    if (!root.crypto?.subtle) fail('Este navegador não oferece a verificação necessária para vincular recursos. Você ainda pode importar arquivos normalmente.');
    return [...new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes))].map(byte => byte.toString(16).padStart(2,'0')).join('');
  };
  async function readFolder(files,projectId) {
    if (!files.length || files.length > 20000) fail('Escolha uma pasta de projeto com até 20 mil arquivos.');
    const paths = new Map(); let rootName = '';
    for (const file of files) {
      const parts = String(file.webkitRelativePath || '').split('/');
      const name = parts.shift(), path = parts.join('/');
      if (!name || !safePath(path) || rootName && rootName !== name) fail('Não foi possível identificar a raiz da pasta selecionada.');
      rootName = name;
      if (paths.has(path)) fail('A pasta contém caminhos repetidos.');
      // Inspect only media and the public catalogs; never read private app sources.
      if (path.split('/').some(part => part === '.git' || part === 'node_modules')) continue;
      if (kindOf(path) || /^\.heartspace\/[a-z][a-z0-9_-]*_artifacts\.json$/.test(path)) paths.set(path,file);
    }
    const artifacts = [], ids = new Set(), ownedPaths = new Set(), catalogProjects = new Set();
    const catalogs = [...paths].filter(([path]) => path.startsWith('.heartspace/') && path.endsWith('_artifacts.json'));
    if (catalogs.length > 20) fail('Há catálogos demais nesta pasta.');
    for (const [path,file] of catalogs) {
      if (file.size > 2*1024*1024) fail(`O catálogo é grande demais: ${path}`);
      let catalog; try { catalog = JSON.parse(await file.text()); } catch (_) { fail(`Não foi possível ler o catálogo: ${path}`); }
      if (catalog?.schema_version !== 1 || !catalog.artifacts || typeof catalog.artifacts !== 'object' || Array.isArray(catalog.artifacts)) fail(`Versão ou estrutura de catálogo não suportada: ${path}`);
      if (identity(catalog.project_id)) catalogProjects.add(catalog.project_id);
      const entries = Object.entries(catalog.artifacts);
      if (entries.length > 10000) fail('O catálogo contém recursos demais.');
      for (const [id,artifact] of entries) {
        if (artifact?.schema_version !== 1 || id !== artifact.artifact_id || !identity(id) || !identity(artifact.project_id) || !identity(artifact.type) || !/^[a-z][a-z0-9_-]{0,79}$/.test(artifact.source_app_id || '') || !Number.isSafeInteger(artifact.revision) || artifact.revision < 1) fail(`Um recurso do catálogo está inválido: ${path}`);
        catalogProjects.add(artifact.project_id);
        const key = `${artifact.project_id}:${artifact.source_app_id}:${id}`;
        if (ids.has(key)) fail('Uma identidade de recurso aparece mais de uma vez nos catálogos.');
        ids.add(key);
        // A sprite sheet is not a background or a portrait. Keep it out of raw imports too.
        if (safePath(artifact.preview?.image_path) && artifact.preview.kind === 'heartkey.sprite_sheet') ownedPaths.add(artifact.preview.image_path);
        const runtime = artifact.runtime_ref, resourcePath = runtime?.path;
        if (!safePath(resourcePath)) continue;
        ownedPaths.add(resourcePath);
        const kind = kindOf(resourcePath);
        if (!kind || !['image','artwork','illustration','texture','audio','audio_event','sound'].includes(artifact.type)) continue;
        if (runtime.sha256 !== undefined && !/^[a-f0-9]{64}$/i.test(runtime.sha256)) fail('O catálogo contém uma assinatura de recurso inválida.');
        if (runtime.size_bytes !== undefined && (!Number.isSafeInteger(runtime.size_bytes) || runtime.size_bytes < 1)) fail('O catálogo contém um tamanho de recurso inválido.');
        artifacts.push({kind,path:resourcePath,name:String(artifact.title || id).slice(0,160),file:paths.get(resourcePath),expectedHash:runtime.sha256?.toLowerCase(),expectedSize:runtime.size_bytes,
          ref:{schema_version:1,kind:'artifact',project_id:artifact.project_id,artifact_id:id,type:artifact.type,source_app_id:artifact.source_app_id,revision:artifact.revision,policy:'pinned'}});
      }
    }
    if (catalogProjects.size > 1) fail('A pasta mistura catálogos de projetos diferentes. Escolha a raiz de um único projeto.');
    const catalogProject = [...catalogProjects][0] || '';
    const sourceProject = catalogProject || projectId;
    const entries = [...artifacts];
    for (const [path,file] of paths) {
      if (!kindOf(path) || ownedPaths.has(path) || path.split('/').some(part => part.startsWith('.'))) continue;
      entries.push({kind:kindOf(path),path,name:file.name,file,ref:{schema_version:1,kind:'file',project_id:sourceProject,policy:'pinned'}});
    }
    if (entries.length > 10000) fail('A pasta contém mídias demais. Escolha uma pasta menor.');
    return {name:rootName,projectId:sourceProject,catalogProject,entries};
  }
  async function snapshot(entry) {
    const file = entry.file;
    if (!file) fail('O arquivo indicado pelo catálogo não está na pasta escolhida. A cópia anterior foi mantida.');
    if (!file.size || file.size > media.limits[entry.kind]) fail(entry.kind === 'image' ? 'O vínculo aceita PNG, JPEG ou WebP de até 4 MB. Exporte uma versão menor na ferramenta de origem.' : 'O vínculo aceita áudio de até 8 MB. Exporte uma versão menor na ferramenta de origem.');
    if (entry.expectedSize !== undefined && file.size !== entry.expectedSize) fail('O tamanho do arquivo difere do catálogo. Atualize a exportação na ferramenta de origem.');
    const bytes = new Uint8Array(await file.arrayBuffer()), mime = media.sniff(bytes);
    if (!mime.startsWith(entry.kind + '/')) fail('O arquivo não contém o tipo de mídia esperado.');
    const sha256 = await digest(bytes);
    if (entry.expectedHash && sha256 !== entry.expectedHash) fail('O arquivo difere da assinatura do catálogo. Atualize a exportação na ferramenta de origem.');
    if (entry.kind === 'image') await root.HeartspaceImageOptimizer.validateOriginal(new Blob([bytes],{type:mime}));
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset,offset+16384));
    const asset = media.normalize({name:entry.name,mime,data:`data:${mime};base64,${btoa(binary)}`,project_ref:{...entry.ref,path:entry.path,sha256}},entry.kind);
    return asset || fail('Não foi possível preparar este recurso.');
  }
  function toBlob(value,kind = 'image') {
    const asset = media.normalize(value,kind);
    if (!asset) fail('A cópia deste recurso está indisponível.');
    const binary = atob(asset.data.slice(asset.data.indexOf(',')+1));
    return new Blob([Uint8Array.from(binary,character => character.charCodeAt(0))],{type:asset.mime});
  }
  function create(options) {
    const doc = options.document; let folder = null, folderScope = '', active = false;
    const style = doc.createElement('style'); style.textContent = `.project-assets-dialog{box-sizing:border-box;width:min(680px,calc(100vw - 32px));max-height:85vh;padding:20px;border:1px solid #ffffff28;border-radius:10px;background:#191919;color:#ddd;font:14px system-ui}.project-assets-dialog::backdrop{background:#0009}.project-assets-dialog h2{margin:0;font-size:18px}.project-assets-dialog p{line-height:1.5}.project-assets-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.project-assets-dialog button,.project-assets-dialog select,.project-assets-dialog input{box-sizing:border-box;min-height:36px;padding:7px 10px;border:1px solid #ffffff25;border-radius:6px;color:inherit;background:#222;font:inherit}.project-assets-dialog input{width:100%;margin:10px 0}.project-assets-dialog select{width:100%;min-height:180px;max-height:32vh}.project-assets-dialog select option{padding:6px}.project-assets-dialog button:disabled{opacity:.4}.project-assets-dialog small{display:block;overflow-wrap:anywhere;color:#aaa;line-height:1.5;margin:10px 0}.project-assets-dialog [hidden]{display:none!important}`; doc.head.append(style);
    const describe = asset => {
      const ref = media.projectRef(asset?.project_ref);
      return ref ? `${asset.name || ref.path} · ${ref.kind === 'artifact' ? `${ref.source_app_id} · revisão ${ref.revision}` : 'arquivo do projeto'} · versão fixada` : asset?.name || 'Sem recurso';
    };
    async function pick(kind,{current = null} = {}) {
      if (active) return undefined;
      const initial = options.context();
      if (!initial.editable || initial.blocked) throw new Error('A edição deste projeto não está disponível.');
      if (folderScope !== initial.key) { folder = null; folderScope = initial.key; }
      active = true;
      return new Promise((resolve,reject) => {
        const dialog = doc.createElement('dialog'); dialog.className = 'project-assets-dialog';
        dialog.innerHTML = `<h2>Recurso do projeto</h2><p>Escolha a pasta para usar uma imagem ou áudio. Uma cópia acompanha o Docs offline; mudanças na origem só entram quando você escolher atualizar.</p><div class="project-assets-actions"><button type="button" data-folder>Escolher pasta</button><button type="button" data-check>Verificar vínculo</button><button type="button" data-detach>Usar cópia independente</button></div><input type="file" webkitdirectory multiple data-files hidden><small data-current></small><input type="search" data-search aria-label="Buscar recurso" placeholder="Buscar nome ou caminho"><select size="8" data-list aria-label="Recursos disponíveis"></select><small data-detail></small><p role="status"></p><div class="project-assets-actions"><button type="button" data-use>Usar versão selecionada</button><button type="button" data-cancel>Cancelar</button></div>`;
        const q = selector => dialog.querySelector(selector), list = q('[data-list]'), input = q('[data-files]'), status = q('[role=status]'), use = q('[data-use]');
        const ref = media.projectRef(current?.project_ref), cached = media.normalize(current,kind); let selectedAsset = null, busy = false, generation = 0, checking = false, settled = false;
        const valid = () => { const now = options.context(); return dialog.open && now.key === initial.key && now.editable && !now.blocked; };
        const message = value => { status.textContent = value; };
        const close = result => { if (settled) return; settled = true; if (dialog.open) dialog.close(); dialog.remove(); active = false; resolve(result); };
        const usableFolder = () => folder && (!initial.expectedProject || !folder.catalogProject || folder.catalogProject === initial.expectedProject);
        const selected = () => {
          if (list.selectedIndex < 0 || list.value === '') return undefined;
          const entry = folder?.entries[Number(list.value)];
          return entry?.kind === kind ? entry : undefined;
        };
        const detail = () => {
          const entry = selected();
          q('[data-detail]').textContent = entry ? `${entry.path} · ${entry.ref.kind === 'artifact' ? `${entry.ref.source_app_id} · revisão ${entry.ref.revision}` : 'Vínculo pelo caminho; renomear exige selecionar novamente.'}${entry.file ? '' : ' · arquivo ausente'}` : 'Selecione um recurso.';
          use.disabled = busy || !entry?.file || !usableFolder();
        };
        const render = () => {
          selectedAsset = null;
          const search = q('[data-search]').value.trim().toLocaleLowerCase(); list.replaceChildren();
          folder?.entries.forEach((entry,index) => { if (entry.kind === kind && (!search || `${entry.name} ${entry.path}`.toLocaleLowerCase().includes(search))) { const option = doc.createElement('option'); option.value = index; option.textContent = `${entry.name} · ${entry.path}${entry.file ? '' : ' · ausente'}`; list.append(option); } });
          if (list.options.length) list.selectedIndex = 0;
          if (!list.options.length) message(folder ? 'Nenhum recurso compatível encontrado. Animações nativas e folhas de sprites precisam de um render estático ou de um adaptador próprio.' : 'Escolha a pasta do projeto para consultar os recursos.');
          detail();
        };
        const run = async work => {
          if (busy) return; busy = true; const ticket = ++generation;
          dialog.querySelectorAll('button:not([data-cancel]),input,select').forEach(element => element.disabled = true);
          try { if (!valid()) fail('O projeto ou a permissão mudou. Abra o seletor novamente.'); await work(); }
          catch (error) { if (dialog.open) message(error.message || 'Não foi possível ler este recurso.'); }
          finally { if (ticket === generation && dialog.open) { busy = false; dialog.querySelectorAll('button,input,select').forEach(element => element.disabled = false); q('[data-check]').disabled = !ref; q('[data-detach]').disabled = !ref || !cached; detail(); } }
        };
        const checkRevision = asset => {
          const next = asset.project_ref;
          if (ref?.kind === 'artifact' && next.kind === 'artifact' && next.project_id === ref.project_id && next.source_app_id === ref.source_app_id && next.artifact_id === ref.artifact_id && (next.revision < ref.revision || next.revision === ref.revision && next.sha256 !== ref.sha256)) fail('O catálogo retrocedeu ou mudou o arquivo sem atualizar a revisão. Corrija a origem; a versão fixada foi preservada.');
        };
        q('[data-current]').textContent = describe(current);
        q('[data-check]').disabled = !ref; q('[data-detach]').disabled = !ref || !cached;
        q('[data-folder]').onclick = () => { checking = false; input.click(); };
        input.onchange = () => {
          const files = [...input.files]; input.value = ''; if (!files.length) return;
          void run(async () => {
            const next = await readFolder(files,initial.projectId);
            if (!valid()) fail('O projeto mudou. Escolha a pasta novamente.');
            if (initial.expectedProject && next.catalogProject && next.catalogProject !== initial.expectedProject) fail('O catálogo pertence a outro projeto HeartSpace.');
            folder = next; message(`Pasta ${folder.name} lida. Para ver mudanças posteriores, selecione a pasta novamente.`); render();
            if (checking && ref) await compareCurrent();
          });
        };
        q('[data-search]').oninput = render; list.onchange = () => { selectedAsset = null; detail(); };
        q('[data-detach]').onclick = () => { if (!valid()) { message('O projeto mudou. Abra o seletor novamente.'); return; } const asset = media.normalize(current,kind); if (!asset) return; delete asset.project_ref; close(asset); };
        const compareCurrent = async () => {
          if (!usableFolder()) fail('Escolha a pasta de origem para verificar. A cópia offline está preservada.');
          if (folder.projectId !== ref.project_id) fail('A pasta selecionada pertence a outro projeto. Selecione a pasta de origem.');
          const entry = folder.entries.find(item => item.kind === kind && (ref.kind === 'artifact' ? item.ref.kind === 'artifact' && item.ref.project_id === ref.project_id && item.ref.source_app_id === ref.source_app_id && item.ref.artifact_id === ref.artifact_id : item.ref.kind === 'file' && item.path === ref.path));
          if (!entry) fail('O recurso não foi encontrado na pasta. A cópia offline está preservada.');
          const asset = await snapshot(entry); if (!valid()) return;
          checkRevision(asset);
          q('[data-search]').value = ''; render(); list.value = String(folder.entries.indexOf(entry)); detail();
          selectedAsset = asset;
          message(asset.project_ref.sha256 === ref.sha256 && (ref.kind !== 'artifact' || asset.project_ref.revision === ref.revision) ? 'A origem corresponde à versão fixada.' : 'Há uma nova versão. A versão anterior permanece até você escolher usar a nova versão.');
        };
        q('[data-check]').textContent = 'Buscar atualização';
        q('[data-check]').onclick = () => { checking = true; input.click(); };
        use.onclick = () => void run(async () => {
          const entry = selected(); if (!entry || !usableFolder()) return;
          const asset = selectedAsset || await snapshot(entry);
          checkRevision(asset);
          if (valid()) close(asset);
        });
        q('[data-cancel]').onclick = () => close(undefined);
        dialog.addEventListener('cancel',event => { event.preventDefault(); close(undefined); });
        dialog.addEventListener('close',() => close(undefined));
        try { doc.body.append(dialog); dialog.showModal(); render(); q('[data-folder]').focus(); }
        catch (_) { dialog.remove(); active = false; reject(new Error('Este navegador não conseguiu abrir o seletor de recursos. Use a importação de arquivos comum.')); }
      });
    }
    return {pick,describe};
  }
  root.HeartspaceDocsProjectAssets = Object.freeze({create,toBlob});
})(globalThis);
