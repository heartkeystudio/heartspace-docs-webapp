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
    .scene-editing .scene-multi-selected{outline:2px solid #40a9ff;outline-offset:2px}
    .scene-multi-tools{position:absolute;box-sizing:border-box;border:1px dashed #57b6ff;pointer-events:none;z-index:120;min-width:2px;min-height:2px}
    .scene-multi-tools [data-multi-handle]{position:absolute;width:18px;height:18px;min-width:18px;min-height:18px;padding:0;border:2px solid #fff;border-radius:3px;background:#087fc4;box-shadow:0 0 0 1px #000;pointer-events:auto;touch-action:none}
    .scene-multi-tools [data-multi-handle=scale]{right:-9px;bottom:-9px;cursor:nwse-resize}
    .scene-multi-tools [data-multi-handle=rotate]{left:50%;top:-28px;transform:translateX(-50%);border-radius:50%;cursor:grab}
    .scene-multi-actions{position:absolute;right:4px;top:4px;display:flex;gap:3px;pointer-events:auto;white-space:nowrap}
    .scene-multi-actions button{width:30px;min-width:30px;height:28px;min-height:28px;padding:2px;border:1px solid #ffffff70;border-radius:4px;background:#092f48;color:#fff;font:600 12px/1 system-ui;cursor:pointer}
    .scene-multi-actions button:focus-visible,.scene-multi-tools [data-multi-handle]:focus-visible{outline:3px solid #ffe09b;outline-offset:2px}
    .scene-multi-marquee{position:absolute;z-index:119;border:1px solid #40a9ff;background:#40a9ff22;pointer-events:none}
    .scene-parallax-preview .scene-element{pointer-events:none!important;outline:none!important}
    .scene-parallax-preview .scene-element-tools{display:none!important}
    .scene-parallax-preview .scene-element[data-element-type=hotspot]>.scene-element-content{visibility:hidden!important}
  `;
  const create = options => {
    const {parent,surface,read,write,preview} = options;
    const doc = parent.ownerDocument, win = doc.defaultView;
    const style = doc.createElement('style'); style.textContent = styles; doc.head.append(style);
    const panel = doc.createElement('section'); panel.className = 'scene-composer';
    panel.innerHTML = `<summary>Elementos da cena</summary><div class="scene-composer-body">
      <label class="scene-check"><input data-field="dialogue_visible" type="checkbox" checked>Mostrar caixa de diálogo</label>
      <details><summary>Parallax da cena</summary><div class="scene-composer-body">
        <label class="scene-check"><input data-field="parallax_enabled" type="checkbox">Ativar parallax</label>
        <div class="scene-element-grid"><label>Intensidade (%)<input data-field="parallax_strength" type="number" min="0" max="200" step="5"></label><label>Suavização (ms)<input data-field="parallax_smoothing_ms" type="number" min="0" max="1000" step="10"></label></div>
        <label class="scene-check"><input data-parallax-preview type="checkbox">Experimentar parallax</label>
        <small data-parallax-help>Mova o mouse sobre a cena para experimentar. Desative a experiência para voltar a arrastar elementos. Configure o deslocamento de cada camada abaixo.</small>
      </div></details>
      <div class="scene-element-actions"><button type="button" data-action="image">+ Imagem</button><button type="button" data-action="project-image">+ Recurso do projeto</button><button type="button" data-action="character">+ Personagem</button><button type="button" data-action="text">+ Texto</button><button type="button" data-action="button">+ Botão</button><button type="button" data-action="hotspot">+ Região clicável</button></div>
      <input type="file" accept="image/png,image/jpeg,image/webp" data-upload hidden>
      <label>Camadas · da frente para o fundo<select data-list size="5" aria-label="Elementos da cena" multiple></select><small>Ctrl/Cmd ou Shift + clique seleciona vários. Arraste uma área vazia do palco para selecionar por área.</small></label>
      <div class="scene-element-actions"><button type="button" data-action="up">Subir camada</button><button type="button" data-action="down">Descer camada</button><button type="button" data-action="duplicate">Duplicar</button><button type="button" data-action="remove">Remover</button></div>
      <section data-properties hidden aria-label="Propriedades do elemento"><div class="scene-composer-body">
        <label>Nome<input data-field="name" maxlength="120"></label>
        <label class="scene-check"><input data-field="visible" type="checkbox">Visível</label>
        <details><summary>Parallax desta camada</summary><div class="scene-composer-body">
          <div class="scene-element-actions"><button type="button" data-parallax-preset="0,0">Fixo</button><button type="button" data-parallax-preset="0.6,0.4">Fundo</button><button type="button" data-parallax-preset="1.5,1">Meio</button><button type="button" data-parallax-preset="3,2">Frente</button></div>
          <div class="scene-element-grid"><label>Horizontal (%)<input data-field="parallax_x" type="number" min="-15" max="15" step="0.1"></label><label>Vertical (%)<input data-field="parallax_y" type="number" min="-15" max="15" step="0.1"></label></div>
          <small>Deslocamento em relação à tela do jogo, na intensidade de 100%. Zero mantém fixo; valores negativos invertem o movimento. Os atalhos ajustam apenas o deslocamento. Para cenários, deixe margem nas imagens para não revelar bordas. Uma região sobreposta deve usar o mesmo deslocamento da imagem.</small>
        </div></details>
        <label data-type="character">Personagem<select data-field="character_id"></select></label>
        <label data-type="text button">Texto<textarea data-field="text" maxlength="10000"></textarea><small data-type="button">Deixe vazio para usar o texto da opção vinculada durante a apresentação.</small></label>
        <div data-type="text button" class="scene-element-grid"><label>Tamanho do texto<input data-field="font_size" type="number" min="12" max="160" step="1"></label><label>Cor<input data-field="color" type="color"></label><label>Alinhamento<select data-field="align"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label></div>
        <details data-interaction-editor open><summary>Ao clicar</summary><div class="scene-composer-body">
          <label>Escolha vinculada<select data-interaction-choice aria-label="Escolha acionada pelo elemento"></select></label>
          <small data-interaction-help></small>
          <small>O clique fica ativo quando a história chega ao bloco de escolha indicado. Destinos, condições e efeitos são os da opção original. As opções em texto continuam disponíveis. Regiões são transparentes na apresentação; suas bordas aparecem apenas aqui.</small>
        </div></details>
        <div data-type="art" class="scene-element-actions"><button type="button" data-action="replace">Trocar imagem</button><button type="button" data-action="project-replace">Recurso do projeto…</button></div><small data-type="art" data-asset-description></small>
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
    panel.querySelectorAll('[data-action="project-image"],[data-action="project-replace"]').forEach(button => { button.hidden = !options.pickAsset; });
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
    const authoredControls = [...panel.querySelectorAll('input,textarea,select,button')];
    const fields = [...panel.querySelectorAll('[data-field]')];
    const sceneFields = new Set(['dialogue_visible','parallax_enabled','parallax_strength','parallax_smoothing_ms']);
    const percentFields = new Set(['scale','opacity','parallax_strength']);
    const parallaxHover = win.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const parallaxReduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    const parallaxSupported = win.CSS?.supports?.('translate','1px 1px') === true;
    const parallaxPreview = panel.querySelector('[data-parallax-preview]');
    const setParallaxPreview = enabled => {
      parallaxPreview.checked = Boolean(enabled); surface.classList.toggle('scene-parallax-preview',Boolean(enabled));
      options.previewParallax?.(Boolean(enabled));
      render(false);
    };
    parallaxPreview.addEventListener('change',() => setParallaxPreview(parallaxPreview.checked));
    doc.addEventListener('visibilitychange',() => { if (doc.hidden) setParallaxPreview(false); });
    let key = '', selected = '', selectedIds = new Set(), uploadIntent = null, drag = null, marquee = null;
    const context = () => read();
    const getItem = state => selectedIds.size === 1 ? media.presentation(state.presentation).elements.find(item => item.id === selected) : null;
    const setSelection = ids => {
      selectedIds = new Set(ids);
      selected = selectedIds.size === 1 ? [...selectedIds][0] : '';
    };
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
      motionEditor.querySelector('[data-motion-action=view]').disabled = !editable || !track || !frame || state.displayProfile === 'eink' || parallaxReduced.matches;
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
      const layer = surface.querySelector('.scene-elements-layer');
      const focusedAction=layer?.querySelector('.scene-multi-tools [data-multi-action]:focus')?.dataset.multiAction;
      layer?.querySelector('.scene-multi-tools')?.remove();
      surface.querySelectorAll('[data-scene-element]').forEach(node => {
        const active = selectedIds.has(node.dataset.sceneElement);
        node.classList.toggle('scene-selected',active && editable && selectedIds.size === 1);
        node.classList.toggle('scene-multi-selected',active && editable && selectedIds.size > 1);
        node.tabIndex = editable ? 0 : -1;
        const item = items.get(node.dataset.sceneElement);
        node.setAttribute('aria-label',`${item?.name || 'Elemento de cena'}${active ? ', selecionado' : ''}`);
        node.style.setProperty('--scene-handle-size',`${16 / Math.max(.01,canvasScale * (item?.scale || 1))}px`);
        node.querySelector('.scene-element-tools')?.remove();
        if (active && editable && selectedIds.size === 1) {
          const tools = doc.createElement('div'); tools.className = 'scene-element-tools';
          tools.innerHTML = '<button type="button" data-handle="scale" tabindex="-1" aria-label="Alterar escala"></button><button type="button" data-handle="rotate" tabindex="-1" aria-label="Girar"></button><button type="button" data-handle="anchor" tabindex="-1" aria-label="Mover âncora"></button>';
          node.append(tools);
        }
      });
      if (editable && !parallaxPreview.checked && selectedIds.size > 1 && layer) {
        const layerRect = layer.getBoundingClientRect(),bounds=boundsFor();
        if (bounds) {
          const {left,top,right,bottom}=bounds;
          const tools = doc.createElement('div'); tools.className = 'scene-multi-tools'; tools.setAttribute('role','group'); tools.setAttribute('aria-label',`${selectedIds.size} elementos selecionados; transformação coletiva`);
          Object.assign(tools.style,{left:`${left-layerRect.left}px`,top:`${top-layerRect.top}px`,width:`${Math.max(2,right-left)}px`,height:`${Math.max(2,bottom-top)}px`});
          tools.innerHTML = '<button type="button" data-multi-handle="rotate" aria-label="Girar seleção arrastando"></button><button type="button" data-multi-handle="scale" aria-label="Escalar seleção proporcionalmente arrastando"></button><div class="scene-multi-actions" role="group" aria-label="Transformações coletivas pelo teclado"><button type="button" data-multi-action="left" aria-label="Mover seleção à esquerda" title="Mover à esquerda">←</button><button type="button" data-multi-action="right" aria-label="Mover seleção à direita" title="Mover à direita">→</button><button type="button" data-multi-action="up" aria-label="Mover seleção para cima" title="Mover para cima">↑</button><button type="button" data-multi-action="down" aria-label="Mover seleção para baixo" title="Mover para baixo">↓</button><button type="button" data-multi-action="rotate-left" aria-label="Girar seleção 15 graus para a esquerda" title="Girar −15°">−15°</button><button type="button" data-multi-action="rotate-right" aria-label="Girar seleção 15 graus para a direita" title="Girar +15°">+15°</button><button type="button" data-multi-action="scale-down" aria-label="Reduzir escala coletiva em dez por cento" title="Reduzir 10%">−10%</button><button type="button" data-multi-action="scale-up" aria-label="Aumentar escala coletiva em dez por cento" title="Aumentar 10%">+10%</button></div>';
          layer.append(tools);
          if(focusedAction)tools.querySelector(`[data-multi-action="${focusedAction}"]`)?.focus({preventScroll:true});
        }
      }
      surface.classList.toggle('scene-editing',editable);
    };
    const render = (populate = true) => {
      const state = context(), value = media.presentation(state.presentation);
      if (key !== state.key) { selected = ''; selectedIds = new Set(); key = state.key; status.textContent = ''; setParallaxPreview(false); }
      selectedIds = new Set([...selectedIds].filter(id => value.elements.some(item => item.id === id)));
      selected = selectedIds.size === 1 ? [...selectedIds][0] : '';
      const active = getItem(state);
      panel.querySelector('[data-asset-description]').textContent = active?.asset ? options.describeAsset?.(active.asset) || active.asset.name : '';
      list.replaceChildren(...value.elements.slice().reverse().map(item => new Option(`${item.visible ? '' : '◌ '}${item.name}`,item.id)));
      list.multiple = true; [...list.options].forEach(option => { option.selected = selectedIds.has(option.value); }); list.disabled = !value.elements.length;
      properties.hidden = !active;
      panel.dispatchEvent(new win.CustomEvent('scene-selection-change',{detail:{id:active?.id || '',name:selectedIds.size > 1 ? `${selectedIds.size} elementos selecionados` : active?.name || '',count:selectedIds.size}}));
      if (populate) {
        const characters = fields.find(field => field.dataset.field === 'character_id');
        characters.replaceChildren(new Option('Escolha um personagem',''),...state.characters.map(character => new Option(character.name,character.id)));
        fields.forEach(field => {
          const property = field.dataset.field;
          const val = sceneFields.has(property) ? value[property] : active?.[property];
          if (field.type === 'checkbox') field.checked = Boolean(val);
          else field.value = val === undefined ? '' : typeof val === 'number' ? String(Math.round(val * (percentFields.has(property) ? 10000 : 100)) / 100) : val;
        });
        if (active) {
          const pair = `${active.anchor_x},${active.anchor_y}`, anchor = panel.querySelector('[data-anchor]');
          anchor.value = [...anchor.options].some(option => option.value === pair) ? pair : 'custom';
        }
      }
      panel.querySelectorAll('[data-type]').forEach(node => { node.hidden = !active || (node.dataset.type === 'art' ? !['image','character'].includes(active.type) : !node.dataset.type.split(' ').includes(active.type)); });
      panel.querySelector('[data-action=replace]').hidden = active?.type !== 'image';
      authoredControls.forEach(control => { if (control !== list) control.disabled = !state.editable; });
      ['up','down','duplicate','remove'].forEach(action => { panel.querySelector(`[data-action=${action}]`).disabled = !state.editable || !active || (action === 'up' && value.elements.at(-1)?.id === selected) || (action === 'down' && value.elements[0]?.id === selected); });
      renderMotionEditor(populate);
      renderInteractions();
      const reduced = parallaxReduced.matches || state.displayProfile === 'eink', hover = parallaxHover.matches;
      const hasParallax = value.elements.some(item => item.visible && (item.parallax_x || item.parallax_y));
      parallaxPreview.disabled = !value.parallax_enabled || !value.parallax_strength || !hasParallax || reduced || !hover || !parallaxSupported;
      if (parallaxPreview.disabled && parallaxPreview.checked) setParallaxPreview(false);
      panel.querySelector('[data-parallax-help]').textContent = !parallaxSupported ? 'Este navegador exibe a composição estática, sem parallax.' : reduced ? 'Movimento reduzido está ativo: o parallax permanece estático.' : !hover ? 'O parallax requer um mouse ou ponteiro com hover. Em telas somente de toque a cena permanece estática.' : !value.parallax_enabled || !hasParallax ? 'Ative o parallax e escolha um deslocamento em Parallax desta camada. Depois, experimente movendo o mouse sobre a cena.' : 'Mova o mouse sobre a cena. Desative Experimentar parallax para voltar a arrastar elementos. A experiência não altera posições salvas.';
      mark();
    };
    const commit = (value,expectedKey,populate = false) => {
      const state = context();
      if (!state.editable || state.key !== expectedKey || !write(expectedKey,media.presentation(value))) return false;
      render(populate); return true;
    };
    const boundsFor = (ids = selectedIds) => {
      const nodes = [...ids].map(id => surface.querySelector(`[data-scene-element="${id}"]`)).filter(Boolean);
      if (nodes.length < 2) return null;
      const rects = nodes.map(node => {const hidden=node.hidden;if(hidden)node.hidden=false;const rect=node.getBoundingClientRect();if(hidden)node.hidden=true;return rect;});
      return {left:Math.min(...rects.map(rect => rect.left)),top:Math.min(...rects.map(rect => rect.top)),right:Math.max(...rects.map(rect => rect.right)),bottom:Math.max(...rects.map(rect => rect.bottom))};
    };
    const projectSelection = (base,ids,transform) => {
      const value = media.presentation(base), selected = new Set(ids);
      value.elements = value.elements.map(item => selected.has(item.id) ? media.element({...item,...transform(item)}) : item);
      return value;
    };
    const moveSelection = (base,ids,dx,dy) => {
      const items = media.presentation(base).elements.filter(item => ids.includes(item.id));
      if (!items.length) return media.presentation(base);
      const appliedX = Math.max(Math.max(...items.map(item => -100-item.x)),Math.min(Math.min(...items.map(item => 200-item.x)),dx));
      const appliedY = Math.max(Math.max(...items.map(item => -100-item.y)),Math.min(Math.min(...items.map(item => 200-item.y)),dy));
      return projectSelection(base,ids,item => ({x:item.x+appliedX,y:item.y+appliedY}));
    };
    const rotateSelection = (base,ids,angle,bounds,rect) => {
      const items = media.presentation(base).elements.filter(item => ids.includes(item.id));
      if (items.length < 2 || !bounds) return media.presentation(base);
      const centerX=(bounds.left+bounds.right)/2,centerY=(bounds.top+bounds.bottom)/2;
      const minAngle=Math.max(...items.map(item => -360-item.rotation)),maxAngle=Math.min(...items.map(item => 360-item.rotation));
      const requested=Math.max(minAngle,Math.min(maxAngle,angle));
      const candidate=delta=>items.map(item=>{
        const x=rect.left+item.x*rect.width/100-centerX,y=rect.top+item.y*rect.height/100-centerY,radians=delta*Math.PI/180;
        return {id:item.id,x:(centerX+x*Math.cos(radians)-y*Math.sin(radians)-rect.left)/rect.width*100,y:(centerY+x*Math.sin(radians)+y*Math.cos(radians)-rect.top)/rect.height*100,rotation:item.rotation+delta};
      });
      const valid=values=>values.every(item=>item.x>=-100&&item.x<=200&&item.y>=-100&&item.y<=200&&item.rotation>=-360&&item.rotation<=360);
      let values=candidate(requested);
      if(!valid(values)){let low=0,high=1;for(let i=0;i<24;i++){const mid=(low+high)/2;if(valid(candidate(requested*mid)))low=mid;else high=mid;}values=candidate(requested*low);}
      const changes=new Map(values.map(item=>[item.id,item]));
      return projectSelection(base,ids,item=>changes.get(item.id));
    };
    const scaleSelection = (base,ids,factor,bounds,rect) => {
      const items = media.presentation(base).elements.filter(item => ids.includes(item.id));
      if(items.length<2||!bounds)return media.presentation(base);
      const centerX=(bounds.left+bounds.right)/2,centerY=(bounds.top+bounds.bottom)/2;
      const minFactor=Math.max(...items.map(item=>.05/item.scale)),maxFactor=Math.min(...items.map(item=>8/item.scale));
      const requested=Math.max(minFactor,Math.min(maxFactor,factor));
      const candidate=ratio=>items.map(item=>({id:item.id,x:(centerX+(rect.left+item.x*rect.width/100-centerX)*ratio-rect.left)/rect.width*100,y:(centerY+(rect.top+item.y*rect.height/100-centerY)*ratio-rect.top)/rect.height*100,scale:item.scale*ratio}));
      const valid=values=>values.every(item=>item.x>=-100&&item.x<=200&&item.y>=-100&&item.y<=200&&item.scale>=.05&&item.scale<=8);
      let values=candidate(requested);
      if(!valid(values)){let low=0,high=1;for(let i=0;i<24;i++){const mid=(low+high)/2;if(valid(candidate(1+(requested-1)*mid)))low=mid;else high=mid;}values=candidate(1+(requested-1)*low);}
      const changes=new Map(values.map(item=>[item.id,item]));
      return projectSelection(base,ids,item=>changes.get(item.id));
    };
    const applyMultiAction = action => {
      if(selectedIds.size<2||parallaxPreview.checked)return;
      const state=context(),ids=[...selectedIds],bounds=boundsFor(ids),rect=surface.getBoundingClientRect();
      if(!bounds)return;
      let value;
      if(['left','right','up','down'].includes(action)){const step=1;value=moveSelection(state.presentation,ids,action==='left'?-step:action==='right'?step:0,action==='up'?-step:action==='down'?step:0);}
      else if(action==='rotate-left'||action==='rotate-right')value=rotateSelection(state.presentation,ids,action==='rotate-left'?-15:15,bounds,rect);
      else if(action==='scale-down'||action==='scale-up')value=scaleSelection(state.presentation,ids,action==='scale-down'?.9:1.1,bounds,rect);
      if(value)commit(value,state.key,true);
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
      selected = id(); setSelection([selected]); key = state.key;
      value.elements.push(media.element({id:selected,type,asset,character_id:type === 'character' ? character?.id : '',name:asset?.name || (type === 'character' ? character?.name : ''),text:type === 'text' ? 'Seu texto aqui' : '',...(['button','hotspot'].includes(type) ? {font_size:24} : {})}));
      if (commit(value,state.key,true)) { status.textContent = type === 'character' && !character?.portrait ? 'Adicione um retrato a este personagem na biblioteca do projeto.' : ''; fields.find(field => field.dataset.field === 'name').focus(); }
    };
    list.multiple = true;
    list.addEventListener('change',() => { setSelection([...list.selectedOptions].map(option => option.value)); render(); });
    interactionSelect.addEventListener('change',() => {
      let link = ['', ''];
      try { if (interactionSelect.value) link = JSON.parse(interactionSelect.value); } catch (_) { return; }
      change({choice_block_id:link[0],choice_option_id:link[1]},true);
    });
    panel.addEventListener('input',event => {
      const field = event.target, property = field.dataset.field;
      if (!property || !context().editable) return;
      if (field.type === 'number' && (!field.value.trim() || !field.validity.valid)) return;
      const value = field.type === 'checkbox' ? field.checked : field.type === 'number' ? Number(field.value) / (percentFields.has(property) ? 100 : 1) : field.value;
      if (sceneFields.has(property)) { const state = context(); commit({...state.presentation,[property]:value},state.key); }
      else change({[property]:value});
    });
    panel.querySelector('[data-anchor]').addEventListener('change',event => {
      if (event.target.value !== 'custom') { const [anchor_x,anchor_y] = event.target.value.split(',').map(Number); change({anchor_x,anchor_y},true); }
    });
    panel.addEventListener('click',event => {
      const button = event.target.closest('button'); if (!button || button.closest('[data-motion-editor],[data-interaction-editor]') || !context().editable) return;
      if (button.dataset.parallaxPreset !== undefined) { const [parallax_x,parallax_y] = button.dataset.parallaxPreset.split(',').map(Number); change({parallax_x,parallax_y},true); return; }
      if (button.dataset.preset) { change({x:Number(button.dataset.preset),y:100,anchor_x:50,anchor_y:100,scale:1,rotation:0},true); return; }
      const action = button.dataset.action, state = context(), value = media.presentation(state.presentation), index = value.elements.findIndex(item => item.id === selected);
      if (action === 'project-image' || action === 'project-replace') {
        const target = action === 'project-replace' ? selected : '', expected = state.key;
        void (async () => {
          try {
            const asset = await options.pickAsset('image',{current:target ? getItem(state)?.asset : null});
            if (!asset || context().key !== expected || !context().editable) return;
            if (target) {
              if (!media.presentation(context().presentation).elements.some(item => item.id === target)) return;
              setSelection([target]); change({asset},true);
            } else add('image',asset);
            status.textContent = asset.project_ref ? 'Recurso vinculado com cópia offline.' : 'Cópia independente aplicada.';
          } catch (error) { if (context().key === expected) status.textContent = error.message || 'Não foi possível vincular o recurso.'; }
        })();
        return;
      }
      if (action === 'image' || action === 'replace') { uploadIntent = {key:state.key,id:action === 'replace' ? selected : ''}; upload.click(); return; }
      if (['character','text','button','hotspot'].includes(action)) { add(action); return; }
      if (index < 0) return;
      if (action === 'remove') { value.elements.splice(index,1); setSelection([]); }
      if (action === 'duplicate') {
        if (value.elements.length >= 80) { status.textContent = 'A cena já possui 80 elementos.'; return; }
        const copy = {...value.elements[index],id:id(),name:value.elements[index].name + ' · cópia',x:value.elements[index].x + 2,y:value.elements[index].y + 2};
        value.elements.splice(index + 1,0,media.element(copy)); setSelection([copy.id]);
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
        const asset = await media.readFile(file,'image',{purpose:'background'}), state = context();
        if (state.key !== intent.key || !state.editable) return;
        if (intent.id) {
          if (!media.presentation(state.presentation).elements.some(item => item.id === intent.id)) return;
          setSelection([intent.id]); change({asset},true); status.textContent = '';
        } else add('image',asset);
      } catch (error) { if (context().key === intent.key) status.textContent = error.message || 'Não foi possível importar a imagem.'; }
    });
    const pointer = event => {
      const rect = surface.getBoundingClientRect();
      return {x:(event.clientX - rect.left) / rect.width * 100,y:(event.clientY - rect.top) / rect.height * 100};
    };
    const paintMarquee = point => {
      const layer=surface.querySelector('.scene-elements-layer'); if(!layer||!marquee)return;
      let box=layer.querySelector('.scene-multi-marquee');if(!box){box=doc.createElement('div');box.className='scene-multi-marquee';layer.append(box);}
      const rect=layer.getBoundingClientRect(),left=Math.min(marquee.start.x,point.x),top=Math.min(marquee.start.y,point.y),right=Math.max(marquee.start.x,point.x),bottom=Math.max(marquee.start.y,point.y);
      Object.assign(box.style,{left:`${left-rect.left}px`,top:`${top-rect.top}px`,width:`${right-left}px`,height:`${bottom-top}px`});
    };
    const finishMarquee = cancelled => {
      const current=marquee;if(!current)return;marquee=null;
      surface.querySelector('.scene-multi-marquee')?.remove();
      if(cancelled){setSelection(current.initial);render();return;}
      const dx=current.point.x-current.start.x,dy=current.point.y-current.start.y;
      if(Math.hypot(dx,dy)<4){setSelection(current.additive?current.initial:[]);render();return;}
      const left=Math.min(current.start.x,current.point.x),right=Math.max(current.start.x,current.point.x),top=Math.min(current.start.y,current.point.y),bottom=Math.max(current.start.y,current.point.y);
      const hits=[...surface.querySelectorAll('[data-scene-element]')].filter(node=>{if(node.hidden)return false;const rect=node.getBoundingClientRect();return rect.right>=left&&rect.left<=right&&rect.bottom>=top&&rect.top<=bottom;}).map(node=>node.dataset.sceneElement);
      setSelection(current.additive?[...new Set([...current.initial,...hits])]:hits);render();
    };
    const applyGroupPreview = (current,point) => {
      const {start,mode,ids,original,bounds,rect,items}=current,dx=point.x-start.x,dy=point.y-start.y;
      if(mode==='group-scale'){
        const centerX=(bounds.left+bounds.right)/2,centerY=(bounds.top+bounds.bottom)/2;
        const distance=point=>Math.hypot(point.x-centerX,point.y-centerY),factor=distance(start)>1?distance(point)/distance(start):1;
        return scaleSelection(original,ids,factor,bounds,rect);
      }
      if(mode==='group-rotate'){
        const angle=point=>Math.atan2(point.y-(bounds.top+bounds.bottom)/2,point.x-(bounds.left+bounds.right)/2);
        let delta=(angle(point)-angle(start))*180/Math.PI;delta=Math.atan2(Math.sin(delta*Math.PI/180),Math.cos(delta*Math.PI/180))*180/Math.PI;
        return rotateSelection(original,ids,delta,bounds,rect);
      }
      if(ids.length>1)return moveSelection(original,ids,dx/rect.width*100,dy/rect.height*100);
      const item=items[0];if(!item)return media.presentation(original);
      let changes;
      if(mode==='rotate'){
        const angle=p=>Math.atan2((p.y-item.y)*rect.height,(p.x-item.x)*rect.width);
        changes={rotation:Math.round(item.rotation+(angle(point)-angle(start))*180/Math.PI)};
      }else if(mode==='scale'){
        const distance=p=>Math.hypot((p.x-item.x)*rect.width,(p.y-item.y)*rect.height);
        changes={scale:item.scale*distance(point)/Math.max(1,distance(start))};
      }else if(mode==='anchor'){
        const radians=item.rotation*Math.PI/180,px=dx*rect.width/100,py=dy*rect.height/100;
        const ax=Math.max(0,Math.min(100,item.anchor_x+(px*Math.cos(radians)+py*Math.sin(radians))/item.scale/(item.width*rect.width/100)*100));
        const ay=Math.max(0,Math.min(100,item.anchor_y+(-px*Math.sin(radians)+py*Math.cos(radians))/item.scale/(item.height*rect.height/100)*100));
        const localX=(ax-item.anchor_x)*item.width*rect.width/10000*item.scale,localY=(ay-item.anchor_y)*item.height*rect.height/10000*item.scale;
        changes={anchor_x:ax,anchor_y:ay,x:item.x+(localX*Math.cos(radians)-localY*Math.sin(radians))/rect.width*100,y:item.y+(localX*Math.sin(radians)+localY*Math.cos(radians))/rect.height*100};
      }else changes={x:item.x+dx,y:item.y+dy};
      return projectSelection(original,ids,candidate=>candidate.id===item.id?changes:{});
    };
    surface.addEventListener('click',event=>{const action=event.target.closest('[data-multi-action]')?.dataset.multiAction;if(action&&context().editable&&!parallaxPreview.checked){event.preventDefault();applyMultiAction(action);}});
    surface.addEventListener('pointerdown',event => {
      if (parallaxPreview.checked) return;
      const state=context(),node=event.target.closest('[data-scene-element]'),multiHandle=event.target.closest('[data-multi-handle]');
      if (!state.editable || event.button !== 0) return;
      if(event.target.closest('[data-multi-action]'))return;
      if(!node&&!multiHandle){if(event.target===surface||event.target.classList.contains('scene-elements-layer')){event.preventDefault();const additive=event.shiftKey||event.ctrlKey||event.metaKey,point={x:event.clientX,y:event.clientY};marquee={key:state.key,pointerId:event.pointerId,start:point,point,initial:[...selectedIds],additive};surface.setPointerCapture(event.pointerId);}return;}
      event.preventDefault(); event.stopPropagation();
      if(node){const id=node.dataset.sceneElement,modifier=event.shiftKey||event.ctrlKey||event.metaKey;if(modifier){const next=new Set(selectedIds);if(next.has(id))next.delete(id);else next.add(id);setSelection(next);render();return;}if(!selectedIds.has(id))setSelection([id]);}
      const ids=[...selectedIds],base=media.presentation(state.presentation),items=base.elements.filter(item=>ids.includes(item.id));if(!items.length)return;
      const singleHandle=event.target.closest('[data-handle]')?.dataset.handle,groupMode=multiHandle?.dataset.multiHandle,mode=groupMode==='rotate'?'group-rotate':groupMode==='scale'?'group-scale':singleHandle||'move';
      render();
      const start=mode==='group-rotate'||mode==='group-scale'?{x:event.clientX,y:event.clientY}:pointer(event),rect=surface.getBoundingClientRect();
      drag={key:state.key,pointerId:event.pointerId,ids,items,start,mode,value:base,original:base,bounds:boundsFor(ids),rect};
      surface.setPointerCapture(event.pointerId);
    });
    surface.addEventListener('pointermove',event => {
      if(marquee&&marquee.pointerId===event.pointerId){const point={x:event.clientX,y:event.clientY};marquee.point=point;if(Math.hypot(point.x-marquee.start.x,point.y-marquee.start.y)>=4)paintMarquee(point);return;}
      if (!drag || drag.pointerId !== event.pointerId) return;
      const state=context();if(!state.editable||state.key!==drag.key){drag=null;preview(state.presentation);render();return;}
      const point=drag.mode==='group-rotate'||drag.mode==='group-scale'?{x:event.clientX,y:event.clientY}:pointer(event);
      drag.value=applyGroupPreview(drag,point);
      preview(drag.value); mark();
    });
    const finish = (event,cancelled = false) => {
      if(marquee&&event.pointerId===marquee.pointerId){marquee.point={x:event.clientX,y:event.clientY};if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);finishMarquee(cancelled);return;}
      if (!drag || event.pointerId !== drag.pointerId) return;
      const current = drag; drag = null;
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      if (cancelled) { preview(context().presentation); render(); }
      else {
        const latest=context();
        const value=latest.key===current.key ? (options.mergeGesture ? options.mergeGesture(current.original,current.value,media.presentation(latest.presentation)) : current.value) : null;
        if(value)commit(value,current.key,true);
        else {status.textContent='A cena mudou durante o gesto. As alterações atuais foram preservadas; refaça a manipulação.';preview(latest.presentation);render();}
      }
    };
    surface.addEventListener('pointerup',event => finish(event));
    surface.addEventListener('pointercancel',event => finish(event,true));
    surface.addEventListener('lostpointercapture',event => finish(event,true));
    surface.addEventListener('keydown',event => {
      if (parallaxPreview.checked) return;
      if(event.key==='Escape'&&(drag||marquee)){event.preventDefault();finish({pointerId:drag?.pointerId??marquee?.pointerId},true);return;}
      const node = event.target.closest('[data-scene-element]'); if (!node || !context().editable) return;
      if (event.key === 'Escape') { setSelection([]); render(); return; }
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if(selectedIds.size>1){const step=event.shiftKey?5:1,ids=[...selectedIds],state=context(),value=moveSelection(state.presentation,ids,event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);commit(value,state.key,true);return;}
      setSelection([node.dataset.sceneElement]);const item=getItem(context()),step=event.shiftKey?5:.5;
      change({x:item.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),y:item.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)},true);
    });
    parallaxHover.addEventListener('change',() => render(false));
    parallaxReduced.addEventListener('change',() => render(false));
    return {render,stopParallaxPreview:() => setParallaxPreview(false)};
  };
  root.HeartspaceSceneComposer = {create};
})(globalThis);
