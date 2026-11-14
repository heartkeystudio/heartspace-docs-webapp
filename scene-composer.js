/* Scene composition authoring. Playback uses the portable narrative-media renderer. */
(function (root) {
  const media = root.HeartspaceNarrativeMedia;
  const styles = `
    .scene-composer{grid-column:1/-1;min-width:0;border:0;border-top:1px solid #ffffff20;padding:12px 0;margin:0;font-size:12px}
    .scene-composer summary{cursor:pointer;color:#ddd;font-weight:600}.scene-composer-body{display:grid;gap:10px;padding-top:12px}
    .scene-composer label{display:grid;gap:5px;min-width:0}.scene-composer .scene-element-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .scene-composer input,.scene-composer select,.scene-composer textarea{box-sizing:border-box;width:100%;min-width:0;max-width:100%;font:inherit;color:inherit;background:#ffffff06;border:1px solid #ffffff20;border-radius:5px;padding:7px}
    .scene-composer textarea{min-height:80px;resize:vertical}.scene-composer select[size]{height:126px}.scene-composer select[size] option{padding:5px}
    .scene-composer .scene-element-actions{display:flex;flex-wrap:wrap;gap:5px}.scene-composer button{min-height:30px;border:1px solid #ffffff20;border-radius:5px;background:#ffffff08;color:#ccc;font:inherit;padding:5px 8px;cursor:pointer}
    .scene-composer button:disabled{opacity:.4;cursor:default}.scene-composer .scene-check{display:flex;align-items:center;gap:7px}.scene-composer .scene-check input{width:16px;height:16px;min-height:0;margin:0}
    .scene-composer [hidden]{display:none!important}.scene-composer small,.scene-composer-status{color:#999;line-height:1.5}.scene-composer-status{margin:0;min-height:1.5em}
    .scene-editing .scene-elements-layer .scene-element{pointer-events:auto;touch-action:none;cursor:move;user-select:none}
    .scene-editing .scene-element.scene-selected{outline:2px solid #e2e2e2;outline-offset:2px}
    .scene-editing .scene-element:hover:not(.scene-selected){outline:1px dashed #fff8}
    .scene-element-tools{position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:100}
    .scene-element-tools button{position:absolute;display:block;width:var(--scene-handle-size,18px);height:var(--scene-handle-size,18px);min-width:0;min-height:0;border:2px solid #fff;border-radius:50%;background:#222;padding:0;pointer-events:auto;touch-action:none;transform:translate(-50%,-50%);box-shadow:0 0 0 1px #000}
    .scene-element-tools [data-handle=scale]{left:100%;top:100%;cursor:nwse-resize;border-radius:2px}
    .scene-element-tools [data-handle=rotate]{left:50%;top:-24px;cursor:grab}
    .scene-element-tools [data-handle=anchor]{left:var(--element-anchor-x);top:var(--element-anchor-y);width:var(--scene-handle-size,14px);height:var(--scene-handle-size,14px);background:#c69a41;cursor:crosshair}
    .scene-editing .scene-element-content{pointer-events:none}
    .scene-editing .scene-element:focus-visible{outline:3px solid #e6bd6e}
  `;
  const create = options => {
    const {parent,surface,read,write,preview} = options;
    const doc = parent.ownerDocument, win = doc.defaultView;
    const style = doc.createElement('style'); style.textContent = styles; doc.head.append(style);
    const panel = doc.createElement('details'); panel.className = 'scene-composer'; panel.open = true;
    panel.innerHTML = `<summary>Elementos da cena</summary><div class="scene-composer-body">
      <label class="scene-check"><input data-field="dialogue_visible" type="checkbox" checked>Mostrar caixa de diálogo</label>
      <div class="scene-element-actions"><button type="button" data-action="image">+ Imagem</button><button type="button" data-action="character">+ Personagem</button><button type="button" data-action="text">+ Texto</button><button type="button" data-action="button">+ Botão</button><button type="button" data-action="hotspot">+ Região clicável</button></div>
      <input type="file" accept="image/png,image/jpeg,image/webp" data-upload hidden>
      <label>Camadas · da frente para o fundo<select data-list size="5" aria-label="Elementos da cena"></select></label>
      <div class="scene-element-actions"><button type="button" data-action="up">Subir camada</button><button type="button" data-action="down">Descer camada</button><button type="button" data-action="duplicate">Duplicar</button><button type="button" data-action="remove">Remover</button></div>
      <section data-properties hidden aria-label="Propriedades do elemento"><div class="scene-composer-body">
        <label>Nome<input data-field="name" maxlength="120"></label>
        <label class="scene-check"><input data-field="visible" type="checkbox">Visível</label>
        <label data-type="character">Personagem<select data-field="character_id"></select></label>
        <label data-type="text button">Texto<textarea data-field="text" maxlength="10000"></textarea><small data-type="button">Deixe vazio para usar o texto da opção vinculada durante a apresentação.</small></label>
        <div data-type="text button" class="scene-element-grid"><label>Tamanho do texto<input data-field="font_size" type="number" min="12" max="160" step="1"></label><label>Cor<input data-field="color" type="color"></label><label>Alinhamento<select data-field="align"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label></div>
        <details data-interaction-editor open><summary>Ao clicar</summary><div class="scene-composer-body">
          <label>Escolha vinculada<select data-interaction-choice aria-label="Escolha acionada pelo elemento"></select></label>
          <small data-interaction-help></small>
          <small>O clique fica ativo quando a história chega ao bloco de escolha indicado. Destinos, condições e efeitos são os da opção original. As opções em texto continuam disponíveis. Regiões são transparentes na apresentação; suas bordas aparecem apenas aqui.</small>
        </div></details>
        <div data-type="art" class="scene-element-actions"><button type="button" data-action="replace">Trocar imagem</button></div>
        <div class="scene-element-actions"><button type="button" data-preset="20">Esquerda</button><button type="button" data-preset="50">Centro</button><button type="button" data-preset="80">Direita</button></div>
        <div class="scene-element-grid">
          <label>X (%)<input data-field="x" type="number" min="-100" max="200" step="0.1"></label><label>Y (%)<input data-field="y" type="number" min="-100" max="200" step="0.1"></label>
          <label>Largura (%)<input data-field="width" type="number" min="1" max="300" step="0.1"></label><label>Altura (%)<input data-field="height" type="number" min="1" max="300" step="0.1"></label>
          <label>Escala (%)<input data-field="scale" type="number" min="5" max="800" step="1"></label><label>Rotação (°)<input data-field="rotation" type="number" min="-360" max="360" step="1"></label>
          <label>Opacidade (%)<input data-field="opacity" type="number" min="0" max="100" step="1"></label>
          <label>Âncora<select data-anchor><option value="50,100">Base central</option><option value="50,50">Centro</option><option value="0,0">Canto superior esquerdo</option><option value="100,100">Canto inferior direito</option><option value="custom">Personalizada</option></select></label>
          <label>Âncora X (%)<input data-field="anchor_x" type="number" min="0" max="100" step="0.1"></label><label>Âncora Y (%)<input data-field="anchor_y" type="number" min="0" max="100" step="0.1"></label>
        </div>
        <div class="scene-element-grid"><label class="scene-check"><input data-field="flip_x" type="checkbox">Espelhar horizontal</label><label class="scene-check"><input data-field="flip_y" type="checkbox">Espelhar vertical</label></div>
        <div data-type="art" class="scene-element-grid">
          <label>Encaixe<select data-field="fit"><option value="contain">Imagem inteira</option><option value="cover">Preencher e recortar</option><option value="original">Tamanho original</option></select></label>
          <label>Foco X (%)<input data-field="focus_x" type="number" min="0" max="100" step="1"></label><label>Foco Y (%)<input data-field="focus_y" type="number" min="0" max="100" step="1"></label>
        </div>
        <small>Arraste o elemento para mover. O quadrado altera a escala, o círculo acima gira e o ponto dourado ajusta a âncora. As posições e dimensões são relativas à tela do jogo. Use as setas para mover o elemento selecionado; Shift move em passos maiores.</small>
      </div></section><p class="scene-composer-status" role="status"></p>
    </div>`;
    const screen = parent.querySelector('.scene-moment-controls') || parent.querySelector('.scene-screen-settings');
    parent.insertBefore(panel,screen ? screen.nextSibling : parent.firstChild); surface.classList.add('scene-editing');
    const list = panel.querySelector('[data-list]'), properties = panel.querySelector('[data-properties]'), status = panel.querySelector('[role=status]'), upload = panel.querySelector('[data-upload]');
    const motionEditor = doc.createElement('details'); motionEditor.dataset.motionEditor = '';
    motionEditor.innerHTML = `<summary>Animação neste bloco</summary><div class="scene-composer-body">
      <small data-motion-help>Escolha um bloco em Momento da cena. A composição anterior será o início e os ajustes acima serão o estado final. Para entradas e saídas suaves, altere Visível no bloco escolhido.</small>
      <label class="scene-check"><input type="checkbox" data-motion-enabled>Animar este elemento</label>
      <div data-motion-settings hidden class="scene-composer-body">
        <div class="scene-element-grid"><label>Duração (ms)<input data-motion-field="duration_ms" type="number" min="50" max="60000" step="50"></label><label>Atraso (ms)<input data-motion-field="delay_ms" type="number" min="0" max="60000" step="50"></label></div>
        <label>Suavização<select data-motion-field="easing"><option value="linear">Velocidade constante</option><option value="ease-in-out">Entrada e saída suaves</option><option value="ease-in">Acelerar</option><option value="ease-out">Desacelerar</option><option value="ease">Suave</option><option value="back">Ultrapassar e acomodar</option></select></label>
        <label>Quadros personalizados<select data-motion-frames><option value="">Início automático → estado final</option></select></label>
        <div class="scene-element-grid"><label>Posição na animação (%)<input data-motion-at type="number" min="0" max="99" step="1" value="50"></label><button type="button" data-motion-action="add">Adicionar quadro</button></div>
        <small>O quadro 0 define um início personalizado. Os demais ficam entre o início e o estado final, em 100%. Um novo quadro copia os ajustes atuais do elemento.</small>
        <div data-motion-frame-properties hidden class="scene-composer-body">
          <div class="scene-element-grid">
            <label>X (%)<input data-motion-pose="x" type="number" min="-100" max="200" step="0.1"></label><label>Y (%)<input data-motion-pose="y" type="number" min="-100" max="200" step="0.1"></label>
            <label>Largura (%)<input data-motion-pose="width" type="number" min="1" max="300" step="0.1"></label><label>Altura (%)<input data-motion-pose="height" type="number" min="1" max="300" step="0.1"></label>
            <label>Escala (%)<input data-motion-pose="scale" type="number" min="5" max="800" step="1"></label><label>Rotação (°)<input data-motion-pose="rotation" type="number" min="-360" max="360" step="1"></label>
            <label>Opacidade (%)<input data-motion-pose="opacity" type="number" min="0" max="100" step="1"></label>
          </div><div class="scene-element-actions"><button type="button" data-motion-action="view">Ver quadro</button><button type="button" data-motion-action="remove">Remover quadro</button></div>
        </div>
      </div></div>`;
    properties.querySelector('.scene-composer-body').append(motionEditor);
    const fields = [...panel.querySelectorAll('[data-field]')];
    let key = '', selected = '', uploadIntent = null, drag = null;
    const context = () => read();
    const getItem = state => media.presentation(state.presentation).elements.find(item => item.id === selected);
    const interactionSelect = panel.querySelector('[data-interaction-choice]');
    const renderInteractions = () => {
      const state = context(), item = getItem(state), nodes = state.nodes || [];
      interactionSelect.replaceChildren(new Option('Sem ação',''));
      nodes.forEach((node,index) => {
        if (node.type !== 'choice') return;
        const group = doc.createElement('optgroup'); group.label = `${index + 1} · ${node.prompt || 'Escolha sem pergunta'}`.slice(0,140);
        (node.options || []).forEach(option => {
          if (!node.id || !option.id) return;
          const field = new Option(option.text || 'Opção sem texto',JSON.stringify([node.id,option.id]));
          field.disabled = nodes.filter(candidate => candidate.id === node.id).length !== 1 || node.options.filter(candidate => candidate.id === option.id).length !== 1;
          group.append(field);
        });
        interactionSelect.append(group);
      });
      const linked = Boolean(item?.choice_block_id || item?.choice_option_id);
      const value = linked ? JSON.stringify([item.choice_block_id,item.choice_option_id]) : '';
      const field = [...interactionSelect.options].find(option => option.value === value);
      if (linked && !field) interactionSelect.append(new Option('Vínculo ausente · escolha outra opção',value));
      interactionSelect.value = value; interactionSelect.disabled = !state.editable || !item;
      panel.querySelector('[data-interaction-help]').textContent = linked && (!field || field.disabled) ? 'Este vínculo está ausente ou ambíguo. Selecione uma opção válida; a posição na lista não altera o vínculo.' : linked ? 'Vinculado por identificadores estáveis: reordenar blocos ou opções preserva esta ação.' : nodes.some(node => node.type === 'choice') ? 'Selecione a opção que este elemento deve acionar.' : 'Adicione um bloco de escolha à sequência em Escrever para configurar a interação.';
    };
    const id = () => `element-${win.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
    let motionSelection = '', frameAt = null;
    const motionTrack = state => (state.animations || []).find(track => track.element_id === selected);
    const renderMotionEditor = populate => {
      const state = context(), item = getItem(state), selection = `${state.key}:${selected}`;
      if (selection !== motionSelection) { motionSelection = selection; frameAt = null; populate = true; }
      const track = motionTrack(state), editable = state.editable && state.index >= 0 && Boolean(item);
      const enabled = motionEditor.querySelector('[data-motion-enabled]'); enabled.checked = Boolean(track && track.enabled !== false); enabled.disabled = !editable;
      motionEditor.querySelector('[data-motion-settings]').hidden = !track || track.enabled === false;
      motionEditor.querySelector('[data-motion-help]').textContent = state.index < 0 ? 'Selecione um bloco em Momento da cena para animar este elemento.' : 'A composição anterior é o início. Os ajustes acima definem o estado final. Alterne Visível para entradas e saídas suaves; use atraso para encadear movimentos.';
      motionEditor.querySelectorAll('input,select,button').forEach(control => { if (control !== enabled) control.disabled = !editable || !track || track.enabled === false; });
      const frames = motionEditor.querySelector('[data-motion-frames]');
      frames.replaceChildren(new Option('Início automático → estado final',''),...(track?.keyframes || []).map(frame => new Option(frame.at === 0 ? '0% · Início personalizado' : `${frame.at}% · Quadro intermediário`,String(frame.at))));
      if (!track?.keyframes.some(frame => frame.at === frameAt)) frameAt = null;
      frames.value = frameAt === null ? '' : String(frameAt);
      const frame = track?.keyframes.find(candidate => candidate.at === frameAt);
      motionEditor.querySelector('[data-motion-frame-properties]').hidden = !frame;
      if (populate) {
        motionEditor.querySelectorAll('[data-motion-field]').forEach(field => { field.value = track?.[field.dataset.motionField] ?? (field.type === 'number' ? '0' : 'ease-in-out'); });
        motionEditor.querySelectorAll('[data-motion-pose]').forEach(field => {
          const property = field.dataset.motionPose, value = frame?.[property] ?? item?.[property] ?? 0;
          field.value = String(Math.round(value * (['scale','opacity'].includes(property) ? 10000 : 100)) / 100);
        });
      }
    };
    const writeMotion = (track,populate = false) => {
      const state = context();
      if (!state.editable || state.index < 0 || !selected || !options.writeAnimation?.(state.key,selected,track)) return false;
      render(populate); return true;
    };
    motionEditor.addEventListener('input',event => {
      const field = event.target, state = context();
      if (field.matches('[data-motion-enabled]')) {
        writeMotion({...(motionTrack(state) || {element_id:selected,duration_ms:700,delay_ms:0,easing:'ease-in-out',keyframes:[]}),enabled:field.checked},true); return;
      }
      if (!field.matches('[data-motion-field],[data-motion-pose]')) return;
      if (field.type === 'number' && (!field.value || !field.validity.valid)) return;
      const track = motionTrack(state); if (!track) return;
      if (field.dataset.motionField) writeMotion({...track,[field.dataset.motionField]:field.type === 'number' ? Number(field.value) : field.value});
      else if (frameAt !== null) {
        const property = field.dataset.motionPose, value = Number(field.value) / (['scale','opacity'].includes(property) ? 100 : 1);
        writeMotion({...track,keyframes:track.keyframes.map(frame => frame.at === frameAt ? {...frame,[property]:value} : frame)});
      }
    });
    motionEditor.querySelector('[data-motion-frames]').addEventListener('change',event => { frameAt = event.target.value === '' ? null : Number(event.target.value); renderMotionEditor(true); });
    motionEditor.addEventListener('click',event => {
      const button = event.target.closest('[data-motion-action]'); if (!button) return;
      const state = context(), track = motionTrack(state), item = getItem(state); if (!track || !item || !state.editable) return;
      const action = button.dataset.motionAction;
      if (action === 'view') { options.previewAnimationAt?.(selected,frameAt); return; }
      if (action === 'remove') { writeMotion({...track,keyframes:track.keyframes.filter(frame => frame.at !== frameAt)},true); return; }
      const at = motionEditor.querySelector('[data-motion-at]'); if (!at.value || !at.validity.valid) return;
      const position = Number(at.value);
      if (track.keyframes.some(frame => frame.at === position)) { frameAt = position; renderMotionEditor(true); return; }
      if (track.keyframes.length >= 32) { status.textContent = 'Use até 32 quadros personalizados por elemento.'; return; }
      frameAt = position;
      writeMotion({...track,keyframes:[...track.keyframes,{at:position,...Object.fromEntries(media.motionKeys.map(property => [property,item[property]]))}]},true);
    });
    const mark = () => {
      const state = context(), editable = state.editable;
      const items = new Map(media.presentation(state.presentation).elements.map(item => [item.id,item]));
      const canvasScale = surface.getBoundingClientRect().width / Math.max(1,surface.offsetWidth);
      surface.querySelectorAll('[data-scene-element]').forEach(node => {
        const active = node.dataset.sceneElement === selected;
        node.classList.toggle('scene-selected',active && editable);
        node.tabIndex = editable ? 0 : -1;
        const item = items.get(node.dataset.sceneElement);
        node.setAttribute('aria-label',item?.name || 'Elemento de cena');
        node.style.setProperty('--scene-handle-size',`${16 / Math.max(.01,canvasScale * (item?.scale || 1))}px`);
        node.querySelector('.scene-element-tools')?.remove();
        if (active && editable) {
          const tools = doc.createElement('div'); tools.className = 'scene-element-tools';
          tools.innerHTML = '<button type="button" data-handle="scale" tabindex="-1" aria-label="Alterar escala"></button><button type="button" data-handle="rotate" tabindex="-1" aria-label="Girar"></button><button type="button" data-handle="anchor" tabindex="-1" aria-label="Mover âncora"></button>';
          node.append(tools);
        }
      });
      surface.classList.toggle('scene-editing',editable);
    };
    const render = (populate = true) => {
      const state = context(), value = media.presentation(state.presentation);
      if (key !== state.key) { selected = ''; key = state.key; status.textContent = ''; }
      if (selected && !value.elements.some(item => item.id === selected)) selected = '';
      const active = getItem(state);
      list.replaceChildren(...value.elements.slice().reverse().map(item => new Option(`${item.visible ? '' : '◌ '}${item.name}`,item.id)));
      list.value = selected; list.disabled = !value.elements.length;
      properties.hidden = !active;
      if (populate) {
        const characters = fields.find(field => field.dataset.field === 'character_id');
        characters.replaceChildren(new Option('Escolha um personagem',''),...state.characters.map(character => new Option(character.name,character.id)));
        fields.forEach(field => {
          const property = field.dataset.field;
          const val = property === 'dialogue_visible' ? value.dialogue_visible : active?.[property];
          if (field.type === 'checkbox') field.checked = Boolean(val);
          else field.value = val === undefined ? '' : typeof val === 'number' ? String(Math.round(val * (['scale','opacity'].includes(property) ? 10000 : 100)) / 100) : val;
        });
        if (active) {
          const pair = `${active.anchor_x},${active.anchor_y}`, anchor = panel.querySelector('[data-anchor]');
          anchor.value = [...anchor.options].some(option => option.value === pair) ? pair : 'custom';
        }
      }
      panel.querySelectorAll('[data-type]').forEach(node => { node.hidden = !active || (node.dataset.type === 'art' ? !['image','character'].includes(active.type) : !node.dataset.type.split(' ').includes(active.type)); });
      panel.querySelector('[data-action=replace]').hidden = active?.type !== 'image';
      panel.querySelectorAll('input,textarea,select,button').forEach(control => { if (control !== list) control.disabled = !state.editable; });
      ['up','down','duplicate','remove'].forEach(action => { panel.querySelector(`[data-action=${action}]`).disabled = !state.editable || !active || (action === 'up' && value.elements.at(-1)?.id === selected) || (action === 'down' && value.elements[0]?.id === selected); });
      renderMotionEditor(populate);
      renderInteractions();
      mark();
    };
    const commit = (value,expectedKey,populate = false) => {
      const state = context();
      if (!state.editable || state.key !== expectedKey || !write(expectedKey,media.presentation(value))) return false;
      render(populate); return true;
    };
    const change = (changes,populate = false) => {
      const state = context(), value = media.presentation(state.presentation);
      value.elements = value.elements.map(item => item.id === selected ? media.element({...item,...changes}) : item);
      commit(value,state.key,populate);
    };
    const add = (type,asset = null) => {
      const state = context(), value = media.presentation(state.presentation);
      if (!state.editable) return;
      if (value.elements.length >= 80) { status.textContent = 'A cena já possui 80 elementos.'; return; }
      const character = state.characters.find(item => item.portrait) || state.characters[0];
      if (type === 'character' && !character) { status.textContent = 'Cadastre um personagem na biblioteca do projeto primeiro.'; return; }
      selected = id(); key = state.key;
      value.elements.push(media.element({id:selected,type,asset,character_id:type === 'character' ? character?.id : '',name:asset?.name || (type === 'character' ? character?.name : ''),text:type === 'text' ? 'Seu texto aqui' : '',...(['button','hotspot'].includes(type) ? {font_size:24} : {})}));
      if (commit(value,state.key,true)) { status.textContent = type === 'character' && !character?.portrait ? 'Adicione um retrato a este personagem na biblioteca do projeto.' : ''; fields.find(field => field.dataset.field === 'name').focus(); }
    };
    list.addEventListener('change',() => { selected = list.value; render(); });
    interactionSelect.addEventListener('change',() => {
      let link = ['', ''];
      try { if (interactionSelect.value) link = JSON.parse(interactionSelect.value); } catch (_) { return; }
      change({choice_block_id:link[0],choice_option_id:link[1]},true);
    });
    panel.addEventListener('input',event => {
      const field = event.target, property = field.dataset.field;
      if (!property || !context().editable) return;
      if (field.type === 'number' && (!field.value.trim() || !field.validity.valid)) return;
      const value = field.type === 'checkbox' ? field.checked : field.type === 'number' ? Number(field.value) / (['scale','opacity'].includes(property) ? 100 : 1) : field.value;
      if (property === 'dialogue_visible') { const state = context(); commit({...state.presentation,dialogue_visible:value},state.key); }
      else change({[property]:value});
    });
    panel.querySelector('[data-anchor]').addEventListener('change',event => {
      if (event.target.value !== 'custom') { const [anchor_x,anchor_y] = event.target.value.split(',').map(Number); change({anchor_x,anchor_y},true); }
    });
    panel.addEventListener('click',event => {
      const button = event.target.closest('button'); if (!button || button.closest('[data-motion-editor],[data-interaction-editor]') || !context().editable) return;
      if (button.dataset.preset) { change({x:Number(button.dataset.preset),y:100,anchor_x:50,anchor_y:100,scale:1,rotation:0},true); return; }
      const action = button.dataset.action, state = context(), value = media.presentation(state.presentation), index = value.elements.findIndex(item => item.id === selected);
      if (action === 'image' || action === 'replace') { uploadIntent = {key:state.key,id:action === 'replace' ? selected : ''}; upload.click(); return; }
      if (['character','text','button','hotspot'].includes(action)) { add(action); return; }
      if (index < 0) return;
      if (action === 'remove') { value.elements.splice(index,1); selected = ''; }
      if (action === 'duplicate') {
        if (value.elements.length >= 80) { status.textContent = 'A cena já possui 80 elementos.'; return; }
        const copy = {...value.elements[index],id:id(),name:value.elements[index].name + ' · cópia',x:value.elements[index].x + 2,y:value.elements[index].y + 2};
        value.elements.splice(index + 1,0,media.element(copy)); selected = copy.id;
      }
      if (action === 'up' && index < value.elements.length - 1) [value.elements[index],value.elements[index + 1]] = [value.elements[index + 1],value.elements[index]];
      if (action === 'down' && index > 0) [value.elements[index],value.elements[index - 1]] = [value.elements[index - 1],value.elements[index]];
      commit(value,state.key,true);
    });
    upload.addEventListener('change',async () => {
      const file = upload.files?.[0], intent = uploadIntent; upload.value = ''; uploadIntent = null;
      if (!file || !intent || !context().editable) return;
      status.textContent = 'Preparando imagem…';
      try {
        const asset = await media.readFile(file,'image',{purpose:'scene'}), state = context();
        if (state.key !== intent.key || !state.editable) return;
        if (intent.id) {
          if (!media.presentation(state.presentation).elements.some(item => item.id === intent.id)) return;
          selected = intent.id; change({asset},true); status.textContent = '';
        } else add('image',asset);
      } catch (error) { if (context().key === intent.key) status.textContent = error.message || 'Não foi possível importar a imagem.'; }
    });
    const pointer = event => {
      const rect = surface.getBoundingClientRect();
      return {x:(event.clientX - rect.left) / rect.width * 100,y:(event.clientY - rect.top) / rect.height * 100};
    };
    surface.addEventListener('pointerdown',event => {
      const node = event.target.closest('[data-scene-element]'), state = context();
      if (!state.editable || event.button !== 0) return;
      if (!node) { if (event.target === surface || event.target.classList.contains('scene-elements-layer')) { selected = ''; render(); } return; }
      event.preventDefault(); event.stopPropagation();
      selected = node.dataset.sceneElement;
      const item = getItem(state); if (!item) return;
      const mode = event.target.closest('[data-handle]')?.dataset.handle || 'move';
      render();
      const start = pointer(event), rect = surface.getBoundingClientRect();
      drag = {key:state.key,pointerId:event.pointerId,item,start,mode,value:media.presentation(state.presentation),rect};
      surface.setPointerCapture(event.pointerId);
    });
    surface.addEventListener('pointermove',event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const state = context(); if (!state.editable || state.key !== drag.key) { drag = null; render(); return; }
      const point = pointer(event), {item,start,mode} = drag;
      const dx = point.x - start.x, dy = point.y - start.y;
      let changes;
      if (mode === 'rotate') {
        const angle = p => Math.atan2((p.y - item.y) * drag.rect.height,(p.x - item.x) * drag.rect.width);
        changes = {rotation:Math.round(item.rotation + (angle(point) - angle(start)) * 180 / Math.PI)};
      } else if (mode === 'scale') {
        const distance = p => Math.hypot((p.x - item.x) * drag.rect.width,(p.y - item.y) * drag.rect.height);
        changes = {scale:item.scale * distance(point) / Math.max(1,distance(start))};
      } else if (mode === 'anchor') {
        // Unrotate/unscale the pointer delta, preserving the image's world position.
        const radians = item.rotation * Math.PI / 180, px = dx * drag.rect.width / 100, py = dy * drag.rect.height / 100;
        const ax = Math.max(0,Math.min(100,item.anchor_x + (px * Math.cos(radians) + py * Math.sin(radians)) / item.scale / (item.width * drag.rect.width / 100) * 100));
        const ay = Math.max(0,Math.min(100,item.anchor_y + (-px * Math.sin(radians) + py * Math.cos(radians)) / item.scale / (item.height * drag.rect.height / 100) * 100));
        const localX = (ax - item.anchor_x) * item.width * drag.rect.width / 10000 * item.scale, localY = (ay - item.anchor_y) * item.height * drag.rect.height / 10000 * item.scale;
        changes = {anchor_x:ax,anchor_y:ay,x:item.x + (localX * Math.cos(radians) - localY * Math.sin(radians)) / drag.rect.width * 100,y:item.y + (localX * Math.sin(radians) + localY * Math.cos(radians)) / drag.rect.height * 100};
      } else changes = {x:item.x + dx,y:item.y + dy};
      drag.value.elements = drag.value.elements.map(candidate => candidate.id === item.id ? media.element({...item,...changes}) : candidate);
      preview(drag.value); mark();
    });
    const finish = (event,cancelled = false) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const current = drag; drag = null;
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      if (cancelled) { preview(context().presentation); render(); }
      else commit(current.value,current.key,true);
    };
    surface.addEventListener('pointerup',event => finish(event));
    surface.addEventListener('pointercancel',event => finish(event,true));
    surface.addEventListener('lostpointercapture',event => finish(event,true));
    surface.addEventListener('keydown',event => {
      const node = event.target.closest('[data-scene-element]'); if (!node || !context().editable) return;
      if (event.key === 'Escape') { selected = ''; render(); return; }
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); selected = node.dataset.sceneElement;
      const item = getItem(context()), step = event.shiftKey ? 5 : .5;
      change({x:item.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),y:item.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)},true);
    });
    return {render};
  };
  root.HeartspaceSceneComposer = {create};
})(globalThis);
