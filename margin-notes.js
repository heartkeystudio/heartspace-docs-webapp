/* Authoring-only margin notes. Anchors describe text; the manuscript is untouched. */
(function(root){
  'use strict';
  const COLORS=['amber','blue','rose','sage'],WIDTH=220,MAX=200;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const bounded=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  function normalize(value){
    if(value==null)return [];
    if(!Array.isArray(value)||value.length>MAX)throw new Error('As notas da margem usam um formato inválido. A fonte deve ser preservada.');
    const ids=new Set();
    return value.map(n=>{
      if(!object(n)||typeof n.id!=='string'||!n.id||n.id.length>100||ids.has(n.id)||typeof n.text!=='string'||n.text.length>4000||!COLORS.includes(n.color)||typeof n.resolved!=='boolean'||!['left','right'].includes(n.side)||!bounded(n.offset,0,4000)||!bounded(n.y,0,1000000)||typeof n.updatedAt!=='string')throw new Error('Uma nota da margem não pôde ser reconhecida. A fonte deve ser preservada.');
      ids.add(n.id);
      const a=n.anchor;
      if(a!==null&&(!object(a)||typeof a.quote!=='string'||!a.quote||a.quote.length>800||typeof a.prefix!=='string'||a.prefix.length>40||typeof a.suffix!=='string'||a.suffix.length>40||!Number.isSafeInteger(a.start)||a.start<0||(a.textVersion!==undefined&&(typeof a.textVersion!=='string'||a.textVersion.length>40))))throw new Error('Uma ligação de nota está em formato inválido.');
      return {id:n.id,text:n.text,color:n.color,resolved:n.resolved,side:n.side,offset:n.offset,y:n.y,anchor:a===null?null:{quote:a.quote,prefix:a.prefix,suffix:a.suffix,start:a.start,...(a.textVersion!==undefined?{textVersion:a.textVersion}:{})},updatedAt:n.updatedAt};
    });
  }
  function fromWire(value){if(value==null)return [];if(!object(value)||value.schema_version!==1||!Array.isArray(value.notes))throw new Error('Esta versão das notas da margem não é suportada.');return normalize(value.notes);}
  const toWire=value=>({schema_version:1,notes:normalize(value)});
  function mount(o){
    const doc=o.editor.ownerDocument,area=o.area,wrap=o.wrap,page=o.page;
    const node=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});
    const action=(text,fn)=>{const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;};
    const style=node('style');style.textContent=styles;doc.head.append(style);
    const control=node('div');control.className='margin-notes-menu';
    const toggle=action('Notas',()=>{capture();setMenuOpen(menu.hidden);});toggle.className='tool';toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded','false');
    const menu=node('div');menu.className='margin-notes-popover';menu.hidden=true;
    menu.id='margin-notes-popover';toggle.setAttribute('aria-controls',menu.id);
    const add=action('Nova nota na margem',()=>create()),show=action('Mostrar notas',()=>{visible=!visible;setMenuOpen(false);o.layout();schedule();});
    const resolvedLabel=node('label'),resolvedInput=node('input');resolvedInput.type='checkbox';resolvedLabel.append(resolvedInput,doc.createTextNode(' Mostrar resolvidas'));resolvedInput.addEventListener('change',()=>{showResolved=resolvedInput.checked;o.layout();schedule();});
    const listing=node('nav');listing.className='margin-notes-list';listing.setAttribute('aria-label','Notas deste capítulo');
    const help=node('p','Selecione um trecho antes de criar a nota para ligar uma seta. Arraste a alça para posicioná-la.');
    const undo=action('Desfazer exclusão',()=>{const state=o.state();if(removed?.scope!==state.scope)return;const notes=normalize(state.notes);notes.push(removed.note);write(notes);removed=null;schedule();});undo.hidden=true;
    // Keep the popover outside the horizontally scrolling toolbar so it cannot be clipped.
    menu.append(add,show,resolvedLabel,listing,help,undo);control.append(toggle);o.toolbar.append(control);doc.body.append(menu);
    function setMenuOpen(open){menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)positionMenu();}
    function positionMenu(){
      if(menu.hidden)return;
      const viewport=root.visualViewport,left=(viewport?.offsetLeft||0)+8,top=(viewport?.offsetTop||0)+8;
      const right=left+(viewport?.width||root.innerWidth)-16,bottom=top+(viewport?.height||root.innerHeight)-16;
      const anchor=toggle.getBoundingClientRect(),toolbar=o.toolbar.getBoundingClientRect();
      if(toggle.disabled||!toggle.getClientRects().length||anchor.right<=toolbar.left||anchor.left>=toolbar.right){setMenuOpen(false);return;}
      const width=Math.min(282,Math.max(0,right-left)),y=Math.max(top,anchor.bottom+8);
      Object.assign(menu.style,{width:`${width}px`,left:`${Math.max(left,Math.min(anchor.right-width,right-width))}px`,top:`${y}px`,maxHeight:`${Math.max(0,bottom-y)}px`});
    }
    const board=node('aside');board.className='margin-notes-board';board.setAttribute('aria-label','Notas de autoria na margem');board.hidden=true;
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('margin-notes-arrows');svg.setAttribute('aria-hidden','true');board.append(svg);area.append(board);
    const cards=new Map();let scope='',visible=true,showResolved=false,selected=null,removed=null,active='',frame=0,drag=null,textDirty=true,index=null,lastSpace='';
    function textIndex(){
      if(index&&!textDirty)return index;
      const nodes=[],walker=doc.createTreeWalker(o.editor,NodeFilter.SHOW_TEXT,{acceptNode(n){
        return n.parentElement?.closest('.authoring-decoration,.narrative-meta,.narrative-reading-label,.mermaid-source,.mermaid-preview,[hidden],button,input,textarea,select,[contenteditable="false"]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
      }});let text='',n;
      while((n=walker.nextNode())){nodes.push({node:n,start:text.length,end:text.length+n.data.length});text+=n.data;}
      let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
      textDirty=false;return index={text,nodes,textVersion:`${text.length}:${hash>>>0}`};
    }
    function offset(container,at,map){
      if(container.nodeType===Node.TEXT_NODE){const item=map.nodes.find(x=>x.node===container);return item?item.start+at:null;}
      let total=0;
      for(const item of map.nodes){try{const probe=doc.createRange();probe.setStart(container,at);probe.collapse(true);if(probe.comparePoint(item.node,item.node.data.length)>0)break;total=item.end;}catch(_){return null;}}
      return total;
    }
    function capture(){
      const state=o.state(),selection=doc.getSelection();if(!state.enabled||!selection?.rangeCount)return null;
      const range=selection.getRangeAt(0);
      if(!o.editor.contains(range.startContainer)||!o.editor.contains(range.endContainer))return selected?.scope===state.scope?selected:null;
      if(range.collapsed){selected=null;return null;}
      const map=textIndex(),start=offset(range.startContainer,range.startOffset,map),end=offset(range.endContainer,range.endOffset,map);
      if(start===null||end===null||end<=start)return null;
      const raw=map.text.slice(start,end),quote=raw.trim();
      if(!quote||quote.length>800){selected=null;return null;}
      const from=start+raw.indexOf(quote),rect=range.getBoundingClientRect();
      return selected={scope:state.scope,anchor:{quote,prefix:map.text.slice(Math.max(0,from-40),from),suffix:map.text.slice(from+quote.length,from+quote.length+40),start:from,textVersion:map.textVersion},rect};
    }
    function locate(anchor){
      if(!anchor)return null;const map=textIndex(),candidates=[];let cursor=0;
      if(anchor.textVersion===map.textVersion&&map.text.slice(anchor.start,anchor.start+anchor.quote.length)===anchor.quote){candidates.push({at:anchor.start,score:3});cursor=map.text.length+1;}
      while(cursor<=map.text.length){const at=map.text.indexOf(anchor.quote,cursor);if(at<0)break;
        const prefix=map.text.slice(Math.max(0,at-anchor.prefix.length),at),suffix=map.text.slice(at+anchor.quote.length,at+anchor.quote.length+anchor.suffix.length);
        candidates.push({at,score:Number(Boolean(anchor.prefix)&&prefix===anchor.prefix)+Number(Boolean(anchor.suffix)&&suffix===anchor.suffix)});cursor=at+1;if(candidates.length>200)return null;}
      if(!candidates.length)return null;
      candidates.sort((a,b)=>b.score-a.score);
      // Never choose an arbitrary repeated phrase when surrounding text cannot
      // disambiguate it. A changed/deleted quote remains an explicitly loose note.
      if(candidates.length>1&&candidates[0].score===candidates[1].score)return null;
      if(candidates[0].score===0&&(anchor.prefix||anchor.suffix)&&candidates[0].at!==anchor.start)return null;
      const start=candidates[0].at,end=start+anchor.quote.length;
      const first=map.nodes.find(n=>n.end>start),last=map.nodes.find(n=>n.end>=end);
      if(!first||!last)return null;
      const range=doc.createRange();range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
      const rect=[...range.getClientRects()].find(r=>r.width&&r.height);return rect?{range,rect}:null;
    }
    function write(notes){const state=o.state();if(!state.editable)return false;try{o.change(normalize(notes),state.scope);schedule();return true;}catch(error){o.status(error.message);return false;}}
    function update(id,patch){const state=o.state(),notes=normalize(state.notes),note=notes.find(n=>n.id===id);if(!note)return false;Object.assign(note,patch,{updatedAt:new Date().toISOString()});return write(notes);}
    function currentNotes(){return normalize(o.state().notes).filter(n=>showResolved||!n.resolved);}
    function rightGap(){return o.editor.querySelector('.narrative-block:not(.narrative-inline)')?88:16;}
    function space(){const state=o.state();if(!visible||!state.enabled)return {left:0,right:0};const notes=currentNotes(),left=notes.filter(n=>n.side==='left'),right=notes.filter(n=>n.side==='right');return {left:left.length?WIDTH+32+Math.max(...left.map(n=>n.offset)):0,right:right.length?WIDTH+rightGap()+16+Math.max(...right.map(n=>n.offset)):0};}
    function geometry(){const rect=area.getBoundingClientRect(),paper=page.getBoundingClientRect(),zoom=Number(wrap.style.zoom)||1;return {zoom,x:paper.left-rect.left-area.clientLeft+area.scrollLeft,y:paper.top-rect.top-area.clientTop+area.scrollTop,width:paper.width,height:paper.height,gap:rightGap(),rect};}
    function create(){
      const state=o.state();if(!state.enabled||!state.editable)return;
      const notes=normalize(state.notes);if(notes.length>=MAX){o.status('Há 200 notas neste capítulo. Resolva ou remova algumas antes de criar outra.');return;}
      const selection=capture(),g=geometry(),rect=(selection&&locate(selection.anchor)?.rect)||selection?.rect;
      const y=rect?(rect.top-g.rect.top-area.clientTop+area.scrollTop-g.y)/g.zoom:(area.scrollTop-g.y+60)/g.zoom;
      const note={id:'note-'+(root.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`),text:'',color:'amber',resolved:false,side:'right',offset:16,y:Math.max(0,Math.min(1000000,y)),anchor:selection?.anchor||null,updatedAt:new Date().toISOString()};
      // Offset subsequent loose notes so creating several does not stack them.
      if(!rect)while(notes.some(n=>!n.resolved&&n.side===note.side&&Math.abs(n.y-note.y)<150/g.zoom))note.y+=180/g.zoom;
      notes.push(note);if(!write(notes))return;
      visible=true;active=note.id;menu.hidden=true;toggle.setAttribute('aria-expanded','false');o.layout();schedule();
      requestAnimationFrame(()=>{const card=cards.get(note.id);card?.input.focus();card?.element.scrollIntoView({block:'nearest',inline:'nearest'});});
    }
    function follow(id){const note=normalize(o.state().notes).find(n=>n.id===id),found=locate(note?.anchor);if(!found){o.status('O trecho mudou ou está repetido. Selecione o texto e vincule a nota novamente.');return;}
      const rect=area.getBoundingClientRect();area.scrollTop+=found.rect.top-rect.top-area.clientHeight*.35;active=id;schedule();}
    function makeCard(note){
      const element=node('article');element.className='margin-note';element.setAttribute('aria-label','Nota na margem');
      const header=node('header'),handle=action('⠿',()=>{});handle.className='margin-note-handle';handle.setAttribute('aria-label','Mover nota. Use as setas para reposicionar; Alt e esquerda ou direita para trocar de margem.');handle.title='Arrastar nota';
      const color=node('select');color.setAttribute('aria-label','Cor da nota');for(const [value,label] of [['amber','Âmbar'],['blue','Azul'],['rose','Rosa'],['sage','Verde']]){const opt=node('option',label);opt.value=value;color.append(opt);}color.addEventListener('change',()=>update(note.id,{color:color.value}));
      const resolve=action('Resolver',()=>{const n=normalize(o.state().notes).find(n=>n.id===note.id);if(n&&update(note.id,{resolved:!n.resolved})){o.layout();schedule();}});
      const remove=action('×',()=>{const state=o.state(),notes=normalize(state.notes),n=notes.find(n=>n.id===note.id);if(n&&write(notes.filter(n=>n.id!==note.id))){removed={scope:state.scope,note:n};o.layout();schedule();}});remove.setAttribute('aria-label','Excluir nota');
      header.append(handle,color,resolve,remove);
      const input=node('textarea');input.placeholder='O que falta resolver?';input.maxLength=4000;input.rows=3;input.setAttribute('aria-label','Texto da nota');input.addEventListener('input',()=>{if(update(note.id,{text:input.value})){input.style.height='auto';input.style.height=Math.min(260,Math.max(76,input.scrollHeight))+'px';schedule();}});
      const quote=node('blockquote'),status=node('small'),actions=node('footer'),go=action('Ir ao trecho',()=>follow(note.id)),link=action('Vincular seleção',()=>{const selectedText=capture();if(!selectedText){o.status('Selecione um trecho do capítulo para vincular esta nota (até 800 caracteres).');return;}update(note.id,{anchor:selectedText.anchor});});
      link.addEventListener('pointerdown',event=>event.preventDefault());
      const unlink=action('Soltar seta',()=>update(note.id,{anchor:null}));actions.append(go,link,unlink);element.append(header,input,quote,status,actions);board.append(element);
      element.addEventListener('focusin',()=>{active=note.id;schedule();});element.addEventListener('pointerenter',()=>{active=note.id;schedule();});
      handle.addEventListener('pointerdown',event=>{
        const state=o.state(),n=normalize(state.notes).find(n=>n.id===note.id);if(event.button!==0||!state.editable||!n)return;
        event.preventDefault();handle.focus({preventScroll:true});active=n.id;handle.setPointerCapture(event.pointerId);drag={scope:state.scope,id:n.id,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,scrollTop:area.scrollTop,scrollLeft:area.scrollLeft,note:clone(n),next:clone(n),g:geometry()};element.classList.add('is-dragging');
      });
      handle.addEventListener('pointermove',event=>{
        if(!drag||drag.id!==note.id||drag.pointer!==event.pointerId)return;
        if(o.state().scope!==drag.scope||!o.state().editable){drag=null;return;}
        const g=drag.g,deltaX=event.clientX-drag.startX+area.scrollLeft-drag.scrollLeft,center=g.rect.left+g.x-area.scrollLeft+g.width/2;
        const side=event.clientX<center?'left':'right';
        const startingX=drag.note.side==='left'?g.x-WIDTH-16-drag.note.offset:g.x+g.width+g.gap+drag.note.offset;
        const x=startingX+deltaX,offset=side==='left'?g.x-WIDTH-16-x:x-g.x-g.width-g.gap;
        drag.next={...drag.note,side,offset:Math.max(0,Math.min(4000,offset)),y:Math.max(0,Math.min(1000000,drag.note.y+(event.clientY-drag.startY+area.scrollTop-drag.scrollTop)/g.zoom))};schedule();
      });
      const end=event=>{if(!drag||drag.id!==note.id||drag.pointer!==event.pointerId)return;const finished=drag;drag=null;element.classList.remove('is-dragging');if(finished.scope===o.state().scope&&event.type==='pointerup'){update(note.id,{side:finished.next.side,offset:finished.next.offset,y:finished.next.y});o.layout();}schedule();};
      handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
      handle.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)||!o.state().editable)return;event.preventDefault();const n=normalize(o.state().notes).find(n=>n.id===note.id),step=event.shiftKey?2:12;if(!n)return;
        if(event.altKey&&['ArrowLeft','ArrowRight'].includes(event.key)){update(note.id,{side:event.key==='ArrowLeft'?'left':'right'});o.layout();return;}
        const patch=event.key==='ArrowUp'||event.key==='ArrowDown'?{y:Math.max(0,Math.min(1000000,n.y+(event.key==='ArrowUp'?-step:step)))}:{offset:Math.max(0,Math.min(4000,n.offset+(event.key==='ArrowLeft'?(n.side==='left'?step:-step):(n.side==='right'?step:-step))))};update(note.id,patch);
      });
      return {element,input,color,handle,resolve,remove,quote,status,go,link,unlink};
    }
    function render(){
      frame=0;const state=o.state();
      if(!state.editable)drag=null;
      if(scope!==state.scope){scope=state.scope;drag=null;selected=null;removed=null;active='';textDirty=true;index=null;cards.forEach(c=>c.element.remove());cards.clear();}
      toggle.disabled=!state.enabled;toggle.textContent=state.notes?.length?`Notas · ${state.notes.length}`:'Notas';
      if(!state.enabled)setMenuOpen(false);
      listing.replaceChildren(...normalize(state.notes).map(note=>{
        const item=action(`${note.resolved?'✓ ':''}${note.text.trim().split('\n')[0].slice(0,44)||'Nota sem texto'}`,()=>{
          const openedScope=o.state().scope;visible=true;if(note.resolved){showResolved=true;resolvedInput.checked=true;}
          active=note.id;menu.hidden=true;toggle.setAttribute('aria-expanded','false');o.layout();schedule();
          setTimeout(()=>{if(o.state().scope!==openedScope)return;const card=cards.get(note.id);card?.element.scrollIntoView({block:'center',inline:'nearest'});card?.input.focus({preventScroll:true});},130);
        });item.disabled=!state.enabled;return item;
      }));
      add.disabled=!state.enabled||!state.editable;show.disabled=!state.enabled;show.textContent=visible?'Ocultar notas':'Mostrar notas';undo.hidden=!removed||removed.scope!==scope;undo.disabled=!state.editable;
      positionMenu();
      const spacing=space(),zoom=Number(wrap.style.zoom)||1,base=parseFloat(getComputedStyle(wrap).getPropertyValue('--book-gutter'))||64;
      const spaceKey=`${spacing.left}:${spacing.right}`;if(lastSpace!==spaceKey){lastSpace=spaceKey;o.layout();}
      const left=`${base+spacing.left/zoom}px`,right=`${base+spacing.right/zoom}px`;
      if(wrap.style.getPropertyValue('--book-left-gutter')!==left)wrap.style.setProperty('--book-left-gutter',left);
      if(wrap.style.getPropertyValue('--book-right-gutter')!==right)wrap.style.setProperty('--book-right-gutter',right);
      wrap.toggleAttribute('data-margin-notes-space',Boolean(spacing.left||spacing.right));
      board.hidden=!visible||!state.enabled||!state.notes.length;
      if(board.hidden){svg.replaceChildren();return;}
      const g=geometry(),notes=currentNotes(),ids=new Set(notes.map(n=>n.id));
      cards.forEach((c,id)=>{if(!ids.has(id)){c.element.remove();cards.delete(id);}});
      svg.replaceChildren();
      const width=Math.max(area.clientWidth,g.x+g.width+spacing.right+base*zoom),height=Math.max(area.clientHeight,g.y+g.height+100,...notes.map(n=>g.y+n.y*g.zoom+340));
      svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      for(const original of notes){const note=drag?.id===original.id?drag.next:original;let c=cards.get(note.id);if(!c){c=makeCard(note);cards.set(note.id,c);}
        const x=note.side==='left'?g.x-WIDTH-16-note.offset:g.x+g.width+g.gap+note.offset,y=g.y+note.y*g.zoom;
        c.element.style.left=`${Math.max(8,x)}px`;c.element.style.top=`${Math.max(8,y)}px`;c.element.dataset.color=note.color;c.element.classList.toggle('is-resolved',note.resolved);c.element.classList.toggle('is-active',active===note.id);c.element.classList.toggle('is-dragging',drag?.id===note.id);
        c.input.readOnly=!state.editable;if(c.input.value!==note.text)c.input.value=note.text;
        c.color.value=note.color;c.color.disabled=!state.editable;c.resolve.disabled=!state.editable;c.resolve.textContent=note.resolved?'Reabrir':'Resolver';c.remove.disabled=!state.editable;c.handle.disabled=!state.editable;c.link.disabled=!state.editable;c.unlink.hidden=!note.anchor;c.unlink.disabled=!state.editable;
        c.quote.textContent=note.anchor?.quote||'';c.quote.hidden=!note.anchor;
        const found=locate(note.anchor);c.go.hidden=!note.anchor;c.go.disabled=!found;
        c.status.textContent=note.anchor?(found?'Ligada ao trecho':'Trecho alterado ou ambíguo. Vincule novamente.'):'Nota livre';
        if(!found)continue;
        const targetX=found.rect[note.side==='left'?'left':'right']-g.rect.left-area.clientLeft+area.scrollLeft,targetY=found.rect.top-g.rect.top-area.clientTop+area.scrollTop+found.rect.height/2;
        const startX=Math.max(8,x)+(note.side==='left'?WIDTH:0),startY=y+24,direction=note.side==='left'?1:-1,curve=Math.max(24,Math.abs(targetX-startX)*.45);
        const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${startX} ${startY} C${startX+direction*curve} ${startY},${targetX-direction*curve} ${targetY},${targetX} ${targetY} M${targetX-direction*6} ${targetY-4} L${targetX} ${targetY} L${targetX-direction*6} ${targetY+4}`);path.dataset.color=note.color;path.classList.toggle('is-active',active===note.id);svg.append(path);
      }
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(render);}
    const changes=new MutationObserver(()=>{textDirty=true;schedule();});changes.observe(o.editor,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','data-active','data-reading-active']});
    new MutationObserver(()=>{o.layout();schedule();}).observe(doc.body,{attributes:true,attributeFilter:['class','data-work-area']});
    if(root.ResizeObserver){const observer=new ResizeObserver(schedule);observer.observe(page);observer.observe(area);observer.observe(wrap);}
    root.addEventListener('resize',schedule);
    root.visualViewport?.addEventListener('resize',positionMenu);
    root.visualViewport?.addEventListener('scroll',positionMenu);
    o.toolbar.addEventListener('scroll',positionMenu,{passive:true});
    doc.addEventListener('selectionchange',capture);
    doc.addEventListener('pointerdown',event=>{if(!control.contains(event.target)&&!menu.contains(event.target))setMenuOpen(false);});
    doc.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}
      if(event.ctrlKey&&event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='m'&&o.editor.contains(doc.activeElement)&&o.state().enabled&&o.state().editable){event.preventDefault();create();}
    });
    add.addEventListener('pointerdown',event=>event.preventDefault());
    schedule();return Object.freeze({schedule,space});
  }
  const styles=`
.margin-notes-menu{position:relative;flex:none}.margin-notes-popover{position:fixed;z-index:85;box-sizing:border-box;overflow:auto;width:282px;padding:10px;display:grid;gap:6px;background:#1b1b1b;border:1px solid #ffffff25;border-radius:9px;box-shadow:0 12px 32px #0008}.margin-notes-popover[hidden]{display:none}.margin-notes-popover button{text-align:left;background:#ffffff0a}.margin-notes-popover label{font-size:12px;display:flex;gap:6px;align-items:center}.margin-notes-list{display:grid;gap:3px;max-height:180px;overflow:auto}.margin-notes-list:empty{display:none}.margin-notes-list button{font-size:11px;padding:5px 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.margin-notes-popover p{font-size:11px;color:#999;line-height:1.5;margin:6px 0}.margin-notes-board{position:absolute;left:0;top:0;width:0;height:0;z-index:7;pointer-events:none}.margin-notes-board[hidden]{display:none}.margin-notes-arrows{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}.margin-notes-arrows path{fill:none;stroke:#a58b61;stroke-width:1;opacity:.48}.margin-notes-arrows path[data-color=blue]{stroke:#72aed3}.margin-notes-arrows path[data-color=rose]{stroke:#d590a7}.margin-notes-arrows path[data-color=sage]{stroke:#8eb497}.margin-notes-arrows path.is-active{opacity:.95;stroke-width:1.5}.margin-note{--note-ink:#dbc49c;position:absolute;width:220px;padding:10px;box-sizing:border-box;border:1px solid #8b73533d;border-top:2px solid #a58b61;border-radius:7px;background:#28251f;color:#ddd;box-shadow:0 6px 16px #0003;pointer-events:auto;font-size:12px;line-height:1.5}.margin-note[data-color=blue]{--note-ink:#a0c9e3;background:#20282e;border-color:#72aed33d;border-top-color:#72aed3}.margin-note[data-color=rose]{--note-ink:#e0b0c0;background:#2d2328;border-color:#d590a73d;border-top-color:#d590a7}.margin-note[data-color=sage]{--note-ink:#b6d2bc;background:#232b25;border-color:#8eb4973d;border-top-color:#8eb497}.margin-note.is-active{box-shadow:0 7px 20px #0005}.margin-note.is-resolved{opacity:.65}.margin-note>header{display:flex;gap:4px;align-items:center;margin-bottom:7px}.margin-note button{font-size:10px;min-height:26px;padding:3px 5px;background:transparent;color:var(--note-ink)}.margin-note button:hover{background:#ffffff0b}.margin-note button:disabled{opacity:.4;cursor:default}.margin-note .margin-note-handle{touch-action:none;cursor:grab;font-size:18px;padding-inline:2px}.margin-note.is-dragging .margin-note-handle{cursor:grabbing}.margin-note select{width:67px;min-height:26px;font-size:10px;padding:2px;background:transparent;color:var(--note-ink);border:0}.margin-note textarea{display:block;width:100%;box-sizing:border-box;min-height:76px;max-height:260px;resize:vertical;border:0;background:transparent;color:#eee;font:inherit;line-height:1.6;padding:2px;outline-offset:3px}.margin-note blockquote{margin:8px 0 4px;padding:2px 0 2px 7px;border-left:2px solid var(--note-ink);font-size:10px;max-height:62px;overflow:auto;color:var(--note-ink);white-space:pre-wrap}.margin-note small{display:block;color:#aaa;font-size:10px}.margin-note footer{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}body.writing-clean .margin-notes-board,body.reading-mode .margin-notes-board{display:none!important}@media print{.margin-notes-board,.margin-notes-menu,.margin-notes-popover{display:none!important}.editor-wrap[data-margin-notes-space]{--book-left-gutter:0px!important;--book-right-gutter:0px!important;padding-inline:0!important}}
`;
  root.HeartspaceDocsMarginNotes=Object.freeze({normalize,fromWire,toWire,mount});
})(globalThis);
