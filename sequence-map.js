/* The sequence graph is a view of authored choices. Only its camera/layout are local UI preferences. */
(function (root) {
  'use strict';
  const memory = new Map();
  const WIDTH = 236, HEIGHT = 154, LIMIT = 50000;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const FLOW_VERSION = 2, COLUMN_GAP = 64, ROW_GAP = 106;
  function flowLayout(entries) {
    const keys = entries.map(entry => entry.key), known = new Set(keys);
    const order = new Map(keys.map((key,index) => [key,index]));
    const outgoing = new Map(keys.map(key => [key,[]])), incoming = new Map(keys.map(key => [key,[]]));
    entries.forEach(entry => {
      const targets = [...new Set(entry.routes.map(route => route.targetKey).filter(key => key !== entry.key && known.has(key)))];
      outgoing.set(entry.key,targets); targets.forEach(key => incoming.get(key).push(entry.key));
    });
    // Collapse cycles before assigning levels, so returns cannot push the graph down forever.
    const visited = new Set(), finished = [];
    keys.forEach(key => {
      if (visited.has(key)) return;
      visited.add(key);
      const stack = [{key,index:0}];
      while (stack.length) {
        const current = stack.at(-1), targets = outgoing.get(current.key);
        if (current.index < targets.length) {
          const target = targets[current.index++];
          if (!visited.has(target)) { visited.add(target); stack.push({key:target,index:0}); }
        } else { finished.push(current.key); stack.pop(); }
      }
    });
    const components = [], componentFor = new Map();
    finished.reverse().forEach(key => {
      if (componentFor.has(key)) return;
      const component = {keys:[],next:new Set(),previous:new Set(),level:0};
      const index = components.length; components.push(component);
      const stack = [key]; componentFor.set(key,index);
      while (stack.length) {
        const current = stack.pop(); component.keys.push(current);
        incoming.get(current).forEach(source => { if (!componentFor.has(source)) { componentFor.set(source,index); stack.push(source); } });
      }
      component.keys.sort((a,b) => order.get(a) - order.get(b));
    });
    outgoing.forEach((targets,source) => targets.forEach(target => {
      const from = componentFor.get(source), to = componentFor.get(target);
      if (from !== to) { components[from].next.add(to); components[to].previous.add(from); }
    }));
    const pending = components.map(component => component.previous.size);
    const queue = components.map((_,index) => index).filter(index => pending[index] === 0);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const component = components[queue[cursor]];
      component.next.forEach(index => {
        components[index].level = Math.max(components[index].level,component.level + component.keys.length);
        if (--pending[index] === 0) queue.push(index);
      });
    }
    const levels = new Map();
    components.forEach(component => component.keys.forEach((key,index) => levels.set(key,component.level + index)));
    // The choice order provides a stable left-to-right order for sibling branches.
    const walk = keys.filter(key => levels.get(key) === 0), discovery = new Map(walk.map((key,index) => [key,index]));
    for (let cursor = 0; cursor < walk.length; cursor++) outgoing.get(walk[cursor]).forEach(key => {
      if (!discovery.has(key)) { discovery.set(key,discovery.size); walk.push(key); }
    });
    keys.forEach(key => { if (!discovery.has(key)) discovery.set(key,discovery.size); });
    const groups = [], grouped = new Set();
    keys.forEach(key => {
      if (grouped.has(key)) return;
      const group = [key]; grouped.add(key);
      for (let cursor = 0; cursor < group.length; cursor++) [...outgoing.get(group[cursor]),...incoming.get(group[cursor])].forEach(neighbor => {
        if (!grouped.has(neighbor)) { grouped.add(neighbor); group.push(neighbor); }
      });
      groups.push(group);
    });
    const result = new Map(); let left = 48;
    groups.forEach(group => {
      const layers = new Map();
      group.forEach(key => { const level = levels.get(key); if (!layers.has(level)) layers.set(level,[]); layers.get(level).push(key); });
      const rows = [...layers].sort(([a],[b]) => a - b);
      rows.forEach(([,row]) => row.sort((a,b) => discovery.get(a) - discovery.get(b)));
      const columns = Math.max(...rows.map(([,row]) => row.length));
      const width = columns * (WIDTH + COLUMN_GAP) - COLUMN_GAP;
      const centers = new Map();
      const measure = () => rows.forEach(([,row]) => row.forEach((key,index) => centers.set(key,(width - row.length * (WIDTH + COLUMN_GAP) + COLUMN_GAP) / 2 + index * (WIDTH + COLUMN_GAP) + WIDTH / 2)));
      measure();
      // A few stable barycenter sweeps reduce crossings around merges and uneven branches.
      for (let pass = 0; pass < 3; pass++) {
        [false,true].forEach(reverse => {
          const sequence = reverse ? [...rows].reverse() : rows;
          sequence.forEach(([level,row]) => {
            const original = new Map(row.map((key,index) => [key,index]));
            const scores = new Map(row.map(key => {
              const neighbors = (reverse ? outgoing : incoming).get(key).filter(other => reverse ? levels.get(other) > level : levels.get(other) < level);
              return [key,neighbors.length ? neighbors.reduce((sum,other) => sum + centers.get(other),0) / neighbors.length : centers.get(key)];
            }));
            row.sort((a,b) => scores.get(a) - scores.get(b) || original.get(a) - original.get(b)); measure();
          });
        });
      }
      rows.forEach(([level,row]) => row.forEach(key => result.set(key,{x:left + centers.get(key) - WIDTH / 2,y:48 + level * (HEIGHT + ROW_GAP)})));
      left += width + 140;
    });
    return result;
  }
  function create(options) {
    const {document:doc,entries,targets,scopeKey,scopeLabel,canEdit,chapters = [],defaultChapterId} = options;
    const win = doc.defaultView;
    const storageKey = `heartspace-sequence-map-v1:${scopeKey}`;
    let stored = memory.get(storageKey);
    if (!stored) { try { stored = JSON.parse(win.localStorage.getItem(storageKey) || 'null'); } catch (_) { /* Local view preferences are optional. */ } }
    stored = stored && typeof stored === 'object' ? stored : {};
    const byKey = new Map(entries.map(entry => [entry.key,entry]));
    const automatic = flowLayout(entries), positions = new Map(), manualKeys = new Set();
    const savedPositions = new Map((Array.isArray(stored.positions) ? stored.positions : []).filter(point => point && typeof point.key === 'string').map(point => [point.key,point]));
    const layoutChapters = [...new Set(entries.map(entry => entry.documentId || 'references'))], chapterRows = new Map();
    const savedManualKeys = new Set(Array.isArray(stored.manualKeys) ? stored.manualKeys : []);
    entries.forEach(entry => {
      const column = layoutChapters.indexOf(entry.documentId || 'references'), row = chapterRows.get(column) || 0;
      chapterRows.set(column,row + 1);
      const point = savedPositions.get(entry.key);
      if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
      // Old versions saved every default column as well as real manual moves.
      const manual = stored.layoutVersion === FLOW_VERSION ? savedManualKeys.has(entry.key) : Math.abs(point.x - (48 + column * 340)) > 1 || Math.abs(point.y - (48 + row * 220)) > 1;
      if (manual) { manualKeys.add(entry.key); positions.set(entry.key,{x:clamp(point.x,16,LIMIT),y:clamp(point.y,16,LIMIT)}); }
    });
    const occupied = [...positions.values()];
    automatic.forEach((point,key) => {
      if (manualKeys.has(key)) return;
      const candidate = {...point};
      while (occupied.some(other => Math.abs(other.x - candidate.x) < WIDTH + 24 && Math.abs(other.y - candidate.y) < HEIGHT + 24)) candidate.x += WIDTH + COLUMN_GAP;
      positions.set(key,candidate); occupied.push(candidate);
    });
    let organizationUndo = null, connection = null, draft = null, pendingCreation = null, choiceDraft = null, simulation = null;
    let selected = byKey.has(stored.selected) ? stored.selected : entries.find(entry => entry.current)?.key || entries[0]?.key || '';
    let selectedRoute = typeof stored.selectedRoute === 'string' ? stored.selectedRoute : '', zoom = Number.isFinite(stored.zoom) ? clamp(stored.zoom,.2,1.6) : 1;
    let cleanupGesture = null, disposed = false, frame = 0, initialized = false, suppressClick = false;
    let worldWidth = 0, worldHeight = 0;
    let camera = {left:Number.isFinite(stored.left) ? stored.left : 0,top:Number.isFinite(stored.top) ? stored.top : 0};
    const cards = new Map(), paths = [];
    let visibleKeys = new Set(byKey.keys()), coreKeys = new Set(byKey.keys());
    let miniVisible = stored.miniVisible !== false;
    const filterChapters = [...new Map(entries.filter(entry => entry.documentId).map(entry => [entry.documentId,{id:entry.documentId,title:entry.chapter || 'Capítulo'}])).values()];
    const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
    const node = (tag,className,text) => {
      const item = doc.createElement(tag); if (className) item.className = className;
      if (text !== undefined) item.textContent = text; return item;
    };
    const button = (text,handler,label) => {
      const item = node('button','',text); item.type = 'button'; if (label) item.setAttribute('aria-label',label);
      item.addEventListener('click',handler); return item;
    };
    const section = node('section','sequence-graph'); section.setAttribute('aria-label',`Mapa de sequências · ${scopeLabel}`);
    const toolbar = node('div','sequence-graph-toolbar');
    const context = node('strong','sequence-graph-context',scopeLabel); context.title = scopeLabel;
    const percent = node('output','','100%'); percent.setAttribute('aria-label','Zoom do mapa');
    const help = node('p','sequence-graph-help','O fluxo segue de cima para baixo, com alternativas lado a lado. Organizar fluxo recalcula a disposição; Desfazer organização recupera a anterior. Arraste o fundo para navegar e o título de um cartão para movê-lo. Ctrl + roda ajusta o zoom. As saídas numeradas correspondem às opções de escolha: arraste uma até um cartão ou até o fundo para criar um destino. Também é possível clicar na saída e depois no destino; Escape cancela. Selecione uma sequência ou seta para consultar e editar seus destinos. No título, as setas do teclado movem o cartão; Shift amplia o passo. Os filtros mantêm as conexões vizinhas como contexto. Clique ou arraste no minimapa para navegar; nele, as setas movem a visão e Home enquadra as sequências visíveis. Simular seleção inicia um percurso passo a passo, destacando a sequência atual e as escolhas percorridas. Voltar restaura as variáveis do passo anterior. No inspetor, Nova escolha cria um bloco com pergunta e opções; Adicionar opção amplia uma escolha existente.'); help.hidden = true;
    const helpButton = button('?',() => { help.hidden = !help.hidden; helpButton.setAttribute('aria-expanded',String(!help.hidden)); },'Como usar o mapa'); helpButton.setAttribute('aria-expanded','false');
    const simulate = button('Simular seleção',() => simulation ? stopSimulation() : startSimulation(selected));
    const createSequence = button('Nova sequência',() => showCreate()); createSequence.disabled = !canEdit || !chapters.length;
    const cancelConnect = button('Cancelar conexão',() => cancelConnection()); cancelConnect.hidden = true;
    const filterToggle = button('Filtros',() => { filterPanel.hidden = !filterPanel.hidden; filterToggle.setAttribute('aria-expanded',String(!filterPanel.hidden)); if (!filterPanel.hidden) searchInput.focus({preventScroll:true}); save(); }); filterToggle.setAttribute('aria-expanded',String(Boolean(stored.filterOpen)));
    const miniToggle = button('Minimapa',() => { cleanupGesture?.(); miniVisible = !miniVisible; miniPanel.hidden = !miniVisible; miniToggle.setAttribute('aria-pressed',String(miniVisible)); renderMini(); save(); }); miniToggle.setAttribute('aria-pressed',String(miniVisible));
    const organize = button('Organizar fluxo',organizeFlow);
    const undoOrganization = button('Desfazer organização',undoFlow); undoOrganization.disabled = true;
    toolbar.append(context,simulate,createSequence,cancelConnect,filterToggle,miniToggle,organize,undoOrganization,button('−',() => changeZoom(zoom / 1.2),'Diminuir zoom do mapa'),percent,button('+',() => changeZoom(zoom * 1.2),'Aumentar zoom do mapa'),button('Enquadrar mapa',() => fit([...visibleKeys]),'Enquadrar sequências visíveis'),button('Seleção',() => fit(selected ? [selected] : []),'Enquadrar sequência selecionada'),helpButton);
    const filterPanel = node('div','sequence-graph-filters'); filterPanel.hidden = !stored.filterOpen;
    const searchLabel = node('label','','Buscar'), searchInput = node('input'); searchInput.type = 'search'; searchInput.placeholder = 'Sequência, capítulo ou ID'; searchInput.maxLength = 160; searchInput.value = typeof stored.filters?.query === 'string' ? stored.filters.query.slice(0,160) : ''; searchLabel.append(searchInput);
    const filterChapterLabel = node('label','','Capítulo'), filterChapter = node('select'); filterChapter.append(new win.Option('Todos os capítulos',''));
    filterChapters.forEach(chapter => filterChapter.append(new win.Option(chapter.title,chapter.id))); filterChapter.value = filterChapters.some(chapter => chapter.id === stored.filters?.chapter) ? stored.filters.chapter : ''; filterChapterLabel.append(filterChapter);
    const scopeLabelNode = node('label','','Mostrar'), scopeInput = node('select');
    [['all','Todas as sequências'],['nearby','Entradas e saídas da seleção'],['reachable','Caminhos a partir da seleção'],['issues','Com pendências']].forEach(([value,label]) => scopeInput.append(new win.Option(label,value)));
    scopeInput.value = ['all','nearby','reachable','issues'].includes(stored.filters?.scope) ? stored.filters.scope : 'all'; scopeLabelNode.append(scopeInput);
    const filterCount = node('output','sequence-graph-filter-count'); filterCount.setAttribute('aria-live','polite');
    const clearFilterButton = button('Limpar filtros',() => resetFilters(true));
    filterPanel.append(searchLabel,filterChapterLabel,scopeLabelNode,clearFilterButton,filterCount);
    const updateFilter = () => { cancelConnection(false); applyFilters(); renderInspector(); fit([...visibleKeys]); save(); };
    searchInput.addEventListener('input',updateFilter); filterChapter.addEventListener('change',updateFilter); scopeInput.addEventListener('change',updateFilter);
    const body = node('div','sequence-graph-body');
    const viewport = node('div','sequence-graph-viewport'); viewport.tabIndex = 0;
    viewport.setAttribute('role','region'); viewport.setAttribute('aria-label','Mapa de caminhos. Arraste o fundo ou use as barras de rolagem para navegar.');
    const canvas = node('div','sequence-graph-canvas'); canvas.append(viewport);
    const spacer = node('div','sequence-graph-spacer'), stage = node('div','sequence-graph-stage'); spacer.append(stage); viewport.append(spacer);
    const svgNode = (tag,attributes) => { const item = doc.createElementNS('http://www.w3.org/2000/svg',tag); Object.entries(attributes || {}).forEach(([key,value]) => item.setAttribute(key,String(value))); return item; };
    const svg = svgNode('svg',{class:'sequence-graph-lines','aria-hidden':'true'});
    const defs = svgNode('defs');
    const arrowId = `sequence-arrow-${Math.random().toString(36).slice(2)}`;
    const marker = svgNode('marker',{id:arrowId,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});
    marker.append(svgNode('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'context-stroke'})); defs.append(marker); svg.append(defs); stage.append(svg);
    const inspector = node('aside','sequence-graph-inspector'); inspector.setAttribute('aria-label','Sequência e destinos');
    const feedback = node('p','sequence-graph-feedback'); feedback.setAttribute('role','status');
    const miniPanel = node('aside','sequence-graph-minimap'); miniPanel.hidden = !miniVisible; miniPanel.setAttribute('aria-label','Visão geral do mapa'); miniPanel.id = `${arrowId}-minimap`; miniToggle.setAttribute('aria-controls',miniPanel.id);
    const mini = svgNode('svg',{tabindex:0,role:'region','aria-label':'Minimapa. Clique ou arraste para navegar; setas movem a visão e Home enquadra o mapa.'});
    const miniLines = svgNode('g',{'aria-hidden':'true'}), miniCards = svgNode('g',{'aria-hidden':'true'}), miniView = svgNode('rect',{class:'sequence-graph-miniview','vector-effect':'non-scaling-stroke','aria-hidden':'true'});
    mini.append(miniLines,miniCards,miniView); miniPanel.append(mini); canvas.append(miniPanel);
    const emptyFilter = node('div','sequence-graph-filter-empty'); emptyFilter.hidden = true;
    emptyFilter.append(node('p','','Nenhuma sequência corresponde aos filtros.'),button('Limpar filtros',() => resetFilters(true))); canvas.append(emptyFilter);
    const miniNodes = new Map(), miniEdges = [];
    entries.forEach(entry => { const rect = svgNode('rect',{rx:10}); const title = svgNode('title'); title.textContent = entry.title; rect.append(title); miniCards.append(rect); miniNodes.set(entry.key,rect); });
    filterPanel.id = `${arrowId}-filters`; filterToggle.setAttribute('aria-controls',filterPanel.id);
    body.append(canvas,inspector); section.append(toolbar,filterPanel,help,body,feedback);
    const createDialog = node('dialog','sequence-graph-create');
    const createForm = node('form');
    const createTitle = node('h3','','Nova sequência'); createTitle.id = `${arrowId}-create-title`; createDialog.setAttribute('aria-labelledby',createTitle.id);
    const createNotice = node('p','sequence-graph-note');
    const nameLabel = node('label','','Nome'), nameInput = node('input'); nameInput.required = true; nameInput.maxLength = 120; nameInput.autocomplete = 'off'; nameInput.placeholder = 'Chegada ao castelo'; nameLabel.append(nameInput);
    const chapterLabel = node('label','','Capítulo'), chapterInput = node('select'); chapterInput.required = true;
    chapters.forEach(chapter => chapterInput.append(new win.Option(chapter.title,chapter.id))); chapterLabel.append(chapterInput);
    const createError = node('p','sequence-graph-warning'); createError.setAttribute('role','alert');
    const createActions = node('div','sequence-graph-actions');
    const submitCreation = button('Criar sequência',() => {}); submitCreation.type = 'submit';
    createActions.append(button('Cancelar',() => closeCreate()),submitCreation);
    createForm.append(createTitle,createNotice,nameLabel,chapterLabel,createError,createActions); createDialog.append(createForm); section.append(createDialog);
    createDialog.addEventListener('cancel',event => { event.preventDefault(); closeCreate(); });
    createForm.addEventListener('submit',event => {
      event.preventDefault(); if (!pendingCreation || !canEdit || submitCreation.disabled) return;
      const title = nameInput.value.trim();
      if (!title) { createError.textContent = 'Informe o nome da sequência.'; nameInput.focus(); return; }
      submitCreation.disabled = true;
      let result;
      try { result = options.onCreateSequence?.({title,documentId:chapterInput.value},pendingCreation.connection); }
      catch (_) { createError.textContent = 'Não foi possível salvar a sequência. Confira o estado do capítulo antes de tentar novamente.'; submitCreation.disabled = false; return; }
      if (!result?.ok) { createError.textContent = result?.message || 'Não foi possível criar a sequência.'; submitCreation.disabled = false; return; }
      const point = pendingCreation.point;
      if (point) { positions.set(result.key,point); manualKeys.add(result.key); }
      selected = result.key; selectedRoute = ''; pendingCreation = null; createDialog.close(); cancelConnection(false); save();
      options.onRefresh?.(result.key);
    });
    function showCreate(point = null,sourceConnection = null) {
      if (!canEdit || simulation || !chapters.length || disposed || createDialog.open || choiceDialog.open) return;
      sourceConnection = sourceConnection || connection;
      cleanupGesture?.();
      pendingCreation = {point:point ? {x:clamp(point.x,16,LIMIT),y:clamp(point.y,16,LIMIT)} : null,connection:sourceConnection};
      createError.textContent = ''; nameInput.value = ''; submitCreation.disabled = false;
      const preferred = sourceConnection?.source.documentId || defaultChapterId;
      chapterInput.value = chapters.some(chapter => chapter.id === preferred) ? preferred : chapters[0].id;
      createNotice.textContent = sourceConnection ? `A opção “${sourceConnection.route.label}” de “${sourceConnection.source.title}” levará à nova sequência.` : 'Escolha o capítulo onde a sequência será criada.';
      submitCreation.textContent = sourceConnection ? 'Criar e conectar' : 'Criar sequência';
      createDialog.showModal(); nameInput.focus();
    }
    function closeCreate() {
      pendingCreation = null; createDialog.close(); cancelConnection();
      if (!disposed) createSequence.focus({preventScroll:true});
    }
    const choiceDialog = node('dialog','sequence-graph-create sequence-graph-choice-create');
    const choiceForm = node('form'), choiceHeading = node('h3'); choiceHeading.id = `${arrowId}-choice-title`; choiceDialog.setAttribute('aria-labelledby',choiceHeading.id);
    const choiceNotice = node('p','sequence-graph-note');
    const promptLabel = node('label','','Pergunta ou contexto (opcional)'), promptInput = node('textarea'); promptInput.rows = 3; promptInput.placeholder = 'O que você fará ao chegar à floresta?'; promptLabel.append(promptInput);
    const choiceRows = node('div','sequence-graph-choice-rows');
    const addRowButton = button('Adicionar opção',() => { const row = addChoiceRow(); row.querySelector('input').focus(); });
    const choiceError = node('p','sequence-graph-warning'); choiceError.setAttribute('role','alert');
    const choiceActions = node('div','sequence-graph-actions');
    const saveChoice = button('Criar escolha',() => {}); saveChoice.type = 'submit';
    choiceActions.append(button('Cancelar',() => closeChoice()),saveChoice);
    choiceForm.append(choiceHeading,choiceNotice,promptLabel,choiceRows,addRowButton,choiceError,choiceActions); choiceDialog.append(choiceForm); section.append(choiceDialog);
    choiceDialog.addEventListener('cancel',event => { event.preventDefault(); closeChoice(); });
    function updateChoiceRows() {
      [...choiceRows.children].forEach((row,index) => { row.querySelector('legend').textContent = `Opção ${index + 1}`; const remove = row.querySelector('[data-remove-choice-row]'); remove.disabled = choiceRows.children.length <= 1; remove.setAttribute('aria-label',`Remover opção ${index + 1}`); });
    }
    function addChoiceRow() {
      const row = node('fieldset','sequence-graph-choice-row'); row.append(node('legend'));
      const textLabel = node('label','','Texto da opção'), text = node('input'); text.required = true; text.dataset.choiceText = ''; text.autocomplete = 'off'; text.placeholder = 'Seguir pela floresta'; textLabel.append(text);
      const destinationLabel = node('label','','Destino'), destination = node('select'); destination.append(new win.Option('Definir depois',''));
      targets.forEach(target => destination.append(new win.Option(target.label,target.id))); destinationLabel.append(destination);
      const remove = button('Remover opção',() => { if (choiceRows.children.length > 1) { const next = row.nextElementSibling || row.previousElementSibling; row.remove(); updateChoiceRows(); next?.querySelector('input')?.focus(); } }); remove.dataset.removeChoiceRow = '';
      row.append(textLabel,destinationLabel,remove); choiceRows.append(row); updateChoiceRows(); return row;
    }
    function showChoice(source,choice = null) {
      if (!canEdit || simulation || disposed || source.external || source.missing || source.duplicate || choiceDialog.open || createDialog.open) return;
      cleanupGesture?.(); cancelConnection(false);
      choiceDraft = {source,choice}; choiceError.textContent = ''; promptInput.value = ''; saveChoice.disabled = false;
      choiceHeading.textContent = choice ? 'Adicionar opções' : 'Nova escolha'; saveChoice.textContent = choice ? 'Adicionar opções' : 'Criar escolha';
      choiceNotice.textContent = choice ? `Em “${source.title}”: ${choice.prompt || 'Escolha sem pergunta'}. As opções existentes serão mantidas.` : `Em “${source.title}”. O novo bloco será inserido ao final desta sequência.`;
      promptLabel.hidden = Boolean(choice); choiceRows.replaceChildren(); addChoiceRow(); if (!choice) addChoiceRow();
      choiceDialog.showModal(); (choice ? choiceRows.querySelector('input') : promptInput).focus();
    }
    function closeChoice() {
      const choice = choiceDraft?.choice; choiceDraft = null; choiceDialog.close();
      if (!disposed) { if (choice) focusChoice(choice.nodeId); else inspector.querySelector('[data-new-choice]')?.focus({preventScroll:true}); }
    }
    choiceForm.addEventListener('submit',event => {
      event.preventDefault(); if (!choiceDraft || !canEdit || simulation || saveChoice.disabled) return;
      const data = {prompt:promptInput.value,options:[...choiceRows.children].map(row => ({text:row.querySelector('[data-choice-text]').value.trim(),targetEvent:row.querySelector('select').value}))};
      if (!data.options.length || data.options.some(option => !option.text)) { choiceError.textContent = 'Preencha o texto de cada opção.'; return; }
      saveChoice.disabled = true;
      const current = choiceDraft; let result;
      try { result = current.choice ? options.onAddChoiceOptions?.(current.source,current.choice,data) : options.onCreateChoice?.(current.source,data); }
      catch (_) { choiceError.textContent = 'Não foi possível salvar. Confira o estado do capítulo antes de tentar novamente.'; saveChoice.disabled = false; return; }
      if (!result?.ok) { choiceError.textContent = result?.message || 'Não foi possível salvar a escolha.'; saveChoice.disabled = false; return; }
      selected = current.source.key; selectedRoute = ''; save(); choiceDraft = null; choiceDialog.close(); options.onRefresh?.(undefined,result.choiceId);
    });
    function focusChoice(id) {
      if (!coreKeys.has(selected)) resetFilters();
      const group = [...inspector.querySelectorAll('[data-choice-node-id]')].find(item => item.dataset.choiceNodeId === id);
      if (!group) return;
      inspector.scrollTop += group.getBoundingClientRect().top - inspector.getBoundingClientRect().top - 12;
      group.querySelector('button')?.focus({preventScroll:true});
    }
    function validDestination(entry) { return Boolean(entry && !entry.missing && !entry.duplicate && targets.some(target => target.id === entry.id)); }
    function connectionHighlights(targetKey = '') {
      cards.forEach((card,key) => {
        card.dataset.connectable = String(Boolean(connection) && validDestination(byKey.get(key)));
        card.dataset.connectionTarget = String(key === targetKey);
        card.querySelectorAll('[data-route-key]').forEach(port => port.setAttribute('aria-pressed',String(connection?.source.key === key && connection?.route.key === port.dataset.routeKey)));
      });
    }
    function cancelConnection(announce = true) {
      cleanupGesture?.(); connection = null; draft?.remove(); draft = null; cancelConnect.hidden = true; connectionHighlights(); applyFilters();
      if (announce && !disposed) feedback.textContent = 'Conexão cancelada.';
    }
    function beginConnection(source,route) {
      if (!canEdit || simulation || source.external || source.duplicate) return;
      select(source.key,route.key); connection = {source,route}; cancelConnect.hidden = false; connectionHighlights(); applyFilters();
      [...(cards.get(source.key)?.querySelectorAll('[data-route-key]') || [])].find(port => port.dataset.routeKey === route.key)?.focus({preventScroll:true});
      feedback.textContent = `Conectar “${route.label}”: escolha uma sequência ou clique no fundo para criar um destino. Escape cancela.`;
    }
    function connectTo(target) {
      if (!connection || !validDestination(target)) { connectionHighlights(); feedback.textContent = 'Escolha uma sequência existente com ID único.'; return; }
      const current = connection;
      const result = options.onChangeDestination?.(current.source,current.route,target.id);
      if (!result?.ok) { feedback.textContent = result?.message || 'Não foi possível conectar este caminho.'; return; }
      cancelConnection(false); selected = current.source.key; selectedRoute = current.route.key; save(); options.onRefresh?.();
    }
    function activateCard(entry) {
      if (suppressClick) return;
      if (connection) connectTo(entry); else select(entry.key);
    }
    function worldPoint(event) {
      const rect = viewport.getBoundingClientRect();
      return {x:(event.clientX - rect.left + viewport.scrollLeft) / zoom,y:(event.clientY - rect.top + viewport.scrollTop) / zoom};
    }
    function cardAt(event) {
      const card = doc.elementFromPoint(event.clientX,event.clientY)?.closest('.sequence-graph-card');
      return card && stage.contains(card) ? byKey.get(card.dataset.key) : null;
    }
    function showDraft(event) {
      if (!connection) return;
      if (!draft) { draft = svgNode('path',{class:'sequence-graph-draft',fill:'none','marker-end':`url(#${arrowId})`}); svg.append(draft); }
      const a = positions.get(connection.source.key), b = worldPoint(event);
      const index = connection.source.routes.findIndex(route => route.key === connection.route.key), count = connection.source.routes.length;
      const offset = count > 1 ? (index / (count - 1) * 2 - 1) * Math.min(70,(count - 1) * 10) : 0;
      const x = a.x + WIDTH / 2 + offset, y = a.y + HEIGHT, middle = y + Math.max(40,Math.abs(b.y - y) / 2);
      draft.setAttribute('d',`M ${x} ${y} C ${x} ${middle},${b.x} ${middle},${b.x} ${b.y}`);
      const target = cardAt(event); connectionHighlights(validDestination(target) ? target.key : '');
    }
    function dropConnection(event) {
      const target = cardAt(event);
      if (target) { connectTo(target); return; }
      const rect = viewport.getBoundingClientRect();
      if (event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom) {
        showCreate(worldPoint(event),connection);
      } else cancelConnection();
    }
    function startConnectionDrag(event,source,route) {
      if (!canEdit || simulation || source.external || source.duplicate || event.button !== 0 || cleanupGesture) return;
      event.preventDefault(); event.stopPropagation();
      const capture = event.currentTarget, start = {x:event.clientX,y:event.clientY}; let moved = false;
      capture.focus({preventScroll:true}); capture.setPointerCapture(event.pointerId);
      const move = e => {
        if (e.pointerId !== event.pointerId) return;
        if (!moved && Math.hypot(e.clientX - start.x,e.clientY - start.y) > 4) { moved = true; beginConnection(source,route); }
        if (!moved) return;
        const bounds = viewport.getBoundingClientRect();
        if (e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom) {
          if (e.clientX < bounds.left + 28) viewport.scrollLeft -= 18; else if (e.clientX > bounds.right - 28) viewport.scrollLeft += 18;
          if (e.clientY < bounds.top + 28) viewport.scrollTop -= 18; else if (e.clientY > bounds.bottom - 28) viewport.scrollTop += 18;
        }
        showDraft(e);
      };
      const cleanup = () => {
        if (!cleanupGesture) return;
        cleanupGesture = null; win.removeEventListener('pointermove',move); win.removeEventListener('pointerup',up); win.removeEventListener('pointercancel',cancelPointer); win.removeEventListener('blur',cancel); win.removeEventListener('keydown',escape);
        if (capture.hasPointerCapture(event.pointerId)) capture.releasePointerCapture(event.pointerId);
        draft?.remove(); draft = null;
        suppressClick = moved; win.setTimeout(() => { suppressClick = false; },0);
      };
      const up = e => { if (e.pointerId === event.pointerId) { cleanup(); if (moved) dropConnection(e); } };
      const cancel = () => { cleanup(); cancelConnection(); };
      const cancelPointer = e => { if (e.pointerId === event.pointerId) cancel(); };
      const escape = e => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
      cleanupGesture = cancel;
      win.addEventListener('pointermove',move); win.addEventListener('pointerup',up); win.addEventListener('pointercancel',cancelPointer); win.addEventListener('blur',cancel); win.addEventListener('keydown',escape);
    }
    function resetFilters(enframe = false) {
      searchInput.value = ''; filterChapter.value = ''; scopeInput.value = 'all';
      applyFilters(); renderInspector(); if (enframe) fit([...visibleKeys]); save();
    }
    function applyFilters() {
      const query = normalized(searchInput.value.trim()), mode = scopeInput.value;
      let scope = null;
      if (mode === 'nearby' || mode === 'reachable') {
        scope = new Set(selected ? [selected] : []);
        if (mode === 'nearby') paths.forEach(edge => { if (edge.source === selected || edge.target === selected) { scope.add(edge.source); scope.add(edge.target); } });
        else {
          const adjacency = new Map(); paths.forEach(edge => { if (!adjacency.has(edge.source)) adjacency.set(edge.source,[]); adjacency.get(edge.source).push(edge.target); });
          const queue = [...scope]; for (let cursor = 0; cursor < queue.length; cursor++) (adjacency.get(queue[cursor]) || []).forEach(key => { if (!scope.has(key)) { scope.add(key); queue.push(key); } });
        }
      }
      coreKeys = new Set(entries.filter(entry => connection || simulation || ((!query || normalized(`${entry.title} ${entry.chapter} ${entry.id}`).includes(query)) && (!filterChapter.value || entry.documentId === filterChapter.value) && (!scope || scope.has(entry.key)) && (mode !== 'issues' || entry.warning || entry.routes.some(route => route.warning)))).map(entry => entry.key));
      visibleKeys = new Set(coreKeys);
      // Show one neighboring hop as context without expanding indefinitely through the book.
      paths.forEach(edge => { if (coreKeys.has(edge.source) || coreKeys.has(edge.target)) { visibleKeys.add(edge.source); visibleKeys.add(edge.target); } });
      cards.forEach((card,key) => { card.hidden = !visibleKeys.has(key); card.dataset.filterContext = String(visibleKeys.has(key) && !coreKeys.has(key)); });
      paths.forEach(edge => { const show = visibleKeys.has(edge.source) && visibleKeys.has(edge.target) && (coreKeys.has(edge.source) || coreKeys.has(edge.target)); edge.line.style.display = show ? '' : 'none'; edge.hit.style.display = show ? '' : 'none'; });
      emptyFilter.hidden = visibleKeys.size > 0 || !entries.length;
      filterCount.textContent = simulation ? 'Mapa completo durante a simulação; filtros preservados para depois' : connection ? 'Todos os destinos visíveis durante a conexão' : `${coreKeys.size} de ${entries.length} sequências${visibleKeys.size > coreKeys.size ? ` · ${visibleKeys.size - coreKeys.size} referências de contexto` : ''}`;
      filterToggle.dataset.active = String(Boolean(query || filterChapter.value || mode !== 'all'));
      renderMini();
    }
    function revealAndFocus(key) {
      if (!byKey.has(key)) return;
      initialize(); select(key);
      if (!coreKeys.has(key)) resetFilters();
      fit([key]); cards.get(key)?.querySelector('button')?.focus({preventScroll:true});
    }
    function renderMini() {
      if (disposed || !miniVisible) return;
      mini.setAttribute('viewBox',`0 0 ${worldWidth || 800} ${worldHeight || 500}`);
      miniNodes.forEach((rect,key) => {
        const point = positions.get(key); rect.setAttribute('x',point.x); rect.setAttribute('y',point.y); rect.setAttribute('width',WIDTH); rect.setAttribute('height',HEIGHT);
        rect.style.display = visibleKeys.has(key) ? '' : 'none'; rect.dataset.selected = String(key === selected); rect.dataset.context = String(!coreKeys.has(key)); rect.dataset.playing = String(simulation?.runner.state.eventId === byKey.get(key)?.id); rect.dataset.visited = String(Boolean(simulation?.visits.includes(byKey.get(key)?.id)));
      });
      miniEdges.forEach(edge => { const geometry = edge.line.getAttribute('d') || ''; if (edge.path.getAttribute('d') !== geometry) edge.path.setAttribute('d',geometry); edge.path.style.display = edge.line.style.display; edge.path.dataset.traversed = edge.line.dataset.traversed || 'false'; });
      miniView.setAttribute('x',viewport.scrollLeft / zoom); miniView.setAttribute('y',viewport.scrollTop / zoom);
      miniView.setAttribute('width',Math.min(worldWidth,viewport.clientWidth / zoom)); miniView.setAttribute('height',Math.min(worldHeight,viewport.clientHeight / zoom));
    }
    function navigateMini(event) {
      if (event.button !== 0 || cleanupGesture) return;
      event.preventDefault(); event.stopPropagation(); cancelConnection(false); mini.focus({preventScroll:true}); mini.setPointerCapture(event.pointerId);
      const initial = {left:viewport.scrollLeft,top:viewport.scrollTop};
      const navigate = e => {
        const rect = mini.getBoundingClientRect(), scale = Math.min(rect.width / worldWidth,rect.height / worldHeight);
        if (!scale) return;
        const x = clamp((e.clientX - rect.left - (rect.width - worldWidth * scale) / 2) / scale,0,worldWidth);
        const y = clamp((e.clientY - rect.top - (rect.height - worldHeight * scale) / 2) / scale,0,worldHeight);
        viewport.scrollLeft = x * zoom - viewport.clientWidth / 2; viewport.scrollTop = y * zoom - viewport.clientHeight / 2; renderMini();
      };
      const move = e => { if (e.pointerId === event.pointerId) navigate(e); };
      const finish = cancel => {
        if (!cleanupGesture) return; cleanupGesture = null;
        win.removeEventListener('pointermove',move); win.removeEventListener('pointerup',up); win.removeEventListener('pointercancel',cancelPointer); win.removeEventListener('blur',cancelGesture); win.removeEventListener('keydown',escape);
        if (mini.hasPointerCapture(event.pointerId)) mini.releasePointerCapture(event.pointerId);
        if (cancel) { viewport.scrollLeft = initial.left; viewport.scrollTop = initial.top; }
        renderMini(); save();
      };
      const up = e => { if (e.pointerId === event.pointerId) finish(false); };
      const cancelGesture = () => finish(true), cancelPointer = e => { if (e.pointerId === event.pointerId) finish(true); };
      const escape = e => { if (e.key === 'Escape') { e.preventDefault(); finish(true); } };
      cleanupGesture = cancelGesture;
      win.addEventListener('pointermove',move); win.addEventListener('pointerup',up); win.addEventListener('pointercancel',cancelPointer); win.addEventListener('blur',cancelGesture); win.addEventListener('keydown',escape); navigate(event);
    }
    mini.addEventListener('pointerdown',navigateMini);
    mini.addEventListener('keydown',event => {
      const moves = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if (moves[event.key]) { event.preventDefault(); const step = event.shiftKey ? 240 : 80; viewport.scrollLeft += moves[event.key][0] * step; viewport.scrollTop += moves[event.key][1] * step; renderMini(); save(); }
      else if (event.key === 'Home') { event.preventDefault(); fit([...visibleKeys]); }
    });
    function canSimulate(key) {
      const entry = byKey.get(key);
      return Boolean(entry && !entry.missing && !entry.duplicate && options.simulationStory?.sequences?.some(sequence => sequence.event_id === entry.id));
    }
    function simulationControls() {
      simulate.textContent = simulation ? 'Encerrar simulação' : 'Simular seleção'; simulate.setAttribute('aria-pressed',String(Boolean(simulation))); simulate.disabled = !simulation && !canSimulate(selected);
      createSequence.disabled = Boolean(simulation) || !canEdit || !chapters.length;
      clearFilterButton.disabled = Boolean(simulation); searchInput.disabled = Boolean(simulation); filterChapter.disabled = Boolean(simulation); scopeInput.disabled = Boolean(simulation);
      cards.forEach((card,key) => card.querySelectorAll('[data-route-key]').forEach(port => { const entry = byKey.get(key); port.disabled = Boolean(simulation) || !canEdit || entry.external || entry.duplicate; }));
    }
    function startSimulation(key) {
      if (!canSimulate(key) || !root.HeartspaceNarrativeRuntime) return;
      cleanupGesture?.(); cancelConnection(false);
      const story = JSON.parse(JSON.stringify(options.simulationStory)); story.start_event_id = byKey.get(key).id;
      simulation = {viewBefore:{selected,selectedRoute,zoom,left:viewport.scrollLeft,top:viewport.scrollTop},runner:root.HeartspaceNarrativeRuntime.createRunner(story),storyById:new Map(story.sequences.map(sequence => [sequence.event_id,sequence])),startId:story.start_event_id,history:[],trace:[],visits:[story.start_event_id],follow:true,lastFollow:'',variablesOpen:false,traceOpen:false};
      refreshSimulation(); feedback.textContent = 'Simulação passo a passo. Escolhas e variáveis usam uma cópia dos dados desta sessão.';
    }
    function stopSimulation() {
      if (!simulation) return;
      const previous = simulation.viewBefore; simulation = null;
      selected = previous.selected; selectedRoute = previous.selectedRoute; zoom = previous.zoom; sizeStage();
      viewport.scrollLeft = previous.left; viewport.scrollTop = previous.top;
      simulationControls(); highlight(); applyFilters(); renderInspector(); save();
      feedback.textContent = 'Simulação encerrada.'; simulate.focus({preventScroll:true});
    }
    function rememberSimulationStep() {
      return {state:simulation.runner.snapshot(),traceLength:simulation.trace.length,visitsLength:simulation.visits.length};
    }
    function advanceSimulation(optionIndex) {
      if (!simulation) return;
      const current = simulation.runner.current(), before = rememberSimulationStep();
      if (!current.node) return;
      if (current.node.type === 'choice') {
        const option = current.node.options?.[optionIndex];
        if (!option || !simulation.runner.choose(optionIndex)) return;
        const entry = entries.find(item => item.id === before.state.eventId && !item.duplicate);
        const route = entry?.routes.find(item => (item.nodeId || item.blockId) === current.node.id && item.optionIndex === optionIndex);
        simulation.trace.push({sourceId:before.state.eventId,targetId:option.target_event,routeKey:route?.key || '',label:option.text || 'Opção sem texto'});
        simulation.visits.push(option.target_event);
      } else if (!simulation.runner.advance()) return;
      simulation.history.push(before); refreshSimulation();
    }
    function backSimulation() {
      if (!simulation?.history.length) return;
      const previous = simulation.history.at(-1);
      if (!simulation.runner.restore(previous.state)) return;
      simulation.history.pop(); simulation.trace.length = previous.traceLength; simulation.visits.length = previous.visitsLength;
      simulation.lastFollow = ''; refreshSimulation('back');
    }
    function restartSimulation() {
      if (!simulation) return;
      simulation.runner.restart(); simulation.history = []; simulation.trace = []; simulation.visits = [simulation.startId]; simulation.lastFollow = ''; refreshSimulation();
    }
    function refreshSimulation(focus = 'advance') {
      if (!simulation) return;
      simulationControls(); highlight(); applyFilters(); renderInspector();
      const entry = entries.find(item => item.id === simulation.runner.state.eventId && !item.duplicate);
      if (simulation.follow && entry && simulation.lastFollow !== entry.id) {
        const point = positions.get(entry.key); viewport.scrollLeft = (point.x + WIDTH / 2) * zoom - viewport.clientWidth / 2; viewport.scrollTop = (point.y + HEIGHT / 2) * zoom - viewport.clientHeight / 2;
        simulation.lastFollow = entry.id;
      }
      renderMini(); save();
      const control = inspector.querySelector(`[data-sim-action="${focus}"]:not(:disabled)`) || inspector.querySelector('[data-sim-choice]:not(:disabled)') || inspector.querySelector('[data-sim-action="advance"]:not(:disabled)') || inspector.querySelector('h3');
      control?.focus({preventScroll:true});
    }
    function simulationMarks() {
      const visited = new Set(simulation?.visits || []), activeId = simulation?.runner.state.eventId;
      const activeNode = simulation?.runner.current().node, counts = new Map();
      simulation?.trace.forEach(step => { const key = JSON.stringify([step.sourceId,step.routeKey]); counts.set(key,(counts.get(key) || 0) + 1); });
      cards.forEach((card,key) => {
        const entry = byKey.get(key); card.dataset.playing = String(entry.id === activeId);
        if (entry.id === activeId) card.setAttribute('aria-current','step'); else card.removeAttribute('aria-current');
        card.dataset.visited = String(visited.has(entry.id));
        if (visited.has(entry.id)) card.dataset.dim = 'false';
      });
      paths.forEach(edge => {
        const source = byKey.get(edge.source);
        const taken = counts.get(JSON.stringify([source.id,edge.route.key])) || 0;
        const option = source.id === activeId && activeNode?.type === 'choice' && (edge.route.nodeId || edge.route.blockId) === activeNode.id ? activeNode.options?.[edge.route.optionIndex] : null;
        edge.line.dataset.traversed = String(taken > 0);
        edge.line.dataset.blocked = String(Boolean(option) && (!simulation.storyById.has(option.target_event) || !root.HeartspaceNarrativeRuntime.conditionMatches(option.condition,simulation.runner.state.variables)));
        if (source.id === activeId) edge.line.dataset.dim = 'false';
        if (taken) edge.line.dataset.dim = 'false';
      });
    }
    function renderSimulation() {
      const session = simulation;
      const {sequence,node:step,ended,missing} = session.runner.current();
      const heading = node('h3','','Simulação passo a passo'); heading.tabIndex = -1;
      inspector.append(heading,node('strong','',sequence?.title || simulation.runner.state.eventId),node('p','sequence-graph-chapter',sequence?.chapter || ''));
      const onMap = entries.some(entry => entry.id === simulation.runner.state.eventId && !entry.duplicate);
      if (!onMap) inspector.append(node('p','sequence-graph-warning','Esta sequência está fora do livro mostrado no mapa. O percurso continua nos controles abaixo.'));
      const status = node('p','sequence-graph-note',missing ? 'Sequência ausente ou com ID ambíguo.' : ended ? 'Fim da sequência. Volte ou reinicie para explorar outro caminho.' : `Bloco ${simulation.runner.state.index + 1} de ${sequence.nodes.length}`); status.setAttribute('role','status'); inspector.append(status);
      const controls = node('div','sequence-graph-actions');
      const back = button('Voltar',backSimulation); back.dataset.simAction = 'back'; back.disabled = !simulation.history.length;
      controls.append(back,button('Reiniciar',restartSimulation),button('Encerrar',stopSimulation)); inspector.append(controls);
      const follow = node('label','sequence-graph-sim-follow'), check = node('input'); check.type = 'checkbox'; check.checked = simulation.follow;
      check.addEventListener('change',() => { simulation.follow = check.checked; simulation.lastFollow = ''; if (simulation.follow) refreshSimulation(); }); follow.append(check,doc.createTextNode('Acompanhar sequência no mapa')); inspector.append(follow);
      if (step) {
        const content = node('section','sequence-graph-sim-content');
        if (step.type === 'choice') {
          if (step.prompt?.trim()) content.append(node('p','',step.prompt));
          (step.options || []).forEach((option,index) => {
            const available = root.HeartspaceNarrativeRuntime.conditionMatches(option.condition,simulation.runner.state.variables);
            const target = simulation.storyById.get(option.target_event);
            const choice = button(`${index + 1}. ${option.text || 'Opção sem texto'}`,() => advanceSimulation(index)); choice.dataset.simChoice = String(index); choice.disabled = !available || !target;
            const explanation = !target ? 'Destino ausente ou ambíguo' : !available ? 'Condição não atendida' : '';
            if (explanation) { choice.title = explanation; choice.append(node('small','',explanation)); }
            content.append(choice);
          });
          if (!step.options?.length) content.append(node('p','sequence-graph-warning','Esta escolha ainda não tem opções.'));
        } else {
          const labels = {dialogue:step.character || 'Personagem',narration:'Narração',pause:`Pausa · ${step.duration_ms || 0} ms · avanço manual`,signal:`Sinal · ${step.name || 'sem nome'}`,variation:'Variação'};
          content.append(node('strong','',labels[step.type] || 'Bloco'));
          const version = step.type === 'variation' ? root.HeartspaceNarrativeRuntime.resolveVariation(step,simulation.runner.state.variables) : null;
          content.append(node('p','sequence-graph-sim-copy',step.type === 'variation' ? version?.text || 'Versão vazia' : step.type === 'signal' ? step.payload === undefined ? 'Sem dados adicionais' : JSON.stringify(step.payload) : step.type === 'pause' ? 'Avance quando quiser continuar o percurso.' : step.text || 'Trecho vazio'));
          const next = button('Avançar',() => advanceSimulation()); next.dataset.simAction = 'advance'; content.append(next);
        }
        inspector.append(content);
      }
      const variables = node('details','sequence-graph-sim-details'); variables.open = simulation.variablesOpen; variables.append(node('summary','',`Variáveis · ${Object.keys(simulation.runner.state.variables).length}`));
      variables.addEventListener('toggle',() => { if (simulation === session) simulation.variablesOpen = variables.open; });
      Object.entries(simulation.runner.state.variables).forEach(([id,value]) => variables.append(node('p','',`${id}: ${JSON.stringify(value)}`))); inspector.append(variables);
      const trace = node('details','sequence-graph-sim-details'); trace.open = simulation.traceOpen; trace.append(node('summary','',`Percurso · ${simulation.trace.length} escolhas`));
      trace.addEventListener('toggle',() => { if (simulation === session) simulation.traceOpen = trace.open; });
      const list = node('ol'); list.append(node('li','',simulation.storyById.get(simulation.startId)?.title || simulation.startId));
      simulation.trace.forEach(item => list.append(node('li','',`${item.label} → ${simulation.storyById.get(item.targetId)?.title || item.targetId}`))); trace.append(list); inspector.append(trace);
    }
    function save() {
      if (disposed) return;
      if (viewport.clientWidth && viewport.clientHeight) camera = {left:viewport.scrollLeft,top:viewport.scrollTop};
      const data = {filters:{query:searchInput.value,chapter:filterChapter.value,scope:scopeInput.value},filterOpen:!filterPanel.hidden,miniVisible,layoutVersion:FLOW_VERSION,manualKeys:[...manualKeys],positions:[...positions].map(([key,point]) => ({key,...point})),zoom,selected,selectedRoute,...camera};
      memory.set(storageKey,data);
      try { win.localStorage.setItem(storageKey,JSON.stringify(data)); } catch (_) { feedback.textContent = 'A disposição do mapa será mantida somente nesta sessão.'; }
    }
    function sizeStage() {
      worldWidth = Math.max(800,...[...positions.values()].map(point => point.x + WIDTH + 100));
      worldHeight = Math.max(500,...[...positions.values()].map(point => point.y + HEIGHT + 100));
      stage.style.width = `${worldWidth}px`; stage.style.height = `${worldHeight}px`;
      svg.setAttribute('width',worldWidth); svg.setAttribute('height',worldHeight);
      stage.style.transform = `scale(${zoom})`;
      spacer.style.width = `${worldWidth * zoom}px`; spacer.style.height = `${worldHeight * zoom}px`;
      percent.textContent = `${Math.round(zoom * 100)}%`; renderMini();
    }
    function changeZoom(next,clientX,clientY) {
      const bounds = viewport.getBoundingClientRect();
      const x = clientX === undefined ? viewport.clientWidth / 2 : clientX - bounds.left;
      const y = clientY === undefined ? viewport.clientHeight / 2 : clientY - bounds.top;
      const point = {x:(viewport.scrollLeft + x) / zoom,y:(viewport.scrollTop + y) / zoom};
      zoom = clamp(next,.2,1.6); sizeStage();
      viewport.scrollLeft = point.x * zoom - x; viewport.scrollTop = point.y * zoom - y; save();
    }
    function fit(keys) {
      const points = keys.map(key => positions.get(key)).filter(Boolean);
      if (!points.length || !viewport.clientWidth || !viewport.clientHeight) return;
      const left = Math.min(...points.map(point => point.x)), top = Math.min(...points.map(point => point.y));
      const right = Math.max(...points.map(point => point.x + WIDTH)), bottom = Math.max(...points.map(point => point.y + HEIGHT));
      zoom = clamp(Math.min((viewport.clientWidth - 64) / (right - left),(viewport.clientHeight - 64) / (bottom - top)),.2,1.2);
      sizeStage(); viewport.scrollLeft = (left + right) * zoom / 2 - viewport.clientWidth / 2; viewport.scrollTop = (top + bottom) * zoom / 2 - viewport.clientHeight / 2; save();
    }
    function organizeFlow() {
      cleanupGesture?.();
      organizationUndo = {positions:new Map([...positions].map(([key,point]) => [key,{...point}])),manualKeys:new Set(manualKeys),zoom,left:viewport.scrollLeft,top:viewport.scrollTop};
      positions.clear(); flowLayout(entries).forEach((point,key) => positions.set(key,point)); manualKeys.clear();
      undoOrganization.disabled = false; draw(); fit([...visibleKeys]); save();
      feedback.textContent = 'Fluxo organizado: alternativas lado a lado e reencontros abaixo. Você pode continuar movendo os cartões.';
    }
    function undoFlow() {
      if (!organizationUndo) return;
      cleanupGesture?.();
      positions.clear(); organizationUndo.positions.forEach((point,key) => positions.set(key,point));
      manualKeys.clear(); organizationUndo.manualKeys.forEach(key => manualKeys.add(key)); zoom = organizationUndo.zoom;
      draw(); viewport.scrollLeft = organizationUndo.left; viewport.scrollTop = organizationUndo.top;
      organizationUndo = null; undoOrganization.disabled = true; save(); feedback.textContent = 'Disposição anterior restaurada.';
    }
    function routePath(source,target,index,count) {
      const a = positions.get(source), b = positions.get(target);
      const offset = count > 1 ? (index / (count - 1) * 2 - 1) * Math.min(70,(count - 1) * 10) : 0;
      if (source === target) return `M ${a.x + WIDTH} ${a.y + HEIGHT / 2 + offset} C ${a.x + WIDTH + 70} ${a.y - 42},${a.x + WIDTH / 2} ${a.y - 40},${a.x + WIDTH / 2} ${a.y}`;
      const below = b.y >= a.y + HEIGHT + 30;
      if (below && b.y - a.y < (HEIGHT + ROW_GAP) * 1.5) {
        const x1 = a.x + WIDTH / 2 + offset, y1 = a.y + HEIGHT, x2 = b.x + WIDTH / 2, y2 = b.y;
        const middle = (y1 + y2) / 2;
        return `M ${x1} ${y1} C ${x1} ${middle},${x2} ${middle},${x2} ${y2}`;
      }
      if (!below && Math.abs(b.y - a.y) < HEIGHT && b.x > a.x + WIDTH + 36) {
        const x1 = a.x + WIDTH, y1 = a.y + HEIGHT / 2 + offset, y2 = b.y + HEIGHT / 2;
        const bend = Math.max(60,(b.x - x1) / 2);
        return `M ${x1} ${y1} C ${x1 + bend} ${y1},${b.x - bend} ${y2},${b.x} ${y2}`;
      }
      // Returns and edges skipping levels travel outside the intervening cards.
      const x1 = a.x + WIDTH, y1 = a.y + HEIGHT / 2 + offset, x2 = b.x + WIDTH, y2 = b.y + HEIGHT / 2;
      const obstacles = [...positions.values()].filter(point => point.y + HEIGHT >= Math.min(y1,y2) && point.y <= Math.max(y1,y2));
      const lane = Math.max(x1,x2,...obstacles.map(point => point.x + WIDTH)) + 46 + index % 4 * 12;
      const direction = y2 >= y1 ? 1 : -1;
      return `M ${x1} ${y1} C ${x1 + 24} ${y1},${lane} ${y1},${lane} ${y1 + direction * 24} L ${lane} ${y2 - direction * 24} C ${lane} ${y2},${x2 + 24} ${y2},${x2} ${y2}`;
    }

    function draw() {
      positions.forEach((point,key) => { const card = cards.get(key); if (card) { card.style.left = `${point.x}px`; card.style.top = `${point.y}px`; } });
      paths.forEach(edge => { const d = routePath(edge.source,edge.target,edge.index,edge.count); edge.line.setAttribute('d',d); edge.hit.setAttribute('d',d); });
      sizeStage();
    }
    function highlight() {
      const related = new Set(selected ? [selected] : []);
      paths.forEach(edge => { if (edge.source === selected || edge.target === selected) { related.add(edge.source); related.add(edge.target); } });
      cards.forEach((card,key) => {
        card.dataset.selected = String(key === selected); card.dataset.dim = String(Boolean(selected) && !related.has(key));
        card.querySelector('.sequence-graph-handle').setAttribute('aria-pressed',String(key === selected));
      });
      paths.forEach(edge => {
        edge.line.dataset.related = String(edge.source === selected || edge.target === selected);
        edge.line.dataset.selected = String(edge.source === selected && edge.route.key === selectedRoute);
        edge.line.dataset.dim = String(Boolean(selected) && edge.source !== selected && edge.target !== selected);
      });
      simulationMarks();
    }
    function select(key,routeKey = '') {
      if (!byKey.has(key)) return;
      selected = key; selectedRoute = routeKey; simulationControls(); highlight(); applyFilters(); renderInspector(); save();
    }
    function renderInspector() {
      inspector.replaceChildren();
      if (simulation) { renderSimulation(); return; }
      const entry = byKey.get(selected);
      if (!entry) { inspector.append(node('p','','Selecione uma sequência para ver seus caminhos.')); return; }
      inspector.append(node('h3','',entry.title),node('p','sequence-graph-chapter',entry.chapter || 'Destino ausente'),node('code','sequence-graph-id',entry.id));
      if (!coreKeys.has(entry.key)) inspector.append(button('Revelar seleção',() => revealAndFocus(entry.key)));
      if (entry.external) inspector.append(node('p','sequence-graph-note','Referência a uma sequência fora deste livro. Abra o capítulo para explorar seu mapa.'));
      if (entry.warning) inspector.append(node('p','sequence-graph-warning',entry.warning));
      if (entry.preview) inspector.append(node('p','sequence-graph-excerpt',entry.preview));
      const actions = node('div','sequence-graph-actions');
      if (!entry.missing) {
        actions.append(button('Abrir sequência',() => options.onOpen?.(entry)));
        if (!entry.external) { const create = button('Nova escolha',() => showChoice(entry)); create.dataset.newChoice = ''; create.disabled = !canEdit || entry.duplicate; actions.append(create); }
        const simulationButton = button('Simular daqui',() => startSimulation(entry.key)); simulationButton.disabled = !canSimulate(entry.key); actions.append(simulationButton);
        const play = button('Abrir player',() => options.onPlay?.(entry)); play.disabled = entry.duplicate; actions.append(play);
      }
      inspector.append(actions);
      const choiceGroups = new Map();
      (entry.choiceBlocks || []).forEach((choice,index) => {
        const group = node('section','sequence-graph-choice-group'); group.dataset.choiceNodeId = choice.nodeId;
        group.append(node('h4','',`Escolha ${index + 1}`),node('p','sequence-graph-note',choice.prompt || 'Somente opções'));
        const add = button('Adicionar opção',() => showChoice(entry,choice)); add.disabled = !canEdit || entry.external || entry.duplicate; group.append(add);
        if (!choice.optionCount) group.append(node('p','sequence-graph-note','Esta escolha ainda não tem opções.'));
        choiceGroups.set(choice.nodeId,group); inspector.append(group);
      });
      if (!entry.routes.length && !entry.choiceBlocks?.length) inspector.append(node('p','sequence-graph-note',entry.missing ? 'Uma escolha aponta para este ID, mas a sequência não foi encontrada.' : entry.external ? 'As saídas desta referência são mostradas no livro de origem.' : 'Sem saídas por escolha. Isso pode ser um final ou um trecho ainda em construção.'));
      entry.routes.forEach((route,routeIndex) => {
        const row = node('form','sequence-graph-route'); row.dataset.selected = String(route.key === selectedRoute);
        row.append(node('strong','',`${routeIndex + 1}. ${route.label}`));
        if (route.condition) row.append(node('small','','Caminho com condição'));
        const label = node('label','','Destino');
        const selectTarget = node('select'); selectTarget.setAttribute('aria-label',`Destino de ${route.label}`);
        selectTarget.append(new win.Option('Sem destino',''));
        if (route.target && !targets.some(target => target.id === route.target)) selectTarget.append(new win.Option(`${route.target} · ausente ou ambíguo`,route.target));
        targets.forEach(target => selectTarget.append(new win.Option(target.label,target.id)));
        selectTarget.value = route.target; selectTarget.disabled = !canEdit || entry.external || entry.duplicate;
        label.append(selectTarget); row.append(label);
        if (route.warning) row.append(node('small','sequence-graph-warning',route.warning));
        const controls = node('div','sequence-graph-actions');
        const connect = button('Conectar no mapa',() => beginConnection(entry,route)); connect.disabled = selectTarget.disabled; controls.append(connect);
        const create = button('Criar destino',() => showCreate(null,{source:entry,route})); create.disabled = selectTarget.disabled || !chapters.length; controls.append(create);
        const apply = button('Salvar destino',() => {}); apply.type = 'submit'; apply.disabled = selectTarget.disabled; controls.append(apply);
        if (route.targetKey && byKey.has(route.targetKey)) controls.append(button('Ver destino',() => revealAndFocus(route.targetKey)));
        row.append(controls);
        row.addEventListener('submit',event => {
          event.preventDefault(); if (apply.disabled) return;
          const result = options.onChangeDestination?.(entry,route,selectTarget.value);
          if (result?.ok === false) { feedback.textContent = result.message || 'Não foi possível alterar o destino.'; return; }
          feedback.textContent = 'Destino salvo.'; save(); options.onRefresh?.();
        });
        (choiceGroups.get(route.nodeId || route.blockId) || inspector).append(row);
      });
      if (selectedRoute) {
        const row = [...inspector.querySelectorAll('.sequence-graph-route')].find(item => item.dataset.selected === 'true');
        if (row) inspector.scrollTop += row.getBoundingClientRect().top - inspector.getBoundingClientRect().top - 12;
      }
    }
    function startGesture(event,key) {
      if (event.button !== 0 || cleanupGesture || connection) return;
      event.preventDefault();
      const point = key ? {...positions.get(key)} : null;
      const wasManual = key && manualKeys.has(key);
      const start = {x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
      let moved = false;
      const capture = event.currentTarget;
      capture.focus?.({preventScroll:true});
      capture.setPointerCapture(event.pointerId);
      if (key) select(key);
      viewport.dataset.dragging = 'true';
      const move = e => {
        if (e.pointerId !== event.pointerId) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.hypot(dx,dy) > 4) moved = true;
        if (!moved) return;
        if (key) { positions.set(key,{x:clamp(point.x + dx / zoom,16,LIMIT),y:clamp(point.y + dy / zoom,16,LIMIT)}); draw(); }
        else { viewport.scrollLeft = start.left - dx; viewport.scrollTop = start.top - dy; }
      };
      const cleanup = cancel => {
        if (!cleanupGesture) return;
        cleanupGesture = null;
        win.removeEventListener('pointermove',move); win.removeEventListener('pointerup',up); win.removeEventListener('pointercancel',cancelPointer); win.removeEventListener('blur',cancelGesture); win.removeEventListener('keydown',escape);
        if (capture.hasPointerCapture(event.pointerId)) capture.releasePointerCapture(event.pointerId);
        delete viewport.dataset.dragging;
        if (cancel) { if (key) { positions.set(key,point); draw(); } else { viewport.scrollLeft = start.left; viewport.scrollTop = start.top; } }
        if (key && moved && !cancel) manualKeys.add(key);
        else if (key && !wasManual) manualKeys.delete(key);
        suppressClick = moved; win.setTimeout(() => { suppressClick = false; },0); save();
      };
      const up = e => { if (e.pointerId === event.pointerId) cleanup(false); };
      const cancelPointer = e => { if (e.pointerId === event.pointerId) cleanup(true); };
      const cancelGesture = () => cleanup(true);
      const escape = e => { if (e.key === 'Escape') { e.preventDefault(); cleanup(true); } };
      cleanupGesture = cancelGesture;
      win.addEventListener('pointermove',move); win.addEventListener('pointerup',up); win.addEventListener('pointercancel',cancelPointer); win.addEventListener('blur',cancelGesture); win.addEventListener('keydown',escape);
    }
    entries.forEach(entry => {
      const card = node('article','sequence-graph-card'); card.dataset.key = entry.key; card.dataset.missing = String(entry.missing); card.dataset.external = String(entry.external);
      const handle = button(entry.title,event => { event.stopPropagation(); activateCard(entry); }); handle.className = 'sequence-graph-handle';
      handle.title = `${entry.title} · Arraste para mover; setas do teclado também movem o cartão.`;
      handle.addEventListener('pointerdown',event => { event.stopPropagation(); startGesture(event,entry.key); });
      handle.addEventListener('keydown',event => {
        const moves = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if (!moves[event.key]) return; event.preventDefault(); select(entry.key);
        const point = positions.get(entry.key), step = event.shiftKey ? 40 : 10;
        manualKeys.add(entry.key);
        positions.set(entry.key,{x:clamp(point.x + moves[event.key][0] * step,16,LIMIT),y:clamp(point.y + moves[event.key][1] * step,16,LIMIT)}); draw(); save();
      });
      card.append(handle,node('small','sequence-graph-chapter',entry.chapter || 'Destino ausente'),node('p','sequence-graph-preview',entry.preview || (entry.missing ? 'Revise a escolha que aponta para este destino.' : 'Sequência vazia')));
      card.append(node('small',entry.warning ? 'sequence-graph-warning' : 'sequence-graph-count',entry.warning || `${entry.blockCount} blocos · ${entry.routes.length} saídas${entry.current ? ' · Atual' : ''}`));
      if (entry.routes.length) {
        const ports = node('div','sequence-graph-ports'); ports.setAttribute('aria-label','Saídas por escolha');
        entry.routes.forEach((route,index) => {
          const port = button(`${index + 1} ↗`,event => { event.stopPropagation(); if (!suppressClick) beginConnection(entry,route); },`Conectar opção ${index + 1}: ${route.label}`);
          port.dataset.routeKey = route.key; port.title = `${index + 1}. ${route.label} · Arraste ou clique para conectar`; port.setAttribute('aria-pressed','false');
          port.disabled = !canEdit || entry.external || entry.duplicate;
          port.addEventListener('pointerdown',event => startConnectionDrag(event,entry,route)); ports.append(port);
        });
        card.append(ports);
      }
      card.addEventListener('click',() => { activateCard(entry); });
      cards.set(entry.key,card); stage.append(card);
    });
    entries.forEach(entry => entry.routes.forEach((route,index) => {
      if (!positions.has(route.targetKey)) return;
      const line = svgNode('path',{class:'sequence-graph-line',fill:'none','marker-end':`url(#${arrowId})`});
      const hit = svgNode('path',{class:'sequence-graph-hit',fill:'none'});
      const title = svgNode('title'); title.textContent = `${entry.title} → ${route.label}`; hit.append(title);
      hit.addEventListener('click',event => { event.stopPropagation(); if (!suppressClick) select(entry.key,route.key); });
      svg.append(line,hit);
      const miniature = svgNode('path',{fill:'none','vector-effect':'non-scaling-stroke'}); miniLines.append(miniature);
      const edge = {source:entry.key,target:route.targetKey,route,index,count:entry.routes.length,line,hit}; paths.push(edge); miniEdges.push({...edge,path:miniature});
    }));
    viewport.addEventListener('pointerdown',event => { if (!event.target.closest('.sequence-graph-card,.sequence-graph-hit')) startGesture(event); });
    viewport.addEventListener('click',event => { if (connection && !suppressClick && !event.target.closest('.sequence-graph-card,.sequence-graph-hit')) showCreate(worldPoint(event),connection); });
    viewport.addEventListener('dblclick',event => { if (!connection && !suppressClick && !event.target.closest('.sequence-graph-card,.sequence-graph-hit')) showCreate(worldPoint(event)); });
    section.addEventListener('keydown',event => { if (event.key === 'Escape' && connection && !createDialog.open) { event.preventDefault(); cancelConnection(); } });
    viewport.addEventListener('wheel',event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault(); changeZoom(zoom * Math.exp(-event.deltaY * .002),event.clientX,event.clientY);
    },{passive:false});
    viewport.addEventListener('keydown',event => {
      if (event.target !== viewport) return;
      if (['+','=','-'].includes(event.key)) { event.preventDefault(); changeZoom(zoom * (event.key === '-' ? 1 / 1.2 : 1.2)); }
      if (event.key === 'Home') { event.preventDefault(); fit([...visibleKeys]); }
    });
    viewport.addEventListener('scroll',() => { if (initialized) { win.cancelAnimationFrame(frame); frame = win.requestAnimationFrame(() => { renderMini(); save(); }); } },{passive:true});
    const initialize = () => {
      if (disposed || initialized || !viewport.clientWidth || !viewport.clientHeight) return;
      draw();
      if (stored.layoutVersion === FLOW_VERSION && Number.isFinite(stored.zoom)) { viewport.scrollLeft = Number.isFinite(stored.left) ? stored.left : 0; viewport.scrollTop = Number.isFinite(stored.top) ? stored.top : 0; }
      else fit([...visibleKeys]);
      initialized = true; renderMini();
    };
    const observer = win.ResizeObserver ? new win.ResizeObserver(() => { initialize(); renderMini(); }) : null; observer?.observe(viewport);
    frame = win.requestAnimationFrame(initialize);
    draw(); simulationControls(); highlight(); applyFilters(); renderInspector();
    if (!entries.length) feedback.textContent = chapters.length && canEdit ? 'Use Nova sequência ou dê dois cliques no fundo para iniciar o mapa.' : 'Crie um capítulo na biblioteca para começar o mapa de sequências.';
    return {
      element:section,
      focus:revealAndFocus,
      focusChoice,
      dispose() { cleanupGesture?.(); if (initialized) save(); disposed = true; simulation = null; pendingCreation = null; choiceDraft = null; if (choiceDialog.open) choiceDialog.close(); if (createDialog.open) createDialog.close(); draft?.remove(); observer?.disconnect(); win.cancelAnimationFrame(frame); }
    };
  }
  root.HeartspaceSequenceMap = {create};
})(typeof globalThis !== 'undefined' ? globalThis : this);
