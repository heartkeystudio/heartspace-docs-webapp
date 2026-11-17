/* Visual pagination. Fragment markers never belong to the authoring source. */
(function(root){
  'use strict';
  const PART='data-book-fragment',CONT='data-book-continuation',END='data-book-fragment-end',INLINE='data-book-inline';
  const runtime=[PART,CONT,END,INLINE,'data-book-justify','data-book-overflow'];
  let serial=0;
  const uid=()=>`bp-${++serial}`;
  const composing=new WeakSet();
  const viewports=new WeakMap();
  // A collapsed element range can have an empty rectangle after restoring a
  // bookmark. Resolve its text boundary instead of using the entire paragraph.
  function caretRect(editor,selection=editor.ownerDocument.getSelection()){
    if(!selection?.rangeCount||!selection.isCollapsed||!editor.contains(selection.focusNode))return null;
    const range=selection.getRangeAt(0).cloneRange(),usable=rect=>rect&&Number.isFinite(rect.top)&&rect.height>0;
    let rect=range.getBoundingClientRect();if(usable(rect))return rect;
    const node=selection.focusNode,offset=selection.focusOffset;
    if(node.nodeType===1){
      const edge=(child,last)=>{
        if(!child)return null;
        const walker=editor.ownerDocument.createTreeWalker(child,4),texts=[];
        if(child.nodeType===3)texts.push(child);else{let text;while((text=walker.nextNode()))texts.push(text);}
        if(last)texts.reverse();
        for(const text of texts){if(!text.length)continue;range.setStart(text,last?text.length:0);range.collapse(true);const r=range.getBoundingClientRect();if(usable(r))return r;}
        return null;
      };
      rect=edge(node.childNodes[offset],false)||edge(node.childNodes[offset-1],true);if(rect)return rect;
      if(!node.textContent.trim()&&node.matches('p,div,li,td,th')){rect=node.getBoundingClientRect();if(usable(rect))return {top:rect.top,bottom:rect.top+Math.min(rect.height,24),height:Math.min(rect.height,24)};}
    }
    return null;
  }
  function captureViewport(editor){
    const pending=viewports.get(editor);if(pending)return pending;
    const area=editor.closest('.editor-area');if(!area)return null;
    const bounds=area.getBoundingClientRect(),rect=caretRect(editor),visible=rect&&rect.bottom>bounds.top&&rect.top<bounds.bottom;
    const anchor={area,top:visible?rect.top:null,scrollTop:area.scrollTop,scrollLeft:area.scrollLeft,minHeight:editor.style.getPropertyValue('min-height'),priority:editor.style.getPropertyPriority('min-height'),reveal:false};
    // Removing the wrappers must not shrink the scroll range while the browser
    // is applying an edit or while the paginator is measuring the new leaves.
    editor.style.setProperty('min-height',`${editor.offsetHeight}px`);
    viewports.set(editor,anchor);return anchor;
  }
  function restoreViewport(editor,anchor=viewports.get(editor)){
    if(!anchor)return;
    viewports.delete(editor);
    if(anchor.minHeight)editor.style.setProperty('min-height',anchor.minHeight,anchor.priority);else editor.style.removeProperty('min-height');
    const rect=caretRect(editor),area=anchor.area;
    // During typing keep the viewport itself still. Natural line wraps or an
    // explicit page break may move the caret; the caller reveals it only when
    // it actually leaves the usable area. Layout-only changes retain its line.
    if(!anchor.reveal&&anchor.top!=null&&rect)area.scrollTop+=rect.top-anchor.top;else area.scrollTop=anchor.scrollTop;
    area.scrollLeft=anchor.scrollLeft;
  }
  function normalizeTextFlow(editor){
    // Plain clipboard wrappers carry no authoring identity or formatting. Keep
    // their block children in the page flow instead of treating the whole paste
    // as one indivisible object. Containers with attributes remain intact.
    let wrappers=[...editor.children].filter(n=>n.matches('div')&&!n.attributes.length&&n.querySelector('p,div,h1,h2,h3,h4,h5,h6,ul,ol,blockquote,pre,figure,table'));
    while(wrappers.length){for(const wrapper of wrappers)wrapper.replaceWith(...wrapper.childNodes);wrappers=[...editor.children].filter(n=>n.matches('div')&&!n.attributes.length&&n.querySelector('p,div,h1,h2,h3,h4,h5,h6,ul,ol,blockquote,pre,figure,table'));}
    const inline='a,span,strong,b,em,i,u,s,del,mark,small,sub,sup,code,br,img';let run=[];
    const flush=()=>{
      if(run.some(n=>n.nodeType===3&&n.data.trim()||n.nodeType===1)){
        const paragraph=editor.ownerDocument.createElement('p');run[0].before(paragraph);paragraph.append(...run);
      }
      run=[];
    };
    for(const node of [...editor.childNodes]){
      if(node.nodeType===3||node.nodeType===8||node.nodeType===1&&node.matches(inline))run.push(node);else flush();
    }
    flush();
  }
  function bookmark(editor){
    const doc=editor.ownerDocument,selection=doc.getSelection();
    if(!selection?.rangeCount||!editor.contains(selection.anchorNode)||!editor.contains(selection.focusNode))return ()=>{};
    const range=selection.getRangeAt(0).cloneRange(),backward=selection.anchorNode===range.endContainer&&selection.anchorOffset===range.endOffset&&!range.collapsed;
    const start=doc.createComment('book-caret'),end=range.collapsed?null:doc.createComment('book-selection');
    if(end){const tail=range.cloneRange();tail.collapse(false);tail.insertNode(end);}
    range.collapse(true);range.insertNode(start);
    return ()=>{
      try{if(start.isConnected&&(!end||end.isConnected)){
        const a=start.parentNode,ai=[...a.childNodes].indexOf(start),b=end?.parentNode||a,bi=end?[...b.childNodes].indexOf(end):ai;
        selection.setBaseAndExtent(backward?b:a,backward?bi:ai,backward?a:b,backward?ai:bi);
      }}finally{end?.remove();start.remove();editor.normalize();}
    };
  }
  function mergeBoundary(left,right){
    const trailing=[],leading=[];let a=left.lastChild,b=right.firstChild;
    while(a?.nodeType===8){trailing.unshift(a);a=a.previousSibling;}
    while(b?.nodeType===8){leading.push(b);b=b.nextSibling;}
    if(a?.nodeType===1&&b?.nodeType===1&&a.localName===b.localName&&a.getAttribute(INLINE)&&a.getAttribute(INLINE)===b.getAttribute(INLINE)){
      for(const marker of [...trailing,...leading])a.append(marker);
      mergeBoundary(a,b);while(b.firstChild)a.append(b.firstChild);b.remove();
    }
  }
  function clean(element){
    for(const e of [element,...element.querySelectorAll('*')]){
      for(const attr of runtime)e.removeAttribute(attr);
      for(const prop of ['--book-overflow-height','--book-image-fit'])e.style?.removeProperty(prop);
      if(e.hasAttribute('style')&&!e.getAttribute('style'))e.removeAttribute('style');
    }
  }
  function canonicalize(editor,{unwrap=true,preserve=false,flow=false}={}){
    const restore=preserve?bookmark(editor):()=>{};
    try{
      root.HeartspaceDocsBookReferences?.clear(editor);
      if(unwrap)editor.querySelectorAll('.book-page-content').forEach(page=>page.replaceWith(...page.childNodes));
      if(flow)normalizeTextFlow(editor);
      editor.normalize();
      const blocks=[...editor.querySelectorAll(`[${PART}]`)];let previous=null;
      for(const block of blocks){
        if(previous&&previous.getAttribute(PART)===block.getAttribute(PART)&&previous.localName===block.localName){
          const between=[];for(let n=previous.nextSibling;n&&n!==block;n=n.nextSibling)between.push(n);
          if(previous.parentNode===block.parentNode&&between.every(n=>n.nodeType===8||n.nodeType===3&&!n.data.trim())){
            for(const n of between)previous.append(n);
            mergeBoundary(previous,block);while(block.firstChild)previous.append(block.firstChild);block.remove();continue;
          }
        }
        previous=block;
      }
      clean(editor);return editor;
    }finally{restore();}
  }
  function logicalClone(element){
    const token=element?.getAttribute?.(PART);if(!token)return element.cloneNode(true);
    const container=element.closest('.content'),holder=element.ownerDocument.createElement('div');
    for(const part of container?.querySelectorAll(`[${PART}]`)||[])if(part.getAttribute(PART)===token)holder.append(part.cloneNode(true));
    canonicalize(holder);return holder.firstElementChild||element.cloneNode(true);
  }
  function textMap(block){
    const nodes=[],walker=block.ownerDocument.createTreeWalker(block,4);let text='',node;
    while((node=walker.nextNode())){nodes.push({node,start:text.length,end:text.length+node.length});text+=node.data;}
    return {nodes,text};
  }
  function point(map,offset){const item=map.nodes.find(n=>n.end>=offset&&n.end>n.start)||map.nodes.at(-1);return item?{node:item.node,offset:Math.max(0,offset-item.start)}:null;}
  function lineBoxes(block){
    const range=block.ownerDocument.createRange();range.selectNodeContents(block);
    const rects=[...range.getClientRects()].filter(r=>r.height>0&&r.width>0).sort((a,b)=>a.top-b.top||a.left-b.left),lines=[];
    for(const rect of rects){
      const last=lines.at(-1),overlap=last?Math.min(last.bottom,rect.bottom)-Math.max(last.top,rect.top):0;
      if(last&&overlap>Math.min(last.bottom-last.top,rect.height)*.25){last.top=Math.min(last.top,rect.top);last.bottom=Math.max(last.bottom,rect.bottom);}
      else lines.push({top:rect.top,bottom:rect.bottom});
    }
    return lines;
  }
  function contentBottom(page){const style=getComputedStyle(page),rect=page.getBoundingClientRect(),scale=page.offsetHeight?rect.height/page.offsetHeight:1;return rect.bottom-((parseFloat(style.paddingBottom)||0)+(root.HeartspaceDocsBookReferences?.reserve(page)||0))*scale-(parseFloat(style.borderBottomWidth)||0)*scale;}
  function splittable(block){
    if(block.nodeType!==1||!block.matches('p,div')||block.matches('.book-edition-index-row')||!block.textContent.trim())return false;
    return [...block.querySelectorAll('*')].every(e=>/^(span|a|strong|b|em|i|u|s|del|mark|small|sub|sup|code|br)$/.test(e.localName)&&!e.id&&(!e.hasAttribute('data-localization-id')||e.matches('sup[data-book-footnote]'))&&(!e.hasAttribute('contenteditable')||e.matches('sup[data-book-footnote]'))&&!e.classList.contains('narrative-inline')&&getComputedStyle(e).display!=='inline-block');
  }
  function safeCut(text,offset){
    if(root.Intl?.Segmenter){const segment=new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text).containing(offset-1);if(segment&&segment.index+segment.segment.length>offset)return segment.index;}
    if(offset>0&&/[\uD800-\uDBFF]/.test(text[offset-1])&&/[\uDC00-\uDFFF]/.test(text[offset]))return offset-1;
    return offset;
  }
  function split(block,page,relax=false){
    if(!splittable(block))return null;
    const lines=lineBoxes(block),limit=contentBottom(page),fit=lines.filter(l=>l.bottom<=limit+.5).length;
    let count=Math.min(fit,lines.length-2);
    if(count<2){if(!relax||fit<1||fit>=lines.length)return null;count=Math.min(fit,lines.length-1);}
    const bottom=lines[count-1].bottom+.5,map=textMap(block),range=block.ownerDocument.createRange();
    let low=0,high=map.text.length;
    while(low<high){const mid=Math.ceil((low+high)/2),at=point(map,mid);if(!at)break;range.setStart(block,0);range.setEnd(at.node,at.offset);const rects=[...range.getClientRects()];if(rects.every(r=>r.bottom<=bottom))low=mid;else high=mid-1;}
    let cut=safeCut(map.text,low);
    const candidate=point(map,cut),reference=candidate?.node.parentElement?.closest('sup[data-book-footnote]');
    if(reference){const first=map.nodes.find(item=>reference.contains(item.node));if(first&&cut>first.start&&cut<first.end)cut=first.start;}
    if(cut<1||cut>=map.text.length||!map.text.slice(0,cut).trim()||!map.text.slice(cut).trim())return null;
    const at=point(map,cut),atomic=at.node.parentElement?.closest('sup[data-book-footnote]');
    if(atomic){if(at.offset===0)range.setStartBefore(atomic);else range.setStartAfter(atomic);}else range.setStart(at.node,at.offset);
    range.setEnd(block,block.childNodes.length);
    for(let e=atomic?atomic.parentElement:at.node.parentElement;e&&e!==block;e=e.parentElement)if(!e.hasAttribute(INLINE))e.setAttribute(INLINE,uid());
    const tail=block.cloneNode(false);tail.removeAttribute('id');tail.removeAttribute('data-localization-id');
    tail.append(range.extractContents());
    const token=block.getAttribute(PART)||uid();block.setAttribute(PART,token);tail.setAttribute(PART,token);tail.setAttribute(CONT,'true');
    if(block.hasAttribute(END)||!block.hasAttribute(CONT))tail.setAttribute(END,'true');block.removeAttribute(END);
    if(getComputedStyle(block).textAlign==='justify'){block.setAttribute('data-book-justify','true');tail.setAttribute('data-book-justify','true');}
    return tail;
  }
  function isHeading(node){return node.nodeType===1&&node.matches('h1,h2,h3,h4,h5,h6');}
  function hasContent(page){return [...page.childNodes].some(n=>n.nodeType===1&&!n.hasAttribute('data-book-generated')||n.nodeType===3&&n.data.trim());}
  function blockBottom(block){return block.nodeType===1?block.getBoundingClientRect().bottom:0;}
  function fitAtomic(block,page){
    const scale=page.offsetHeight?page.getBoundingClientRect().height/page.offsetHeight:1;
    const height=Math.max(40,(contentBottom(page)-block.getBoundingClientRect().top)/scale);
    if(block.matches('figure')&&block.querySelector('img')){
      const img=block.querySelector('img'),rest=block.getBoundingClientRect().height-img.getBoundingClientRect().height;
      img.style.setProperty('--book-image-fit',`${Math.max(24,height-rest/scale)}px`);
    }
    if(blockBottom(block)>contentBottom(page)+.5){block.setAttribute('data-book-overflow','true');block.style.setProperty('--book-overflow-height',`${height}px`);}
  }
  function reflow({editor,pages,makePage}){
    if(composing.has(editor))return pages;
    const restore=bookmark(editor);let flow=[];
    try{
      canonicalize(editor,{flow:true});const notes=root.HeartspaceDocsBookReferences?.createFlow(editor);flow=[...editor.childNodes];editor.replaceChildren();pages.length=0;
      if(!flow.length){const p=editor.ownerDocument.createElement('p');p.append(editor.ownerDocument.createElement('br'));flow.push(p);}
      let page=makePage(0);notes?.start(page);page.classList.add('measuring-reading');let headings=[];
      const fresh=()=>{notes?.end(page);page.classList.remove('measuring-reading');page=makePage(pages.length);notes?.start(page);page.classList.add('measuring-reading');};
      for(let index=0;index<flow.length;index++){
        let block=flow[index];
        if(block.nodeType===1&&block.matches('[data-page-break="true"]')){page.append(block);headings=[];fresh();continue;}
        page.append(block);
        if(isHeading(block)){
          headings.push(block);
          if(blockBottom(block)>contentBottom(page)+.5&&([...page.childNodes].some(n=>n.nodeType===1&&!headings.includes(n))||pages.length===1)){for(const h of headings)h.remove();fresh();for(const h of headings)page.append(h);}
          if(blockBottom(block)>contentBottom(page)+.5){
            if(headings.length>1){block.remove();fresh();page.append(block);headings=[block];}
            fitAtomic(block,page);
          }
          continue;
        }
        // Inline comments (including caret bookmarks) must not end a heading run.
        if(block.nodeType!==1){if(block.nodeType===3&&block.data.trim())headings=[];continue;}
        if(blockBottom(block)<=contentBottom(page)+.5){headings=[];continue;}
        let previous=[...page.childNodes].filter(n=>n!==block&&!headings.includes(n)&&!n.dataset?.bookGenerated);
        let beforeGroup=previous.some(n=>n.nodeType===1||n.nodeType===3&&n.data.trim());
        // A new reference can reserve space under text that already fitted.
        // Move its block first so that earlier text never overlaps its footer.
        if(previous.some(n=>n.nodeType===1&&blockBottom(n)>contentBottom(page)+.5)){
          block.remove();for(const h of headings)h.remove();fresh();for(const h of headings)page.append(h);page.append(block);beforeGroup=false;
          if(blockBottom(block)<=contentBottom(page)+.5){headings=[];continue;}
        }
        let tail=split(block,page,false);
        if(tail){flow.splice(index+1,0,tail);headings=[];fresh();continue;}
        if(beforeGroup||headings.length||pages.length===1){block.remove();for(const h of headings)h.remove();fresh();for(const h of headings)page.append(h);page.append(block);}
        headings=[];
        if(blockBottom(block)>contentBottom(page)+.5){
          tail=split(block,page,true);
          if(tail){flow.splice(index+1,0,tail);fresh();continue;}
          // Keep oversized, indivisible objects accessible without overlapping sheets.
          fitAtomic(block,page);
        }
      }
      notes?.end(page);
      while(notes?.pending()){page.classList.remove('measuring-reading');page=makePage(pages.length);notes.start(page);page.classList.add('measuring-reading');notes.end(page);}
      page.classList.remove('measuring-reading');
      if(!hasContent(page)&&!page.querySelector('[data-book-generated="footnotes"]')){const p=editor.ownerDocument.createElement('p');p.append(editor.ownerDocument.createElement('br'));page.append(p);}
      return pages;
    }catch(error){
      // A failed measurement must leave the complete authoring text available.
      if(flow.length){editor.replaceChildren(...flow);canonicalize(editor);editor.classList.remove('book-paginated');}
      throw error;
    }finally{editor.querySelectorAll('.measuring-reading').forEach(p=>p.classList.remove('measuring-reading'));restore();}
  }
  function prepare(editor){
    if(!editor.querySelector(`[${PART}],.book-page-content`))return;
    captureViewport(editor);
    canonicalize(editor,{preserve:true});editor.classList.remove('book-paginated');
  }
  function captureSelection(editor){
    const selection=editor.ownerDocument.getSelection();
    if(!selection?.rangeCount||!editor.contains(selection.anchorNode)||!editor.contains(selection.focusNode))return null;
    const endpoint=(scope,node,offset)=>{
      const element=node.nodeType===1?node:node.parentElement,path=[];
      for(let current=element;current!==scope;current=current.parentElement)path.unshift([...current.parentElement.children].indexOf(current));
      const range=editor.ownerDocument.createRange();range.selectNodeContents(element);range.setEnd(node,offset);
      return {path,offset:range.toString().length};
    };
    if(editor.querySelector(`.book-page-content,[${PART}]`)){
      // IME must keep the live leaves intact. Resolve source positions on a
      // clone so undo still uses logical paragraphs, not physical fragments.
      const copy=editor.cloneNode(true),sourceRange=selection.getRangeAt(0),range=editor.ownerDocument.createRange();
      const copied=node=>{const path=[];for(let n=node;n!==editor;n=n.parentNode)path.unshift([...n.parentNode.childNodes].indexOf(n));let result=copy;for(const index of path)result=result.childNodes[index];return result;};
      range.setStart(copied(sourceRange.startContainer),sourceRange.startOffset);range.setEnd(copied(sourceRange.endContainer),sourceRange.endOffset);
      const start=editor.ownerDocument.createComment('book-source-start'),end=sourceRange.collapsed?null:editor.ownerDocument.createComment('book-source-end');
      if(end){const tail=range.cloneRange();tail.collapse(false);tail.insertNode(end);}range.collapse(true);range.insertNode(start);
      canonicalize(copy,{flow:true});
      const at=marker=>endpoint(copy,marker.parentNode,[...marker.parentNode.childNodes].indexOf(marker));
      const first=at(start),last=end?at(end):first,backward=selection.anchorNode===sourceRange.endContainer&&selection.anchorOffset===sourceRange.endOffset&&!sourceRange.collapsed;
      return {anchor:backward?last:first,focus:backward?first:last};
    }
    return {anchor:endpoint(editor,selection.anchorNode,selection.anchorOffset),focus:endpoint(editor,selection.focusNode,selection.focusOffset)};
  }
  function restoreSelection(editor,snapshot){
    if(!snapshot)return;
    prepare(editor);
    const endpoint=value=>{
      let element=editor;for(const index of value.path){element=element.children[index];if(!element)return null;}
      const map=textMap(element),at=point(map,Math.min(value.offset,map.text.length));
      return at||{node:element,offset:0};
    };
    const a=endpoint(snapshot.anchor),b=endpoint(snapshot.focus);
    if(a&&b)editor.ownerDocument.getSelection()?.setBaseAndExtent(a.node,a.offset,b.node,b.offset);
  }
  function installEditing(o){
    let mutation=null,pasted=false;
    const editing=()=>{const anchor=captureViewport(o.editor);if(anchor)anchor.reveal=true;};
    o.editor.addEventListener('keydown',event=>{
      const formatting=(event.ctrlKey||event.metaKey)&&!event.altKey&&(/^(b|i|u|x|[0-6])$/i.test(event.key)||event.shiftKey&&['Digit7','Digit8'].includes(event.code));
      if(o.editable()&&!event.isComposing&&(['Enter','Backspace','Delete','Tab'].includes(event.key)||event.key===' '&&event.shiftKey||formatting)){editing();prepare(o.editor);o.layout();}
    },true);
    o.editor.addEventListener('beforeinput',event=>{
      if(!o.editable()||composing.has(o.editor)||event.isComposing)return;
      if(event.inputType==='historyUndo'||event.inputType==='historyRedo'){
        mutation=null;
        if(event.cancelable&&(event.inputType==='historyUndo'?o.undo():o.redo()))event.preventDefault();
        return;
      }
      editing();prepare(o.editor);
      const anchor=viewports.get(o.editor);if(anchor&&/insertFrom(Paste|Drop)|insertReplacementText/.test(event.inputType))anchor.top=null;
      mutation=o.begin();mutation.bookBeforeSelection=captureSelection(o.editor);mutation.bookInput=event.inputType;mutation.bookInputData=event.data;mutation.bookInputAt=Date.now();
    },true);
    o.editor.addEventListener('input',event=>{
      if(composing.has(o.editor))return;editing();
      if((pasted||/insertFrom(Paste|Drop)/.test(event.inputType))&&o.editor.closest('.page')?.dataset.layout==='book'){const restore=bookmark(o.editor);try{normalizeTextFlow(o.editor);}finally{restore();}}
      pasted=false;if(mutation){mutation.bookAfterSelection=captureSelection(o.editor);o.end(mutation);mutation=null;}o.layout({immediate:true});
    });
    o.editor.addEventListener('compositionstart',()=>{if(!o.editable())return;editing();mutation=o.begin();mutation.bookBeforeSelection=captureSelection(o.editor);composing.add(o.editor);});
    o.editor.addEventListener('compositionend',()=>{if(!composing.has(o.editor))return;composing.delete(o.editor);prepare(o.editor);if(mutation){mutation.bookAfterSelection=captureSelection(o.editor);o.end(mutation);mutation=null;}o.changed();o.layout({immediate:true});});
    for(const type of ['copy','cut','paste'])o.editor.addEventListener(type,()=>{prepare(o.editor);if(type==='paste'){pasted=true;const anchor=viewports.get(o.editor);if(anchor){anchor.top=null;anchor.reveal=true;}}o.layout();if(type!=='copy')setTimeout(()=>o.layout({immediate:true}),0);},true);
  }
  const styles=`
.content .book-page-content:first-child{padding-bottom:var(--book-margin-y,72px)}
.content [data-book-continuation]{text-indent:0!important;margin-top:0!important}
.content [data-book-fragment]:not([data-book-fragment-end]){margin-bottom:0!important}
.content [data-book-justify]:not([data-book-fragment-end]){text-align-last:justify}
.content [data-book-overflow]{max-height:var(--book-overflow-height);overflow:auto;box-sizing:border-box}
.content img[style*="--book-image-fit"]{max-height:var(--book-image-fit)!important;object-fit:contain}
`;
  root.HeartspaceDocsBookPagination=Object.freeze({reflow,canonicalize,logicalClone,prepare,restoreSelection,caretRect,captureViewport,restoreViewport,installEditing,composing:editor=>composing.has(editor),styles});
})(globalThis);
