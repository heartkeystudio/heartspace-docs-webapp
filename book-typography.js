/* Shared book typography and semantic chapter openings. Manuscript blocks stay intact. */
(function(root){
  'use strict';
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const FONTS={serif:'Georgia, "Times New Roman", serif',classic:'"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',sans:'Inter, ui-sans-serif, system-ui, sans-serif'};
  const base={schema_version:1,enabled:true,font:'serif',fontSize:17,lineHeight:1.6,align:'justify',paragraphSpace:0,firstIndent:1.25,skipFirstIndent:true,hyphenate:false,language:'pt-BR',headingFont:'serif',headingSize:32,headingAlign:'center',smallCaps:false,openingSpace:24,numberSize:16,numberGap:16,textGap:40,numberFormat:'label',numberLabel:'Capítulo'};
  const ranges={fontSize:[12,28],lineHeight:[1,2.5],paragraphSpace:[0,40],firstIndent:[0,4],headingSize:[18,64],openingSpace:[0,200],numberSize:[10,32],numberGap:[0,120],textGap:[0,200]};
  const enums={font:Object.keys(FONTS),headingFont:Object.keys(FONTS),align:['left','justify'],headingAlign:['left','center','right'],language:['pt-BR','pt-PT','en','es','fr','de'],numberFormat:['label','arabic','roman']};
  const presets={classic:base,airy:{...base,font:'classic',align:'left',lineHeight:1.75,paragraphSpace:10,firstIndent:0,headingFont:'classic'},modern:{...base,font:'sans',headingFont:'sans',align:'left',paragraphSpace:10,firstIndent:0,headingSize:30,numberFormat:'arabic',textGap:32}};
  function normalizeStyle(value){
    if(value==null)return null;
    if(!object(value)||value.schema_version!==1)throw new Error('Esta versão dos estilos do livro não é suportada. A fonte foi preservada.');
    const result=clone(base);
    for(const [key,[min,max]] of Object.entries(ranges))if(value[key]!==undefined){if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw new Error('Uma medida do estilo do livro é inválida.');result[key]=value[key];}
    for(const [key,values] of Object.entries(enums))if(value[key]!==undefined){if(!values.includes(value[key]))throw new Error('Uma opção do estilo do livro é inválida.');result[key]=value[key];}
    for(const key of ['enabled','skipFirstIndent','hyphenate','smallCaps'])if(value[key]!==undefined){if(typeof value[key]!=='boolean')throw new Error('Uma opção do estilo do livro é inválida.');result[key]=value[key];}
    if(value.numberLabel!==undefined){if(typeof value.numberLabel!=='string'||value.numberLabel.length>40)throw new Error('O nome da numeração do capítulo é inválido.');result.numberLabel=value.numberLabel;}
    if(value.edition!=null)result.edition=root.HeartspaceDocsBookComposition.normalizeEdition(value.edition);
    return result;
  }
  function normalizeChapter(value){
    if(value==null)return null;
    if(!object(value)||value.schema_version!==1||typeof value.enabled!=='boolean'||value.alignment!=null&&!['left','center','right','justify'].includes(value.alignment)||!['auto','custom','none'].includes(value.numbering)||!Number.isInteger(value.number)||value.number<1||value.number>9999)throw new Error('A abertura do capítulo usa um formato inválido. A fonte foi preservada.');
    return {schema_version:1,enabled:value.enabled,numbering:value.numbering,number:value.number,alignment:value.alignment??null};
  }
  function chapterNumber(record,records){
    const config=normalizeChapter(record?.chapterHeading);
    if(!config?.enabled||config.numbering==='none'||record.layout==='canvas'||record.isNotebook||record.bookSection?.role&&record.bookSection.role!=='chapter')return null;
    if(config.numbering==='custom'||!record.folderId)return config.number;
    const chapters=records.filter(r=>r.folderId===record.folderId&&r.layout!=='canvas'&&!r.isNotebook&&!r.trashedAt&&!r.archivedAt&&(!r.bookSection?.role||r.bookSection.role==='chapter')&&r.chapterHeading?.numbering!=='none');
    const index=chapters.findIndex(r=>r.id===record.id);return index<0?config.number:index+1;
  }
  function numeral(number){
    if(number>3999)return String(number);
    let result='';for(const [value,text] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(number>=value){result+=text;number-=value;}
    return result;
  }
  function numberText(number,style){if(number==null)return '';const s=style||base;return s.numberFormat==='roman'?numeral(number):s.numberFormat==='label'?`${s.numberLabel.trim()} ${number}`.trim():String(number);}
  function decorate(o,c){
    const active=Boolean(c.record&&c.record.layout==='book'),s=active&&c.style?.enabled?normalizeStyle(c.style):null,page=o.page;
    const heading=active&&c.record.chapterHeading?.enabled?numberText(chapterNumber(c.record,c.records),s):'';
    c={...c,chapter:normalizeChapter(c.record?.chapterHeading)};
      page.toggleAttribute('data-book-style',Boolean(s));page.toggleAttribute('data-chapter-opening',Boolean(active&&c.chapter?.enabled));
      o.number.textContent=heading;o.number.hidden=!heading;
      if(c.chapter?.alignment)page.dataset.chapterTitleAlign=c.chapter.alignment;else delete page.dataset.chapterTitleAlign;
      page.toggleAttribute('data-book-first-indent',Boolean(s?.skipFirstIndent));
      if(s){
        for(const [key,value] of Object.entries({'body-font':FONTS[s.font],'body-size':`${s.fontSize}px`,'line-height':s.lineHeight,'body-align':s.align,'paragraph-space':`${s.paragraphSpace}px`,'first-indent':`${s.firstIndent}em`,'heading-font':FONTS[s.headingFont],'heading-size':`${s.headingSize}px`,'heading-align':s.headingAlign,'heading-caps':s.smallCaps?'small-caps':'normal','opening-space':`${s.openingSpace}px`,'number-size':`${s.numberSize}px`,'number-gap':`${s.numberGap}px`,'text-gap':`${s.textGap}px`,'hyphens':s.hyphenate?'auto':'manual'}))page.style.setProperty(`--book-${key}`,String(value));
        o.editor.lang=s.language;
      }else {
        o.editor.removeAttribute('lang');
        for(const key of ['body-font','body-size','line-height','body-align','paragraph-space','first-indent','heading-font','heading-size','heading-align','heading-caps','opening-space','number-size','number-gap','text-gap','hyphens'])page.style.removeProperty(`--book-${key}`);
      }
  }
  function mount(o){
    const doc=o.page.ownerDocument,panel=o.panel;
    const node=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});
    const style=node('style');style.textContent=styles;doc.head.append(style);
    const section=node('details');section.className='book-typography';section.append(node('summary','Estilos e abertura'));
    const scopeLabel=node('p');scopeLabel.className='book-style-scope';
    const enabledLabel=node('label'),enabled=node('input');enabled.type='checkbox';enabledLabel.className='book-style-check';enabledLabel.append(enabled,doc.createTextNode(' Usar estilos compartilhados'));
    const form=node('div');form.className='book-style-fields';
    const controls=new Map();
    function group(title){const g=node('details');g.append(node('summary',title));const body=node('div');body.className='book-style-fields';g.append(body);form.append(g);return body;}
    function field(parent,key,label,type,choices){const row=node('label',label),input=node(type==='select'?'select':'input');
      if(type==='select')for(const [value,name] of choices){const option=node('option',name);option.value=value;input.append(option);}
      else {input.type=type;if(type==='number'){input.required=true;input.min=ranges[key][0];input.max=ranges[key][1];input.step=['lineHeight','firstIndent'].includes(key)?'.05':'1';}if(type==='text')input.maxLength=40;}
      if(type==='checkbox'){row.textContent='';row.className='book-style-check';row.append(input,doc.createTextNode(` ${label}`));}else row.append(input);
      input.dataset.bookStyleField=key;controls.set(key,input);parent.append(row);return input;
    }
    const presetRow=node('label','Modelo'),preset=node('select');for(const [value,name] of [['custom','Personalizado'],['classic','Romance clássico'],['airy','Leitura arejada'],['modern','Contemporâneo']]){const option=node('option',name);option.value=value;preset.append(option);}presetRow.append(preset);form.append(presetRow);
    const fontChoices=[['serif','Serifada · Georgia'],['classic','Serifada · Palatino'],['sans','Sem serifa · Sistema']];
    const body=group('Corpo do texto');field(body,'font','Fonte','select',fontChoices);field(body,'fontSize','Tamanho (px)','number');field(body,'lineHeight','Entrelinha','number');field(body,'align','Alinhamento','select',[['left','À esquerda'],['justify','Justificado']]);
    const paragraphs=group('Parágrafos');field(paragraphs,'firstIndent','Recuo da primeira linha (em)','number');field(paragraphs,'paragraphSpace','Espaço entre parágrafos (px)','number');field(paragraphs,'skipFirstIndent','Sem recuo após títulos e separadores','checkbox');field(paragraphs,'hyphenate','Hifenização automática do navegador','checkbox');field(paragraphs,'language','Idioma do texto','select',[['pt-BR','Português · Brasil'],['pt-PT','Português · Portugal'],['en','Inglês'],['es','Espanhol'],['fr','Francês'],['de','Alemão']]);
    const opening=group('Abertura do capítulo');field(opening,'headingFont','Fonte do título','select',fontChoices);field(opening,'headingSize','Tamanho do título (px)','number');field(opening,'headingAlign','Alinhamento','select',[['left','À esquerda'],['center','Centralizado'],['right','À direita']]);field(opening,'smallCaps','Título em versaletes','checkbox');field(opening,'openingSpace','Espaço acima da abertura (px)','number');field(opening,'numberSize','Tamanho do número (px)','number');field(opening,'numberGap','Distância entre número e título (px)','number');field(opening,'textGap','Distância até o texto (px)','number');field(opening,'numberFormat','Apresentação do número','select',[['label','Nome e número'],['arabic','1, 2, 3…'],['roman','I, II, III…']]);field(opening,'numberLabel','Nome da numeração','text');
    const chapterSection=node('details');chapterSection.append(node('summary','Abertura desta seção'));const chapterForm=node('div');chapterForm.className='book-style-fields';chapterSection.append(chapterForm);
    const chapterLabel=node('label'),chapterEnabled=node('input');chapterEnabled.type='checkbox';chapterLabel.className='book-style-check';chapterLabel.append(chapterEnabled,doc.createTextNode(' Mostrar abertura'));
    const chapterFields=node('div');chapterFields.className='book-style-fields';
    const titleLabel=node('label','Título da seção'),chapterTitle=node('input');chapterTitle.type='text';chapterTitle.maxLength=500;titleLabel.append(chapterTitle);
    const numberLabel=node('label','Numeração'),chapterMode=node('select');for(const [value,name] of [['auto','Automática pela ordem do livro'],['custom','Número escolhido'],['none','Sem número']]){const option=node('option',name);option.value=value;chapterMode.append(option);}numberLabel.append(chapterMode);
    const valueLabel=node('label','Número'),chapterValue=node('input');chapterValue.type='number';chapterValue.required=true;chapterValue.min=1;chapterValue.max=9999;chapterValue.step=1;valueLabel.append(chapterValue);
    const alignmentLabel=node('label','Alinhamento deste título'),chapterAlign=node('select');for(const [value,name] of [['','Seguir estilo do livro'],['left','À esquerda'],['center','Centralizado'],['right','À direita'],['justify','Justificado']]){const option=node('option',name);option.value=value;chapterAlign.append(option);}alignmentLabel.append(chapterAlign);
    const help=node('p','O título acima é o mesmo nome do documento. A numeração é calculada separadamente.');help.className='book-style-help';
    chapterFields.append(titleLabel,numberLabel,valueLabel,help);chapterForm.append(chapterLabel,alignmentLabel,chapterFields);
    const status=node('p');status.className='book-style-help';status.setAttribute('role','status');
    section.append(scopeLabel,enabledLabel,form,chapterSection,status);panel.append(section);
    let formKey='',signature='',applied='',layoutFrame=0;
    function context(){const c=o.context();return {...c,style:normalizeStyle(c.book?c.book.bookStyle:c.record?.bookStyle),chapter:normalizeChapter(c.record?.chapterHeading)};}
    function layout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;o.layout();});}
    function apply(c){
      const active=Boolean(c.record&&c.record.layout==='book'),s=active&&c.style?.enabled?c.style:null,page=o.page;
      const heading=active&&c.chapter?.enabled?numberText(chapterNumber(c.record,c.records),s):'';
      const next=JSON.stringify([active,s,c.chapter,heading,c.record?.introSpacing,c.record?.bookSection]);
      if(applied===next)return;applied=next;
      decorate(o,c);
      if(o.introSpacing){o.introSpacing.placeholder=s?'Do estilo do livro':'Padrão';o.introSpacing.title=s?'Deixe vazio para seguir a distância do estilo do livro.':'Distância até o texto. Deixe vazio para restaurar o padrão.';}
      layout();
    }
    function refresh(force=false){
      const c=context();apply(c);section.hidden=!c.record||c.record.layout!=='book';
      const next=JSON.stringify([c.key,c.style,c.chapter,c.record?.title,c.record?.bookSection,c.editable,c.book?.name]);
      if(!force&&c.key===formKey&&panel.contains(doc.activeElement))return;
      if(!force&&signature===next)return;signature=next;formKey=c.key;
      const s=c.style||base;scopeLabel.textContent=c.book?`Estilo compartilhado por todos os capítulos de “${c.book.name}”`:'Estilo deste documento';
      enabled.checked=Boolean(c.style?.enabled);enabledLabel.lastChild.textContent=c.book?' Usar estilos compartilhados':' Usar estilos neste documento';form.hidden=!enabled.checked;
      const comparable=c.style?{...c.style}:null;if(comparable)delete comparable.edition;
      preset.value=Object.keys(presets).find(name=>JSON.stringify(normalizeStyle(presets[name]))===JSON.stringify(comparable))||'custom';for(const [key,input] of controls){if(input.type==='checkbox')input.checked=s[key];else input.value=String(s[key]);input.disabled=!c.editable;}
      enabled.disabled=preset.disabled=!c.editable;
      chapterEnabled.checked=Boolean(c.chapter?.enabled);chapterEnabled.disabled=!c.editable;chapterFields.hidden=!c.chapter?.enabled;chapterTitle.value=o.title.textContent.trim()||c.record?.title||'';chapterMode.value=c.chapter?.numbering||'auto';chapterValue.value=String(c.chapter?.number||1);valueLabel.hidden=chapterMode.value!=='custom'&&Boolean(c.book);chapterAlign.value=c.chapter?.alignment||'';chapterAlign.disabled=chapterTitle.disabled=chapterMode.disabled=chapterValue.disabled=!c.editable;
      const numberedChapter=!c.record?.bookSection?.role||c.record.bookSection.role==='chapter';numberLabel.hidden=!numberedChapter;if(!numberedChapter)valueLabel.hidden=true;help.textContent=numberedChapter?'O título acima é o mesmo nome do documento. A numeração é calculada separadamente.':'Esta função editorial não usa numeração de capítulos. O título é o mesmo nome do documento.';
      if(!c.book&&chapterMode.value==='auto')numberLabel.title='Documentos avulsos usam o número escolhido até serem movidos para um livro.';else numberLabel.removeAttribute('title');
      status.textContent='';
    }
    function commit(kind,value){
      try{const c=context();if(c.key!==formKey||!c.editable)throw new Error('O capítulo ou sua permissão mudou. Abra as configurações novamente.');o.change(kind,value,c.key);refresh(true);}catch(error){status.textContent=error.message;}
    }
    enabled.addEventListener('change',()=>commit('style',{...(context().style||base),enabled:enabled.checked}));
    preset.addEventListener('change',()=>{if(presets[preset.value])commit('style',{...clone(presets[preset.value]),...(context().style?.edition?{edition:context().style.edition}:{})});});
    for(const [key,input] of controls)input.addEventListener('change',()=>{if(!input.validity.valid)return;const c=context();commit('style',{...(c.style||base),[key]:input.type==='checkbox'?input.checked:input.type==='number'?input.valueAsNumber:input.value});});
    function commitChapter(){if(!chapterValue.validity.valid)return;commit('chapter',{schema_version:1,enabled:chapterEnabled.checked,numbering:chapterMode.value,number:chapterValue.valueAsNumber||1,alignment:chapterAlign.value||null});}
    chapterAlign.addEventListener('change',commitChapter);chapterEnabled.addEventListener('change',commitChapter);chapterMode.addEventListener('change',commitChapter);chapterValue.addEventListener('change',commitChapter);
    chapterTitle.addEventListener('change',()=>{const value=chapterTitle.value.trim();if(!value){status.textContent='Dê um título ao capítulo.';return;}commit('title',value);});
    return Object.freeze({refresh,focused:()=>panel.contains(doc.activeElement)});
  }
  const styles=`
.book-typography>summary,.book-style-fields>details>summary,.book-typography>details>summary{cursor:pointer;font-size:12px;color:#ddd}
.book-typography[hidden],.book-style-fields[hidden]{display:none}
.book-style-scope,.book-style-help{color:#999;font-size:11px;line-height:1.5;margin:8px 0}
.book-style-fields{display:grid;gap:10px;margin-top:10px}.book-style-fields>details{border-top:1px solid #ffffff14;padding-top:8px}
.page-settings-popover .book-style-check{display:flex;align-items:center;gap:7px}.book-style-check input{margin:0;flex:none}
.book-style-fields input:not([type=checkbox]),.book-style-fields select{width:100%;box-sizing:border-box;min-width:0;height:34px;padding:0 8px;border:1px solid #ffffff20;border-radius:6px;background:#111;color:#eee;font:inherit}
.chapter-heading-number{font-family:var(--book-heading-font,inherit);font-weight:400;font-size:var(--book-number-size,16px);line-height:1.4;text-align:var(--book-heading-align,center);margin:var(--book-opening-space,0px) 0 var(--book-number-gap,16px);color:var(--document-ink,#fff);user-select:none}
.chapter-heading-number[hidden]{display:none}
.page[data-chapter-opening]:has(.chapter-heading-number[hidden]) .doc-title{margin-top:var(--book-opening-space,0px)}
.page[data-book-style] .content{font-family:var(--book-body-font);font-size:var(--book-body-size);line-height:var(--book-line-height);text-align:var(--book-body-align);hyphens:var(--book-hyphens)}
.page[data-book-style] :is(.content,.book-page-content)>p{margin-block:0 var(--book-paragraph-space);text-indent:var(--book-first-indent)}
.page[data-book-style][data-book-first-indent] .content>p:first-child,
.page[data-book-style][data-book-first-indent] .content>.book-page-content:first-child>p:first-child,
.page[data-book-style][data-book-first-indent] :is(h1,h2,h3,h4,h5,h6,hr,[data-page-break])+p{text-indent:0}
.page[data-book-style] .doc-title{font-family:var(--book-heading-font);font-size:var(--book-heading-size);text-align:var(--book-heading-align);font-variant-caps:var(--book-heading-caps)}
.page[data-chapter-title-align=left] .doc-title{text-align:left}.page[data-chapter-title-align=center] .doc-title{text-align:center}.page[data-chapter-title-align=right] .doc-title{text-align:right}.page[data-chapter-title-align=justify] .doc-title{text-align:justify}
.page[data-book-style] .content :is(h1,h2,h3,h4,h5,h6){font-family:var(--book-heading-font)}
.page[data-book-style]:has(.doc-subtitle[hidden]) .doc-title,.page[data-book-style] .doc-subtitle{margin-bottom:var(--book-text-gap)}
.page[data-book-style][data-custom-intro-spacing]:has(.doc-subtitle[hidden]) .doc-title,.page[data-book-style][data-custom-intro-spacing] .doc-subtitle{margin-bottom:var(--intro-spacing)}
.page[data-book-style] .content>:first-child,.page[data-book-style] .content>.book-page-content:first-child>:first-child{margin-top:0}
.page[data-book-style]:not([data-chapter-opening]) .doc-title{margin-top:var(--book-opening-space)}
`;
  root.HeartspaceDocsBookTypography=Object.freeze({normalizeStyle,normalizeChapter,chapterNumber,numberText,decorate,preset:name=>clone(presets[name]||base),mount});
})(globalThis);
