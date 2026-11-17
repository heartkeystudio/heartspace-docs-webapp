/* Whole-book composition is a disposable projection of the authoring documents. */
(function(root){
  'use strict';
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const roles={cover:'Capa',title:'Folha de rosto',credits:'Créditos',dedication:'Dedicatória',epigraph:'Epígrafe',preface:'Prefácio',part:'Parte',prologue:'Prólogo',chapter:'Capítulo',epilogue:'Epílogo',appendix:'Apêndice'};
  const frontRoles=new Set(['cover','title','credits','dedication','epigraph','preface']);
  const defaults={schema_version:1,paper:'a5',orientation:'portrait',mirrored:true,inner:64,outer:48,top:56,bottom:56,pageNumbers:true,startNumber:1,frontStart:1,frontRoman:true,numberPosition:'outer',headers:'book-chapter',leftHeader:'',rightHeader:'',hideOpening:true};
  const ranges={inner:[24,160],outer:[24,160],top:[32,160],bottom:[32,160],startNumber:[1,99999],frontStart:[1,99999]};
  const enums={paper:['a4','a5','letter'],orientation:['portrait','landscape'],numberPosition:['outer','center'],headers:['none','book-chapter','chapter','custom']};
  function normalizeEdition(value){
    if(value==null)return null;
    if(!object(value)||value.schema_version!==1)throw new Error('A composição do livro usa uma versão incompatível. A fonte foi preservada.');
    const result=clone(defaults);
    for(const [key,[min,max]] of Object.entries(ranges))if(value[key]!==undefined){if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)throw new Error('Uma medida ou numeração da composição é inválida.');result[key]=value[key];}
    for(const [key,values] of Object.entries(enums))if(value[key]!==undefined){if(!values.includes(value[key]))throw new Error('Uma opção da composição é inválida.');result[key]=value[key];}
    for(const key of ['mirrored','pageNumbers','frontRoman','hideOpening'])if(value[key]!==undefined){if(typeof value[key]!=='boolean')throw new Error('Uma opção da composição é inválida.');result[key]=value[key];}
    for(const key of ['leftHeader','rightHeader'])if(value[key]!==undefined){if(typeof value[key]!=='string'||value[key].length>160)throw new Error('O texto do cabeçalho é inválido.');result[key]=value[key];}
    return result;
  }
  function normalizeSection(value){
    if(value==null)return null;
    if(!object(value)||value.schema_version!==1||!Object.hasOwn(roles,value.role)||!['next','recto','verso'].includes(value.start)||!['auto','arabic','roman','none'].includes(value.numbering)||typeof value.include!=='boolean'||typeof value.showHeading!=='boolean')throw new Error('A função editorial da seção é inválida. A fonte foi preservada.');
    return {schema_version:1,role:value.role,start:value.start,numbering:value.numbering,include:value.include,showHeading:value.showHeading};
  }
  const sectionFor=record=>normalizeSection(record?.bookSection)||{schema_version:1,role:'chapter',start:'recto',numbering:'auto',include:true,showHeading:true};
  const paperSizes={a4:[794,1123],a5:[559,794],letter:[816,1056]};
  function roman(value){if(value>3999)return String(value);let result='';for(const [n,s] of [[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']])while(value>=n){result+=s;value-=n;}return result;}
  function mount(o){
    const doc=o.panel.ownerDocument,node=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});
    const css=node('style');css.textContent=styles;doc.head.append(css);
    const details=node('details');details.className='book-composition-settings';details.append(node('summary','Composição do livro'));
    const controls=node('div');controls.className='book-style-fields';details.append(controls);
    const help=node('p','A prévia reúne as seções na ordem da biblioteca. Papel, margens e cabeçalhos abaixo pertencem à composição do livro.');help.className='book-style-help';controls.append(help);
    const openButton=node('button','Prévia do livro inteiro');openButton.type='button';openButton.className='page-settings-save';controls.append(openButton);
    const editionFields=new Map(),sectionFields=new Map();
    const group=title=>{const box=node('details');box.append(node('summary',title));const body=node('div');body.className='book-style-fields';box.append(body);controls.append(box);return body;};
    function field(parent,fields,key,label,type,choices){
      const row=node('label',label),input=node(type==='select'?'select':'input');
      if(type==='select')for(const [value,name] of choices){const option=node('option',name);option.value=value;input.append(option);}
      else {input.type=type;if(type==='number'){input.min=ranges[key][0];input.max=ranges[key][1];input.step='1';input.required=true;}if(type==='text')input.maxLength=160;}
      if(type==='checkbox'){row.textContent='';row.className='book-style-check';row.append(input,doc.createTextNode(` ${label}`));}else row.append(input);
      row.dataset.compositionField=key;fields.set(key,input);parent.append(row);return input;
    }
    const sectionBody=group('Função desta seção');
    field(sectionBody,sectionFields,'role','Função editorial','select',Object.entries(roles));
    field(sectionBody,sectionFields,'include','Incluir na composição','checkbox');
    field(sectionBody,sectionFields,'showHeading','Mostrar título e abertura','checkbox');
    field(sectionBody,sectionFields,'start','Começar em','select',[['next','Próxima página'],['recto','Página da direita (ímpar)'],['verso','Página da esquerda (par)']]);
    field(sectionBody,sectionFields,'numbering','Números desta seção','select',[['auto','Pela função editorial'],['arabic','1, 2, 3…'],['roman','i, ii, iii…'],['none','Ocultar números']]);
    const paper=group('Papel e margens da composição');
    field(paper,editionFields,'paper','Papel','select',[['a5','A5'],['a4','A4'],['letter','Carta']]);
    field(paper,editionFields,'orientation','Orientação','select',[['portrait','Retrato'],['landscape','Paisagem']]);
    field(paper,editionFields,'mirrored','Espelhar margens pares e ímpares','checkbox');
    for(const [key,label] of [['inner','Margem interna / esquerda (px)'],['outer','Margem externa / direita (px)'],['top','Margem superior (px)'],['bottom','Margem inferior (px)']])field(paper,editionFields,key,label,'number');
    const numbers=group('Numeração e cabeçalhos');
    field(numbers,editionFields,'pageNumbers','Mostrar números das páginas','checkbox');
    field(numbers,editionFields,'startNumber','Primeiro número do corpo do livro','number');
    field(numbers,editionFields,'frontStart','Primeiro número das páginas iniciais','number');
    field(numbers,editionFields,'frontRoman','Páginas iniciais em algarismos romanos','checkbox');
    field(numbers,editionFields,'numberPosition','Posição dos números','select',[['outer','Canto externo'],['center','Centro']]);
    field(numbers,editionFields,'headers','Cabeçalhos','select',[['none','Sem cabeçalhos'],['book-chapter','Livro à esquerda, seção à direita'],['chapter','Título da seção'],['custom','Textos personalizados']]);
    field(numbers,editionFields,'leftHeader','Cabeçalho das páginas da esquerda','text');field(numbers,editionFields,'rightHeader','Cabeçalho das páginas da direita','text');
    field(numbers,editionFields,'hideOpening','Ocultar cabeçalhos e números nas aberturas','checkbox');
    const status=node('p');status.className='book-style-help';status.setAttribute('role','status');controls.append(status);o.panel.append(details);
    const dialog=node('dialog');dialog.className='book-edition-dialog';dialog.setAttribute('aria-label','Composição do livro');
    const bar=node('header'),heading=node('strong'),sectionSelect=node('select'),view=node('select'),zoom=node('select');
    sectionSelect.setAttribute('aria-label','Ir à seção do livro');view.setAttribute('aria-label','Visualização das páginas');zoom.setAttribute('aria-label','Zoom da composição');
    for(const [value,label] of [['double','Páginas duplas'],['single','Página única']]){const item=node('option',label);item.value=value;view.append(item);}
    for(const [value,label] of [['auto','Auto'],['.5','50%'],['.75','75%'],['1','100%'],['1.25','125%']]){const item=node('option',label);item.value=value;zoom.append(item);}
    const update=node('button','Atualizar'),edit=node('button','Abrir seção'),close=node('button','Fechar');for(const button of [update,edit,close])button.type='button';edit.title='Abrir a seção escolhida na lista';
    bar.append(heading,sectionSelect,view,zoom,update,edit,close);
    const progress=node('p');progress.className='book-edition-progress';progress.setAttribute('role','status');
    const viewport=node('div');viewport.className='book-edition-viewport';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Páginas do livro');
    dialog.append(bar,progress,viewport);doc.body.append(dialog);
    let formKey='',signature='',run=0,openedKey='',rendered=[],assetUrls=[],currentWidth=559;
    const revoke=urls=>urls.forEach(url=>URL.revokeObjectURL(url));
    function refresh(force=false){
      const c=o.context();details.hidden=!c.record||c.record.layout!=='book';
      if(o.trigger){o.trigger.disabled=!c.readable;o.trigger.title=c.readable?'Compor as seções do livro em páginas':'Abra um documento do formato livro para visualizar a composição.';}
      if(dialog.open&&(!c.readable||c.key!==openedKey)){dialog.close();}
      const next=JSON.stringify([c.key,c.style?.edition,c.record?.bookSection,c.editable,c.readable]);
      if(!force&&c.key===formKey&&o.panel.contains(doc.activeElement))return;
      if(!force&&signature===next)return;signature=next;formKey=c.key;
      const edition=normalizeEdition(c.style?.edition)||defaults,section=sectionFor(c.record);
      for(const [fields,value] of [[editionFields,edition],[sectionFields,section]])for(const [key,input] of fields){if(input.type==='checkbox')input.checked=value[key];else input.value=String(value[key]);input.disabled=!c.editable;}
      for(const key of ['leftHeader','rightHeader'])editionFields.get(key).parentElement.hidden=edition.headers!=='custom';
      openButton.disabled=!c.readable;status.textContent='';
    }
    function commit(kind,value){try{const c=o.context();if(c.key!==formKey||!c.editable)throw new Error('O livro ou sua permissão mudou. Abra as configurações novamente.');o.change(kind,value,c.key);refresh(true);}catch(error){status.textContent=error.message;}}
    for(const [key,input] of editionFields)input.addEventListener('change',()=>{if(!input.validity.valid)return;commit('edition',{...(normalizeEdition(o.context().style?.edition)||defaults),[key]:input.type==='checkbox'?input.checked:input.type==='number'?input.valueAsNumber:input.value});});
    for(const [key,input] of sectionFields)input.addEventListener('change',()=>{const section=sectionFor(o.context().record);commit('section',{...section,[key]:input.type==='checkbox'?input.checked:input.value});});
    function scale(){
      const width=(view.value==='double'?currentWidth*2+24:currentWidth),value=zoom.value==='auto'?Math.max(.1,Math.min(1,(viewport.clientWidth-40)/width)):Number(zoom.value);
      viewport.querySelectorAll('.book-edition-spread').forEach(spread=>spread.style.zoom=String(value));
    }
    function arrange(){
      const fragment=doc.createDocumentFragment(),items=view.value==='double'?[null,...rendered]:rendered;
      const step=view.value==='double'?2:1;
      for(let i=0;i<items.length;i+=step){const spread=node('div');spread.className='book-edition-spread';spread.style.gridTemplateColumns=`repeat(${step},${currentWidth}px)`;
        for(let j=0;j<step;j++){const item=items[i+j];if(item)spread.append(item);else{const ghost=node('div');ghost.className='book-edition-ghost';ghost.setAttribute('aria-hidden','true');spread.append(ghost);}}
        fragment.append(spread);
      }
      viewport.replaceChildren(fragment);scale();
    }
    async function compose(){
      const attempt=++run,c=await o.snapshot();if(attempt!==run||!dialog.open)return;
      if(!c.readable||c.key!==openedKey)throw new Error('O projeto ou seu acesso mudou. Abra a prévia novamente.');
      const edition=normalizeEdition(c.style?.edition)||clone(defaults),spec=paperSizes[edition.paper];
      const [width,height]=edition.orientation==='landscape'?[spec[1],spec[0]]:spec;
      const records=c.records.filter(record=>record.layout==='book'&&!record.isNotebook&&!record.trashedAt&&!record.archivedAt&&sectionFor(record).include);
      const staging=node('div');staging.className='book-edition-staging';dialog.append(staging);
      const result=[],urls=[],sections=[];let physical=0,front=edition.frontStart,body=edition.startNumber,previousFront=null,missingImages=0;
      const check=()=>{if(attempt!==run||!dialog.open||o.context().key!==openedKey||!o.context().readable)throw new Error('A composição foi interrompida porque o contexto mudou.');};
      const margins=index=>edition.mirrored&&index%2===0?[edition.outer,edition.inner]:[edition.inner,edition.outer];
      function sheet(record,section,isFront,opening,blank=false){
        physical+=1;const number=isFront?front++:body++,leaf=node('article');leaf.className='page book-edition-sheet';leaf.dataset.layout='book';leaf.dataset.opening=String(opening);leaf.dataset.physicalPage=String(physical);leaf.dataset.documentId=record.id;
        leaf.style.cssText=`width:${width}px;height:${height}px;min-height:0;padding:0;--book-margin-y:${edition.bottom}px;--book-sheet-height:${height}px;--book-page-height:${height}px;--book-page-width:${width}px;--book-sheet-gap:0px`;
        leaf.setAttribute('aria-label',`Página física ${physical}${blank?' · em branco':` · ${record.title}`}`);
        if(blank){leaf.classList.add('book-edition-blank');leaf.title='Página em branco inserida para respeitar o lado de abertura da seção';}else{
          const [left,right]=margins(physical),suppress=opening&&edition.hideOpening;
          const hiddenNumber=section.numbering==='none'||section.numbering==='auto'&&['cover','title','credits'].includes(section.role);
          if(edition.pageNumbers&&!suppress&&!hiddenNumber){const footer=node('div',section.numbering==='roman'||section.numbering==='auto'&&isFront&&edition.frontRoman?roman(number):String(number));footer.className='book-edition-folio';footer.style.bottom=`${Math.max(8,edition.bottom/2-8)}px`;footer.style.left=`${left}px`;footer.style.right=`${right}px`;footer.style.textAlign=edition.numberPosition==='center'?'center':physical%2?'right':'left';leaf.append(footer);}
          if(edition.headers!=='none'&&!suppress){const head=node('div',edition.headers==='custom'?(physical%2?edition.rightHeader:edition.leftHeader):edition.headers==='chapter'||physical%2?record.title:c.book?.name||record.title);head.className='book-edition-running-head';head.style.top=`${Math.max(8,edition.top/2-8)}px`;head.style.left=`${left}px`;head.style.right=`${right}px`;head.style.textAlign=physical%2?'right':'left';leaf.append(head);}
        }
        result.push(leaf);return leaf;
      }
      dialog.setAttribute('aria-busy','true');update.disabled=edit.disabled=true;progress.textContent='Compondo o livro…';
      try{
        if(doc.fonts?.ready)await doc.fonts.ready;check();
        for(let recordIndex=0;recordIndex<records.length;recordIndex++){
          const record=records[recordIndex],section=sectionFor(record),isFront=frontRoles.has(section.role);
          const desired=section.start==='recto'?1:section.start==='verso'?0:null;
          if(desired!==null&&(physical+1)%2!==desired)sheet(record,section,previousFront??isFront,false,true);
          const start=physical+1,[left,right]=margins(start);
          const source=node('article');source.className='page book-edition-source';source.dataset.layout='book';source.dataset.narrativeProfile=record.narrativeProfile||'prose';source.style.cssText=`width:${width}px;min-height:0;padding:0;--book-margin-y:${edition.bottom}px;--book-sheet-gap:0px`;
          const opening=node('div');opening.className='book-edition-opening';opening.style.cssText=`padding:${edition.top}px ${right}px 0 ${left}px`;
          const chapterNumber=node('div');chapterNumber.className='chapter-heading-number';const title=node('h1',record.title);title.className='doc-title';title.dataset.align=record.titleAlign||'left';const subtitle=node('div',record.subtitle||'');subtitle.className='doc-subtitle';subtitle.hidden=!record.subtitle;subtitle.style.textAlign=record.subtitleAlign||'left';opening.append(chapterNumber,title,subtitle);opening.hidden=!section.showHeading;
          const content=node('div');content.className='content';content.innerHTML=o.sanitize(record.body||'<p><br></p>');source.append(opening,content);staging.append(source);
          root.HeartspaceDocsBookTypography.decorate({page:source,editor:content,number:chapterNumber},{record,records:c.allRecords,style:c.style});
          if(record.introSpacing!=null){source.dataset.customIntroSpacing='';source.style.setProperty('--intro-spacing',`${record.introSpacing}px`);}
          await o.prepare(content,record);check();
          for(const image of content.querySelectorAll('img[data-local-image],img[data-remote-image]')){
            let blob=null;try{blob=await o.loadImage({localId:image.dataset.localImage,remotePath:image.dataset.remoteImage});}catch(error){check();}
            check();if(blob){const url=URL.createObjectURL(blob);urls.push(url);image.src=url;}
          }
          await Promise.all([...content.querySelectorAll('img')].map(image=>Promise.race([image.decode?.().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))])));check();
          for(const image of content.querySelectorAll('img'))if(!image.complete||!image.naturalWidth){const placeholder=node('div',`Imagem indisponível${image.alt?`: ${image.alt}`:''}`);placeholder.className='book-edition-missing-image';image.replaceWith(placeholder);missingImages+=1;}
          content.querySelectorAll('.authoring-decoration,[data-reading-empty="true"],[data-canonical-visible="false"]').forEach(element=>element.remove());
          content.querySelectorAll('.narrative-variation-version[data-reading-active="false"]').forEach(element=>element.remove());
          content.querySelectorAll('[contenteditable]').forEach(element=>element.contentEditable='false');content.querySelectorAll('button,input,textarea,select').forEach(element=>element.disabled=true);
          for(const e of content.querySelectorAll('[id]'))if(!e.closest('svg'))e.removeAttribute('id');
          const firstHeight=height-(section.showHeading?opening.getBoundingClientRect().height:0),pages=[];
          if(firstHeight<edition.bottom+40)throw new Error(`A abertura de “${record.title}” não cabe no papel escolhido. Reduza os espaços da abertura ou escolha um papel maior.`);
          content.classList.add('book-paginated');
          const makePage=index=>{const page=node('div'),[l,r]=margins(start+index);page.className='book-page-content';page.style.cssText=`height:${index?height:Math.max(80,firstHeight)}px;padding:${index||!section.showHeading?edition.top:0}px ${r}px ${edition.bottom}px ${l}px`;content.append(page);pages.push(page);return page;};
          root.HeartspaceDocsBookPagination.reflow({editor:content,pages,makePage});
          sections.push({record,start,count:pages.length});
          for(let i=0;i<pages.length;i++){
            const target=sheet(record,section,isFront,i===0&&section.showHeading),bodyNode=node('div');bodyNode.className='content';bodyNode.lang=content.lang;
            for(const attr of [...source.attributes])if(attr.name.startsWith('data-'))target.setAttribute(attr.name,attr.value);
            for(let n=0;n<source.style.length;n++){const key=source.style[n];if(key.startsWith('--book-')||key==='--intro-spacing')target.style.setProperty(key,source.style.getPropertyValue(key));}
            if(i===0&&section.showHeading)target.append(opening);bodyNode.append(pages[i]);target.append(bodyNode);
          }
          source.remove();previousFront=isFront;progress.textContent=`${recordIndex+1} de ${records.length} seções · ${physical} páginas`;await new Promise(resolve=>requestAnimationFrame(resolve));check();
        }
        revoke(assetUrls);assetUrls=urls;rendered=result;currentWidth=width;heading.textContent=c.book?.name||c.record.title;
        sectionSelect.replaceChildren();for(const {record,start,count} of sections){const option=node('option',`${record.title} · ${roles[sectionFor(record).role]} · p. física ${start}–${start+count-1}`);option.value=record.id;sectionSelect.append(option);}
        sectionSelect.value=sections[0]?.record.id||'';arrange();viewport.scrollTop=0;
        progress.textContent=records.length?`${records.length} seções · ${physical} páginas físicas · prévia do conteúdo original${missingImages?` · ${missingImages} imagem(ns) indisponível(is)`:''}`:'Nenhuma seção incluída. Confira a função editorial das seções do livro.';
        edit.disabled=!records.length;sectionSelect.disabled=!records.length;
      }catch(error){revoke(urls);if(attempt===run&&dialog.open)progress.textContent=`Não foi possível compor o livro: ${error.message}`;}
      finally{staging.remove();if(attempt===run){dialog.removeAttribute('aria-busy');update.disabled=false;}}
    }
    async function open(){try{const c=o.context();if(!c.readable)throw new Error('Abra um documento disponível para visualizar o livro.');openedKey=c.key;if(!dialog.open)dialog.showModal();await compose();}catch(error){status.textContent=error.message;if(dialog.open)progress.textContent=error.message;}}
    openButton.addEventListener('click',open);update.addEventListener('click',()=>{void compose().catch(error=>{progress.textContent=error.message;});});
    close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{run+=1;rendered=[];viewport.replaceChildren();revoke(assetUrls);assetUrls=[];dialog.querySelectorAll('.book-edition-staging').forEach(element=>element.remove());});
    sectionSelect.addEventListener('change',()=>{rendered.find(page=>page.dataset.documentId===sectionSelect.value&&!page.classList.contains('book-edition-blank'))?.scrollIntoView({block:'start',inline:'nearest'});});
    edit.addEventListener('click',()=>{const id=sectionSelect.value;if(!id)return;dialog.close();o.edit(id);});
    view.addEventListener('change',()=>{arrange();viewport.scrollTop=0;});zoom.addEventListener('change',scale);
    viewport.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault();});
    const observer=new ResizeObserver(scale);observer.observe(viewport);
    return Object.freeze({refresh,open,focused:()=>o.panel.contains(doc.activeElement)});
  }
  const styles=`
.book-composition-settings>summary{cursor:pointer;font-size:12px;color:#ddd}
.book-composition-settings[hidden]{display:none}
.book-edition-dialog{box-sizing:border-box;width:calc(100vw - 32px);height:calc(100dvh - 32px);max-width:none;max-height:none;padding:0;border:1px solid #ffffff26;border-radius:10px;background:var(--bg,#111);color:var(--text,#eee);overflow:hidden}
.book-edition-dialog::backdrop{background:#000b}.book-edition-dialog[open]{display:flex;flex-direction:column;gap:0}
.book-edition-dialog>header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid #ffffff16;flex:none}
.book-edition-dialog>header>strong{margin-right:auto;font-size:14px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.book-edition-dialog :is(button,select){font:inherit;font-size:12px;background:#202020;color:#eee;border:1px solid #ffffff26;border-radius:5px;padding:7px}
.book-edition-dialog>header>select:first-of-type{max-width:280px}.book-edition-dialog button:disabled{opacity:.45}
.book-edition-progress{margin:0;padding:7px 16px;font-size:12px;color:#999;min-height:16px;flex:none}
.book-edition-viewport{position:relative;flex:1;min-height:0;overflow:auto;padding:20px;outline:none;overscroll-behavior:contain}
.book-edition-spread{display:grid;gap:24px;width:max-content;margin:0 auto 24px;align-items:start}
.book-edition-staging{position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none}
.book-edition-dialog .page{box-sizing:border-box;position:relative;max-width:none;border:0;border-radius:0;background:var(--paper,#202124);color:var(--document-ink,#fff);box-shadow:none;margin:0;zoom:1;flex:none;overflow:visible}
.book-edition-dialog .book-edition-sheet.page{overflow:hidden;box-shadow:0 0 0 1px #ffffff20}
.book-edition-dialog .content{min-height:0;margin:0}.book-edition-dialog .book-page-content{box-sizing:border-box}
.book-edition-dialog .book-edition-opening{display:flow-root}.book-edition-dialog .book-edition-opening[hidden],.book-edition-dialog .doc-subtitle[hidden]{display:none}.book-edition-dialog .doc-subtitle{resize:none;white-space:pre-wrap}
.book-edition-dialog :is(.book-edition-folio,.book-edition-running-head){position:absolute;font:12px Georgia,serif;color:var(--document-ink,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:16px;pointer-events:none}
.book-edition-viewport:focus-visible{outline:1px solid var(--accent,#0c8ce9);outline-offset:-2px}
.book-edition-missing-image{box-sizing:border-box;min-height:100px;padding:20px;border:1px dashed #999;color:#999;font:14px system-ui;text-align:center}
.book-edition-dialog .authoring-decoration,.book-edition-dialog [data-placeholder]:empty::before{display:none!important}
.book-edition-dialog .content [data-page-break=true]{height:0;margin:0;border:0}.book-edition-dialog .content [data-page-break=true]>span{display:none}
.book-edition-dialog .narrative-inline{padding:0;background:transparent}.book-edition-dialog .narrative-variation-version[data-reading-active=true]{display:block}
.book-edition-dialog .page[data-narrative-profile=prose] .narrative-block[data-narrative-type=dialogue]:not(.narrative-inline)>.narrative-text:not(:empty)::before{content:'— '}
.book-edition-dialog .narrative-block[data-narrative-type=choice]>.narrative-choice-prompt,.book-edition-dialog .narrative-block[data-narrative-type=choice]>.narrative-choice-options{display:inline}
.book-edition-dialog .narrative-block[data-choice-prompt-empty=true]>.narrative-choice-prompt,.book-edition-dialog .narrative-block[data-choice-prompt-empty=true]>.narrative-reading-label{display:none!important}
.book-edition-dialog .narrative-block[data-narrative-type=choice] .narrative-choice-option{display:none;padding:0}
.book-edition-dialog .narrative-block[data-narrative-type=choice] .narrative-choice-option[data-canonical=true]{display:inline}
.book-edition-dialog .narrative-choice-option[data-canonical=true]::before{position:static;content:' — '}
.book-edition-dialog .narrative-block[data-choice-prompt-empty=true] .narrative-choice-option[data-canonical=true]::before{content:none}
.book-edition-dialog .narrative-choice-text{display:inline}
.book-edition-sheet[data-opening=false][data-book-first-indent] .content>.book-page-content:first-child>p:first-child:not([data-book-continuation]),
.book-edition-source:has(.book-edition-opening[hidden])[data-book-first-indent] .content>.book-page-content:first-child>p:first-child:not([data-book-continuation]){text-indent:var(--book-first-indent)}
@media(max-width:700px){.book-edition-dialog{width:100vw;height:100dvh;border-radius:0}.book-edition-dialog>header{padding:8px}.book-edition-dialog>header>strong{max-width:150px}}
`;
  root.HeartspaceDocsBookComposition=Object.freeze({normalizeEdition,normalizeSection,sectionFor,roles,defaults:()=>clone(defaults),mount});
})(globalThis);
