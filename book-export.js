/* Editorial outputs are local projections; the manuscript and asset registry stay intact. */
(function(root){
  'use strict';
  const XHTML='http://www.w3.org/1999/xhtml',EPUB='http://www.idpf.org/2007/ops';
  const encoder=new TextEncoder(),xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const filename=value=>(value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100)||'livro');
  // EPUB requires an uncompressed mimetype as the first entry, without extra fields.
  function archive(files){
    if(files.length>1000)throw new Error('O EPUB excede 1000 arquivos. Divida a edição em volumes.');
    const local=[],central=[],names=new Set();let offset=0,size=0;
    for(const file of files){
      if(!/^(mimetype|META-INF\/container\.xml|EPUB\/(package\.opf|nav\.xhtml|book\.css|section-\d+\.xhtml|assets\/image-\d+\.(png|jpg|gif|svg)))$/.test(file.name)||names.has(file.name))throw new Error('Um caminho do EPUB é inválido ou repetido.');
      names.add(file.name);const name=encoder.encode(file.name),bytes=typeof file.data==='string'?encoder.encode(file.data):file.data;
      if(!(bytes instanceof Uint8Array))throw new Error('Um recurso do EPUB não pôde ser lido.');
      if(offset+bytes.length>100*1024*1024)throw new Error('O EPUB excede 100 MB. Reduza as imagens ou divida a edição em volumes.');
      const crc=root.HeartspaceNarrativePackage.crc32(bytes),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);header.set(name,30);local.push(header,bytes);
      const entry=new Uint8Array(46+name.length),d=new DataView(entry.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);entry.set(name,46);central.push(entry);size+=entry.length;offset+=header.length+bytes.length;
    }
    const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
    return new Blob([...local,...central,end],{type:'application/epub+zip'});
  }
  const xhtml=(title,language,body)=>`<?xml version="1.0" encoding="utf-8"?><html xmlns="${XHTML}" xmlns:epub="${EPUB}" lang="${xml(language)}" xml:lang="${xml(language)}"><head><title>${xml(title)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head><body>${body}</body></html>`;
  function ebookCss(style){
    const s=style?.enabled?style:null,d=s?.design||{},fonts={serif:'Georgia,serif',classic:'Palatino,Georgia,serif',sans:'sans-serif'};
    return `body{font-family:${fonts[s?.font]||'serif'};line-height:${s?.lineHeight||1.5};margin:5%;text-align:${s?.align||'left'};hyphens:${s?.hyphenate?'auto':'manual'}}
p{margin:0 0 ${s?(s.paragraphSpace/s.fontSize).toFixed(3):'.5'}em;text-indent:${s?.firstIndent||0}em;orphans:2;widows:2}h1,h2,h3,h4,h5,h6{font-family:${fonts[s?.headingFont]||'serif'};break-after:avoid}h1{text-align:${s?.headingAlign||'left'};font-size:${s?(s.headingSize/s.fontSize).toFixed(3):'2'}em;font-variant:${s?.smallCaps?'small-caps':'normal'};margin:0 0 ${s?(s.textGap/s.fontSize).toFixed(3):'1'}em}
.opening{text-align:${s?.headingAlign||'center'};margin-top:${s?(s.openingSpace/s.fontSize).toFixed(3):'1'}em}.chapter-number{margin-bottom:${s?(s.numberGap/s.fontSize).toFixed(3):'1'}em}.subtitle{margin-bottom:${s?(s.textGap/s.fontSize).toFixed(3):'1'}em}.ornament{text-align:center;margin-bottom:1em;font-size:1.4em}
${s?.skipFirstIndent?'h1+p,h2+p,h3+p,.opening+p,.scene-break+p,section>p:first-child{text-indent:0}':''}
img{max-width:100%;height:auto}figure{max-width:100%;margin:${(d.illustrationSpace||24)/17}em auto;text-indent:0;break-inside:avoid}figure img{display:block;margin:auto}.frame-line img{box-sizing:border-box;padding:.5em;border:1px solid currentColor}.frame-soft img{box-sizing:border-box;padding:.7em;border:1px solid #888;border-radius:.3em}figcaption{font-size:.8em;text-align:center;margin-top:.5em;font-style:${d.captionFont==='italic'?'italic':'normal'}}.plate{break-before:page;break-after:page}.scene-break{text-align:center;text-indent:0;margin:${(d.separatorSpace??24)/17}em 0;min-height:1em;break-after:avoid}.scene-line{border:0;border-top:1px solid currentColor;width:30%;margin:1.5em auto}
blockquote{margin:1em 5%}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{border-collapse:collapse;max-width:100%;font-size:.9em}td,th{padding:.25em;border:1px solid currentColor}a{color:inherit}aside.footnote{font-size:.85em;margin:1em 0;white-space:pre-wrap}aside.footnote p{text-indent:0}.narrative-label{font-size:.85em;font-weight:bold}.narrative-line{white-space:pre-wrap;margin:.6em 0}.choice-prompt,.choice-text{display:inline;white-space:pre-wrap}.choice-prompt{font-weight:bold}.index-list{list-style:none;padding:0}.index-list li{margin:.5em 0}`;
  }
  async function buildEpub(snapshot,metadata,check,report){
    const doc=snapshot.pages[0].ownerDocument,files=[{name:'mimetype',data:'application/epub+zip'},{name:'META-INF/container.xml',data:'<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'}],assets=[],seen=new Map(),sections=snapshot.sections;
    const language=snapshot.style?.language||'pt-BR',links=new Map(sections.map((entry,index)=>[entry.record.id,`section-${index+1}.xhtml`]));let diagrams=0,assetSize=0,coverAsset=null;
    function addAsset(asset){assetSize+=asset.data.length;if(assetSize>100*1024*1024)throw new Error('As imagens do EPUB excedem 100 MB. Reduza-as ou divida a edição em volumes.');assets.push(asset);}
    async function resource(image){
      const src=image.getAttribute('src')||'',key=image.dataset.localImage?`local:${image.dataset.localImage}`:image.dataset.remoteImage?`remote:${image.dataset.remoteImage}`:src;if(seen.has(key))return seen.get(key);
      if(!/^(data:image\/(png|jpeg|gif|webp|avif);|blob:)/i.test(src))throw new Error('Uma imagem não está disponível localmente. Atualize a prévia antes de exportar.');
      let blob=snapshot.imageBlobs.get(src);
      if(!blob&&src.startsWith('data:')){
        const match=src.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);if(!match)throw new Error('Uma imagem incorporada usa uma codificação não suportada. Insira o arquivo novamente.');
        const binary=atob(match[2]);blob=new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type:match[1]});
      }
      check();if(!blob)throw new Error('Uma imagem não pôde ser lida. Atualize a prévia antes de exportar.');
      let type=blob.type.toLowerCase();
      if(!['image/png','image/jpeg','image/gif'].includes(type)){
        const decoded=doc.createElement('img');decoded.src=src;let deadline;
        try{
          await Promise.race([decoded.decode(),new Promise((resolve,reject)=>{deadline=setTimeout(()=>reject(new Error('Uma imagem demorou demais para carregar. Atualize a prévia e tente novamente.')),10000);})]);check();
          if(!decoded.naturalWidth||!decoded.naturalHeight||decoded.naturalWidth*decoded.naturalHeight>32000000)throw new Error('Uma imagem é grande demais para converter para PNG. Reduza-a antes de exportar.');
          const canvas=doc.createElement('canvas');canvas.width=decoded.naturalWidth;canvas.height=decoded.naturalHeight;canvas.getContext('2d').drawImage(decoded,0,0);
          blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));check();if(!blob)throw new Error('Não foi possível converter uma imagem para PNG.');type='image/png';
        }finally{clearTimeout(deadline);decoded.removeAttribute('src');}
      }
      const path=`assets/image-${assets.length+1}.${{'image/png':'png','image/jpeg':'jpg','image/gif':'gif'}[type]}`,data=new Uint8Array(await blob.arrayBuffer());check();
      if(data.length>100*1024*1024)throw new Error('Uma imagem excede o limite do EPUB.');
      addAsset({path,type,data});seen.set(key,path);return path;
    }
    function diagram(svg){
      const copy=svg.cloneNode(true);
      if(copy.querySelector('image'))throw new Error('Um diagrama contém imagens externas. Substitua-o por uma ilustração incorporada antes de exportar o EPUB.');
      copy.querySelectorAll('script,iframe,object,embed,image,audio,video,animate,animateTransform,set,link,form,input,button,textarea,select').forEach(element=>element.remove());
      for(const element of [copy,...copy.querySelectorAll('*')]){
        for(const attr of [...element.attributes])if(/^on/i.test(attr.name)||/href$/i.test(attr.name)&&!attr.value.startsWith('#')||/url\(\s*['"]?(?!#)/i.test(attr.value))element.removeAttributeNode(attr);
      }
      copy.querySelectorAll('style').forEach(element=>{element.textContent=element.textContent.replace(/@import[^;]*;/gi,'').replace(/url\(\s*['"]?(?!#)[^)]*\)/gi,'none');});
      const ink=doc.createElementNS('http://www.w3.org/2000/svg','style');ink.textContent=diagramStyles;copy.append(ink);
      const path=`assets/image-${assets.length+1}.svg`,data=encoder.encode(new XMLSerializer().serializeToString(copy));addAsset({path,type:'image/svg+xml',data});diagrams++;return path;
    }
    const allowed=new Set('p br hr div span section aside blockquote strong b em i u s del small sub sup mark code pre ul ol li h1 h2 h3 h4 h5 h6 table caption thead tbody tfoot tr th td figure figcaption img a'.split(' '));
    for(let index=0;index<sections.length;index++){
      check();const entry=sections[index],record=entry.record,source=entry.content.cloneNode(true),opening=entry.opening.cloneNode(true),out=doc.implementation.createDocument(XHTML,'section'),body=out.documentElement,notes=[],ids=new Map();
      source.querySelectorAll('.authoring-decoration,[hidden],.mermaid-source,.mermaid-status,[data-book-plate-tail],button,input,textarea,select').forEach(element=>element.remove());
      for(const block of source.querySelectorAll('.narrative-block')){
        if(record.narrativeProfile!=='script')block.querySelectorAll('.narrative-reading-label').forEach(element=>element.remove());
        block.querySelectorAll('.narrative-choice-option:not([data-canonical=true])').forEach(element=>element.remove());
        if(block.dataset.choicePromptEmpty==='true')block.querySelector('.narrative-choice-prompt')?.remove();
      }
      for(const element of source.querySelectorAll('[id]'))ids.set(element.id,`content-${ids.size+1}`);
      const make=(tag,text)=>{const e=out.createElementNS(XHTML,tag);if(text!==undefined)e.textContent=text;return e;};
      const ep=(e,type)=>e.setAttributeNS(EPUB,'epub:type',type);
      const serialize=element=>new XMLSerializer().serializeToString(element);
      async function convert(input,parent){
        if(input.nodeType===3){parent.append(out.createTextNode(input.textContent));return;}if(input.nodeType!==1)return;
        if(input.matches('[hidden],.authoring-decoration,.mermaid-source,.mermaid-status'))return;
        if(input.matches('[data-mermaid-block]')){
          const svg=input.querySelector('.mermaid-preview svg');if(!svg)throw new Error(`Um diagrama de “${record.title}” não está pronto. Corrija a prévia antes de exportar.`);
          const figure=make('figure'),image=make('img'),labels=[...svg.querySelectorAll('.nodeLabel')].map(label=>label.textContent.trim()).filter(Boolean).join('; ');image.setAttribute('src',diagram(svg));image.setAttribute('alt',input.querySelector('figcaption')?.textContent||svg.querySelector('title')?.textContent||(labels?`Diagrama: ${labels}`:'Diagrama'));figure.append(image);parent.append(figure);return;
        }
        if(input.matches('[data-page-break=true]')){const e=make('div');e.setAttribute('style','break-before:page');parent.append(e);return;}
        if(input.matches('[data-book-separator]')){
          const value=input.dataset.bookSeparator==='inherit'?snapshot.style?.design?.separator||'dots':input.dataset.bookSeparator,symbol={dots:'· · ·',stars:'* * *',diamond:'◆',space:'',line:''}[value]||'';
          const e=make(value==='line'?'hr':'div',symbol);e.setAttribute('class',value==='line'?'scene-line':'scene-break');e.setAttribute('role','separator');e.setAttribute('aria-label','Mudança de cena');parent.append(e);return;
        }
        if(input.matches('sup[data-book-footnote]')){
          const number=input.textContent,n=notes.length+1,e=make('sup'),link=make('a',number);link.setAttribute('href',`#note-${n}`);link.setAttribute('id',`reference-${n}`);ep(link,'noteref');e.append(link);parent.append(e);notes.push({number,text:input.dataset.footnoteText||''});return;
        }
        if(!allowed.has(input.localName)){for(const child of input.childNodes)await convert(child,parent);return;}
        const e=make(input.localName);if(ids.has(input.id))e.setAttribute('id',ids.get(input.id));
        for(const attr of ['colspan','rowspan','scope','start','reversed','title','lang'])if(input.hasAttribute(attr))e.setAttribute(attr,input.getAttribute(attr));
        const inline=[];for(const key of ['text-align','font-weight','font-style','text-decoration','white-space']){const value=input.style.getPropertyValue(key);if(value&&!/[{};]|url\(|expression/i.test(value))inline.push(`${key}:${value}`);}if(inline.length)e.setAttribute('style',inline.join(';'));
        if(input.matches('img')){const path=await resource(input);e.setAttribute('src',path);e.setAttribute('alt',input.alt||'');if(role==='cover'&&!coverAsset)coverAsset=path;}
        if(input.matches('a')){
          const href=input.getAttribute('href')||'',target=input.dataset.docRef;
          if(target&&links.has(target))e.setAttribute('href',links.get(target));else if(!target&&/^(https?:|mailto:|tel:)/i.test(href))e.setAttribute('href',href);else if(!target&&href.startsWith('#')&&ids.has(href.slice(1)))e.setAttribute('href',`#${ids.get(href.slice(1))}`);
        }
        if(input.matches('figure')){
          const d=snapshot.style?.enabled?snapshot.style.design:null,explicit=input.dataset.bookIllustration,styled=explicit&&explicit!=='original'||!explicit&&d?.illustrations;
          if(explicit==='page')e.setAttribute('class','plate');
          if(styled){const width=Number(input.dataset.illustrationWidth)||d?.illustrationWidth||100,align=input.dataset.illustrationAlign||d?.illustrationAlign||'center';e.setAttribute('style',`width:${width}%;margin-left:${align==='left'?'0':'auto'};margin-right:${align==='right'?'0':'auto'}`);}
          if(input.dataset.editionIllustration)e.setAttribute('id',`illustration-${input.dataset.editionIllustration}`);
          const frame=input.dataset.illustrationFrame||d?.illustrationFrame;if(styled&&['line','soft'].includes(frame))e.setAttribute('class',`${explicit==='page'?'plate ':''}frame-${frame}`);
          if(input.dataset.captionPosition==='top'){const caption=input.querySelector(':scope>figcaption');if(caption)await convert(caption,e);}
        }
        if(input.matches('figcaption'))e.setAttribute('style',`text-align:${input.closest('figure')?.dataset.captionAlign||'center'}`);
        if(input.matches('.narrative-reading-label'))e.setAttribute('class','narrative-label');
        if(input.matches('.narrative-text,.narrative-variation-version'))e.setAttribute('class','narrative-line');
        if(input.matches('.narrative-choice-prompt'))e.setAttribute('class','choice-prompt');
        if(input.matches('.narrative-choice-options,.narrative-choice-option,.narrative-choice-text'))e.setAttribute('class','choice-text');
        if(input.matches('.narrative-text')&&record.narrativeProfile!=='script'&&input.closest('.narrative-block')?.dataset.narrativeType==='dialogue'&&!input.closest('.narrative-inline'))e.append(out.createTextNode('— '));
        if(input.matches('.narrative-choice-option[data-canonical=true]')&&input.closest('.narrative-block')?.dataset.choicePromptEmpty!=='true')e.append(out.createTextNode(' — '));
        for(const child of input.childNodes){if(child.nodeType===1&&child.matches('figcaption')&&input.dataset.captionPosition==='top')continue;await convert(child,e);}
        parent.append(e);
      }
      const role=root.HeartspaceDocsBookComposition.sectionFor(record).role;
      const semantics={cover:'cover',title:'titlepage',credits:'copyright-page',dedication:'dedication',epigraph:'epigraph',preface:'preface',part:'part',prologue:'prologue',chapter:'chapter',epilogue:'epilogue',appendix:'appendix'};ep(body,semantics[role]);
      if(!opening.hidden){
        const header=make('header');header.setAttribute('class','opening');
        for(const [selector,tag,cls] of [['.book-opening-ornament','div','ornament'],['.chapter-heading-number','div','chapter-number'],['.doc-title','h1',''],['.doc-subtitle','div','subtitle']]){
          const original=opening.querySelector(selector);if(!original||original.hidden||!original.textContent.trim())continue;const e=make(tag,original.textContent);if(cls)e.setAttribute('class',cls);if(selector==='.book-opening-ornament')e.setAttribute('aria-hidden','true');if(tag==='h1'){const align=record.chapterHeading?.alignment||snapshot.style?.headingAlign||record.titleAlign||'left';e.setAttribute('style',`text-align:${align}`);}header.append(e);
        }body.append(header);
      }
      for(const child of source.childNodes)await convert(child,body);
      notes.forEach((note,i)=>{const aside=make('aside'),p=make('p'),back=make('a',`${note.number}. `);aside.setAttribute('id',`note-${i+1}`);aside.setAttribute('class','footnote');ep(aside,'footnote');back.setAttribute('href',`#reference-${i+1}`);back.setAttribute('aria-label',`Voltar à referência ${note.number}`);p.append(back,out.createTextNode(note.text));aside.append(p);body.append(aside);});
      const content=xhtml(record.title,language,serialize(body));
      if(new DOMParser().parseFromString(content,'application/xhtml+xml').querySelector('parsererror'))throw new Error(`O texto de “${record.title}” contém caracteres incompatíveis com EPUB.`);
      files.push({name:`EPUB/section-${index+1}.xhtml`,data:content});report(`Preparando EPUB · ${index+1} de ${sections.length} seções`);await new Promise(resolve=>setTimeout(resolve,0));
    }
    check();files.push({name:'EPUB/book.css',data:ebookCss(snapshot.style)});
    const toc=sections.map((entry,i)=>`<li><a href="section-${i+1}.xhtml">${xml(entry.label||entry.record.title)}</a></li>`).join('');
    let illustrations='';if(snapshot.edition.illustrations){const items=[];sections.forEach((entry,i)=>entry.content.querySelectorAll('figure:has(img) figcaption').forEach(caption=>{if(caption.textContent.trim())items.push(`<li><a href="section-${i+1}.xhtml#illustration-${xml(caption.closest('figure').dataset.editionIllustration)}">${xml(caption.textContent.trim())}</a></li>`);}));if(items.length)illustrations=`<nav aria-label="Lista de ilustrações"><h2>Lista de ilustrações</h2><ol>${items.join('')}</ol></nav>`;}
    files.push({name:'EPUB/nav.xhtml',data:xhtml('Sumário',language,`<nav epub:type="toc" id="toc"><h1>Sumário</h1><ol>${toc}</ol></nav>${illustrations}`)});
    const modified=new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),identifier=root.crypto?.randomUUID?`urn:uuid:${root.crypto.randomUUID()}`:`urn:heartspace:book:${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const manifest=sections.map((entry,i)=>`<item id="section-${i+1}" href="section-${i+1}.xhtml" media-type="application/xhtml+xml"${entry.content.querySelector('[data-mermaid-block]')?' properties="svg"':''}/>`).join('')+assets.map((asset,i)=>`<item id="image-${i+1}" href="${asset.path}" media-type="${asset.type}"${asset.path===coverAsset?' properties="cover-image"':''}/>`).join('');
    const frontRoles=new Set(['cover','title','credits','dedication','epigraph','preface']),indexPosition=sections.findIndex(entry=>!frontRoles.has(root.HeartspaceDocsBookComposition.sectionFor(entry.record).role)),spine=sections.map((entry,i)=>`<itemref idref="section-${i+1}"/>`);
    if(snapshot.edition.contents||snapshot.edition.illustrations)spine.splice(indexPosition<0?spine.length:indexPosition,0,'<itemref idref="nav"/>');
    files.push({name:'EPUB/package.opf',data:`<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${xml(language)}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(metadata.title)}</dc:title><dc:language>${xml(language)}</dc:language>${metadata.author?`<dc:creator>${xml(metadata.author)}</dc:creator>`:''}<meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="book.css" media-type="text/css"/>${manifest}</manifest><spine>${spine.join('')}</spine></package>`});
    for(const file of files.filter(file=>/\.(xml|opf|xhtml)$/.test(file.name)))if(new DOMParser().parseFromString(file.data,'application/xml').querySelector('parsererror'))throw new Error('Um texto de metadados ou índice contém caracteres incompatíveis com EPUB.');
    for(const asset of assets)files.push({name:`EPUB/${asset.path}`,data:asset.data});check();return {blob:archive(files),diagrams};
  }
  function mount(o){
    const doc=o.dialog.ownerDocument,node=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});
    const style=node('style');style.textContent=styles;doc.head.append(style);
    const options=node('details');options.className='book-export-options';options.append(node('summary','Exportação'));
    const fields=node('div'),title=node('input'),author=node('input'),paper=node('input');fields.className='book-export-fields';paper.type='checkbox';paper.checked=true;title.maxLength=300;author.maxLength=300;
    for(const [label,input] of [['Título da edição',title],['Autor (opcional)',author]]){const row=node('label',label);row.append(input);fields.append(row);}
    const paperLabel=node('label','');paperLabel.className='book-export-paper';paperLabel.append(paper,doc.createTextNode(' Papel branco na prévia'));fields.append(paperLabel);
    fields.append(node('p','PDF: use “Salvar como PDF” na janela de impressão, escala 100%, margens nenhuma e cabeçalhos do navegador desligados. EPUB: texto ajustável pelo leitor, sem paginação fixa. Os dados acima pertencem apenas a esta exportação.'));
    const pdf=node('button','PDF / Imprimir'),epub=node('button','Baixar EPUB'),recovery=node('button','Voltar à prévia'),availability=node('p');availability.hidden=recovery.hidden=true;pdf.type=epub.type=recovery.type='button';fields.append(pdf,epub,recovery,availability);options.append(fields);o.bar.after(options);
    let snapshot=null,busy=false,epoch=0,printing=false,printRoot=null,printStyle=null,oldTitle='',metadataKey='',defaultTitle='';
    const valid=()=>{if(!snapshot||!o.valid())throw new Error('Atualize a prévia antes de exportar.');};
    function disabled(){pdf.disabled=epub.disabled=!snapshot||busy||snapshot.available===false;}
    function invalidate(){epoch++;snapshot=null;disabled();}
    function set(value){snapshot=value;if(metadataKey!==value.key){title.value=value.title;author.value='';}else if(title.value===defaultTitle)title.value=value.title;metadataKey=value.key;defaultTitle=value.title;availability.hidden=value.available!==false;availability.textContent=value.available===false?'Abra este projeto no navegador para exportar PDF ou EPUB. A exportação por arquivo ainda não está disponível no app desktop.':'';disabled();}
    function cleanup(){
      if(!printing&&!printRoot&&!printStyle)return;const restore=printing;printing=false;recovery.hidden=true;doc.body.classList.remove('book-printing');printRoot?.remove();printStyle?.remove();printRoot=printStyle=null;if(restore){epoch++;doc.title=oldTitle;busy=false;disabled();o.lock(false);}
    }
    paper.addEventListener('change',()=>o.dialog.toggleAttribute('data-print-preview',paper.checked));o.dialog.toggleAttribute('data-print-preview',true);
    pdf.addEventListener('click',async()=>{const attempt=epoch;try{
      valid();if(busy)return;
      if(snapshot.missingImages)throw new Error('Há imagens indisponíveis. Recupere os arquivos e atualize a prévia antes de imprimir.');
      if(snapshot.sections.some(section=>[...section.content.querySelectorAll('[data-mermaid-block]')].some(block=>!block.querySelector('.mermaid-preview svg'))))throw new Error('Há diagramas sem prévia disponível. Corrija-os e atualize o livro antes de imprimir.');
      if(snapshot.pages.some(page=>page.querySelector('[data-book-overflow]')||page.scrollWidth>page.clientWidth+2||page.scrollHeight>page.clientHeight+2))throw new Error('Há blocos maiores que a área da página. Divida-os ou aumente o papel antes de gerar o PDF. O EPUB mantém o conteúdo completo.');
      if(typeof root.print!=='function')throw new Error('A impressão não está disponível neste ambiente. Abra o projeto no navegador para salvar como PDF.');
      printRoot=node('div');printRoot.className='book-print-root';
      let svgIndex=0;for(const page of snapshot.pages){
        const copy=page.cloneNode(true);copy.id=`book-page-${copy.dataset.physicalPage}`;
        // SVG ids are document-global: print copies must not resolve to editor defs.
        for(const svg of copy.querySelectorAll('svg')){
          svgIndex++;const ids=new Map([...svg.querySelectorAll('[id]')].map((element,i)=>[element.id,`print-${svgIndex}-${i}`]));
          if(svg.id)ids.set(svg.id,`print-svg-${svgIndex}`);
          for(const [id,replacement] of ids){const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(`#${escaped}(?![\\w-])`,'g');for(const element of [svg,...svg.querySelectorAll('*')]){if(element.id===id)element.id=replacement;for(const attr of [...element.attributes])if(attr.name!=='id')element.setAttribute(attr.name,attr.value.replace(pattern,`#${replacement}`));if(element.localName==='style')element.textContent=element.textContent.replace(pattern,`#${replacement}`);}}
        }
        printRoot.append(copy);
      }
      const references=new Map(),labels=new Set();
      for(const ref of printRoot.querySelectorAll('sup[data-book-footnote]')){const key=`${ref.closest('[data-document-id]').dataset.documentId}:${ref.dataset.bookFootnote}`,id=String(references.size+1);references.set(key,id);ref.id=`print-reference-${id}`;const link=node('a',ref.textContent);link.href=`#print-note-${id}`;ref.replaceChildren(link);}
      for(const label of printRoot.querySelectorAll('[data-footnote-edit]')){const key=`${label.closest('[data-document-id]').dataset.documentId}:${label.dataset.footnoteEdit}`,id=references.get(key);if(!id)continue;if(!labels.has(id)){label.id=`print-note-${id}`;labels.add(id);}const link=node('a',label.textContent);link.href=`#print-reference-${id}`;label.replaceChildren(link);}
      printStyle=node('style');printStyle.textContent=`@media print{@page{size:${snapshot.width}px ${snapshot.height}px;margin:0}}`;doc.head.append(printStyle);printRoot.classList.add('book-edition-dialog');doc.body.append(printRoot);
      oldTitle=doc.title;doc.title=title.value.trim()||snapshot.title;printing=busy=true;recovery.hidden=false;disabled();o.lock(true);doc.body.classList.add('book-printing');
      let deadline;
      try{
        await Promise.race([Promise.all([...printRoot.querySelectorAll('img')].map(image=>image.decode())),new Promise((resolve,reject)=>{deadline=setTimeout(()=>reject(new Error('Uma imagem não carregou para impressão. Atualize a prévia e tente novamente.')),10000);})]);
      }finally{clearTimeout(deadline);}
      if(attempt!==epoch||!printing)return;valid();
      o.report('Na impressão, escolha Salvar como PDF. Use escala 100%, margens nenhuma e desligue os cabeçalhos do navegador.');
      root.print();
      // Nonblocking print implementations keep their projection until afterprint.
    }catch(error){if(attempt===epoch){cleanup();o.report(error.message);}}});
    epub.addEventListener('click',async()=>{const attempt=epoch;let captured;try{
      valid();if(busy)return;if(snapshot.missingImages)throw new Error('Há imagens indisponíveis. Recupere os arquivos e atualize a prévia antes de baixar o EPUB.');
      captured=snapshot;busy=true;disabled();o.lock(true);const check=()=>{valid();if(epoch!==attempt||snapshot!==captured)throw new Error('O contexto mudou durante a exportação. Abra a prévia novamente.');};
      const metadata={title:title.value.trim()||captured.title,author:author.value.trim()},result=await buildEpub(captured,metadata,check,o.report);check();
      const url=URL.createObjectURL(result.blob),link=node('a');link.href=url;link.download=`${filename(metadata.title)}.epub`;link.hidden=true;o.dialog.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      o.report(`EPUB gerado com ${captured.sections.length} seções.${result.diagrams?' Diagramas usam SVG; confira o suporte no leitor de destino.':''}`);
    }catch(error){if(epoch===attempt)o.report(`Não foi possível exportar: ${error.message}`);}finally{busy=false;disabled();o.lock(false);}});
    recovery.addEventListener('click',cleanup);root.addEventListener('afterprint',cleanup);root.addEventListener('focus',()=>{if(printing&&!root.matchMedia('print').matches)cleanup();});
    o.dialog.addEventListener('cancel',event=>{if(printing)event.preventDefault();});o.dialog.addEventListener('close',()=>{cleanup();invalidate();});disabled();
    return Object.freeze({invalidate,set,busy:()=>busy});
  }
  const diagramStyles=`.nodeLabel,.nodeLabel *{color:#111!important}.node :is(rect,polygon,circle,ellipse){fill:#fff!important;stroke:#333!important;filter:none!important}text,.label{fill:#111!important;color:#111!important}.flowchart-link{stroke:#333!important}marker path{fill:#333!important;stroke:#333!important}.docs-mermaid-label{box-sizing:border-box;width:210px;max-width:210px;overflow-wrap:anywhere;white-space:normal;text-align:left}.nodeLabel small{display:block;margin-bottom:5px;color:#245c77!important;font:700 10px/1.2 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.nodeLabel strong{display:block;margin-bottom:5px;font:600 14px/1.25 Arial,sans-serif;white-space:normal}.docs-mermaid-label>span{display:block;font:400 12px/1.4 Arial,sans-serif;white-space:normal}`;
  const styles=`
.book-export-options{flex:none;padding:8px 16px;border-bottom:1px solid #ffffff18;font-size:12px}.book-export-options>summary{cursor:pointer}.book-export-fields{display:flex;align-items:end;gap:10px;flex-wrap:wrap;padding-top:10px}.book-export-fields>label{display:grid;gap:5px}.book-export-fields input:not([type=checkbox]){box-sizing:border-box;width:220px;max-width:100%;padding:7px;background:#202020;border:1px solid #ffffff26;border-radius:5px;color:#eee;font:inherit}.book-export-fields>label.book-export-paper{display:flex;align-items:center;align-self:center}.book-export-fields>p{flex-basis:100%;margin:0;line-height:1.5;color:#aaa}
.book-edition-dialog[data-print-preview] .page,.book-print-root .page{--paper:#fff;--document-ink:#111;background:#fff;color:#111;color-scheme:light}
.book-edition-dialog[data-print-preview] .page :is(.doc-title,.doc-subtitle,.content,.content *),.book-print-root .page :is(.doc-title,.doc-subtitle,.content,.content *){color:inherit}
.book-edition-dialog[data-print-preview] .content :is(pre,code,table,td,th,.callout),.book-print-root .content :is(pre,code,table,td,th,.callout){background:transparent!important}
.book-edition-dialog[data-print-preview] .content :is(.narrative-text,.narrative-reading-label,.narrative-choice-text,.narrative-choice-prompt,.narrative-variation-version),.book-print-root .content :is(.narrative-text,.narrative-reading-label,.narrative-choice-text,.narrative-choice-prompt,.narrative-variation-version){color:inherit!important}
.book-edition-dialog[data-print-preview] .mermaid-preview :is(.nodeLabel,.nodeLabel *),.book-print-root .mermaid-preview :is(.nodeLabel,.nodeLabel *){color:#111!important}
.book-edition-dialog[data-print-preview] .mermaid-preview .node :is(rect,polygon,circle,ellipse),.book-print-root .mermaid-preview .node :is(rect,polygon,circle,ellipse){fill:#fff!important;stroke:#333!important;filter:none!important}
.book-edition-dialog[data-print-preview] .mermaid-preview :is(text,.label),.book-print-root .mermaid-preview :is(text,.label){fill:#111!important;color:#111!important}
.book-edition-dialog[data-print-preview] .mermaid-preview .flowchart-link,.book-print-root .mermaid-preview .flowchart-link{stroke:#333!important}.book-edition-dialog[data-print-preview] .mermaid-preview marker path,.book-print-root .mermaid-preview marker path{fill:#333!important;stroke:#333!important}
.book-print-root{display:none}
@media print{
html:has(body.book-printing),body.book-printing{display:block!important;width:auto!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;color:#111!important}
body.book-printing> :not(.book-print-root){display:none!important}
body.book-printing>.book-print-root{display:block!important;position:static!important;inset:auto!important;width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;max-width:none!important;overflow:visible!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;transform:none!important;background:#fff!important;box-shadow:none!important}
body.book-printing .book-edition-dialog::backdrop{display:none!important}
body.book-printing .book-print-root{display:block!important;margin:0!important;padding:0!important;zoom:1!important}
body.book-printing .book-print-root>.book-edition-sheet{display:block!important;margin:0!important;border:0!important;box-shadow:none!important;break-after:page;break-inside:avoid;zoom:1!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}
body.book-printing .book-print-root>.book-edition-sheet:last-child{break-after:auto}
body.book-printing .book-print-root a{color:inherit!important;text-decoration:none!important}
}
`;
  root.HeartspaceDocsBookExport=Object.freeze({mount});
})(globalThis);
