/* Optional chapter decoration, kept outside the editable document body. */
(function (root) {
  'use strict';
  const presets = {
    custom:['Personalizada','#626262',''],forest:['Floresta','#315a3f','Floresta'],fire:['Fogo','#a9482c','Fogo'],
    industrial:['Industrial','#68645e','Industrial'],castle:['Castelo','#74646f','Castelo'],
    calm:['Calma','#49747a','Calma'],tension:['Tensão','#853f47','Tensão'],mystery:['Mistério','#62527b','Mistério']
  };
  const bounded = (value,min,max,fallback) => Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {}, texture = source.texture;
    const localId = typeof texture?.localId === 'string' && /^ambience-[a-zA-Z0-9-]{1,120}$/.test(texture.localId) ? texture.localId : '';
    const remotePath = typeof texture?.remotePath === 'string' && /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(png|webp)$/.test(texture.remotePath) ? texture.remotePath : '';
    return {enabled:source.enabled === true,mode:source.mode === 'texture' ? 'texture' : 'color',preset:Object.hasOwn(presets,source.preset) ? source.preset : 'custom',
      label:typeof source.label === 'string' ? source.label.slice(0,80) : '',color:typeof source.color === 'string' && /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : '#626262',
      width:bounded(source.width,16,96,48),opacity:bounded(source.opacity,.15,1,.7),tileSize:bounded(source.tileSize,32,256,128),
      texture:localId || remotePath ? {localId,remotePath,name:typeof texture.name === 'string' ? texture.name.slice(0,150) : 'Textura'} : null};
  }
  function mount(options) {
    const {document:doc,page,editorWrap,editorArea,panel,getRecord,canEdit,onChange,importTexture,loadTexture,contextKey} = options;
    const win = doc.defaultView, controls = new Map();
    const node = (tag,text) => { const item = doc.createElement(tag); if (text !== undefined) item.textContent = text; return item; };
    const rail = node('aside'); rail.className = 'document-ambience'; rail.setAttribute('aria-hidden','true'); rail.hidden = true;
    const railLabel = node('span'); railLabel.className = 'document-ambience-label'; rail.append(railLabel); page.prepend(rail);
    const heading = node('h3','Ambientação do capítulo'), details = node('details'), summary = node('summary','Faixa ao lado da folha'); details.append(summary); panel.append(heading,details);
    const help = node('p','Uma faixa opcional para o cenário ou sentimento deste capítulo. Aparece no modelo Livro, quando há espaço ao lado da folha.'); details.append(help);
    function field(label,key,type,values) {
      const wrap = node('label'), caption = node('span',label), control = node(type === 'select' ? 'select' : 'input');
      if (type !== 'select') control.type = type;
      if (values) values.forEach(([value,text]) => control.add(new win.Option(text,value)));
      control.dataset.ambienceField = key; controls.set(key,control); wrap.append(caption,control); details.append(wrap); return control;
    }
    field('Mostrar faixa','enabled','checkbox');
    field('Sugestão de ambiente','preset','select',Object.entries(presets).map(([id,preset]) => [id,preset[0]]));
    field('Nome (opcional)','label','text').maxLength = 80;
    field('Fundo','mode','select',[['color','Cor'],['texture','Textura repetida']]);
    field('Cor','color','color');
    const textureActions = node('div'); textureActions.className = 'ambience-texture-actions';
    const upload = node('button','Importar textura'), clear = node('button','Remover textura'), file = node('input');
    upload.type = clear.type = 'button'; file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp'; file.hidden = true; textureActions.append(upload,clear,file); details.append(textureActions);
    const width = field('Largura','width','range'); width.min = 16; width.max = 96; width.step = 4;
    const opacity = field('Intensidade','opacity','range'); opacity.min = .15; opacity.max = 1; opacity.step = .05;
    const tile = field('Tamanho da textura','tileSize','range'); tile.min = 32; tile.max = 256; tile.step = 8;
    const preview = node('div'); preview.className = 'ambience-preview'; preview.setAttribute('aria-hidden','true'); details.append(preview);
    const status = node('p'); status.className = 'ambience-status'; status.setAttribute('role','status'); details.append(status);
    let frame = 0, currentContext = '', sourceKey = '', objectUrl = '', sourceTicket = 0, importTicket = 0, busy = false, message = '';
    function measure() {
      const record = getRecord(), value = normalize(record?.ambience), bounds = page.getBoundingClientRect(), area = editorArea.getBoundingClientRect();
      const zoom = bounds.width && page.offsetWidth ? bounds.width / page.offsetWidth : 1;
      const room = Math.max(0,(bounds.left - area.left - 12) / zoom), width = Math.min(value.width,room);
      rail.hidden = !record || !value.enabled || page.dataset.layout !== 'book' || width < 12 || !bounds.width;
      rail.style.setProperty('--ambience-width',`${width}px`);
    }
    const schedule = () => { if (frame) win.cancelAnimationFrame(frame); frame = win.requestAnimationFrame(() => { frame = 0; measure(); }); };
    function paint(value) {
      [rail,preview].forEach(item => {
        item.style.backgroundColor = value.color;
        item.style.backgroundImage = value.mode === 'texture' && objectUrl ? `url("${objectUrl}")` : 'none';
        item.style.backgroundSize = `${value.tileSize}px auto`;
        item.style.opacity = String(value.opacity);
      }); railLabel.textContent = value.label; preview.textContent = value.label;
      schedule();
    }
    function releaseTexture() { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = ''; }
    function update() {
      const record = getRecord(), key = `${contextKey()}:${record?.id || ''}`;
      if (key !== currentContext) { currentContext = key; importTicket += 1; busy = false; message = ''; }
      const value = normalize(record?.ambience), editable = Boolean(record && canEdit());
      controls.forEach((control,name) => { if (name === 'enabled') control.checked = value.enabled; else control.value = String(value[name]); control.disabled = !editable; });
      controls.get('width').setAttribute('aria-valuetext',`${value.width} pixels`);
      controls.get('opacity').setAttribute('aria-valuetext',`${Math.round(value.opacity * 100)} por cento`);
      controls.get('tileSize').setAttribute('aria-valuetext',`${value.tileSize} pixels`);
      controls.get('tileSize').parentElement.hidden = value.mode !== 'texture'; textureActions.hidden = value.mode !== 'texture';
      upload.disabled = !editable || busy; clear.disabled = !editable || !value.texture; file.disabled = !editable || busy;
      status.textContent = message || (value.texture ? `Textura: ${value.texture.name}` : 'PNG, JPEG ou WebP. Use uma textura seamless para uma repetição contínua.');
      const nextSource = value.mode === 'texture' && value.texture ? `${key}:${JSON.stringify(value.texture)}` : '';
      if (nextSource !== sourceKey) {
        sourceKey = nextSource; const ticket = ++sourceTicket; releaseTexture();
        if (nextSource) void loadTexture(value.texture).then(blob => {
          if (ticket !== sourceTicket || currentContext !== key) return;
          if (!blob) throw new Error('Textura indisponível neste dispositivo. A cor será usada enquanto isso.');
          objectUrl = URL.createObjectURL(blob); paint(normalize(getRecord()?.ambience));
        }).catch(error => { if (ticket === sourceTicket) { message = error.message || 'Não foi possível carregar a textura.'; status.textContent = message; } });
      }
      paint(value);
    }
    function commit(mutator) {
      const record = getRecord(); if (!record || !canEdit()) return;
      importTicket += 1; busy = false; message = '';
      const previous = record.ambience, value = normalize(previous); mutator(value); record.ambience = normalize(value);
      try { onChange(record); } catch (error) { record.ambience = previous; message = error.message || 'Não foi possível salvar a ambientação.'; }
      update();
    }
    details.addEventListener('input',event => {
      const control = event.target, key = control.dataset.ambienceField;
      if (!['label','color','width','opacity','tileSize'].includes(key)) return;
      commit(value => { value[key] = control.value; if (key === 'color') value.preset = 'custom'; });
    });
    details.addEventListener('change',event => {
      const control = event.target, key = control.dataset.ambienceField;
      if (!['enabled','mode','preset'].includes(key)) return;
      commit(value => {
        value[key] = key === 'enabled' ? control.checked : control.value;
        if (key === 'preset' && Object.hasOwn(presets,control.value) && control.value !== 'custom') { value.color = presets[control.value][1]; value.label = presets[control.value][2]; }
      });
    });
    upload.addEventListener('click',() => { if (canEdit()) file.click(); });
    clear.addEventListener('click',() => commit(value => { value.texture = null; value.mode = 'color'; }));
    file.addEventListener('change',async () => {
      const selected = file.files?.[0], record = getRecord(), context = currentContext; file.value = '';
      if (!selected || !record || !canEdit()) return;
      const ticket = ++importTicket; busy = true; message = 'Preparando textura…'; update();
      try {
        const texture = await importTexture(selected);
        if (ticket !== importTicket || context !== currentContext || record.id !== getRecord()?.id || !canEdit()) return;
        // Resolve the current record again: a remote refresh can replace its object.
        const current = getRecord(), previous = current.ambience; current.ambience = normalize({...normalize(previous),texture,mode:'texture'});
        try { onChange(current); } catch (error) { current.ambience = previous; throw error; }
        message = current.ambience.enabled ? 'Textura adicionada.' : 'Textura adicionada. Ative Mostrar faixa para vê-la na folha.';
      } catch (error) { if (ticket === importTicket && context === currentContext) message = error.message || 'Não foi possível importar a textura.'; }
      finally { if (ticket === importTicket && context === currentContext) { busy = false; update(); } }
    });
    if (win.ResizeObserver) { const observer = new win.ResizeObserver(schedule); [page,editorWrap,editorArea].forEach(item => observer.observe(item)); }
    win.addEventListener('resize',schedule);
    editorArea.addEventListener('scroll',schedule,{passive:true});
    win.addEventListener('beforeunload',releaseTexture);
    update(); return {update,schedule};
  }
  root.HeartspaceDocumentAmbience = {normalize,mount};
})(globalThis);
