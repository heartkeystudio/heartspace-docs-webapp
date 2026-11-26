/* Docs-only workspace layout. Moves existing controls; never writes authoring data. */
(function(root){
  'use strict';
  root.HeartspaceSceneWorkspace={create({view,form,surface,moments}){
    const doc=view.ownerDocument, panel=form.querySelector('.scene-composer');
    const node=(tag,cls,html='')=>{const n=doc.createElement(tag);n.className=cls;n.innerHTML=html;return n;};
    const body=panel.querySelector(':scope > .scene-composer-body');
    const originalSettings=[...form.children].filter(n=>n!==panel&&n!==moments);
    originalSettings.forEach(n=>n.dataset.sceneSetting='true');
    view.classList.add('scene-workspace');panel.classList.add('scene-workspace-composer');
    const header=node('header','scene-context-bar','<div><strong>Cena</strong><span data-scene-context></span></div><nav aria-label="Painéis da cena"><button type="button" data-toggle="left" aria-expanded="true">☰ <span>Navegação</span></button><button type="button" data-toggle="right" aria-expanded="true">☷ <span>Inspetor</span></button><button type="button" data-toggle="bottom" aria-expanded="true">▤ <span>Momentos</span></button></nav>');
    const left=node('aside','scene-left-panel','<div class="scene-left-tabs" role="tablist" aria-label="Contexto do painel esquerdo"><button type="button" role="tab" aria-selected="false" data-left="documents">Documentos</button><button type="button" role="tab" aria-selected="true" data-left="layers">Camadas</button><button type="button" role="tab" aria-selected="false" data-left="resources">Recursos</button></div><div data-left-page="documents" hidden></div><div data-left-page="layers"></div><div data-left-page="resources" hidden><p>Adicionar à composição</p></div>');
    left.setAttribute('aria-label','Navegação da cena');
    const toolbar=node('div','scene-composition-toolbar');toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Ferramentas de composição');
    const right=node('aside','scene-inspector','<header><label>Escopo<select id="scene-inspector-scope"><option value="experience">Experiência</option><option value="scene">Cena</option><option value="moment">Momento</option><option value="element">Elemento</option></select></label><p data-scope-help></p></header><section data-scope="experience"></section><section data-scope="composition"></section><section data-scope="element"><p data-empty-selection>Selecione um elemento no palco ou em Camadas.</p></section>');
    right.setAttribute('aria-label','Inspetor da cena');
    right.querySelector('[data-scope-help]').id='scene-scope-help';
    const scope=right.querySelector('select'),composition=right.querySelector('[data-scope="composition"]');
    const bottom=node('section','scene-moments-panel');bottom.setAttribute('aria-label','Momentos narrativos');bottom.append(moments);
    const stage=node('section','scene-stage');stage.setAttribute('aria-label','Palco de composição');const host=surface.closest('.scene-viewport')||surface;host.before(stage);stage.append(host);
    const originalActions=view.querySelector('.narrative-presentation-actions');header.append(originalActions);
    scope.setAttribute('aria-describedby','scene-scope-help');
    const screen=originalSettings.find(n=>n.matches('fieldset'));right.querySelector('[data-scope="experience"]').append(screen);
    originalSettings.filter(n=>n!==screen).forEach(n=>composition.append(n));
    const sceneSettings=[...body.children].filter(n=>n.matches('label.scene-check,details'));
    sceneSettings.forEach(n=>composition.append(n));
    const add=body.querySelector('[data-action="image"]').parentElement;
    left.querySelector('[data-left-page="resources"]').append(add);
    const resources=left.querySelector('[data-left-page="resources"]');
    resources.append(body.querySelector('[aria-label="Primitivas geométricas"]'));
    resources.append(body.querySelector('[data-shape-draw]').parentElement);
    const layers=left.querySelector('[data-left-page="layers"]'),list=body.querySelector('[data-list]');layers.append(list.closest('label'),body.querySelector('[data-group-actions]'),body.querySelector('[data-layer-tree]'),body.querySelector(':scope > small'));
    const actions=body.querySelector('[data-action="up"]').parentElement;toolbar.append(actions);
    const properties=body.querySelector('[data-properties]');right.querySelector('[data-scope="element"]').append(properties);
    const status=body.querySelector('[role="status"]')||body.querySelector('.scene-composer-status');if(status)panel.append(status);
    panel.append(header,left,toolbar,right,bottom);body.hidden=true;
    const history=moments.querySelector('.scene-authoring-history');if(history)toolbar.prepend(history);
    // The actual history controls have no stable wrapper class in older versions.
    const undo=moments.querySelector('[data-scene-history]');if(undo)toolbar.prepend(undo.parentElement);
    const sidebar=doc.querySelector('#sidebar'),home=doc.createComment('Docs sidebar home');sidebar.before(home);
    const sequenceLabel=doc.querySelector('.sequence-context'),sequenceHome=doc.createComment('Sequence context home');sequenceLabel.before(sequenceHome);
    let lastMoment='',selected='',selectionCount=0,currentLeft='layers',explicitScope=false;
    const toggleScope=()=>{
      const value=scope.value;
      right.querySelectorAll('[data-scope]').forEach(n=>n.hidden=n.dataset.scope!==(value==='scene'||value==='moment'?'composition':value));
      right.querySelector('[data-empty-selection]').hidden=selectionCount===1;
      right.querySelector('[data-scope-help]').textContent=value==='experience'?'Formato geral da experiência. Não altera o tema de autoria.':value==='element'?selectionCount>1?'Transformações coletivas dos elementos selecionados; propriedades individuais aparecem para um único elemento.':selected?'Propriedades do elemento selecionado.':'Nenhum elemento selecionado.':value==='moment'?'Composição no momento ativo. Regras de herança existentes.':'Composição inicial da sequência.';
    };
    const sync=()=>{
      const active=doc.body.dataset.workArea==='scene';
      if(active&&sequenceLabel.parentElement!==header)header.prepend(sequenceLabel);else if(!active&&sequenceLabel.previousSibling!==sequenceHome)sequenceHome.after(sequenceLabel);
      if(active&&sidebar.parentElement!==left.querySelector('[data-left-page="documents"]'))left.querySelector('[data-left-page="documents"]').append(sidebar);
      else if(!active&&sidebar.previousSibling!==home)home.after(sidebar);
      header.querySelector('[data-scene-context]').textContent=doc.querySelector('#narrative-sequence-select')?.selectedOptions[0]?.textContent||'Sequência ativa';
      toggleScope();
    };
    const setLeft=value=>{currentLeft=value;left.querySelectorAll('[data-left]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.left===value));b.tabIndex=b.dataset.left===value?0:-1;});left.querySelectorAll('[data-left-page]').forEach(p=>p.hidden=p.dataset.leftPage!==value);};
    left.querySelectorAll('[data-left]').forEach((b,i,buttons)=>{
      const page=left.querySelector(`[data-left-page="${b.dataset.left}"]`);b.id='scene-left-'+b.dataset.left;page.id=b.id+'-page';page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',page.id);
      b.addEventListener('click',()=>setLeft(b.dataset.left));
      b.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;buttons[next].focus();setLeft(buttons[next].dataset.left);});
    });
    header.querySelectorAll('[data-toggle]').forEach(b=>b.setAttribute('aria-label','Alternar painel de '+({left:'navegação',right:'propriedades',bottom:'momentos'}[b.dataset.toggle])));
    header.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{const collapsed=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!collapsed));view.classList.toggle('scene-hide-'+b.dataset.toggle,collapsed);const target={left,right,bottom}[b.dataset.toggle];target.hidden=collapsed;}));
    const momentSelect=moments.querySelector('#scene-moment-select');
    const updateMoment=()=>{if(momentSelect.value)lastMoment=momentSelect.value;if(!explicitScope||scope.value!=='experience'){scope.value=selected?'element':momentSelect.value?'moment':'scene';explicitScope=false;}toggleScope();};
    momentSelect.addEventListener('change',updateMoment);
    scope.addEventListener('change',()=>{explicitScope=true;if(scope.value==='scene'&&momentSelect.value){momentSelect.value='';momentSelect.dispatchEvent(new Event('change',{bubbles:true}));}else if(scope.value==='moment'&&!momentSelect.value){momentSelect.value=lastMoment||[...momentSelect.options].find(o=>o.value)?.value||'';momentSelect.dispatchEvent(new Event('change',{bubbles:true}));}toggleScope();});
    panel.addEventListener('scene-selection-change',event=>{selected=event.detail.name||'';selectionCount=Number(event.detail.count)||0;const hint=right.querySelector('[data-empty-selection]');hint.textContent=selectionCount>1?`${selectionCount} elementos selecionados. As propriedades individuais ficam disponíveis ao selecionar apenas um elemento.`:'Selecione um elemento no palco ou em Camadas.';if(!explicitScope||scope.value!=='experience')scope.value=selectionCount?'element':momentSelect.value?'moment':'scene';toggleScope();});
    // Resizers are local UI state, with pointer cancellation and keyboard alternatives.
    const narrow=doc.defaultView.matchMedia('(max-width:740px)');
    for(const [side,target,orientation,min,max,initial] of [['left',left,'vertical',180,380,224],['right',right,'vertical',220,420,286],['bottom',bottom,'horizontal',96,280,164]]){
      const bar=node('div','scene-panel-resizer scene-resizer-'+side);bar.tabIndex=0;bar.setAttribute('role','separator');bar.setAttribute('aria-label','Redimensionar '+({left:'navegação',right:'inspetor',bottom:'momentos'}[side]));const axis=()=>narrow.matches?'horizontal':orientation;bar.setAttribute('aria-orientation',axis());narrow.addEventListener('change',()=>bar.setAttribute('aria-orientation',axis()));bar.setAttribute('aria-valuemin',min);bar.setAttribute('aria-valuemax',max);panel.append(bar);
      let size=initial,gesture=null;
      const apply=value=>{const other=side==='left'?right:left;const limit=side!=='bottom'&&!narrow.matches&&view.clientWidth>0?Math.max(min,Math.min(max,view.clientWidth-(other.hidden?0:other.getBoundingClientRect().width)-192)):max;size=Math.max(min,Math.min(limit,value));view.style.setProperty('--scene-'+side,size+'px');bar.setAttribute('aria-valuemax',limit);bar.setAttribute('aria-valuenow',size);};apply(initial);
      doc.defaultView.addEventListener('resize',()=>apply(size));
      bar.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();apply(e.key==='Home'?min:e.key==='End'?max:size+(['ArrowLeft','ArrowUp'].includes(e.key)?-16:16));});
      bar.addEventListener('pointerdown',e=>{if(e.button!==0)return;gesture={start:axis()==='vertical'?e.clientX:e.clientY,size};bar.setPointerCapture(e.pointerId);e.preventDefault();});
      bar.addEventListener('pointermove',e=>{if(gesture)apply(gesture.size+((axis()==='vertical'?e.clientX:e.clientY)-gesture.start)*(narrow.matches||side==='left'?1:-1));});
      bar.addEventListener('pointerup',()=>{gesture=null;});bar.addEventListener('pointercancel',()=>{if(gesture)apply(gesture.size);gesture=null;});bar.addEventListener('lostpointercapture',()=>{gesture=null;});
    }
    new MutationObserver(sync).observe(doc.body,{attributes:true,attributeFilter:['data-work-area']});
    new MutationObserver(()=>{if(!momentSelect.value&&!selected&&scope.value==='moment')scope.value='scene';sync();}).observe(doc.querySelector('#narrative-sequence-select'),{childList:true});
    scope.value=momentSelect.value?'moment':'scene';setLeft(currentLeft);sync();
  }};
})(globalThis);
