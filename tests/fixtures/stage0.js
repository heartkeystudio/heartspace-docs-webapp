/* Synthetic compatibility corpus. No production documents or external art. */
(function(root) {
  const copy = value => JSON.parse(JSON.stringify(value));
  const legacy = {
    format:'heartspace.docs.authoring',schema_version:1,project:{id:'stage0-project',name:'Teste descartável da etapa 0'},
    books:[{id:'stage0-book',name:'Livro de teste',kind:'book',planning:{premise:'Preservar'},preservedChapterPlans:[],migratedChapterIds:[],updatedAt:''}],
    documents:[{id:'stage0-doc',bookId:'stage0-book',kind:'chapter',title:'Capítulo de teste',subtitle:'',
      content:{format:'heartspace-html-v1',body:'<p>Uma cena de teste.</p>'},legacyPlanning:{},
      narrative:{entrySequenceId:'room',readingProfile:'script',localization:{sourceLocale:'pt-BR',translations:{}},sequences:[{id:'room',title:'Sala',presentation:{}}]},
      page:{layout:'book',size:'a4',orientation:'portrait',margin:'normal'},typography:{titleAlign:'left',subtitleAlign:'left'},appearance:{},
      editorial:{status:'draft',tags:[],notebook:false,archivedAt:'',trashedAt:'',trashedBy:''},order:0,updatedAt:''}],
    resources:{characters:[],variables:[],glossary:[],sceneSettings:{}}
  };
  const nodes = [
    {id:'intro',type:'narration',text:'Uma sala de teste.'},
    {id:'detail',type:'narration',text:'A porta se move.'},
    {id:'choose',type:'choice',prompt:'Abrir a porta?',options:[{id:'open',text:'Abrir',target_event:'ending',effects:[{variable:'opened',operation:'set',value:true}]},{id:'locked',text:'Trancada',target_event:'ending',condition:{variable:'opened',operator:'eq',value:true}}]},
    {id:'reset',type:'narration',text:'Composição restaurada.'}
  ];
  function current(image,ref) {
    const source = copy(legacy), asset = {...copy(image),...(ref ? {project_ref:copy(ref)} : {})};
    const presentation = {speed:0,background:asset,parallax_enabled:true,parallax_strength:1,
      elements:[
        {id:'door',name:'Porta',type:'image',asset,x:20,y:50,width:25,height:60,anchor_x:50,anchor_y:50,scale:1,rotation:10,parallax_x:1},
        {id:'label',type:'text',text:'Porta de teste',x:50,y:20},
        {id:'actor',type:'character',character_id:'guide',x:70,y:80},
        {id:'button',type:'button',choice_block_id:'choose',choice_option_id:'open',text:'Abrir',x:70,y:20},
        {id:'region',type:'hotspot',choice_block_id:'choose',choice_option_id:'open',x:20,y:50,parallax_x:1}
      ],
      cues:[
        {block_id:'detail',set:[{id:'door',x:40}],settings:{accent:'#aabbcc'},animations:[{element_id:'door',enabled:true,duration_ms:600,delay_ms:100,easing:'linear',keyframes:[{at:50,x:30}]}]},
        {block_id:'choose',set:[{id:'label',text:'Escolha'}],order:['door','actor','label','region','button']},
        {block_id:'reset',reset:true},
        {block_id:'removed-block',set:[{id:'door',x:99}]}
      ]};
    source.resources.sceneSettings = {viewport:{aspect:'16:9',width:1280,height:720}};
    source.resources.characters = [{id:'guide',name:'Guia',portrait:copy(asset)}];
    source.resources.variables = [{id:'opened',type:'boolean',default:false}];
    source.documents[0].narrative.sequences = [{id:'room',title:'Sala',presentation},{id:'ending',title:'Final',presentation:{speed:0}}];
    const blockHtml = (node,sequence) => {
      const content = node.type === 'choice'
        ? `<div class="narrative-choice-prompt" contenteditable="true">${node.prompt}</div><div class="narrative-choice-options">${node.options.map(option=>`<div class="narrative-choice-option" data-choice-option-id="${option.id}" data-localization-id="loc-${option.id}"${option.condition ? ` data-condition='${JSON.stringify(option.condition)}'` : ''}${option.effects ? ` data-effect='${JSON.stringify(option.effects[0])}'` : ''}><span class="narrative-choice-text" contenteditable="true">${option.text}</span><span class="narrative-choice-target" contenteditable="true">${option.target_event}</span></div>`).join('')}</div>`
        : `<div class="narrative-text narrative-reading" contenteditable="true" role="textbox" aria-label="Texto da narração">${node.text}</div>`;
      return `<section class="narrative-block" data-narrative-type="${node.type}" data-narrative-id="${node.id}" data-localization-id="loc-${node.id}" data-narrative-sequence-id="${sequence}" contenteditable="false"><div class="narrative-meta"><span class="narrative-kind">${node.type==='choice'?'Escolha':'Narração'}</span></div>${content}</section>`;
    };
    source.documents[0].content.body = nodes.map(node=>blockHtml(node,'room')).join('') + blockHtml({id:'end',type:'narration',text:'Fim do teste.'},'ending');
    return source;
  }
  function story(source) {
    const sequences = source.documents[0].narrative.sequences;
    return {title:'Etapa 0',storage_id:'stage0-only',locale:'pt-BR',start_event_id:'room',viewport:copy(source.resources.sceneSettings.viewport),
      variable_registry:copy(source.resources.variables),character_registry:copy(source.resources.characters),
      sequences:sequences.map(sequence => ({event_id:sequence.id,title:sequence.title,presentation:copy(sequence.presentation),nodes:sequence.id === 'room' ? copy(nodes) : [{id:'end',type:'narration',text:'Fim do teste.'}]}))};
  }
  const corpus = {legacy:() => copy(legacy),current,story,nodes:() => copy(nodes)};
  if (typeof module !== 'undefined') module.exports = corpus; else root.Stage0Fixtures = corpus;
})(globalThis);
