/* Footnote text belongs to its inline reference. Page furniture is disposable. */
(function(root){
  'use strict';
  const selector='sup[data-book-footnote]',generated='[data-book-generated="footnotes"]',states=new WeakMap();
  const uid=()=>`fn-${root.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const noteText=marker=>marker.getAttribute('data-footnote-text')||'';
  const visible=marker=>!marker.closest('[data-canonical-visible="false"],.narrative-variation-version[data-reading-active="false"],.narrative-block[data-reading-empty="true"]');
  function renumber(editor,start=1){
    let number=start;const seen=new Set();
    for(const marker of editor.querySelectorAll(selector)){
      let id=marker.dataset.bookFootnote;if(!/^[a-zA-Z0-9-]{1,100}$/.test(id)||seen.has(id)){id=marker.dataset.bookFootnote=uid();delete marker.dataset.localizationId;}seen.add(id);
      marker.contentEditable='false';marker.setAttribute('role','button');marker.tabIndex=0;
      if(visible(marker)){marker.textContent=String(number++);marker.setAttribute('aria-label',`Nota de rodapé ${marker.textContent}: ${noteText(marker)}`);}
    }
    return number;
  }
  function clear(editor){editor.querySelectorAll(generated).forEach(element=>element.remove());}
  function ensureStyle(doc){if(!doc.querySelector('style[data-book-references]')){const style=doc.createElement('style');style.dataset.bookReferences='';style.textContent=styles;doc.head.append(style);}}
  function createFlow(editor){
    ensureStyle(editor.ownerDocument);clear(editor);renumber(editor,Number(editor.dataset.bookFootnoteStart)||1);
    if(!editor.querySelector(selector))return null;
    let carry=[];
    function start(page){states.set(page,{carry,signature:'',remaining:[],box:null,height:0});carry=[];}
    function end(page){reserve(page);carry=states.get(page)?.remaining||[];}
    return {start,end,pending:()=>carry.length>0};
  }
  function reserve(page){
    const state=states.get(page);if(!state)return 0;
    const markers=[...page.querySelectorAll(selector)].filter(marker=>visible(marker)&&marker.getClientRects().length);
    const items=[...state.carry,...markers.map(marker=>({id:marker.dataset.bookFootnote,number:marker.textContent,text:noteText(marker),continued:false}))];
    const signature=JSON.stringify([page.clientWidth,page.clientHeight,items]);if(signature===state.signature)return state.height;
    state.signature=signature;state.box?.remove();state.box=null;state.height=0;state.remaining=[];
    if(!items.length)return 0;
    const doc=page.ownerDocument,style=getComputedStyle(page),bottom=parseFloat(style.paddingBottom)||0,top=parseFloat(style.paddingTop)||0;
    const available=Math.max(40,page.clientHeight-top-bottom),cap=Math.max(24,available*.45);
    const box=doc.createElement('aside');box.className='book-footnotes';box.dataset.bookGenerated='footnotes';box.contentEditable='false';box.setAttribute('aria-label','Notas de rodapé');
    box.style.cssText=`left:${style.paddingLeft};right:${style.paddingRight};bottom:${bottom}px`;
    page.append(box);state.box=box;
    // Each reference receives space; unfinished text flows onto following sheets.
    const perItem=Math.max(18,(cap-12)/items.length);
    for(const item of items){
      if(box.childElementCount&&box.offsetHeight>=cap-18){state.remaining.push({...item,continued:true});continue;}
      const row=doc.createElement('p'),label=doc.createElement('span'),text=doc.createElement('span');
      label.className='book-footnote-label';label.dataset.footnoteEdit=item.id;label.setAttribute('role','button');label.tabIndex=0;label.textContent=`${item.number}${item.continued?' (continuação)':''}. `;row.append(label,text);box.append(row);
      const value=item.text,measure=end=>{text.textContent=value.slice(0,end);return row.offsetHeight;};
      let low=0,high=value.length;while(low<high){const mid=Math.ceil((low+high)/2);if(measure(mid)<=perItem)low=mid;else high=mid-1;}
      let cut=low;if(cut<value.length&&cut>0){const boundary=value.lastIndexOf(' ',cut);if(boundary>cut*.6)cut=boundary+1;}
      if(cut>0&&/[\uD800-\uDBFF]/.test(value[cut-1])&&/[\uDC00-\uDFFF]/.test(value[cut]))cut-=1;
      // A very narrow sheet must still consume a complete code point per pass.
      if(!cut&&value.length)cut=value.codePointAt(0)>65535?2:1;
      text.textContent=value.slice(0,cut);
      if(cut<value.length)state.remaining.push({...item,text:value.slice(cut),continued:true});
    }
    state.height=box.offsetHeight+10;return state.height;
  }
  function localize(target,text){
    if(target.matches(selector)){target.dataset.footnoteText=text;return;}
    const references=new Map([...target.querySelectorAll(selector)].map(marker=>[marker.dataset.bookFootnote,marker.cloneNode(true)]));
    if(!references.size){target.textContent=text;return;}
    const fragment=target.ownerDocument.createDocumentFragment();let offset=0;
    for(const match of text.matchAll(/\{\{footnote:([a-zA-Z0-9-]+)\}\}/g)){
      fragment.append(text.slice(offset,match.index));const reference=references.get(match[1]);if(reference){fragment.append(reference);references.delete(match[1]);}offset=match.index+match[0].length;
    }
    fragment.append(text.slice(offset),...references.values());target.replaceChildren(fragment);
  }
  function markdownDefinitions(editor,escape){
    return [...editor.querySelectorAll(selector)].map(marker=>`[^${marker.dataset.bookFootnote}]: ${noteText(marker).split('\n').map((line,index)=>`${index?'    ':''}${escape(line)}`).join('\n')}`).join('\n\n');
  }
  function markdownSource(lines){
    const definitions=new Map(),body=[];let fence='';
    for(let index=0;index<lines.length;index++){
      const line=lines[index],matchFence=line.match(/^\s*(`{3,}|~{3,})/);
      if(matchFence){if(!fence)fence=matchFence[1];else if(matchFence[1][0]===fence[0]&&matchFence[1].length>=fence.length)fence='';body.push(line);continue;}
      const match=!fence&&line.match(/^\[\^([a-zA-Z0-9-]{1,100})\]:[ \t]?(.*)$/);
      if(!match){body.push(line);continue;}
      const text=[match[2]];
      while(index+1<lines.length){const continuation=lines[index+1].match(/^(?: {4}|\t)(.*)$/);if(!continuation)break;text.push(continuation[1]);index++;}
      definitions.set(match[1],text.join('\n').replace(/\\([\\`*_{}\[\]<>#+.!|])/g,'$1'));
    }
    fence='';
    return body.map(line=>{
      const matchFence=line.match(/^\s*(`{3,}|~{3,})/);if(matchFence){if(!fence)fence=matchFence[1];else if(matchFence[1][0]===fence[0]&&matchFence[1].length>=fence.length)fence='';return line;}
      if(fence)return line;
      return line.replace(/\[\^([a-zA-Z0-9-]{1,100})\]/g,(match,id)=>definitions.has(id)?`[[heartspace-footnote:${encodeURIComponent(id)}|${encodeURIComponent(definitions.get(id))}]]`:match);
    });
  }
  function mount(o){
    const editor=o.editor,doc=editor.ownerDocument,el=(tag,text)=>Object.assign(doc.createElement(tag),text===undefined?{}:{textContent:text});
    ensureStyle(doc);
    const dialog=el('dialog');dialog.className='book-footnote-dialog';dialog.setAttribute('aria-label','Nota de rodapé');
    const heading=el('h2','Nota de rodapé'),label=el('label','Texto da nota'),input=el('textarea');input.rows=6;input.maxLength=12000;input.required=true;label.append(input);
    const help=el('p','A referência acompanha o texto. O conteúdo aparece no rodapé da folha e continua na seguinte quando necessário.');
    const status=el('p');status.setAttribute('role','status');const actions=el('div'),save=el('button','Salvar nota'),remove=el('button','Remover nota'),cancel=el('button','Cancelar');
    for(const button of [save,remove,cancel])button.type='button';actions.append(remove,cancel,save);dialog.append(heading,label,help,status,actions);doc.body.append(dialog);
    let lastRange=null,lastRangeKey='',range=null,marker=null,key='';
    doc.addEventListener('selectionchange',()=>{const selection=doc.getSelection();if(selection?.rangeCount&&editor.contains(selection.anchorNode)&&editor.contains(selection.focusNode)&&!selection.anchorNode.parentElement?.closest(generated)){lastRange=selection.getRangeAt(0).cloneRange();lastRangeKey=o.context().key;}});
    function open(existing=null){
      const c=o.context();if(!c.enabled)return;
      const selection=doc.getSelection(),currentRange=selection?.rangeCount&&editor.contains(selection.anchorNode)&&editor.contains(selection.focusNode)?selection.getRangeAt(0):lastRangeKey===c.key?lastRange:null;
      marker=existing;range=existing?null:currentRange?.cloneRange();key=c.key;
      if(!existing&&range){const blocked=node=>(node.nodeType===1?node:node.parentElement)?.closest('.narrative-block,[data-mermaid-block],pre,code,figure,sup,[data-book-generated]');if(blocked(range.startContainer)||blocked(range.endContainer)){o.status('Insira a nota em um trecho de texto comum do livro.');return;}}
      if(!existing&&(!c.editable||!range||!editor.contains(range.startContainer))){o.status('Posicione o cursor no texto do livro para inserir uma nota de rodapé.');return;}
      input.value=existing?noteText(existing):'';cancel.textContent=c.editable?'Cancelar':'Fechar';input.readOnly=!c.editable;save.hidden=remove.hidden=!c.editable;remove.disabled=!existing;status.textContent='';
      if(!dialog.open)dialog.showModal();input.focus();
    }
    function current(){const c=o.context();if(c.key!==key||!c.enabled||!c.editable||marker&&!editor.contains(marker)||range&&!editor.contains(range.startContainer))throw new Error('O documento ou sua permissão mudou. Abra a nota novamente.');}
    function change(deleting){
      try{
        current();if(!deleting&&!input.value.trim()){status.textContent='Escreva o texto da nota.';input.focus();return;}
        const mutation=o.begin();
        if(!marker){const selection=doc.getSelection();selection.removeAllRanges();selection.addRange(range);}
        root.HeartspaceDocsBookPagination.prepare(editor);
        if(!marker)range=doc.getSelection().getRangeAt(0).cloneRange();
        if(deleting)marker?.remove();else if(marker)marker.dataset.footnoteText=input.value.trim();else{
          marker=el('sup','1');marker.dataset.bookFootnote=uid();marker.dataset.footnoteText=input.value.trim();marker.contentEditable='false';
          // Keep the selected text, placing its reference immediately after it.
          range.collapse(false);range.insertNode(marker);
        }
        renumber(editor);const caret=doc.createRange();if(marker?.isConnected){caret.setStartAfter(marker);caret.collapse(true);doc.getSelection().removeAllRanges();doc.getSelection().addRange(caret);}
        o.end(mutation);o.changed();dialog.close();editor.focus({preventScroll:true});o.layout();
      }catch(error){status.textContent=error.message;}
    }
    save.addEventListener('click',()=>change(false));remove.addEventListener('click',()=>change(true));cancel.addEventListener('click',()=>dialog.close());
    editor.addEventListener('click',event=>{const reference=event.target.closest(`${selector},[data-footnote-edit]`);if(!reference)return;const id=reference.dataset.bookFootnote||reference.dataset.footnoteEdit,target=[...editor.querySelectorAll(selector)].find(n=>n.dataset.bookFootnote===id);if(target){event.preventDefault();event.stopPropagation();open(target);}});
    editor.addEventListener('keydown',event=>{const reference=event.target.closest(`${selector},[data-footnote-edit]`);if(reference&&['Enter',' '].includes(event.key)){event.preventDefault();reference.click();}});
    doc.addEventListener('keydown',event=>{if(event.ctrlKey&&event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='f'&&!dialog.open&&editor.contains(doc.activeElement)){event.preventDefault();open();}});
    o.trigger?.addEventListener('click',()=>open());
    function refresh(){const c=o.context();if(o.trigger)o.trigger.disabled=!c.enabled||!c.editable;if(dialog.open&&(!c.enabled||c.key!==key))dialog.close();}
    return Object.freeze({open,refresh});
  }
  const styles=`
.content .book-page-content{position:relative}
sup[data-book-footnote]{font-size:.7em;line-height:0;vertical-align:super;text-indent:0;cursor:pointer;color:inherit;padding-inline:1px}
sup[data-book-footnote]:focus-visible{outline:1px solid var(--accent,#0c8ce9)}
.content .book-footnotes{position:absolute;box-sizing:border-box;padding-top:10px;border-top:1px solid currentColor;font-size:.78em;line-height:1.35;text-align:left;text-indent:0;overflow-wrap:anywhere;white-space:pre-wrap}
.content .book-footnotes>p{margin:0 0 4px!important;text-indent:0!important;font:inherit!important;line-height:inherit!important}
.book-footnote-label{font-variant-numeric:tabular-nums;cursor:pointer}
.book-footnote-dialog{width:min(480px,calc(100vw - 48px));padding:22px;border:1px solid #ffffff30;border-radius:10px;background:var(--bg,#171717);color:var(--text,#eee)}
.book-footnote-dialog::backdrop{background:#0009}.book-footnote-dialog h2{margin:0 0 16px;font-size:18px}.book-footnote-dialog label{display:grid;gap:8px}
.book-footnote-dialog textarea{box-sizing:border-box;width:100%;resize:vertical;font:inherit;padding:10px;background:#111;color:#fff;border:1px solid #ffffff30;border-radius:6px}
.book-footnote-dialog p{font-size:12px;color:#aaa;line-height:1.5}.book-footnote-dialog>div{display:flex;gap:8px;justify-content:flex-end}
.book-footnote-dialog button{padding:8px;border:1px solid #ffffff30;border-radius:5px;background:#252525;color:#fff}.book-footnote-dialog button:last-child{background:#0875c5}
`;
  root.HeartspaceDocsBookReferences=Object.freeze({selector,renumber,clear,createFlow,reserve,localize,markdownDefinitions,markdownSource,mount});
})(globalThis);
