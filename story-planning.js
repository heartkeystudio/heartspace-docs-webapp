/* A collection owns its story plan; chapter links identify both document and sequence. */
(function (root) {
  'use strict';
  const phases = { beginning:'Começo', middle:'Meio', ending:'Fim', free:'Marco livre' };
  // Editable starting points, rather than rules enforced on the author's story.
  const models = {
    free:{label:'Livre',description:'Organize seus próprios marcos. Escolher este guia mantém todos os acontecimentos existentes.',steps:[]},
    basic:{label:'Começo, Meio e Fim',description:'Três pontos de partida para desenvolver uma história curta e expandi-la depois.',steps:[
      ['opening','Começo','beginning','Quem acompanhamos e o que coloca a história em movimento?'],
      ['turning-point','Meio','middle','O que muda a situação e torna o objetivo mais difícil?'],
      ['resolution','Fim','ending','Como o conflito termina e o que mudou para os personagens?']
    ]},
    acts:{label:'Três atos',description:'Um guia em três atos, com sugestões para apresentação, confronto e resolução.',steps:[
      ['introduction','Apresentação','beginning','Como é a vida dos personagens antes da mudança?'],
      ['incident','Incidente inicial','beginning','Qual acontecimento rompe o equilíbrio?'],
      ['commitment','Compromisso com a jornada','beginning','Que decisão coloca o personagem no caminho do conflito?'],
      ['obstacles','Obstáculos e tentativas','middle','Que dificuldades revelam os limites do personagem?'],
      ['midpoint','Virada central','middle','Que descoberta ou mudança altera o sentido da jornada?'],
      ['crisis','Crise','middle','O que parece perdido e que escolha se torna inevitável?'],
      ['decision','Decisão final','ending','Como o personagem usa o que aprendeu para agir?'],
      ['climax','Clímax','ending','Qual confronto ou escolha resolve o conflito principal?'],
      ['aftermath','Desfecho','ending','Que consequências ficam e como vemos a transformação?']
    ]},
    hero:{label:'Jornada do herói',description:'Uma adaptação em doze etapas. Você pode renomear, mover ou remover qualquer sugestão.',steps:[
      ['ordinary-world','Mundo comum','beginning','Como é o mundo do personagem e o que falta em sua vida?'],
      ['call','Chamado à aventura','beginning','Que acontecimento convida ou obriga o personagem a mudar?'],
      ['refusal','Recusa do chamado','beginning','Que medo, dever ou dúvida dificulta aceitar a jornada?'],
      ['mentor','Encontro com o mentor','beginning','Quem ou o que oferece orientação, preparo ou uma nova perspectiva?'],
      ['threshold','Travessia do limiar','beginning','Que passo leva o personagem a uma realidade diferente?'],
      ['trials','Testes, aliados e inimigos','middle','Que encontros revelam as regras e os riscos desse novo mundo?'],
      ['approach','Aproximação do grande desafio','middle','Como o personagem se prepara para o desafio central?'],
      ['ordeal','Provação','middle','Que experiência extrema coloca suas crenças ou seu objetivo em risco?'],
      ['reward','Recompensa','middle','O que foi conquistado, descoberto ou compreendido?'],
      ['return-road','Caminho de volta','ending','Que consequências ou novas dificuldades surgem após a conquista?'],
      ['transformation','Transformação final','ending','Como a mudança do personagem se manifesta em uma última escolha?'],
      ['return','Retorno com a conquista','ending','O que a jornada deixa para o personagem, sua comunidade ou seu mundo?']
    ]}
  };
  const worldTypes = {
    character:{label:'Personagem',plural:'Personagens',fields:[
      ['role','Papel na história','Como essa pessoa participa do conflito?'],
      ['desire','Desejo e motivação','O que ela quer e por que isso importa?'],
      ['conflict','Conflito e limites','O que a impede de chegar lá?'],
      ['change','Transformação','Como você imagina que ela muda ao longo da história?']
    ]},
    place:{label:'Lugar',plural:'Lugares',fields:[
      ['atmosphere','Ambiente e sensação','Que clima, bioma ou sentimento esse lugar transmite?'],
      ['features','Características importantes','Que detalhes ajudam a reconhecer e imaginar esse lugar?'],
      ['tensions','Conflitos e possibilidades','Que riscos, encontros ou oportunidades existem aqui?']
    ]},
    rule:{label:'Regra do mundo',plural:'Regras do mundo',fields:[
      ['scope','Como funciona?','O que essa regra permite e a quem ela se aplica?'],
      ['limits','Limites e exceções','O que ela não permite? Existem custos ou exceções?'],
      ['consequences','Consequências','O que acontece quando alguém usa ou quebra essa regra?']
    ]}
  };
  const string = value => typeof value === 'string' ? value : '';
  const linkKey = link => JSON.stringify([string(link.documentId),string(link.sequenceId || link.id)]);
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    const used = new Set(), usedWorld = new Set();
    const worldEntries = (Array.isArray(source.worldEntries) ? source.worldEntries : []).filter(item => item && typeof item === 'object').map((item,index) => {
      let id = string(item.id) || `world-${index + 1}`;
      while (usedWorld.has(id)) id += '-copy';
      usedWorld.add(id);
      const type = Object.hasOwn(worldTypes,item.type) ? item.type : 'rule';
      return {id,type,title:string(item.title),summary:string(item.summary),characterLink:type === 'character' && string(item.characterLink?.id) ? {id:item.characterLink.id,name:string(item.characterLink.name)} : null,ambience:type === 'place' && item.ambience ? HeartspaceDocumentAmbience.style(item.ambience) : null,details:Object.fromEntries(worldTypes[type].fields.map(([key]) => [key,string(item.details?.[key])]))};
    });
    const positions = new Map();
    (Array.isArray(source.mapLayout?.positions) ? source.mapLayout.positions : []).forEach(item => {
      if (!string(item?.milestoneId) || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return;
      positions.set(item.milestoneId,{milestoneId:item.milestoneId,x:Math.max(0,Math.min(100000,item.x)),y:Math.max(0,Math.min(100000,item.y))});
    });
    return {version:5,worldEntries,mapLayout:{mode:source.mapLayout?.mode === 'free' ? 'free' : 'auto',positions:[...positions.values()]}, guide:Object.hasOwn(models,source.guide) ? source.guide : 'free', beginning:string(source.beginning), middle:string(source.middle), ending:string(source.ending),
      milestones:(Array.isArray(source.milestones) ? source.milestones : []).filter(item => item && typeof item === 'object').map((item,index) => {
        let id = string(item.id) || `milestone-${index + 1}`;
        while (used.has(id)) id += '-copy';
        used.add(id);
        const linked = new Set(), dependencies = new Set(), worldLinked = new Set();
        return {id,worldLinks:(Array.isArray(item.worldLinks) ? item.worldLinks : []).filter(link => {
          const key = string(link?.entryId); if (!key || worldLinked.has(key)) return false; worldLinked.add(key); return true;
        }).map(link => ({entryId:link.entryId,title:string(link.title)})),title:string(item.title),summary:string(item.summary),guidance:string(item.guidance),templateKey:string(item.templateKey),preparation:string(item.preparation),consequences:string(item.consequences),
          dependsOn:(Array.isArray(item.dependsOn) ? item.dependsOn : []).filter(link => {
            const key = string(link?.milestoneId); if (!key || key === id || dependencies.has(key)) return false; dependencies.add(key); return true;
          }).map(link => ({milestoneId:link.milestoneId,title:string(link.title)})),phase:Object.hasOwn(phases,item.phase) ? item.phase : 'free',
          links:(Array.isArray(item.links) ? item.links : []).filter(link => {
            const key = linkKey(link || {}); if (!string(link?.sequenceId) || linked.has(key)) return false; linked.add(key); return true;
          }).map(link => ({sequenceId:link.sequenceId,documentId:string(link.documentId),title:string(link.title)}))};
      })};
  }
  function mount(options) {
    const {element,document:doc,getRecord,getSequences,canEdit,onChange,openSequence,getCharacters = () => [],openCharacter,createCharacter,importTexture,loadTexture} = options;
    const win = doc.defaultView;
    let removed = null, templateBatch = null, removedWorld = null, pendingWorld = '';
    const selectedModels = new Map(), uiStates = new Map();
    let mapSurface = null, mapFrame = 0, pendingMilestone = '', pendingConnections = false, pendingMapReveal = '';
    const uiState = id => {
      if (!uiStates.has(id)) uiStates.set(id,{view:'form',selected:'',allConnections:false,scroll:{form:0,map:0},opened:new Set(),mapScroll:{top:0,left:0},connecting:'',layoutUndo:[]});
      return uiStates.get(id);
    };
    const scheduleMap = () => {
      if (mapFrame) win.cancelAnimationFrame(mapFrame);
      mapFrame = win.requestAnimationFrame(() => { mapFrame = 0; mapSurface?.layout(); });
    };
    const mapObserver = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(scheduleMap) : null;
    if (!mapObserver) win.addEventListener('resize',scheduleMap);
    function rememberSurface() {
      element.querySelectorAll('.place-ambience-editor').forEach(item => item.dispose?.());
      const previousId = element.dataset.documentId;
      if (previousId && uiStates.has(previousId)) {
        const previous = uiState(previousId), view = element.dataset.planView || 'form';
        previous.scroll[view] = element.scrollTop;
        if (view === 'form') previous.opened = new Set([...element.querySelectorAll('details[open]')].map(item => item.dataset.id));
        if (mapSurface?.viewport) previous.mapScroll = {top:mapSurface.viewport.scrollTop,left:mapSurface.viewport.scrollLeft};
      }
      if (mapFrame) { win.cancelAnimationFrame(mapFrame); mapFrame = 0; }
      mapObserver?.disconnect(); mapSurface?.dispose?.(); mapSurface = null;
    }
    const node = (tag,className,text) => {
      const result = doc.createElement(tag); if (className) result.className = className;
      if (text !== undefined) result.textContent = text;
      return result;
    };
    const button = (label,action,id) => {
      const result = node('button','',label); result.type = 'button'; result.dataset.planAction = action;
      if (id) result.dataset.id = id;
      result.dataset.focus = `${action}:${id || ''}`;
      return result;
    };
    function field(tag,label,value,key,id,placeholder) {
      const wrap = node('label'); wrap.append(node('span','',label));
      const control = node(tag); control.value = value; control.dataset.planField = key;
      control.dataset.focus = `${key}:${id || ''}`; if (id) control.dataset.id = id;
      if (placeholder) control.placeholder = placeholder;
      if (tag === 'textarea') control.rows = key === 'summary' ? 3 : 4;
      control.disabled = !canEdit(); wrap.append(control); return wrap;
    }
    function toggleSummary(details,label,focus) {
      const summary = node('summary','',label); summary.dataset.focus = focus;
      summary.addEventListener('click',event => { event.preventDefault(); details.open = !details.open; render(); });
      details.append(summary); return summary;
    }
    function renderWorld(plan,opened) {
      const section = node('details','story-plan-world'); section.dataset.id = 'world'; section.open = opened.has('world');
      toggleSummary(section,`Fichas do mundo · ${plan.worldEntries.length}`,'world-summary');
      if (!section.open) return section;
      section.append(node('p','','Guarde as referências desta biblioteca: pessoas, lugares e regras importantes. Todos os campos são opcionais.'));
      const create = node('div','story-plan-actions');
      Object.entries(worldTypes).forEach(([type,config]) => {
        const add = button(`Adicionar ${config.label.toLocaleLowerCase('pt-BR')}`,'add-world',type); add.disabled = !canEdit(); create.append(add);
      }); section.append(create);
      if (!plan.worldEntries.length) section.append(node('p','story-plan-empty','Crie uma ficha para registrar o que você já definiu sobre a história.'));
      Object.entries(worldTypes).forEach(([type,config]) => {
        const entries = plan.worldEntries.filter(entry => entry.type === type); if (!entries.length) return;
        const group = node('section','story-plan-world-group'); group.append(node('h4','',config.plural));
        entries.forEach(entry => {
          const card = node('details','story-plan-world-card'); card.dataset.id = `world:${entry.id}`; card.dataset.worldId = entry.id; card.open = opened.has(card.dataset.id);
          const summary = toggleSummary(card,entry.title || `${config.label} sem título`,`world-card-summary:${entry.id}`); summary.dataset.worldTitle = entry.id;
          if (card.open) {
            const content = node('div','story-plan-world-content');
            content.append(field('input','Nome ou título',entry.title,'world-title',entry.id,'Como você chama esta referência?'),field('textarea','Visão geral',entry.summary,'world-summary',entry.id,'O que é importante lembrar?'));
            if (entry.type === 'character') {
              const link = field('select','Personagem nos diálogos',entry.characterLink?.id || '','character-link',entry.id);
              const select = link.querySelector('select'), characters = getCharacters(); select.append(new win.Option('Sem vínculo',''),...characters.map(character => new win.Option(character.name,character.id)));
              if (entry.characterLink && !characters.some(character => character.id === entry.characterLink.id)) select.append(new win.Option(`${entry.characterLink.name || 'Personagem'} · removido ou indisponível`,entry.characterLink.id));
              select.value = entry.characterLink?.id || ''; content.append(link);
              const actions = node('div','story-plan-actions');
              if (entry.characterLink && characters.some(character => character.id === entry.characterLink.id)) actions.append(button('Abrir personagem','open-character',entry.id));
              else if (entry.title.trim()) { const create = button('Registrar personagem com este nome','create-character',entry.id); create.disabled = !canEdit(); actions.append(create); }
              content.append(actions,node('p','','O vínculo usa o mesmo personagem das falas. As notas da ficha continuam independentes do nome exibido.'));
            }
            if (entry.type === 'place') {
              const collectionId = getRecord()?.id;
              const editor = HeartspaceDocumentAmbience.styleEditor({document:doc,value:entry.ambience,canEdit:canEdit(),importTexture,loadTexture,
                isCurrent:() => getRecord()?.id === collectionId && Boolean(getRecord()?.storyPlanning.worldEntries.some(item => item.id === entry.id)) && canEdit(),
                onChange:value => {
                  const record = getRecord(); if (record?.id !== collectionId || !canEdit()) return;
                  const current = record.storyPlanning.worldEntries.find(item => item.id === entry.id); if (!current) return;
                  const previous = current.ambience; current.ambience = value;
                  try { save(record); } catch (error) { current.ambience = previous; throw error; }
                }});
              editor.dataset.id = `place-ambience:${entry.id}`; editor.open = opened.has(editor.dataset.id); content.append(editor);
            }
            const fields = node('div','story-plan-development-fields');
            config.fields.forEach(([key,label,placeholder]) => fields.append(field('textarea',label,entry.details[key],`world-detail:${key}`,entry.id,placeholder)));
            content.append(fields);
            const references = plan.milestones.filter(milestone => milestone.worldLinks.some(link => link.entryId === entry.id));
            const usage = node('div','story-plan-world-usage'); usage.append(node('strong','','Marcos relacionados'));
            if (references.length) {
              const shortcuts = node('div','story-plan-actions');
              references.forEach(milestone => { const jump = button(milestone.title || 'Marco sem título','jump',entry.id); jump.dataset.targetId = milestone.id; jump.dataset.focus += `:${milestone.id}`; shortcuts.append(jump); }); usage.append(shortcuts);
            } else usage.append(node('p','','Vincule esta ficha em Referências do mundo, dentro de um marco.'));
            content.append(usage);
            const remove = button('Remover ficha','remove-world',entry.id); remove.disabled = !canEdit(); remove.setAttribute('aria-label',`Remover ficha: ${entry.title || config.label}`); content.append(remove); card.append(content);
          }
          group.append(card);
        }); section.append(group);
      });
      return section;
    }
    function renderWorldLinks(milestone,plan,opened) {
      const details = node('details','story-plan-links'); details.dataset.id = `world-links:${milestone.id}`; details.open = opened.has(details.dataset.id);
      toggleSummary(details,`Referências do mundo · ${milestone.worldLinks.length}`,details.dataset.id);
      if (!details.open) return details;
      const existing = new Set(plan.worldEntries.map(entry => entry.id));
      const entries = [...plan.worldEntries,...milestone.worldLinks.filter(link => !existing.has(link.entryId)).map(link => ({id:link.entryId,title:link.title || 'Ficha sem título',missing:true}))];
      const choices = node('div','story-plan-link-choices');
      if (!entries.length) choices.append(node('p','','Adicione personagens, lugares ou regras em Fichas do mundo para vinculá-los aqui.'));
      entries.forEach(entry => {
        const row = node('div','story-plan-dependency-row'), label = node('label'), checkbox = node('input'); checkbox.type = 'checkbox';
        checkbox.checked = milestone.worldLinks.some(link => link.entryId === entry.id); checkbox.disabled = !canEdit();
        checkbox.dataset.planField = 'world-link'; checkbox.dataset.id = milestone.id; checkbox.dataset.entryId = entry.id; checkbox.dataset.focus = `world-link:${milestone.id}:${entry.id}`;
        const caption = node('span','',`${entry.title || 'Ficha sem título'} · ${entry.missing ? 'removida ou indisponível' : worldTypes[entry.type].label}`); caption.dataset.worldLabel = entry.id;
        label.append(checkbox,caption); row.append(label);
        if (!entry.missing) { const open = button('Ver ficha','open-world',milestone.id); open.dataset.entryId = entry.id; open.dataset.focus += `:${entry.id}`; row.append(open); }
        else row.append(node('small','','Revisar vínculo'));
        choices.append(row);
      }); details.append(choices); return details;
    }
    function render() {
      rememberSurface();
      const record = getRecord();
      if (!record) { element.replaceChildren(node('p','','Selecione Planejamento em um livro ou prancheta na Biblioteca. Documentos soltos podem ser arrastados para uma biblioteca.')); return; }
      const sameDocument = element.dataset.documentId === record.id;
      const active = sameDocument && element.contains(doc.activeElement) ? doc.activeElement : null;
      const focusKey = active?.dataset.focus, selection = typeof active?.selectionStart === 'number' ? [active.selectionStart,active.selectionEnd] : null;
      const state = uiState(record.id), scroll = state.scroll[state.view];
      const opened = new Set(state.opened);
      if (!sameDocument) { removed = null; templateBatch = null; removedWorld = null; pendingWorld = pendingWorld && record.storyPlanning.worldEntries.some(item => item.id === pendingWorld) ? pendingWorld : ''; pendingMilestone = ''; pendingConnections = false; pendingMapReveal = ''; }
      if (pendingWorld) { opened.add('world'); opened.add(`world:${pendingWorld}`); }
      if (pendingConnections && pendingMilestone) opened.add(`development:${pendingMilestone}`);
      element.dataset.documentId = record.id; element.dataset.planView = state.view;
      const plan = record.storyPlanning || (record.storyPlanning = normalize());
      const milestonesById = new Map(plan.milestones.map(milestone => [milestone.id,milestone]));
      const sequences = getSequences(); const byId = new Map(sequences.map(sequence => [linkKey(sequence),sequence]));
      const fragment = doc.createDocumentFragment();
      const heading = node('header','story-plan-heading');
      const copy = node('div','story-plan-context');
      copy.append(node('h3','',`${record.layout === 'canvas' ? 'Prancheta' : 'Livro'} · ${record.name || record.title || 'Sem título'}`));
      const help = node('button','story-plan-help-toggle','?'); help.type = 'button'; help.dataset.focus = 'planning-help';
      help.setAttribute('aria-label','Sobre o planejamento'); help.setAttribute('aria-expanded',String(Boolean(state.helpOpen))); help.setAttribute('aria-controls','story-plan-help');
      const explanation = node('section','story-plan-help'); explanation.id = 'story-plan-help'; explanation.hidden = !state.helpOpen; explanation.setAttribute('aria-label','Sobre o planejamento');
      explanation.append(node('p','','O planejamento pertence a este livro ou prancheta e é compartilhado entre todos os seus capítulos e seções. Use-o para guardar o começo, o meio e o fim, desenvolver marcos e reunir personagens, lugares e regras do mundo.'));
      explanation.append(node('p','','Tudo é opcional. Os guias oferecem sugestões editáveis, e Formulário e Mapa mostram o mesmo plano. Vincular sequências ajuda a localizar os acontecimentos sem mudar a ordem dos capítulos ou o texto.'));
      help.addEventListener('click',() => { state.helpOpen = !state.helpOpen; explanation.hidden = !state.helpOpen; help.setAttribute('aria-expanded',String(state.helpOpen)); });
      const closeHelp = event => { if (event.key === 'Escape' && state.helpOpen) { event.preventDefault(); state.helpOpen = false; explanation.hidden = true; help.setAttribute('aria-expanded','false'); help.focus({preventScroll:true}); } };
      help.addEventListener('keydown',closeHelp); explanation.addEventListener('keydown',closeHelp); copy.append(help);
      const views = node('div','story-plan-view-switch'); views.setAttribute('role','group'); views.setAttribute('aria-label','Visualização do planejamento');
      [['form','Formulário'],['map','Mapa']].forEach(([value,label]) => {
        const view = button(label,'plan-view',value); view.setAttribute('aria-pressed',String(state.view === value)); views.append(view);
      }); heading.append(copy,views); fragment.append(heading,explanation);
      if (state.view === 'map') {
        if (!plan.milestones.some(item => item.id === state.selected)) state.selected = plan.milestones[0]?.id || '';
        mapSurface = HeartspaceStoryPlanningMap.create({document:doc,plan,sequences,selectedId:state.selected,allConnections:state.allConnections,canEdit:canEdit(),connectingId:state.connecting,canUndo:Boolean(state.layoutUndo.length),
          onMove:(id,position) => {
            const current = getRecord(); if (current?.id !== record.id || !canEdit() || !current.storyPlanning.milestones.some(item => item.id === id)) return;
            state.layoutUndo.push(JSON.parse(JSON.stringify(current.storyPlanning.mapLayout))); if (state.layoutUndo.length > 30) state.layoutUndo.shift();
            current.storyPlanning.mapLayout.positions = current.storyPlanning.mapLayout.positions.filter(item => item.milestoneId !== id);
            current.storyPlanning.mapLayout.positions.push({milestoneId:id,...position}); save(current); render();
          },onConnect:(source,target) => { const current = getRecord(); if (current?.id === record.id) { connectMap(current,source,target); state.connecting = ''; state.selected = target; pendingMapReveal = target; render(); } }
        });
        fragment.append(mapSurface.element);
      } else {
        const guidePicker = node('details','story-plan-model'); guidePicker.dataset.id = 'narrative-guide'; guidePicker.open = opened.has('narrative-guide');
        guidePicker.append(node('summary','','Guia narrativo'));
        const selectedModel = selectedModels.get(record.id) || plan.guide || 'free';
        const choice = field('select','Modelo de planejamento',selectedModel,'model-choice');
        const selector = choice.querySelector('select'); Object.entries(models).forEach(([key,model]) => selector.append(new win.Option(model.label,key))); selector.value = selectedModel;
        guidePicker.append(choice,node('p','',models[selectedModel].description));
        const remaining = models[selectedModel].steps.filter(step => !plan.milestones.some(milestone => milestone.templateKey === `${selectedModel}:${step[0]}`));
        if (models[selectedModel].steps.length) {
          const preview = node('ol','story-plan-model-preview');
          models[selectedModel].steps.forEach(step => {
            const item = node('li'); item.append(node('strong','',step[1]),node('span','',`${phases[step[2]]} · ${step[3]}`)); preview.append(item);
          }); guidePicker.append(preview,node('p','',remaining.length ? `${remaining.length} ${remaining.length === 1 ? 'marco será acrescentado' : 'marcos serão acrescentados'} ao fim do plano. Seus textos e vínculos serão preservados.` : 'Todas as sugestões deste guia já estão no plano.'));
        }
        const apply = button(remaining.length ? `Adicionar ${remaining.length} ${remaining.length === 1 ? 'marco sugerido' : 'marcos sugeridos'}` : selectedModel === 'free' ? 'Usar guia livre' : 'Usar este guia','apply-model');
        apply.dataset.model = selectedModel; apply.disabled = !canEdit() || (!remaining.length && plan.guide === selectedModel); guidePicker.append(apply); fragment.append(guidePicker);
        if (templateBatch?.collectionId === record.id) {
          const notice = node('div','story-plan-notice'); notice.setAttribute('role','status'); notice.append(node('span','','Sugestões adicionadas. Ao desfazer, marcos que você já editou serão mantidos.'));
          const undo = button('Desfazer inclusão','undo-model'); undo.disabled = !canEdit(); notice.append(undo); fragment.append(notice);
        }
        const overview = node('section','story-plan-overview'); overview.setAttribute('aria-label','Começo, meio e fim');
        const prompts = {beginning:'Como a história começa? O que coloca tudo em movimento?',middle:'Qual acontecimento transforma a situação?',ending:'Onde você quer chegar? Como a história termina?'};
        Object.keys(prompts).forEach(key => overview.append(field('textarea',phases[key],plan[key],key,'',prompts[key])));
        fragment.append(overview);
        if (removedWorld?.collectionId === record.id) {
          const notice = node('div','story-plan-notice'); notice.setAttribute('role','status'); notice.append(node('span','','Ficha removida. As referências nos marcos foram preservadas para revisão.'));
          const undo = button('Desfazer remoção da ficha','undo-world'); undo.disabled = !canEdit(); notice.append(undo); fragment.append(notice);
        }
        fragment.append(renderWorld(plan,opened));
        if (record.legacyPlans?.length) {
          const archive = node('details','story-plan-legacy'); archive.dataset.id = 'legacy-plans'; archive.open = opened.has('legacy-plans');
          archive.append(node('summary','',`Planejamentos preservados dos capítulos · ${record.legacyPlans.length}`));
          archive.append(node('p','','Os textos originais foram preservados separadamente. Você pode consultar estas notas e copiar seus marcos e fichas para o planejamento geral.'));
          record.legacyPlans.forEach(source => {
            const item = node('section'); item.append(node('h4','',source.title));
            ['beginning','middle','ending'].forEach(key => { if (source.plan[key]) item.append(node('strong','',phases[key]),node('p','',source.plan[key])); });
            source.plan.milestones.forEach(milestone => {
              item.append(node('p','',`${milestone.title || 'Marco sem título'}${milestone.summary ? ` — ${milestone.summary}` : ''}`));
              if (milestone.preparation) item.append(node('p','',`Preparação: ${milestone.preparation}`));
              if (milestone.consequences) item.append(node('p','',`Consequências: ${milestone.consequences}`));
            });
            (source.plan.worldEntries || []).forEach(entry => {
              item.append(node('p','',`${worldTypes[entry.type].label}: ${entry.title || 'Ficha sem título'}${entry.summary ? ` — ${entry.summary}` : ''}`));
              worldTypes[entry.type].fields.forEach(([key,label]) => { if (entry.details[key]) item.append(node('p','',`${label}: ${entry.details[key]}`)); });
            });
            if (source.plan.milestones.length || source.plan.worldEntries?.length) { const copy = button('Copiar marcos e fichas para o plano','copy-legacy',source.documentId); copy.disabled = !canEdit(); item.append(copy); }
            archive.append(item);
          }); fragment.append(archive);
        }
        const toolbar = node('div','story-plan-heading'); toolbar.append(node('h3','',`Marcos da história · ${plan.milestones.length}`));
        const add = button('Adicionar marco','add'); add.disabled = !canEdit(); toolbar.append(add); fragment.append(toolbar);
        if (removed?.documentId === record.id) {
          const undo = node('div','story-plan-notice'); undo.setAttribute('role','status');
          undo.append(node('span','','Marco removido. As sequências e as referências foram preservadas.'));
          const restore = button('Desfazer remoção','undo'); restore.disabled = !canEdit(); undo.append(restore); fragment.append(undo);
        }
        if (!plan.milestones.length) fragment.append(node('p','story-plan-empty','Adicione uma descoberta, uma virada ou qualquer acontecimento importante. Você pode vincular sequências quando elas existirem.'));
        const list = node('ol','story-plan-milestones');
        plan.milestones.forEach((milestone,index) => {
          const card = node('li','story-plan-milestone'); card.dataset.milestoneId = milestone.id; card.tabIndex = -1;
          const top = node('div','story-plan-heading'); top.append(node('span','story-plan-number',String(index + 1).padStart(2,'0')));
          const phase = field('select','Etapa',milestone.phase,'phase',milestone.id);
          const select = phase.querySelector('select'); Object.entries(phases).forEach(([value,label]) => select.append(new win.Option(label,value))); select.value = milestone.phase; top.append(phase);
          const actions = node('div','story-plan-actions');
          [['↑','up','Mover marco para cima',index === 0],['↓','down','Mover marco para baixo',index === plan.milestones.length - 1],['Remover','remove','Remover marco',false]].forEach(([label,action,title,boundary]) => {
            const control = button(label,action,milestone.id); control.setAttribute('aria-label',`${title}: ${milestone.title || `marco ${index + 1}`}`); control.disabled = !canEdit() || boundary; actions.append(control);
          }); top.append(actions); card.append(top);
          card.append(field('input','Marco',milestone.title,'title',milestone.id,'Ex.: A descoberta na floresta'));
          card.append(field('textarea','O que acontece?',milestone.summary,'summary',milestone.id,'Anote o que você já imaginou para esse momento.'));
          if (milestone.guidance) card.append(node('p','story-plan-guidance',milestone.guidance));
          const development = node('details','story-plan-development');
          development.dataset.id = `development:${milestone.id}`; development.open = opened.has(development.dataset.id);
          const developmentSummary = node('summary','',`Preparação e consequências${milestone.dependsOn.length ? ` · ${milestone.dependsOn.length} ${milestone.dependsOn.length === 1 ? 'vínculo' : 'vínculos'}` : ''}`);
          developmentSummary.dataset.focus = `development:${milestone.id}`;
          developmentSummary.addEventListener('click',event => { event.preventDefault(); development.open = !development.open; render(); });
          development.append(developmentSummary);
          if (development.open) {
            const developmentFields = node('div','story-plan-development-fields');
            developmentFields.append(
              field('textarea','O que precisa aparecer antes?',milestone.preparation,'preparation',milestone.id,'Ex.: Apresentar o símbolo do mentor antes da descoberta.'),
              field('textarea','O que deve repercutir depois?',milestone.consequences,'consequences',milestone.id,'Ex.: Alex deixa de confiar no mentor e busca outra ajuda.'),
              field('textarea','Pergunta-guia (opcional)',milestone.guidance,'guidance',milestone.id,'Uma pergunta que ajude a desenvolver este marco.')
            ); development.append(developmentFields);
            const relationGroup = node('fieldset','story-plan-dependencies');
            relationGroup.append(node('legend','','Este marco depende de…'),node('p','','Vincule acontecimentos que preparam este momento. A ordem dos marcos continua livre.'));
            const dependencyChoices = [...plan.milestones.filter(item => item.id !== milestone.id),...milestone.dependsOn.filter(link => !milestonesById.has(link.milestoneId)).map(link => ({id:link.milestoneId,title:link.title || 'Marco sem título',missing:true}))];
            if (!dependencyChoices.length) relationGroup.append(node('p','','Adicione outro marco para conectar a preparação da história.'));
            dependencyChoices.forEach(other => {
              const row = node('div','story-plan-dependency-row');
              const label = node('label'); const checkbox = node('input'); checkbox.type = 'checkbox';
              checkbox.checked = milestone.dependsOn.some(link => link.milestoneId === other.id); checkbox.disabled = !canEdit();
              checkbox.dataset.planField = 'dependency'; checkbox.dataset.id = milestone.id; checkbox.dataset.milestoneId = other.id; checkbox.dataset.focus = `dependency:${milestone.id}:${other.id}`;
              label.append(checkbox,node('span','',`${other.title || 'Marco sem título'}${other.missing ? ' · removido ou indisponível' : ''}`)); row.append(label);
              if (!other.missing) {
                const jump = button('Ir ao marco','jump',milestone.id); jump.dataset.targetId = other.id; jump.dataset.focus += `:${other.id}`; row.append(jump);
              } else row.append(node('small','','Revisar vínculo'));
              relationGroup.append(row);
            }); development.append(relationGroup);
            const incoming = plan.milestones.filter(other => other.dependsOn.some(link => link.milestoneId === milestone.id));
            if (incoming.length) {
              const followups = node('div','story-plan-followups'); followups.append(node('strong','','Este marco prepara…'));
              const actions = node('div','story-plan-actions');
              incoming.forEach(other => { const jump = button(other.title || 'Marco sem título','jump',milestone.id); jump.dataset.targetId = other.id; jump.dataset.focus += `:${other.id}`; actions.append(jump); });
              followups.append(actions); development.append(followups);
            }
          }
          card.append(development,renderWorldLinks(milestone,plan,opened));
          const links = node('details','story-plan-links'); links.dataset.id = milestone.id; links.open = opened.has(milestone.id);
          links.append(node('summary','',`Sequências vinculadas · ${milestone.links.length}`));
          const choices = node('div','story-plan-link-choices');
          if (!sequences.length) choices.append(node('p','','Esta biblioteca ainda não tem sequências. Você pode continuar planejando e vinculá-las depois.'));
          [...sequences,...milestone.links.filter(link => !byId.has(linkKey(link))).map(link => ({id:link.sequenceId,documentId:link.documentId,title:link.title || 'Sequência indisponível',missing:true}))].forEach(sequence => {
            const label = node('label'); const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = milestone.links.some(link => linkKey(link) === linkKey(sequence));
            checkbox.disabled = !canEdit(); checkbox.dataset.planField = 'link'; checkbox.dataset.id = milestone.id; checkbox.dataset.sequenceId = sequence.id; checkbox.dataset.documentId = sequence.documentId; checkbox.dataset.focus = `link:${milestone.id}:${linkKey(sequence)}`;
            label.append(checkbox,node('span','',`${sequence.title}${sequence.missing ? ' · removida ou indisponível' : ''}`)); choices.append(label);
          }); links.append(choices); card.append(links);
          const shortcuts = node('div','story-plan-actions');
          milestone.links.filter(link => byId.has(linkKey(link))).forEach(link => {
            const control = button(`Abrir ${byId.get(linkKey(link)).title}`,'open',milestone.id); control.dataset.sequenceId = link.sequenceId; control.dataset.documentId = link.documentId; control.dataset.focus += `:${linkKey(link)}`; shortcuts.append(control);
          }); card.append(shortcuts); list.append(card);
        }); fragment.append(list);
      }
      element.replaceChildren(fragment);
      if (focusKey) {
        const target = [...element.querySelectorAll('[data-focus]')].find(control => control.dataset.focus === focusKey);
        target?.focus({preventScroll:true}); if (target && selection && typeof target.setSelectionRange === 'function') target.setSelectionRange(...selection);
      }
      element.scrollTop = scroll;
      if (mapSurface?.viewport) {
        mapSurface.viewport.scrollTop = state.mapScroll.top; mapSurface.viewport.scrollLeft = state.mapScroll.left;
        mapObserver?.observe(mapSurface.stage); mapObserver?.observe(mapSurface.viewport); scheduleMap();
        if (pendingMapReveal) {
          const target = [...mapSurface.element.querySelectorAll('[data-plan-action="select-map"]')].find(item => item.dataset.id === pendingMapReveal);
          if (target) {
            target.focus({preventScroll:true});
            const rect = target.getBoundingClientRect(), viewport = mapSurface.viewport, bounds = viewport.getBoundingClientRect();
            if (rect.left < bounds.left + 8) viewport.scrollLeft += rect.left - bounds.left - 8;
            else if (rect.right > bounds.right - 8) viewport.scrollLeft += rect.right - bounds.right + 8;
            if (rect.top < bounds.top + 8) viewport.scrollTop += rect.top - bounds.top - 8;
            else if (rect.bottom > bounds.bottom - 8) viewport.scrollTop += rect.bottom - bounds.bottom + 8;
          }
          pendingMapReveal = '';
        }
      }
      if (pendingMilestone && state.view === 'form') {
        const card = [...element.querySelectorAll('.story-plan-milestone')].find(item => item.dataset.milestoneId === pendingMilestone);
        const target = pendingConnections ? card?.querySelector('.story-plan-development summary') : canEdit() ? card?.querySelector('[data-plan-field="title"]') : card;
        target?.focus({preventScroll:true});
        if (target) element.scrollTop += target.getBoundingClientRect().top - element.getBoundingClientRect().top - 16;
        pendingMilestone = ''; pendingConnections = false;
      }
      if (pendingWorld) {
        const card = [...element.querySelectorAll('[data-world-id]')].find(item => item.dataset.worldId === pendingWorld);
        const target = canEdit() ? card?.querySelector('[data-plan-field="world-title"]') : card?.querySelector('summary');
        target?.focus({preventScroll:true});
        if (card) element.scrollTop += card.getBoundingClientRect().top - element.getBoundingClientRect().top - 16;
        pendingWorld = '';
      }
    }
    function current() {
      const record = getRecord(); return record && record.id === element.dataset.documentId ? record : null;
    }
    function save(record) { onChange(record); }
    function connectMap(record,sourceId,targetId) {
      if (!canEdit() || record.id !== getRecord()?.id || sourceId === targetId) return;
      const source = record.storyPlanning.milestones.find(item => item.id === sourceId), target = record.storyPlanning.milestones.find(item => item.id === targetId);
      if (!source || !target || target.dependsOn.some(link => link.milestoneId === sourceId)) return;
      target.dependsOn.push({milestoneId:sourceId,title:source.title}); save(record);
    }

    element.addEventListener('input',event => {
      const control = event.target, key = control.dataset.planField;
      if ((key === 'world-title' || key === 'world-summary' || key?.startsWith('world-detail:')) && canEdit()) {
        const record = current(); if (!record) return;
        const entry = record.storyPlanning.worldEntries.find(item => item.id === control.dataset.id); if (!entry) return;
        if (key.startsWith('world-detail:')) {
          const detailKey = key.slice('world-detail:'.length); if (!worldTypes[entry.type].fields.some(([key]) => key === detailKey)) return;
          entry.details[detailKey] = control.value;
        } else entry[key === 'world-title' ? 'title' : 'summary'] = control.value;
        if (key === 'world-title') {
          record.storyPlanning.milestones.forEach(milestone => milestone.worldLinks.forEach(link => { if (link.entryId === entry.id) link.title = entry.title; }));
          const summary = [...element.querySelectorAll('[data-world-title]')].find(item => item.dataset.worldTitle === entry.id); if (summary) summary.textContent = entry.title || `${worldTypes[entry.type].label} sem título`;
          element.querySelectorAll('[data-world-label]').forEach(label => { if (label.dataset.worldLabel === entry.id) label.textContent = `${entry.title || 'Ficha sem título'} · ${worldTypes[entry.type].label}`; });
        }
        save(record); return;
      }
      if (!['beginning','middle','ending','title','summary','preparation','consequences','guidance'].includes(key) || !canEdit()) return;
      const record = current(); if (!record) return;
      const target = control.dataset.id ? record.storyPlanning.milestones.find(item => item.id === control.dataset.id) : record.storyPlanning;
      if (!target) return; target[key] = control.value;
      if (key === 'title' && control.dataset.id) record.storyPlanning.milestones.forEach(milestone => milestone.dependsOn.forEach(link => { if (link.milestoneId === target.id) link.title = target.title; }));
      save(record);
    });
    element.addEventListener('change',event => {
      const control = event.target;
      if (control.dataset.planField === 'character-link') {
        const record = current(); if (!record || !canEdit()) return;
        const entry = record.storyPlanning.worldEntries.find(item => item.id === control.dataset.id && item.type === 'character'); if (!entry) return;
        const character = getCharacters().find(item => item.id === control.value);
        entry.characterLink = character ? {id:character.id,name:character.name} : null; save(record); render(); return;
      }
      if (control.dataset.planField === 'model-choice') {
        const record = current(); if (!record || !canEdit() || !Object.hasOwn(models,control.value)) return;
        selectedModels.set(record.id,control.value); render(); return;
      }
      if (!['phase','link','dependency','world-link'].includes(control.dataset.planField) || !canEdit()) return;
      const record = current(); if (!record) return;
      const milestone = record.storyPlanning.milestones.find(item => item.id === control.dataset.id); if (!milestone) return;
      if (control.dataset.planField === 'phase') milestone.phase = control.value;
      else if (control.dataset.planField === 'world-link') {
        const entryId = control.dataset.entryId;
        milestone.worldLinks = milestone.worldLinks.filter(link => link.entryId !== entryId);
        const entry = record.storyPlanning.worldEntries.find(item => item.id === entryId);
        if (control.checked && entry) milestone.worldLinks.push({entryId,title:entry.title});
      }
      else if (control.dataset.planField === 'dependency') {
        const targetId = control.dataset.milestoneId;
        milestone.dependsOn = milestone.dependsOn.filter(link => link.milestoneId !== targetId);
        const other = record.storyPlanning.milestones.find(item => item.id === targetId);
        if (control.checked && other && other !== milestone) milestone.dependsOn.push({milestoneId:targetId,title:other.title});
      } else {
        const id = control.dataset.sequenceId, documentId = control.dataset.documentId;
        const key = linkKey({sequenceId:id,documentId});
        milestone.links = milestone.links.filter(link => linkKey(link) !== key);
        if (control.checked) milestone.links.push({sequenceId:id,documentId,title:getSequences().find(sequence => linkKey(sequence) === key)?.title || 'Sequência indisponível'});
      }
      save(record); render();
    });
    element.addEventListener('click',event => {
      const control = event.target.closest('[data-plan-action]'); if (!control) return;
      const record = current(); if (!record) return;
      const action = control.dataset.planAction;
      const state = uiState(record.id);
      if (action === 'open-character') {
        const entry = record.storyPlanning.worldEntries.find(item => item.id === control.dataset.id); if (entry?.characterLink) openCharacter?.(entry.characterLink.id); return;
      }
      if (action === 'create-character' && canEdit()) {
        const entry = record.storyPlanning.worldEntries.find(item => item.id === control.dataset.id && item.type === 'character'); if (!entry?.title.trim()) return;
        const character = createCharacter?.(entry.title.trim()); if (character) { entry.characterLink = {id:character.id,name:character.name}; save(record); render(); } return;
      }
      if (action === 'map-connect-start') { if (canEdit()) { state.connecting = control.dataset.id; state.selected = control.dataset.id; render(); } return; }
      if (action === 'map-connect-cancel') { state.connecting = ''; render(); return; }
      if (action === 'map-layout' && canEdit()) {
        state.layoutUndo.push(JSON.parse(JSON.stringify(record.storyPlanning.mapLayout))); record.storyPlanning.mapLayout.mode = record.storyPlanning.mapLayout.mode === 'free' ? 'auto' : 'free'; save(record); render(); return;
      }
      if (action === 'map-reset' && canEdit()) {
        state.layoutUndo.push(JSON.parse(JSON.stringify(record.storyPlanning.mapLayout))); record.storyPlanning.mapLayout.positions = []; save(record); render(); return;
      }
      if (action === 'map-undo' && canEdit()) {
        const layout = state.layoutUndo.pop(); if (layout) { record.storyPlanning.mapLayout = layout; save(record); render(); } return;
      }
      if (action === 'map-remove-link' && canEdit()) {
        const milestone = record.storyPlanning.milestones.find(item => item.id === control.dataset.targetId); if (!milestone) return;
        milestone.dependsOn = milestone.dependsOn.filter(link => link.milestoneId !== control.dataset.id); save(record); render(); return;
      }
      if (action === 'plan-view') {
        if (!['form','map'].includes(control.dataset.id)) return;
        state.view = control.dataset.id; render();
        [...element.querySelectorAll('[data-plan-action="plan-view"]')].find(item => item.dataset.id === state.view)?.focus({preventScroll:true}); return;
      }
      if (action === 'select-map' && state.connecting) { connectMap(record,state.connecting,control.dataset.id); state.connecting = ''; state.selected = control.dataset.id; pendingMapReveal = control.dataset.id; render(); return; }
      if (action === 'select-map') {
        if (!record.storyPlanning.milestones.some(item => item.id === control.dataset.id)) return;
        state.selected = control.dataset.id; pendingMapReveal = control.dataset.id; render(); return;
      }
      if (action === 'map-connections') { state.allConnections = !state.allConnections; render(); return; }
      if (action === 'edit-map' || action === 'edit-map-connections') {
        if (!record.storyPlanning.milestones.some(item => item.id === control.dataset.id)) return;
        state.view = 'form'; pendingMilestone = control.dataset.id; pendingConnections = action === 'edit-map-connections'; render(); return;
      }
      if (action === 'open') { if (getSequences().some(sequence => sequence.id === control.dataset.sequenceId && sequence.documentId === control.dataset.documentId)) openSequence(control.dataset.sequenceId,control.dataset.documentId); return; }
      if (action === 'open-world') {
        if (record.storyPlanning.worldEntries.some(entry => entry.id === control.dataset.entryId)) { state.view = 'form'; pendingWorld = control.dataset.entryId; render(); }
        return;
      }
      if (action === 'jump') {
        const card = [...element.querySelectorAll('[data-milestone-id]')].find(item => item.classList.contains('story-plan-milestone') && item.dataset.milestoneId === control.dataset.targetId);
        if (card) { card.focus({preventScroll:true}); element.scrollTop += card.getBoundingClientRect().top - element.getBoundingClientRect().top - 16; }
        return;
      }
      if (!canEdit()) return;
      const list = record.storyPlanning.milestones, index = list.findIndex(item => item.id === control.dataset.id);
      if (action === 'add-world') {
        const type = control.dataset.id; if (!Object.hasOwn(worldTypes,type)) return;
        const entry = normalize({worldEntries:[{id:`world-${win.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,type}]}).worldEntries[0];
        record.storyPlanning.worldEntries.push(entry); pendingWorld = entry.id;
      }
      else if (action === 'remove-world') {
        const entries = record.storyPlanning.worldEntries, position = entries.findIndex(entry => entry.id === control.dataset.id); if (position < 0) return;
        removedWorld = {collectionId:record.id,index:position,item:entries.splice(position,1)[0]};
      }
      else if (action === 'undo-world' && removedWorld?.collectionId === record.id) {
        if (!record.storyPlanning.worldEntries.some(entry => entry.id === removedWorld.item.id)) record.storyPlanning.worldEntries.splice(Math.min(removedWorld.index,record.storyPlanning.worldEntries.length),0,removedWorld.item);
        pendingWorld = removedWorld.item.id; removedWorld = null;
      }
      else if (action === 'apply-model') {
        const modelId = control.dataset.model; if (!Object.hasOwn(models,modelId)) return;
        const previousGuide = record.storyPlanning.guide;
        const added = [];
        models[modelId].steps.forEach(([stepId,title,phase,guidance]) => {
          const templateKey = `${modelId}:${stepId}`;
          if (list.some(item => item.templateKey === templateKey)) return;
          const milestone = normalize({milestones:[{id:`milestone-${win.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,title,phase,guidance,templateKey}]}).milestones[0];
          list.push(milestone); added.push({id:milestone.id,snapshot:JSON.stringify(milestone)});
        });
        record.storyPlanning.guide = modelId;
        if (added.length) templateBatch = {collectionId:record.id,previousGuide,guide:modelId,added};
      }
      else if (action === 'undo-model' && templateBatch?.collectionId === record.id) {
        const unchanged = new Set(templateBatch.added.filter(entry => { const item = list.find(milestone => milestone.id === entry.id); return item && JSON.stringify(item) === entry.snapshot; }).map(entry => entry.id));
        record.storyPlanning.milestones = list.filter(item => !unchanged.has(item.id));
        if (record.storyPlanning.guide === templateBatch.guide) record.storyPlanning.guide = templateBatch.previousGuide;
        selectedModels.delete(record.id); templateBatch = null;
      }
      else if (action === 'copy-legacy') {
        const source = record.legacyPlans?.find(item => item.documentId === control.dataset.id); if (!source) return;
        const sourcePlan = normalize(source.plan), copied = sourcePlan.milestones;
        const worldMapping = new Map(sourcePlan.worldEntries.map(entry => [entry.id,`imported:${source.documentId}:${entry.id}`]));
        sourcePlan.worldEntries.forEach(entry => {
          const id = worldMapping.get(entry.id); if (!record.storyPlanning.worldEntries.some(item => item.id === id)) record.storyPlanning.worldEntries.push({...entry,id});
        });
        const mapping = new Map(copied.map(item => [item.id,`imported:${source.documentId}:${item.id}`]));
        copied.forEach(item => {
          const id = mapping.get(item.id); if (list.some(milestone => milestone.id === id)) return;
          list.push({...item,id,worldLinks:item.worldLinks.map(link => ({...link,entryId:worldMapping.get(link.entryId) || `imported:${source.documentId}:${link.entryId}`})),dependsOn:item.dependsOn.map(link => ({...link,milestoneId:mapping.get(link.milestoneId) || `imported:${source.documentId}:${link.milestoneId}`}))});
        });
      }
      else if (action === 'add') list.push({id:`milestone-${(win.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)}`,worldLinks:[],title:'',summary:'',guidance:'',templateKey:'',preparation:'',consequences:'',dependsOn:[],phase:'free',links:[]});
      else if (action === 'remove' && index >= 0) removed = {documentId:record.id,index,item:list.splice(index,1)[0]};
      else if (action === 'undo' && removed?.documentId === record.id) { list.splice(Math.min(removed.index,list.length),0,removed.item); removed = null; }
      else if (['up','down'].includes(action) && index >= 0) {
        const next = index + (action === 'up' ? -1 : 1); if (next < 0 || next >= list.length) return;
        [list[index],list[next]] = [list[next],list[index]];
      } else return;
      save(record); render();
      if (action === 'remove-world') element.querySelector('[data-plan-action="undo-world"]')?.focus({preventScroll:true});
      if (action === 'add') {
        const target = [...element.querySelectorAll('[data-plan-field="title"]')].at(-1); target?.focus({preventScroll:true}); target?.scrollIntoView({block:'nearest'});
      }
    });
    return {render,openWorld:id => { const record = getRecord(); if (!record?.storyPlanning.worldEntries.some(item => item.id === id)) return; uiState(record.id).view = 'form'; pendingWorld = id; render(); }};
  }
  root.HeartspaceStoryPlanning = {normalize,mount};
})(globalThis);
