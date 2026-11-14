/* Optional chapter decoration, kept outside the editable document body. */
(function (root) {
  'use strict';
  const presets = {
    custom:['Personalizada','#626262',''],forest:['Floresta','#315a3f','Floresta'],fire:['Fogo','#a9482c','Fogo'],
    industrial:['Industrial','#68645e','Industrial'],castle:['Castelo','#74646f','Castelo'],
    calm:['Calma','#49747a','Calma'],tension:['Tensão','#853f47','Tensão'],mystery:['Mistério','#62527b','Mistério']
  };
  const bounded = (value,min,max,fallback) => Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
  function normalizeBase(value) {
    const source = value && typeof value === 'object' ? value : {}, texture = source.texture;
    const localId = typeof texture?.localId === 'string' && /^ambience-[a-zA-Z0-9-]{1,120}$/.test(texture.localId) ? texture.localId : '';
    const remotePath = typeof texture?.remotePath === 'string' && /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(png|webp)$/.test(texture.remotePath) ? texture.remotePath : '';
    return {enabled:source.enabled === true,mode:source.mode === 'texture' ? 'texture' : 'color',preset:Object.hasOwn(presets,source.preset) ? source.preset : 'custom',
      label:typeof source.label === 'string' ? source.label.slice(0,80) : '',color:typeof source.color === 'string' && /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : '#626262',
      width:bounded(source.width,16,96,48),opacity:bounded(source.opacity,.15,1,.7),tileSize:bounded(source.tileSize,32,256,128),
      texture:localId || remotePath ? {localId,remotePath,name:typeof texture.name === 'string' ? texture.name.slice(0,150) : 'Textura'} : null};
  }
  function normalizeStyle(value) {
    const link = value?.placeLink;
    return {...normalizeBase(value),placeLink:typeof link?.entryId === 'string' && typeof link?.collectionId === 'string' ? {entryId:link.entryId,collectionId:link.collectionId,title:typeof link.title === 'string' ? link.title : '',snapshot:normalizeBase(link.snapshot)} : null};
  }
  function refreshPlaceLinks(value,collectionId,entries) {
    const ambience = normalize(value), places = new Map(entries.filter(item => item.type === 'place').map(item => [item.id,item]));
    [ambience,...ambience.sequences.map(item => item.style)].forEach(style => {
      const link = style.placeLink, place = link?.collectionId === collectionId ? places.get(link.entryId) : null;
      if (place?.ambience) { link.title = place.title; link.snapshot = normalizeBase(place.ambience); }
    }); return ambience;
  }
  function styleEditor(options) {
    const {document:doc,onChange,importTexture,isCurrent,loadTexture} = options, section = doc.createElement('details'); section.className = 'place-ambience-editor';
    const summary = doc.createElement('summary'); summary.textContent = 'Ambiente deste lugar'; section.append(summary);
    let value = normalizeBase(options.value), ticket = 0, textureTicket = 0, textureSource = '', textureUrl = '';
    const controls = new Map(), preview = doc.createElement('div'); preview.className = 'ambience-preview'; preview.setAttribute('aria-hidden','true');
    function field(label,key,type,choices) {
      const wrap = doc.createElement('label'), text = doc.createElement('span'), control = doc.createElement(type === 'select' ? 'select' : 'input'); text.textContent = label;
      if (type !== 'select') control.type = type; if (choices) choices.forEach(([id,name]) => control.add(new doc.defaultView.Option(name,id)));
      control.disabled = !options.canEdit; control.dataset.placeField = key; controls.set(key,control); wrap.append(text,control); section.append(wrap); return control;
    }
    field('Mostrar faixa ao usar este lugar','enabled','checkbox'); field('Sugestão','preset','select',Object.entries(presets).map(([id,item]) => [id,item[0]]));
    field('Nome na faixa','label','text').maxLength = 80; field('Cor','color','color');
    const width = field('Largura','width','range'); width.min = 16; width.max = 96;
    const intensity = field('Intensidade','opacity','range'); intensity.min = .15; intensity.max = 1; intensity.step = .05;
    const size = field('Tamanho da textura','tileSize','range'); size.min = 32; size.max = 256; size.step = 8;
    field('Fundo','mode','select',[['color','Cor'],['texture','Textura repetida']]);
    const upload = doc.createElement('button'), clear = doc.createElement('button'), file = doc.createElement('input'), status = doc.createElement('p');
    upload.type = clear.type = 'button'; upload.textContent = 'Importar textura'; clear.textContent = 'Remover textura'; file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp'; file.hidden = true; status.setAttribute('role','status');
    section.append(upload,clear,file,preview,status);
    function paint() {
      controls.forEach((control,key) => { if (key === 'enabled') control.checked = value.enabled; else control.value = value[key]; });
      preview.style.backgroundColor = value.color; preview.style.opacity = value.opacity; preview.textContent = value.label;
      preview.style.backgroundSize = `${value.tileSize}px auto`;
      const source = value.mode === 'texture' && value.texture ? JSON.stringify(value.texture) : '';
      if (source !== textureSource) {
        textureSource = source; const operation = ++textureTicket; if (textureUrl) URL.revokeObjectURL(textureUrl); textureUrl = ''; preview.style.backgroundImage = 'none';
        if (source && loadTexture) void loadTexture(value.texture).then(blob => {
          if (!blob || operation !== textureTicket || !section.isConnected) return;
          textureUrl = URL.createObjectURL(blob); preview.style.backgroundImage = `url("${textureUrl}")`;
        }).catch(() => { if (operation === textureTicket && section.isConnected) status.textContent = 'Textura indisponível. A cor foi preservada.'; });
      }
      upload.disabled = clear.disabled = !options.canEdit; status.textContent = value.texture ? `Textura: ${value.texture.name}` : 'A cor e a textura deste lugar podem ser reutilizadas em qualquer capítulo da biblioteca.';
    }
    function save() { if (!isCurrent()) return false; try { onChange(normalizeBase(value)); paint(); return true; } catch (error) { status.textContent = error.message || 'Não foi possível salvar o ambiente.'; return false; } }
    section.addEventListener('input',event => {
      const control = event.target, key = control.dataset.placeField; if (!['label','color','width','opacity','tileSize'].includes(key) || !isCurrent()) return;
      value[key] = control.value; if (key === 'color') value.preset = 'custom'; value = normalizeBase(value); ticket += 1; save();
    });
    section.addEventListener('change',event => {
      const key = event.target.dataset.placeField; if (!['enabled','preset','mode'].includes(key) || !isCurrent()) return;
      value[key] = key === 'enabled' ? event.target.checked : event.target.value;
      if (key === 'preset' && presets[value.preset] && value.preset !== 'custom') { value.color = presets[value.preset][1]; value.label = presets[value.preset][2]; }
      ticket += 1; save();
    });
    upload.addEventListener('click',() => { if (isCurrent()) file.click(); });
    clear.addEventListener('click',() => { if (!isCurrent()) return; ticket += 1; value.texture = null; value.mode = 'color'; save(); });
    file.addEventListener('change',async () => {
      const selected = file.files?.[0]; file.value = ''; if (!selected || !isCurrent()) return;
      const operation = ++ticket; upload.disabled = true; status.textContent = 'Preparando textura…';
      try { const texture = await importTexture(selected); if (operation !== ticket || !section.isConnected || !isCurrent()) return; value.texture = texture; value.mode = 'texture'; save(); }
      catch (error) { if (operation === ticket && section.isConnected) status.textContent = error.message || 'Não foi possível importar a textura.'; }
      finally { if (operation === ticket && section.isConnected) upload.disabled = !options.canEdit; }
    }); section.dispose = () => { ticket += 1; textureTicket += 1; if (textureUrl) URL.revokeObjectURL(textureUrl); textureUrl = ''; }; paint(); return section;
  }
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {}, used = new Set();
    return {...normalizeStyle(source),sequences:(Array.isArray(source.sequences) ? source.sequences : []).filter(item => {
      const id = typeof item?.sequenceId === 'string' ? item.sequenceId : '';
      if (!/^[a-zA-Z0-9._-]+$/.test(id) || used.has(id)) return false; used.add(id); return true;
    }).map(item => ({sequenceId:item.sequenceId,inherit:item.inherit === true,style:normalizeStyle(item.style)}))};
  }
  function mount(options) {
    const {document:doc,page,editorWrap,editorArea,editor,panel,getRecord,canEdit,onChange,importTexture,loadTexture,contextKey,getPlaces = () => [],collectionId = () => ''} = options;
    const win = doc.defaultView, controls = new Map();
    const node = (tag,text) => { const item = doc.createElement(tag); if (text !== undefined) item.textContent = text; return item; };
    const rail = node('aside'); rail.className = 'document-ambience'; rail.setAttribute('aria-hidden','true'); rail.hidden = true;
    page.prepend(rail);
    const heading = node('h3','Ambientação'), details = node('details'), summary = node('summary','Faixa ao lado da folha'); details.append(summary); panel.append(heading,details);
    const help = node('p','Uma faixa opcional para o cenário ou sentimento. No modelo Livro, cada sequência pode usar o padrão do capítulo ou um ambiente próprio.'); details.append(help);
    function field(label,key,type,values) {
      const wrap = node('label'), caption = node('span',label), control = node(type === 'select' ? 'select' : 'input');
      if (type !== 'select') control.type = type;
      if (values) values.forEach(([value,text]) => control.add(new win.Option(text,value)));
      control.dataset.ambienceField = key; controls.set(key,control); wrap.append(caption,control); details.append(wrap); return control;
    }
    field('Aplicar a','scope','select',[['','Capítulo (padrão)']]);
    field('Ambientação da sequência','inherit','select',[['inherit','Usar padrão do capítulo'],['custom','Personalizar esta sequência']]);
    const scopeHelp = node('p'); details.append(scopeHelp);
    field('Ambiente de um lugar','place','select',[['','Personalizado (sem vínculo)']]);
    const placeStatus = node('p'); details.append(placeStatus);
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
    let frame = 0, currentContext = '', selectedSequence = '', importTicket = 0, busy = false, message = '', drawingKey = '', drawingRail = null, scopeOptionsKey = '';
    const textures = new Map();
    const availableSequences = () => getRecord()?.narrativeSequences || [];
    function target() {
      const record = getRecord(), ambience = normalize(record?.ambience);
      const savedOverride = ambience.sequences.find(item => item.sequenceId === selectedSequence);
      const override = savedOverride && !savedOverride.inherit ? savedOverride : null;
      const raw = override?.style || normalizeStyle(ambience), link = raw.placeLink;
      const place = link?.collectionId === collectionId() ? getPlaces().find(item => item.id === link.entryId) : null;
      const value = link ? normalizeStyle(place?.ambience || link.snapshot) : raw;
      return {record,ambience,override,savedOverride,raw,value,place,inherited:Boolean(selectedSequence && !override)};
    }
    const textureKey = value => value.mode === 'texture' && value.texture ? JSON.stringify(value.texture) : '';
    function paint(item,value) {
      item.style.backgroundColor = value.color;
      const source = textures.get(textureKey(value));
      item.style.backgroundImage = source?.url ? `url("${source.url}")` : 'none';
      item.style.backgroundSize = `${value.tileSize}px auto`; item.style.opacity = String(value.opacity);
    }
    function releaseTextures() { textures.forEach(item => { if (item.url) URL.revokeObjectURL(item.url); }); textures.clear(); }
    function resolveTextures(values) {
      const wanted = new Set(values.map(textureKey).filter(Boolean));
      textures.forEach((item,key) => { if (!wanted.has(key)) { if (item.url) URL.revokeObjectURL(item.url); textures.delete(key); } });
      values.forEach(value => {
        const key = textureKey(value); if (!key || textures.has(key)) return;
        const entry = {url:'',error:''}, context = currentContext; textures.set(key,entry);
        void loadTexture(value.texture).then(blob => {
          if (context !== currentContext || textures.get(key) !== entry) return;
          if (!blob) throw new Error('Textura indisponível neste dispositivo. A cor será usada enquanto isso.');
          entry.url = URL.createObjectURL(blob); drawingKey = ''; schedule();
        }).catch(error => {
          if (context !== currentContext || textures.get(key) !== entry) return;
          entry.error = error.message || 'Não foi possível carregar uma textura. A cor será usada enquanto isso.'; schedule();
        });
      });
    }
    function measure() {
      const displayPage = page.hidden ? editorWrap.querySelector('.localization-preview-page:not([hidden])') || page : page;
      const displayEditor = displayPage === page ? editor : displayPage.querySelector('.content');
      let displayRail = displayPage.querySelector(':scope > .document-ambience');
      if (!displayRail) { displayRail = rail.cloneNode(false); displayPage.prepend(displayRail); }
      const {record,ambience,value} = target(), bounds = displayPage.getBoundingClientRect(), area = editorArea.getBoundingClientRect();
      const zoom = bounds.width && displayPage.offsetWidth ? bounds.width / displayPage.offsetWidth : 1;
      const room = Math.max(0,(bounds.left - area.left - 12) / zoom);
      const height = displayPage.offsetHeight, sequenceById = new Map((record?.narrativeSequences || []).map(item => [item.id,item]));
      const overrides = new Map(ambience.sequences.filter(item => !item.inherit && sequenceById.has(item.sequenceId)).map(item => [item.sequenceId,item.style]));
      const resolve = style => {
        const link = style.placeLink, place = link?.collectionId === collectionId() ? getPlaces().find(item => item.id === link.entryId) : null;
        return link ? normalizeBase(place?.ambience || link.snapshot) : normalizeBase(style);
      };
      const boundaries = [{top:0,value:resolve(ambience),sequenceId:''}];
      let previous = '';
      if (record && bounds.width && displayEditor && (overrides.size || ambience.placeLink)) [...displayEditor.querySelectorAll('.narrative-block:not(.narrative-inline)')].forEach(block => {
        const blockBounds = block.getBoundingClientRect(); if (!blockBounds.width || !blockBounds.height) return;
        const id = block.dataset.narrativeSequenceId || record.narrativeSequences?.[0]?.id || '';
        if (id === previous) return; previous = id;
        const top = Math.min(height,Math.max(boundaries.at(-1).top,(blockBounds.top - bounds.top) / zoom));
        boundaries.push({top,value:resolve(overrides.get(id) || ambience),sequenceId:sequenceById.has(id) ? id : ''});
      });
      const merged = [];
      boundaries.forEach((item,index) => {
        const segment = {...item,height:Math.max(0,(boundaries[index + 1]?.top ?? height) - item.top),width:Math.min(room,item.value.width)}, previous = merged.at(-1);
        if (!segment.height) return;
        if (previous && JSON.stringify(previous.value) === JSON.stringify(segment.value)) previous.height += segment.height;
        else merged.push(segment);
      });
      const segments = merged.filter(item => item.value.enabled && item.width >= 12);
      const visible = Boolean(record && displayPage.dataset.layout === 'book' && bounds.width && segments.length);
      displayRail.hidden = !visible;
      resolveTextures([value,...(visible ? segments.map(item => item.value) : [])]);
      paint(preview,value); preview.textContent = value.label;
      const errors = [...textures.values()].filter(item => item.error);
      status.textContent = message || (errors.length ? `${errors.length} ${errors.length === 1 ? 'textura indisponível' : 'texturas indisponíveis'}. A cor será usada nos trechos afetados.` : value.texture ? `Textura: ${value.texture.name}` : 'PNG, JPEG ou WebP. Use uma textura seamless para uma repetição contínua.');
      const nextDrawing = visible ? JSON.stringify(segments.map(item => [item.top,item.height,item.width,item.value,textures.get(textureKey(item.value))?.url || ''])) : '';
      if (nextDrawing === drawingKey && drawingRail === displayRail) return; drawingKey = nextDrawing; drawingRail = displayRail;
      displayRail.replaceChildren(); if (!visible) return;
      displayRail.style.setProperty('--ambience-width',`${segments.reduce((width,item) => Math.max(width,item.width),0)}px`);
      const fragment = doc.createDocumentFragment();
      segments.forEach(item => {
        const segment = node('div'); segment.className = 'document-ambience-segment';
        segment.style.top = `${item.top}px`; segment.style.height = `${item.height}px`; segment.style.width = `${item.width}px`; paint(segment,item.value);
        if (item.value.label && item.height >= 54) { const label = node('span',item.value.label); label.className = 'document-ambience-label'; segment.append(label); }
        fragment.append(segment);
      }); displayRail.append(fragment);
    }
    const schedule = () => { if (frame) win.cancelAnimationFrame(frame); frame = win.requestAnimationFrame(() => { frame = 0; measure(); }); };
    function update() {
      const record = getRecord(), key = `${contextKey()}:${record?.id || ''}`;
      if (key !== currentContext) { currentContext = key; importTicket += 1; busy = false; message = ''; selectedSequence = ''; scopeOptionsKey = ''; drawingKey = ''; rail.replaceChildren(); releaseTextures(); }
      const sequences = availableSequences();
      if (selectedSequence && !sequences.some(item => item.id === selectedSequence)) { selectedSequence = ''; importTicket += 1; busy = false; message = ''; }
      const optionsKey = JSON.stringify(sequences.map(item => [item.id,item.title]));
      if (optionsKey !== scopeOptionsKey) {
        scopeOptionsKey = optionsKey;
        controls.get('scope').replaceChildren(new win.Option('Capítulo (padrão)',''),...sequences.map(item => new win.Option(item.title || 'Sequência sem nome',item.id)));
      }
      const {value,inherited,raw,place} = target(), editable = Boolean(record && canEdit());
      const places = getPlaces(), placeControl = controls.get('place');
      const placeOptions = [new win.Option('Personalizado (sem vínculo)',''),...places.filter(item => item.ambience).map(item => new win.Option(item.title || 'Lugar sem nome',item.id))];
      if (raw.placeLink && !places.some(item => item.id === raw.placeLink.entryId && item.ambience && raw.placeLink.collectionId === collectionId())) placeOptions.push(new win.Option(`${raw.placeLink.title || 'Lugar'} · removido ou de outra biblioteca`,raw.placeLink.entryId));
      placeControl.replaceChildren(...placeOptions);
      placeStatus.textContent = raw.placeLink ? place?.ambience ? 'Este ambiente acompanha as alterações na ficha do lugar.' : 'Lugar indisponível. A última ambientação conhecida foi preservada; escolha outro lugar ou Personalizado.' : '';
      controls.forEach((control,name) => {
        if (name === 'scope') { control.value = selectedSequence; control.disabled = !record; }
        else if (name === 'place') { control.value = raw.placeLink?.entryId || ''; control.disabled = !editable || inherited; }
        else if (name === 'inherit') { control.value = inherited ? 'inherit' : 'custom'; control.disabled = !editable; control.parentElement.hidden = !selectedSequence; }
        else { if (name === 'enabled') control.checked = value.enabled; else control.value = String(value[name]); control.disabled = !editable || inherited || Boolean(raw.placeLink); }
      });
      scopeHelp.textContent = selectedSequence ? 'Ao usar o padrão, sua personalização fica guardada. Este ambiente começa no primeiro bloco da sequência e segue até o início da próxima. Escolha Personalizar para definir outro ambiente, ou desative a faixa apenas neste trecho.' : 'O padrão vale antes da primeira sequência e em todas as sequências sem personalização. A faixa aparece quando há espaço à esquerda da folha.';
      controls.get('width').setAttribute('aria-valuetext',`${value.width} pixels`);
      controls.get('opacity').setAttribute('aria-valuetext',`${Math.round(value.opacity * 100)} por cento`);
      controls.get('tileSize').setAttribute('aria-valuetext',`${value.tileSize} pixels`);
      controls.get('tileSize').parentElement.hidden = value.mode !== 'texture'; textureActions.hidden = value.mode !== 'texture';
      upload.disabled = !editable || inherited || Boolean(raw.placeLink) || busy; clear.disabled = !editable || inherited || Boolean(raw.placeLink) || !value.texture; file.disabled = !editable || inherited || Boolean(raw.placeLink) || busy;
      schedule();
    }
    function commit(mutator) {
      const {record,ambience,override} = target(); if (!record || !canEdit() || (selectedSequence && !override)) return;
      importTicket += 1; busy = false; message = '';
      const previous = record.ambience, value = normalizeStyle(override?.style || ambience); mutator(value);
      if (selectedSequence) override.style = normalizeStyle(value);
      record.ambience = selectedSequence ? ambience : normalize({...value,sequences:ambience.sequences});
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
      if (key === 'scope') {
        if (control.value && !availableSequences().some(item => item.id === control.value)) return;
        selectedSequence = control.value; importTicket += 1; busy = false; message = ''; update(); return;
      }
      if (key === 'place') {
        commit(value => {
          const place = getPlaces().find(item => item.id === control.value && item.ambience);
          value.placeLink = place ? {entryId:place.id,collectionId:collectionId(),title:place.title,snapshot:normalizeBase(place.ambience)} : null;
        }); return;
      }
      if (key === 'inherit') {
        const {record,ambience,raw,savedOverride} = target(); if (!record || !canEdit() || !selectedSequence) return;
        importTicket += 1; busy = false; message = '';
        if (savedOverride) savedOverride.inherit = control.value === 'inherit';
        else if (control.value === 'custom') ambience.sequences.push({sequenceId:selectedSequence,inherit:false,style:normalizeStyle(raw)});
        const previous = record.ambience; record.ambience = normalize(ambience);
        try { onChange(record); } catch (error) { record.ambience = previous; message = error.message || 'Não foi possível salvar a ambientação.'; }
        update(); return;
      }
      if (!['enabled','mode','preset'].includes(key)) return;
      commit(value => {
        value[key] = key === 'enabled' ? control.checked : control.value;
        if (key === 'preset' && Object.hasOwn(presets,control.value) && control.value !== 'custom') { value.color = presets[control.value][1]; value.label = presets[control.value][2]; }
      });
    });
    upload.addEventListener('click',() => { if (canEdit()) file.click(); });
    clear.addEventListener('click',() => commit(value => { value.texture = null; value.mode = 'color'; }));
    file.addEventListener('change',async () => {
      const selected = file.files?.[0], record = getRecord(), context = currentContext, sequenceId = selectedSequence; file.value = '';
      if (!selected || !record || !canEdit() || target().inherited) return;
      const ticket = ++importTicket; busy = true; message = 'Preparando textura…'; update();
      try {
        const texture = await importTexture(selected);
        if (ticket !== importTicket || context !== currentContext || sequenceId !== selectedSequence || record.id !== getRecord()?.id || !canEdit() || target().inherited) return;
        // Resolve the current record again: a remote refresh can replace its object.
        const current = getRecord(), previous = current.ambience, ambience = normalize(previous);
        const override = ambience.sequences.find(item => item.sequenceId === sequenceId && !item.inherit);
        if (sequenceId && !override) return;
        if (override) override.style = normalizeStyle({...override.style,texture,mode:'texture'});
        current.ambience = override ? ambience : normalize({...ambience,texture,mode:'texture'});
        try { onChange(current); } catch (error) { current.ambience = previous; throw error; }
        message = (override?.style || current.ambience).enabled ? 'Textura adicionada.' : 'Textura adicionada. Ative Mostrar faixa para vê-la na folha.';
      } catch (error) { if (ticket === importTicket && context === currentContext) message = error.message || 'Não foi possível importar a textura.'; }
      finally { if (ticket === importTicket && context === currentContext) { busy = false; update(); } }
    });
    if (win.ResizeObserver) { const observer = new win.ResizeObserver(schedule); [page,editorWrap,editorArea].forEach(item => observer.observe(item)); }
    win.addEventListener('resize',schedule);
    editorArea.addEventListener('scroll',schedule,{passive:true});
    editor.addEventListener('input',schedule);
    new win.MutationObserver(schedule).observe(editor,{childList:true,subtree:true,attributes:true,attributeFilter:['data-narrative-sequence-id','data-canonical-visible']});
    win.addEventListener('beforeunload',releaseTextures);
    update(); return {update,schedule,importTexture,loadTexture};
  }
  root.HeartspaceDocumentAmbience = {normalize,mount,style:normalizeBase,styleEditor,refreshPlaceLinks};
})(globalThis);
