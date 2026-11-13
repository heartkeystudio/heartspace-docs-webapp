/* A derived view of collection milestones; no separate graph records or layout data. */
(function (root) {
  'use strict';
  const phases = {beginning:'Começo',middle:'Meio',ending:'Fim',free:'Marcos livres'};
  function create(options) {
    const {document:doc,plan,sequences,selectedId,allConnections,canEdit} = options;
    const node = (tag,className,text) => {
      const item = doc.createElement(tag); if (className) item.className = className;
      if (text !== undefined) item.textContent = text; return item;
    };
    const button = (label,action,id) => {
      const item = node('button','',label); item.type = 'button'; item.dataset.planAction = action;
      if (id) item.dataset.id = id; item.dataset.focus = `map:${action}:${id || ''}`; return item;
    };
    const key = item => JSON.stringify([item.documentId || '',item.sequenceId || item.id || '']);
    const byId = new Map(plan.milestones.map(item => [item.id,item])), order = new Map(plan.milestones.map((item,index) => [item.id,index + 1]));
    const worlds = new Map(plan.worldEntries.map(item => [item.id,item]));
    const sequenceById = new Map(sequences.map(item => [key(item),item]));
    const selected = byId.get(selectedId) || plan.milestones[0];
    const edges = plan.milestones.flatMap(target => target.dependsOn.filter(link => byId.has(link.milestoneId)).map(link => ({source:link.milestoneId,target:target.id})));
    const related = new Set(selected ? [selected.id] : []);
    edges.forEach(edge => { if (edge.source === selected?.id || edge.target === selected?.id) { related.add(edge.source); related.add(edge.target); } });
    const section = node('section','story-plan-map'); section.setAttribute('aria-label','Mapa do planejamento');
    const controls = node('div','story-plan-heading');
    controls.append(node('p','story-plan-map-help','Selecione um marco para ver suas conexões. As setas indicam preparação → acontecimento.'));
    const all = button('Todas as conexões','map-connections'); all.setAttribute('aria-pressed',String(allConnections)); controls.append(all); section.append(controls);
    if (!selected) {
      section.append(node('p','story-plan-empty','Seu mapa começa com o primeiro marco. Use um guia narrativo ou adicione seus próprios acontecimentos no formulário.'));
      section.append(button('Abrir formulário','plan-view','form')); return {element:section,layout:() => {}};
    }
    const body = node('div','story-plan-map-body');
    const viewport = node('div','story-plan-map-viewport'); viewport.tabIndex = 0; viewport.setAttribute('role','region'); viewport.setAttribute('aria-label','Marcos por etapa. Use as barras de rolagem para explorar o mapa.'); viewport.dataset.focus = 'map:viewport';
    const stage = node('div','story-plan-map-stage'); if (plan.milestones.some(item => item.phase === 'free')) stage.classList.add('has-free');
    const svgNode = (tag,attributes) => { const item = doc.createElementNS('http://www.w3.org/2000/svg',tag); Object.entries(attributes || {}).forEach(([name,value]) => item.setAttribute(name,String(value))); return item; };
    const svg = svgNode('svg',{'aria-hidden':'true',focusable:'false',class:'story-plan-map-lines'});
    const defs = svgNode('defs'), marker = svgNode('marker',{id:'story-plan-map-arrow',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});
    marker.append(svgNode('path',{d:'M 0 0 L 8 4 L 0 8 z'})); defs.append(marker); svg.append(defs);
    const lines = svgNode('g'); svg.append(lines); stage.append(svg);
    const cards = new Map();
    Object.entries(phases).forEach(([phase,label]) => {
      const entries = plan.milestones.filter(item => item.phase === phase); if (phase === 'free' && !entries.length) return;
      const lane = node('section','story-plan-map-lane'); lane.append(node('h4','',`${label} · ${entries.length}`));
      const list = node('ol','story-plan-map-cards'); list.setAttribute('aria-label',label);
      if (!entries.length) lane.append(node('p','story-plan-map-lane-empty','Sem marcos nesta etapa.'));
      entries.forEach(milestone => {
        const item = node('li'), card = button('','select-map',milestone.id); card.className = 'story-plan-map-node';
        card.setAttribute('aria-pressed',String(milestone.id === selected.id));
        if (milestone.id === selected.id) card.classList.add('is-selected');
        else if (related.has(milestone.id)) card.classList.add('is-related');
        else if (!allConnections) card.classList.add('is-muted');
        card.append(node('span','story-plan-map-number',`Marco ${order.get(milestone.id)}`),node('strong','',milestone.title || 'Marco sem título'),node('span','story-plan-map-excerpt',milestone.summary || milestone.guidance || 'Ainda sem descrição.'));
        const missing = milestone.dependsOn.filter(link => !byId.has(link.milestoneId)).length + milestone.worldLinks.filter(link => !worlds.has(link.entryId)).length + milestone.links.filter(link => !sequenceById.has(key(link))).length;
        card.append(node('small','',`${milestone.dependsOn.length} ${milestone.dependsOn.length === 1 ? 'preparação' : 'preparações'} · ${milestone.worldLinks.length} ${milestone.worldLinks.length === 1 ? 'ficha' : 'fichas'}${missing ? ` · ${missing} a revisar` : ''}`));
        cards.set(milestone.id,card); item.append(card); list.append(item);
      }); lane.append(list); stage.append(lane);
    }); viewport.append(stage); body.append(viewport);
    const inspector = node('aside','story-plan-map-inspector'); inspector.setAttribute('aria-label','Detalhes do marco selecionado');
    inspector.append(node('span','story-plan-map-number',phases[selected.phase]),node('h4','',selected.title || 'Marco sem título'),node('p','story-plan-map-text',selected.summary || 'Este marco ainda não tem descrição.'));
    if (selected.guidance) inspector.append(node('p','story-plan-guidance',selected.guidance));
    const editActions = node('div','story-plan-actions');
    const edit = button(canEdit ? 'Editar marco' : 'Ver no formulário','edit-map',selected.id); editActions.append(edit);
    const connections = button(canEdit ? 'Editar preparação' : 'Ver preparação','edit-map-connections',selected.id); editActions.append(connections); inspector.append(editActions);
    const text = (label,value) => { if (value) inspector.append(node('h5','',label),node('p','story-plan-map-text',value)); };
    text('Preparação',selected.preparation); text('Consequências',selected.consequences);
    function relations(label,items) {
      inspector.append(node('h5','',label)); const list = node('ul','story-plan-map-relations');
      if (!items.length) list.append(node('li','','Nenhum marco vinculado.'));
      items.forEach(item => {
        const li = node('li');
        if (item.missing) li.append(node('span','',`${item.title || 'Marco sem título'} · removido ou indisponível. Revisar no formulário.`));
        else li.append(button(item.title || 'Marco sem título','select-map',item.id));
        list.append(li);
      }); inspector.append(list);
    }
    relations('Preparado por',selected.dependsOn.map(link => byId.get(link.milestoneId) || {title:link.title,missing:true}));
    relations('Prepara',plan.milestones.filter(item => item.dependsOn.some(link => link.milestoneId === selected.id)));
    if (selected.worldLinks.length) {
      inspector.append(node('h5','','Fichas relacionadas')); const list = node('ul','story-plan-map-relations');
      selected.worldLinks.forEach(link => {
        const li = node('li'), entry = worlds.get(link.entryId);
        if (entry) { const open = button(entry.title || 'Ficha sem título','open-world',entry.id); open.dataset.entryId = entry.id; li.append(open); }
        else li.append(node('span','',`${link.title || 'Ficha sem título'} · removida ou indisponível`));
        list.append(li);
      }); inspector.append(list);
    }
    if (selected.links.length) {
      inspector.append(node('h5','','Sequências vinculadas')); const list = node('ul','story-plan-map-relations');
      selected.links.forEach(link => {
        const li = node('li'), sequence = sequenceById.get(key(link));
        if (sequence) { const open = button(sequence.title,'open',key(link)); open.dataset.sequenceId = link.sequenceId; open.dataset.documentId = link.documentId; li.append(open); }
        else li.append(node('span','',`${link.title || 'Sequência sem título'} · removida ou indisponível`)); list.append(li);
      }); inspector.append(list);
    }
    body.append(inspector); section.append(body);
    function layout() {
      if (!stage.isConnected || !stage.getBoundingClientRect().width) return;
      const bounds = stage.getBoundingClientRect(), width = stage.scrollWidth, height = stage.scrollHeight;
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`); lines.replaceChildren();
      const positions = new Map([...cards].map(([id,card]) => { const rect = card.getBoundingClientRect(); return [id,{left:rect.left - bounds.left,right:rect.right - bounds.left,y:rect.top - bounds.top + rect.height / 2}]; }));
      edges.forEach(edge => {
        const active = edge.source === selected.id || edge.target === selected.id; if (!allConnections && !active) return;
        const source = positions.get(edge.source), target = positions.get(edge.target); if (!source || !target) return;
        let d;
        if (Math.abs(source.left - target.left) < 1) {
          const bend = source.right + 27;
          d = `M ${source.right} ${source.y} C ${bend} ${source.y}, ${bend} ${target.y}, ${target.right + 1} ${target.y}`;
        } else {
          const forward = source.left < target.left, sx = forward ? source.right : source.left, tx = forward ? target.left - 1 : target.right + 1, offset = forward ? 26 : -26;
          d = `M ${sx} ${source.y} C ${sx + offset} ${source.y}, ${tx - offset} ${target.y}, ${tx} ${target.y}`;
        }
        lines.append(svgNode('path',{d,class:active ? 'is-active' : '',fill:'none','marker-end':'url(#story-plan-map-arrow)'}));
      });
    }
    return {element:section,viewport,stage,layout};
  }
  root.HeartspaceStoryPlanningMap = {create};
})(globalThis);
