/* Editorial decoration and illustration intent; rendered measurements are disposable. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value)),object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const ornaments={none:'Sem ornamento',dots:'Pontos',diamond:'Losango',flourish:'Florão'};
  const separators={inherit:'Seguir o livro',line:'Traço',dots:'Pontos',stars:'Asteriscos',diamond:'Losango',space:'Espaço em branco'};
  const symbols={none:'',line:'',dots:'· · ·',stars:'* * *',diamond:'◆',flourish:'❦',space:''};
  const defaults={schema_version:1,openingOrnament:'none',ornamentSize:24,ornamentSpace:16,separator:'dots',separatorSpace:24,illustrations:false,illustrationWidth:100,illustrationAlign:'center',illustrationFrame:'none',illustrationSpace:24,captionSize:12,captionSpace:8,captionFont:'body'};
  const ranges={ornamentSize:[14,48],ornamentSpace:[0,80],separatorSpace:[8,100],illustrationWidth:[20,100],illustrationSpace:[0,80],captionSize:[10,24],captionSpace:[0,40]};
  const enums={openingOrnament:Object.keys(ornaments),separator:Object.keys(separators).filter(key=>key!=='inherit'),illustrationAlign:['left','center','right'],illustrationFrame:['none','line','soft'],captionFont:['body','italic']};
  function normalize(value){
    if(value==null)return null;
    if(!object(value)||value.schema_version!==1)throw new Error('A decoração editorial usa uma versão incompatível. A fonte foi preservada.');
    const result=clone(defaults);
    for(const [key,[min,max]] of Object.entries(ranges))if(value[key]!==undefined){if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)throw new Error('Uma medida da decoração editorial é inválida.');result[key]=value[key];}
    for(const [key,options] of Object.entries(enums))if(value[key]!==undefined){if(!options.includes(value[key]))throw new Error('Uma opção da decoração editorial é inválida.');result[key]=value[key];}
    if(value.illustrations!==undefined){if(typeof value.illustrations!=='boolean')throw new Error('A opção de ilustrações editoriais é inválida.');result.illustrations=value.illustrations;}
    return result;
  }
  function ensureStyle(doc){if(doc.querySelector('style[data-book-design]'))return;const style=doc.createElement('style');style.dataset.bookDesign='';style.textContent=styles;doc.head.append(style);}
  function decorate(o,c){
    const page=o.page,doc=page.ownerDocument,design=c.record?.layout==='book'&&c.style?.enabled?normalize(c.style.design):null;
    ensureStyle(doc);page.toggleAttribute('data-book-design',Boolean(design));page.toggleAttribute('data-book-illustrations',Boolean(design?.illustrations));
    const d=design||defaults,left=d.illustrationAlign==='left'?'0':'auto',right=d.illustrationAlign==='right'?'0':'auto';
    page.dataset.bookIllustrationFrame=d.illustrationFrame;
    for(const [key,value] of Object.entries({'ornament-size':`${d.ornamentSize}px`,'ornament-space':`${d.ornamentSpace}px`,'separator-symbol':JSON.stringify(symbols[d.separator]),'separator-line':d.separator==='line'?'solid':'none','separator-space':`${d.separatorSpace}px`,'figure-width':`${d.illustrationWidth}%`,'figure-left':left,'figure-right':right,'figure-space':`${d.illustrationSpace}px`,'caption-size':`${d.captionSize}px`,'caption-space':`${d.captionSpace}px`,'caption-style':d.captionFont==='italic'?'italic':'normal'}))page.style.setProperty(`--book-${key}`,value);
    const role=c.record?.bookSection?.role||'chapter',show=Boolean(design&&design.openingOrnament!=='none'&&!c.record?.generated&&['part','prologue','chapter','epilogue'].includes(role));
    let ornament=page.querySelector('.book-opening-ornament');
    if(!show){ornament?.remove();return;}
    if(!ornament){ornament=doc.createElement('div');ornament.className='book-opening-ornament';ornament.dataset.bookGenerated='ornament';ornament.contentEditable='false';ornament.setAttribute('aria-hidden','true');const title=page.querySelector('.doc-title');title?.before(ornament);}
    ornament.textContent=symbols[design.openingOrnament];
  }
  function prepare(editor){
    ensureStyle(editor.ownerDocument);
    for(const figure of editor.querySelectorAll('figure[data-docs-image]')){
      for(const key of ['--book-figure-width','--book-figure-left','--book-figure-right'])figure.style.removeProperty(key);
      const width=Number(figure.dataset.illustrationWidth);if(Number.isInteger(width)&&width>=20&&width<=100)figure.style.setProperty('--book-figure-width',`${width}%`);
      const align=figure.dataset.illustrationAlign;if(['left','center','right'].includes(align)){figure.style.setProperty('--book-figure-left',align==='left'?'0':'auto');figure.style.setProperty('--book-figure-right',align==='right'?'0':'auto');}
      if(!figure.getAttribute('style'))figure.removeAttribute('style');
    }
    for(const separator of editor.querySelectorAll('[data-book-separator]')){
      let next=separator.nextElementSibling;
      while(next?.matches('p')&&!next.textContent.trim()&&!next.querySelector('img,sup'))next=next.nextElementSibling;
      if(next?.matches('p'))next.dataset.bookSceneOpening='true';
    }
    // The editable continuation after a plate is not an extra printed blank leaf.
    if(editor.closest('.book-edition-dialog,.localization-preview-page')||editor.ownerDocument.body.classList.contains('reading-mode')){
      const trailing=[];let last=editor.lastElementChild;
      while(last?.matches('p')&&!last.textContent.trim()&&!last.querySelector('img,sup,[data-page-break]')){trailing.push(last);last=last.previousElementSibling;}
      if(last?.matches('figure[data-docs-image][data-book-illustration=page]'))for(const paragraph of trailing)paragraph.dataset.bookPlateTail='true';
    }
  }
  function clean(editor){
    editor.querySelectorAll('[data-book-generated="ornament"]').forEach(element=>element.remove());
    editor.querySelectorAll('[data-book-plate-tail],[data-book-scene-opening]').forEach(element=>{element.removeAttribute('data-book-plate-tail');element.removeAttribute('data-book-scene-opening');});
    for(const figure of editor.querySelectorAll('figure[data-docs-image]')){
      figure.removeAttribute('data-book-plate');
      for(const key of ['--book-figure-width','--book-figure-left','--book-figure-right','--book-plate-offset'])figure.style.removeProperty(key);
      if(!figure.getAttribute('style'))figure.removeAttribute('style');
    }
  }
  function separator(doc,value='inherit'){
    if(!Object.hasOwn(separators,value))throw new Error('Escolha um separador de cena válido.');
    const element=doc.createElement('div');element.dataset.bookSeparator=value;element.contentEditable='false';element.setAttribute('role','separator');element.setAttribute('aria-label','Mudança de cena');element.tabIndex=0;return element;
  }
  function figureOptions(figure){
    return {placement:['inline','page','original'].includes(figure.dataset.bookIllustration)?figure.dataset.bookIllustration:'inherit',width:Number(figure.dataset.illustrationWidth)||null,align:['left','center','right'].includes(figure.dataset.illustrationAlign)?figure.dataset.illustrationAlign:'inherit',frame:['none','line','soft'].includes(figure.dataset.illustrationFrame)?figure.dataset.illustrationFrame:'inherit'};
  }
  function setFigure(figure,value){
    if(!object(value)||!['inherit','inline','page','original'].includes(value.placement)||value.width!=null&&(!Number.isInteger(value.width)||value.width<20||value.width>100)||!['inherit','left','center','right'].includes(value.align)||!['inherit','none','line','soft'].includes(value.frame))throw new Error('Os ajustes da ilustração são inválidos.');
    for(const [key,item] of Object.entries({bookIllustration:value.placement,illustrationWidth:value.width,illustrationAlign:value.align,illustrationFrame:value.frame})){
      if(item==null||item==='inherit')delete figure.dataset[key];else figure.dataset[key]=String(item);
    }
    figure.dataset.bookIllustration=value.placement;
    if(value.placement==='original')for(const key of ['illustrationWidth','illustrationAlign','illustrationFrame'])delete figure.dataset[key];
  }
  function mount(o){
    const editor=o.editor,doc=editor.ownerDocument,node=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});ensureStyle(doc);
    const dialog=node('dialog');dialog.className='book-design-dialog';dialog.setAttribute('aria-label','Compor ilustração');
    const heading=node('h2','Compor ilustração'),preview=node('img');preview.className='book-illustration-thumbnail';preview.alt='';
    const fields=node('div');fields.className='book-design-fields';
    function select(key,label,options){const row=node('label',label),input=node('select');for(const [value,name] of options){const option=node('option',name);option.value=value;input.append(option);}input.dataset.field=key;row.append(input);fields.append(row);return input;}
    const placement=select('placement','Apresentação',[['inherit','Seguir o livro'],['inline','Junto ao texto'],['page','Folha exclusiva'],['original','Estilos livres (banner e cantos)']]);
    const widthRow=node('label','Largura na área de texto (%)'),width=node('input');width.type='number';width.min=20;width.max=100;width.step=1;width.placeholder='Do livro';widthRow.append(width);fields.append(widthRow);
    const align=select('align','Alinhamento',[['inherit','Seguir o livro'],['left','Esquerda'],['center','Centro'],['right','Direita']]);
    const frame=select('frame','Moldura',[['inherit','Seguir o livro'],['none','Sem moldura'],['line','Traço fino'],['soft','Moldura suave']]);
    const position=select('captionPosition','Legenda',[['bottom','Abaixo da imagem'],['top','Acima da imagem']]);
    const captionAlign=select('captionAlign','Alinhamento da legenda',[['left','Esquerda'],['center','Centro'],['right','Direita']]);
    const altRow=node('label','Descrição da imagem'),alt=node('input');alt.type='text';alt.maxLength=1000;altRow.append(alt);fields.append(altRow);
    const captionRow=node('label','Texto da legenda'),caption=node('textarea');caption.rows=3;caption.maxLength=4000;captionRow.append(caption);fields.append(captionRow);
    const help=node('p','A apresentação editorial preserva a imagem inteira. A folha exclusiva inclui a legenda e mantém o texto nas folhas vizinhas.');
    const status=node('p');status.setAttribute('role','status');const actions=node('div'),cancel=node('button','Cancelar'),save=node('button','Aplicar');for(const button of [cancel,save])button.type='button';actions.className='book-design-actions';actions.append(cancel,save);dialog.append(heading,preview,fields,help,status,actions);doc.body.append(dialog);
    const sceneDialog=node('dialog');sceneDialog.className='book-design-dialog';sceneDialog.setAttribute('aria-label','Separador de cena');
    const sceneHeading=node('h2','Separador de cena'),sceneLabel=node('label','Apresentação'),sceneStyle=node('select');for(const [value,name] of Object.entries(separators)){const option=node('option',name);option.value=value;sceneStyle.append(option);}sceneLabel.append(sceneStyle);
    const sceneActions=node('div'),sceneRemove=node('button','Remover'),sceneCancel=node('button','Cancelar'),sceneSave=node('button','Aplicar');sceneActions.className='book-design-actions';for(const button of [sceneRemove,sceneCancel,sceneSave])button.type='button';sceneActions.append(sceneRemove,sceneCancel,sceneSave);
    const sceneStatus=node('p');sceneStatus.setAttribute('role','status');sceneDialog.append(sceneHeading,sceneLabel,sceneStatus,sceneActions);doc.body.append(sceneDialog);
    function updatePlacement(){const free=placement.value==='original';width.disabled=align.disabled=frame.disabled=free;}
    placement.addEventListener('change',updatePlacement);
    let candidate=null,candidateKey='',target=null,key='',lastRange=null,lastRangeKey='',scene=null,sceneRange=null,sceneKey='';
    function current(expected){const c=o.context();if(c.key!==expected||!c.enabled||!c.editable)throw new Error('O documento ou sua permissão mudou. Abra os ajustes novamente.');return c;}
    function selectionRange(){const s=doc.getSelection(),c=o.context();return s?.rangeCount&&editor.contains(s.anchorNode)&&editor.contains(s.focusNode)?s.getRangeAt(0).cloneRange():lastRangeKey===c.key?lastRange?.cloneRange():null;}
    doc.addEventListener('selectionchange',()=>{const range=selectionRange(),s=doc.getSelection();if(range&&s?.rangeCount&&editor.contains(s.anchorNode)&&editor.contains(s.focusNode)){lastRange=range;lastRangeKey=o.context().key;const element=s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement,figure=element?.closest('figure[data-docs-image]');if(figure){candidate=figure;candidateKey=lastRangeKey;}}});
    function openFigure(figure=null){
      const c=o.context();if(!c.enabled||!c.editable)return;
      figure=figure||(candidateKey===c.key&&editor.contains(candidate)?candidate:null);if(!figure||!editor.contains(figure)){o.status('Selecione uma imagem ou posicione o cursor na legenda para compor a ilustração.');return;}
      target=figure;key=c.key;const value=figureOptions(figure),image=figure.querySelector('img');placement.value=value.placement;width.value=value.width??'';align.value=value.align;frame.value=value.frame;position.value=figure.dataset.captionPosition||'bottom';captionAlign.value=figure.dataset.captionAlign||'center';alt.value=image?.alt||'';caption.value=figure.querySelector('figcaption')?.textContent||'';updatePlacement();if(image?.src)preview.src=image.src;else preview.removeAttribute('src');preview.hidden=!image?.src;status.textContent='';dialog.showModal();
    }
    function openSeparator(existing=null){
      const c=o.context();if(!c.enabled||!c.editable)return;scene=existing;sceneKey=c.key;sceneRange=existing?null:selectionRange();
      if(!existing&&(!sceneRange||!editor.contains(sceneRange.startContainer))){o.status('Posicione o cursor no texto do livro para inserir um separador de cena.');return;}
      if(!existing){const at=sceneRange.startContainer.nodeType===1?sceneRange.startContainer:sceneRange.startContainer.parentElement;if(at.closest('figure,.narrative-block,pre,table,[data-book-generated]')){o.status('Insira o separador entre trechos de texto do livro.');return;}}
      sceneStyle.value=existing?.dataset.bookSeparator||'inherit';sceneRemove.hidden=!existing;sceneStatus.textContent='';sceneDialog.showModal();
    }
    save.addEventListener('click',()=>{try{
      current(key);if(!target||!editor.contains(target))throw new Error('A imagem não está mais disponível neste documento.');if(!width.validity.valid||!alt.validity.valid||!caption.validity.valid){status.textContent='Confira a largura (20 a 100%) e os limites dos textos.';return;}
      const mutation=o.begin();root.HeartspaceDocsBookPagination.prepare(editor);setFigure(target,{placement:placement.value,width:placement.value==='original'||width.value===''?null:width.valueAsNumber,align:placement.value==='original'?'inherit':align.value,frame:placement.value==='original'?'inherit':frame.value});
      target.dataset.captionPosition=position.value;target.dataset.captionAlign=captionAlign.value;const image=target.querySelector('img');if(image)image.alt=alt.value;
      let text=target.querySelector('figcaption');if(!text){text=node('figcaption');text.contentEditable='true';target.append(text);}if(text.textContent!==caption.value)text.textContent=caption.value;
      o.end(mutation);o.changed();dialog.close();o.layout();
    }catch(error){status.textContent=error.message;}});
    function changeScene(removing=false){try{
      current(sceneKey);if(!Object.hasOwn(separators,sceneStyle.value))throw new Error('Escolha uma apresentação para o separador.');if(scene&&!editor.contains(scene))throw new Error('O separador não está mais disponível.');
      const mutation=o.begin();if(scene){root.HeartspaceDocsBookPagination.prepare(editor);if(removing)scene.remove();else scene.dataset.bookSeparator=sceneStyle.value;}
      else{const s=doc.getSelection();if(!sceneRange||!editor.contains(sceneRange.startContainer))throw new Error('O ponto de inserção não está mais disponível.');s.removeAllRanges();s.addRange(sceneRange);o.insertSeparator(sceneStyle.value);}
      o.end(mutation);o.changed();sceneDialog.close();o.layout();
    }catch(error){sceneStatus.textContent=error.message;}}
    sceneSave.addEventListener('click',()=>changeScene());sceneRemove.addEventListener('click',()=>changeScene(true));cancel.addEventListener('click',()=>dialog.close());sceneCancel.addEventListener('click',()=>sceneDialog.close());dialog.addEventListener('close',()=>preview.removeAttribute('src'));
    editor.addEventListener('click',event=>{const figure=event.target.closest('figure[data-docs-image]');if(figure){candidate=figure;candidateKey=o.context().key;}const separator=event.target.closest('[data-book-separator]');if(separator){event.preventDefault();openSeparator(separator);}});
    editor.addEventListener('dblclick',event=>{const image=event.target.closest('figure[data-docs-image] img');if(image){event.preventDefault();openFigure(image.closest('figure'));}});
    editor.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('[data-book-separator]')){event.preventDefault();openSeparator(event.target);}});
    o.imageTrigger?.addEventListener('click',()=>openFigure());o.separatorTrigger?.addEventListener('click',()=>openSeparator());
    function refresh(){const c=o.context();for(const trigger of [o.imageTrigger,o.separatorTrigger])if(trigger)trigger.disabled=!c.enabled||!c.editable;if(dialog.open&&(!c.enabled||!c.editable||c.key!==key))dialog.close();if(sceneDialog.open&&(!c.enabled||!c.editable||c.key!==sceneKey))sceneDialog.close();}
    return Object.freeze({refresh,openFigure,openSeparator});
  }
  const styles=`
.book-opening-ornament{font-family:Georgia,serif;font-size:var(--book-ornament-size,24px);line-height:1.2;text-align:var(--book-heading-align,center);margin:0 0 var(--book-ornament-space,16px);color:inherit;user-select:none}
body.writing-clean .editor-wrap>.page>.book-opening-ornament{display:none}
.content [data-book-separator]{display:block;position:relative;height:1.6em;min-height:24px;margin:var(--book-separator-space,24px) 0;text-align:center;text-indent:0;font:18px/1.6 Georgia,serif;clear:both;cursor:pointer;user-select:none}
.content [data-book-separator]::before{content:var(--scene-symbol,var(--book-separator-symbol,'· · ·'))}
.content [data-book-separator]::after{content:'';position:absolute;left:35%;right:35%;top:50%;border-top:1px var(--scene-line,var(--book-separator-line,none)) currentColor}
.content [data-book-separator=line]{--scene-symbol:'';--scene-line:solid}.content [data-book-separator=dots]{--scene-symbol:'· · ·';--scene-line:none}.content [data-book-separator=stars]{--scene-symbol:'* * *';--scene-line:none}.content [data-book-separator=diamond]{--scene-symbol:'◆';--scene-line:none}.content [data-book-separator=space]{--scene-symbol:'';--scene-line:none}
body.reading-mode .content [data-book-separator],.book-edition-dialog .content [data-book-separator]{cursor:default}
.content [data-book-plate-tail]{display:none!important}
.page[data-book-first-indent] .content [data-book-scene-opening]{text-indent:0!important}
.content [data-book-separator]:focus-visible{outline:1px solid var(--accent,#0c8ce9);outline-offset:4px}
.page[data-layout=book][data-book-illustrations] .content figure[data-docs-image]:not([data-book-illustration=original]),.page[data-layout=book] .content figure[data-docs-image][data-book-illustration]:not([data-book-illustration=original]){box-sizing:border-box;width:var(--book-figure-width,100%);max-width:100%;margin:var(--book-figure-space,24px) var(--book-figure-right,auto) var(--book-figure-space,24px) var(--book-figure-left,auto);padding:0}
.page[data-layout=book][data-book-illustrations] .content figure[data-docs-image]:not([data-book-illustration=original]) img,.page[data-layout=book] .content figure[data-docs-image][data-book-illustration]:not([data-book-illustration=original]) img{box-sizing:border-box;display:block;width:100%;height:auto;max-height:var(--book-image-fit,680px);object-fit:contain;border:0;border-radius:0;padding:0;background:transparent}
.page[data-layout=book][data-book-illustrations] .content figure[data-docs-image]:not([data-book-illustration=original]) figcaption,.page[data-layout=book] .content figure[data-docs-image][data-book-illustration]:not([data-book-illustration=original]) figcaption{min-height:0;margin:var(--book-caption-space,8px) 0 0;color:inherit;font-family:inherit;font-size:var(--book-caption-size,12px);font-style:var(--book-caption-style,normal);line-height:1.45;text-indent:0}
.page[data-layout=book] .content figure[data-docs-image] figcaption:empty{min-height:1.4em}
body.reading-mode .page[data-layout=book] .content figure[data-docs-image] figcaption:empty,.book-edition-dialog .content figure[data-docs-image] figcaption:empty{display:none}
.page[data-layout=book][data-book-illustrations] .content figure[data-caption-position=top]:not([data-book-illustration=original]) figcaption,.page[data-layout=book] .content figure[data-book-illustration]:not([data-book-illustration=original])[data-caption-position=top] figcaption{margin:0 0 var(--book-caption-space,8px)}
.page[data-layout=book][data-book-illustrations][data-book-illustration-frame=line] .content figure[data-docs-image]:not([data-book-illustration=original]):not([data-illustration-frame]) img,.page[data-layout=book] .content figure[data-docs-image][data-illustration-frame=line] img{border:1px solid currentColor;padding:8px}
.page[data-layout=book][data-book-illustrations][data-book-illustration-frame=soft] .content figure[data-docs-image]:not([data-book-illustration=original]):not([data-illustration-frame]) img,.page[data-layout=book] .content figure[data-docs-image][data-illustration-frame=soft] img{border:1px solid color-mix(in srgb,currentColor 30%,transparent);padding:12px;border-radius:6px}
.page[data-layout=book] .content figure[data-book-plate]{margin-block:var(--book-plate-offset,0px) 0!important}
.book-design-dialog{box-sizing:border-box;width:min(540px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;padding:22px;border:1px solid #ffffff30;border-radius:10px;background:var(--bg,#171717);color:var(--text,#eee)}
.book-design-dialog::backdrop{background:#0009}.book-design-dialog h2{margin:0 0 16px;font-size:18px}.book-design-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.book-design-dialog label{display:grid;gap:6px;font-size:12px}.book-design-fields>label:has(textarea){grid-column:1/-1}
.book-design-dialog :is(select,input,textarea){box-sizing:border-box;min-width:0;width:100%;padding:8px;border:1px solid #ffffff30;border-radius:5px;background:#111;color:#fff;font:inherit}.book-design-dialog textarea{resize:vertical}.book-design-dialog p{font-size:12px;line-height:1.5;color:#aaa}
.book-illustration-thumbnail{display:block;width:100%;max-height:160px;object-fit:contain;margin-bottom:16px}.book-illustration-thumbnail[hidden]{display:none}.book-design-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.book-design-actions button{padding:8px 12px;border:1px solid #ffffff30;border-radius:5px;background:#252525;color:#fff}.book-design-actions button:last-child{background:#0875c5}
@media(max-width:480px){.book-design-fields{grid-template-columns:1fr}}
`;
  root.HeartspaceDocsBookDesign=Object.freeze({normalize,defaults:()=>clone(defaults),ranges,enums,ornaments,separators,decorate,prepare,clean,separator,figureOptions,setFigure,mount});
})(globalThis);
