/* Task spaces share the original editor and production views. Content is never cloned. */
(function (root) {
  'use strict';
  const areas = { writing:'Escrever', history:'História', translation:'Tradução', scene:'Cena', library:'Biblioteca do projeto', validation:'Pendências' };
  const areaForView = view => ({ sequence:'history', planning:'history', map:'history', localization:'translation', presentation:'scene', characters:'library', variables:'library', glossary:'library', validation:'validation' })[view] || 'history';
  const preferenceKey = 'heartspace.docs.workspaces.v1';
  const viewGroups = { history:['sequence','planning','map'], translation:['localization'], scene:['presentation'], library:['characters','variables','glossary'], validation:['validation'] };
  function mount(options) {
    const { document:doc, editor, panel, showView, setOpen, render, documentId } = options;
    const win = doc.defaultView;
    const nav = doc.querySelector('#work-area-nav');
    const splitButton = doc.querySelector('#work-area-split');
    const inspector = doc.querySelector('#writing-inspector');
    const inspectorFields = doc.querySelector('#writing-inspector-fields');
    const editorArea = doc.querySelector('.editor-area');
    const edgeHandle = doc.querySelector('.project-tools-edge');
    let edgeFrame = 0;
    const motions = new WeakMap();
    let panelWasOpen = false, presentedArea = 'writing', presentedSplit = false;
    function reveal(surface, fromRight = true) {
      if (!surface?.animate || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      motions.get(surface)?.cancel();
      const animation = surface.animate([
        {opacity:0,transform:`translateX(${fromRight ? 18 : -10}px)`},
        {opacity:1,transform:'translateX(0)'}
      ],{duration:180,easing:'cubic-bezier(.2,.7,.3,1)'});
      motions.set(surface,animation);
    }
    // Project resources live independently of the current document task.
    const libraryDrawer = doc.createElement('aside');
    libraryDrawer.className = 'project-library-drawer'; libraryDrawer.hidden = true;
    libraryDrawer.setAttribute('aria-label','Biblioteca do projeto');
    libraryDrawer.innerHTML = '<header><h2>Biblioteca do projeto</h2><button type="button" aria-label="Fechar biblioteca do projeto">Fechar</button></header><nav aria-label="Recursos do projeto"></nav>';
    doc.body.append(libraryDrawer);
    const libraryViews = {characters:doc.querySelector('#narrative-characters'),variables:doc.querySelector('#narrative-variables'),glossary:doc.querySelector('#narrative-glossary-view')};
    const libraryTabs = libraryDrawer.querySelector('nav');
    ['characters','variables','glossary'].forEach(view => {
      libraryTabs.append(doc.querySelector(`[data-production-view="${view}"]`));
      libraryDrawer.append(libraryViews[view]);
    });
    let libraryMotion = 0, libraryClosing = false;
    function slideLibrary(closing = false) {
      const from = Math.max(0,Math.min(1,parseFloat(win.getComputedStyle(doc.body).getPropertyValue('--library-progress')) || 0));
      motions.get(libraryDrawer)?.cancel();
      const target = closing ? 0 : 1;
      doc.body.style.setProperty('--library-progress',String(target));
      if (!doc.body.animate || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
      // One animated value moves the drawer and reserves its space together.
      const animation = doc.body.animate([
        {'--library-progress':String(from)},
        {'--library-progress':String(target)}
      ],{duration:160 * Math.abs(target - from),easing:'ease'});
      motions.set(libraryDrawer,animation);
      return animation;
    }
    function closeLibrary() {
      if (libraryDrawer.hidden || libraryClosing) return;
      libraryClosing = true;
      const token = ++libraryMotion;
      const animation = slideLibrary(true);
      const finish = () => {
        if (token !== libraryMotion) return;
        libraryDrawer.hidden = true;
        libraryClosing = false;
        animation?.cancel();
        doc.body.classList.remove('library-drawer-open');
        scheduleEdgeHandle(); options.layout?.();
      };
      if (animation) animation.finished.then(finish,() => {}); else finish();
      const button = doc.querySelector('#project-library-open');
      button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label','Abrir biblioteca do projeto');
      scheduleEdgeHandle(); options.layout?.();
    }
    function openLibrary(view = lastViews.library) {
      const entering = libraryDrawer.hidden || libraryClosing;
      ++libraryMotion; libraryClosing = false;
      options.loadRegistry?.();
      libraryDrawer.hidden = false;
      doc.body.classList.add('library-drawer-open');
      Object.entries(libraryViews).forEach(([key,node]) => { node.hidden = key !== view; });
      const glossary = doc.querySelector('#localization-glossary');
      if (glossary) glossary.hidden = view !== 'glossary';
      libraryTabs.querySelectorAll('button').forEach(button => {
        button.hidden = false;
        const active = button.dataset.productionView === view;
        button.setAttribute('aria-selected',String(active)); button.tabIndex = active ? 0 : -1;
      });
      lastViews.library = view; persistPreferences();
      const button = doc.querySelector('#project-library-open');
      button.setAttribute('aria-expanded','true'); button.setAttribute('aria-label','Fechar biblioteca do projeto');
      options.renderLibraryView?.(view); if (entering) slideLibrary(); scheduleEdgeHandle(); options.layout?.();
    }
    libraryDrawer.querySelector('header button').addEventListener('click',closeLibrary);
    libraryTabs.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const buttons = [...libraryTabs.querySelectorAll('button')];
      const index = buttons.indexOf(event.target); if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].click(); buttons[next].focus();
    });
    const memories = new Map();
    const viewPositions = new Map();
    const splits = { history:false, translation:false, scene:false };
    const widths = { history:520, translation:520, scene:520 };
    const lastViews = { history:'sequence', translation:'localization', scene:'presentation', library:'characters', validation:'validation' };
    try {
      const saved = JSON.parse(win.localStorage.getItem(preferenceKey) || '{}');
      Object.keys(splits).forEach(key => {
        if (typeof saved?.splits?.[key] === 'boolean') splits[key] = saved.splits[key];
        if (Number.isFinite(saved?.widths?.[key])) widths[key] = Math.max(420,Math.min(900,saved.widths[key]));
      });
      Object.keys(viewGroups).forEach(key => { if (viewGroups[key].includes(saved?.views?.[key])) lastViews[key] = saved.views[key]; });
    } catch (_) { /* UI preferences remain available in memory when storage is unavailable. */ }
    function persistPreferences() {
      try { win.localStorage.setItem(preferenceKey,JSON.stringify({splits,widths,views:lastViews})); } catch (_) { /* Storage is optional. */ }
    }
    let area = 'writing', currentView = null, inspectedBlock = null, savedSelection = null;
    let restoreFrame = 0, viewFrame = 0;
    const scrollTargets = '#narrative-sequence,#narrative-planning,#narrative-map,#localization-list,#localization-project-summary,#narrative-character-list,#narrative-variable-list,#narrative-glossary-view,#narrative-presentation,#narrative-presentation-form,#narrative-validation';
    const viewMemoryKey = () => `${currentView === 'planning' ? options.planningId?.() || documentId() : documentId()}:${currentView}`;
    function rememberView() {
      if (!currentView || panel.hidden) return;
      viewPositions.set(viewMemoryKey(),[...panel.querySelectorAll(scrollTargets)].map(node => ({node,top:node.scrollTop,left:node.scrollLeft})));
    }
    function restoreView() {
      win.cancelAnimationFrame(viewFrame);
      const key = viewMemoryKey();
      viewFrame = win.requestAnimationFrame(() => {
        if (key !== viewMemoryKey() || panel.hidden) return;
        viewPositions.get(key)?.forEach(({node,top,left}) => { node.scrollTop = top; node.scrollLeft = left; });
      });
    }
    function cancelRestore() { win.cancelAnimationFrame(restoreFrame); win.cancelAnimationFrame(viewFrame); restoreFrame = 0; viewFrame = 0; }
    ['pointerdown','keydown','beforeinput','wheel','touchstart'].forEach(name => doc.addEventListener(name,cancelRestore,{capture:true,passive:true}));
    if (win.ResizeObserver) new win.ResizeObserver(() => {
      scheduleEdgeHandle();
    }).observe(nav);
    const narrow = win.matchMedia('(max-width: 1100px)');
    const inEditor = node => node && (editor.contains(node) || doc.querySelector('.page')?.contains(node));
    function remember() {
      rememberView();
      if (!['writing','library'].includes(area) && !doc.body.classList.contains('work-area-split')) return;
      const selection = win.getSelection();
      if (selection?.rangeCount && inEditor(selection.anchorNode) && inEditor(selection.focusNode)) {
        savedSelection = { anchor:selection.anchorNode, anchorOffset:selection.anchorOffset, focus:selection.focusNode, focusOffset:selection.focusOffset };
      }
      const active = doc.activeElement;
      memories.set(documentId(), { selection:savedSelection, scrollTop:editorArea.scrollTop, scrollLeft:editorArea.scrollLeft,
        focus:inEditor(active) ? active : editor, start:active?.selectionStart, end:active?.selectionEnd });
    }
    function restore(deferred = true) {
      const memory = memories.get(documentId());
      if (!memory) return;
      const id = documentId();
      const apply = () => {
        if (area !== 'writing' || id !== documentId()) return;
        const target = memory.focus?.isConnected ? memory.focus : editor;
        target.focus({preventScroll:true});
        const s = memory.selection;
        if (s?.anchor.isConnected && s.focus.isConnected && inEditor(s.anchor) && inEditor(s.focus)) {
          try { win.getSelection().setBaseAndExtent(s.anchor,s.anchorOffset,s.focus,s.focusOffset); } catch (_) { /* A removed paragraph has no selection to restore. */ }
        }
        if (typeof memory.start === 'number' && target.setSelectionRange) target.setSelectionRange(memory.start,memory.end);
        editorArea.scrollTop = memory.scrollTop;
        editorArea.scrollLeft = memory.scrollLeft;
      };
      apply();
      win.cancelAnimationFrame(restoreFrame);
      if (deferred) restoreFrame = win.requestAnimationFrame(() => { apply(); restoreFrame = win.requestAnimationFrame(apply); });
    }
    function splitMaximum() {
      const app = doc.querySelector('.app').getBoundingClientRect();
      const source = doc.querySelector('.workspace').getBoundingClientRect();
      return Math.max(420,Math.min(900,app.right - source.left - 320 - (parseFloat(win.getComputedStyle(doc.body).getPropertyValue('--zen-sidebar-space')) || 0)));
    }
    function syncSplitAccessibility() {
      const resizer = doc.querySelector('#narrative-resizer');
      const visible = !panel.hidden && doc.body.classList.contains('work-area-split');
      resizer.tabIndex = visible ? 0 : -1;
      if (!visible) { ['aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext'].forEach(name => resizer.removeAttribute(name)); return; }
      const size = Math.round(panel.getBoundingClientRect().width);
      resizer.setAttribute('aria-valuemin','420');
      resizer.setAttribute('aria-valuemax',String(Math.round(splitMaximum())));
      resizer.setAttribute('aria-valuenow',String(size));
      resizer.setAttribute('aria-valuetext',`${size} pixels para ${areas[area]}`);
    }
    function positionEdgeHandle() {
      const visible = node => node && node.getClientRects().length && node.clientWidth >= 36 && node.clientHeight >= 52;
      let surface = visible(editorArea) && !(area === 'library' && narrow.matches) ? editorArea : null;
      if (!surface) {
        // Use the outer boundary, never a translation card or an inset list.
        surface = !panel.hidden && visible(panel) ? panel : null;
      }
      edgeHandle.hidden = !surface;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const right = rect.left + surface.clientLeft + surface.clientWidth;
      const viewport = win.visualViewport;
      const topEdge = viewport?.offsetTop || 0;
      const bottomEdge = topEdge + (viewport?.height || win.innerHeight);
      const top = Math.max(topEdge,Math.min(rect.top + surface.clientTop + (surface.clientHeight - 52) / 2,bottomEdge - 52));
      edgeHandle.style.setProperty('--project-handle-left',`${Math.round(right - 36)}px`);
      edgeHandle.style.setProperty('--project-handle-top',`${Math.round(top)}px`);
    }
    function scheduleEdgeHandle() {
      win.cancelAnimationFrame(edgeFrame);
      edgeFrame = win.requestAnimationFrame(positionEdgeHandle);
    }
    function layout() {
      const effectiveSplit = Boolean(splits[area] && !narrow.matches && ['history','translation','scene'].includes(area));
      doc.body.dataset.workArea = area;
      if (widths[area]) doc.documentElement.style.setProperty('--narrative-panel-width',`${widths[area]}px`);
      doc.body.classList.toggle('work-area-split', effectiveSplit);
      nav.querySelectorAll('[data-work-area]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.workArea === (area === 'library' ? 'writing' : area))));
      const libraryButton = doc.querySelector('#project-library-open');
      libraryButton.setAttribute('aria-expanded',String(!libraryDrawer.hidden));
      libraryButton.setAttribute('aria-label',!libraryDrawer.hidden ? 'Fechar biblioteca do projeto' : 'Abrir biblioteca do projeto');
      libraryButton.title = !libraryDrawer.hidden ? 'Fechar biblioteca do projeto' : 'Biblioteca do projeto · Personagens, variáveis e glossário';
      splitButton.hidden = narrow.matches || ['writing','library','validation'].includes(area);
      splitButton.disabled = narrow.matches;
      splitButton.setAttribute('aria-pressed',String(effectiveSplit));
      splitButton.textContent = effectiveSplit ? 'Uma área' : 'Dividir área';
      splitButton.title = narrow.matches ? 'Amplie a janela para dividir a área' : 'Documento e ferramenta lado a lado';
      doc.querySelector('#narrative-title').textContent = areas[area];
      doc.querySelector('#work-area-context').textContent = areas[area];
      doc.querySelector('#narrative-collapse').textContent = area === 'library' ? 'Fechar' : 'Escrever';
      doc.querySelector('#narrative-collapse').setAttribute('aria-label',area === 'library' ? 'Fechar biblioteca do projeto' : 'Voltar à escrita');
      const group = area === 'history' ? ['sequence','planning','map'] : area === 'library' ? ['characters','variables','glossary'] : [];
      const tabs = panel.querySelector('.narrative-tabs');
      tabs.hidden = !group.length;
      tabs.querySelectorAll('[data-production-view]').forEach(button => { button.hidden = !group.includes(button.dataset.productionView); });
      doc.querySelector('#work-area-story-actions').hidden = !['history','scene'].includes(area);
      panel.dataset.workArea = area;
      if (area !== 'writing') closeInspector();
      panel.querySelectorAll('[data-production-view]').forEach(button => { button.tabIndex = button.getAttribute('aria-selected') === 'true' ? 0 : -1; });
      syncSplitAccessibility();
      scheduleEdgeHandle();
      options.layout?.();
      if (!panel.hidden && (presentedArea !== area || presentedSplit !== effectiveSplit)) reveal(panel.querySelector('.narrative-panel'));
      presentedArea = area; presentedSplit = effectiveSplit;
    }
    function activateView(view) {
      rememberView();
      closeMenus();
      win.cancelAnimationFrame(restoreFrame);
      const next = areaForView(view);
      if (['writing','library'].includes(area)) remember();
      area = next;
      currentView = view;
      lastViews[next] = view;
      persistPreferences();
      layout();
      if (next === 'library') { const memory = memories.get(documentId()); if (memory) { editorArea.scrollTop = memory.scrollTop; editorArea.scrollLeft = memory.scrollLeft; } }
      win.requestAnimationFrame(() => panel.querySelectorAll('[data-production-view]').forEach(button => { button.tabIndex = button.getAttribute('aria-selected') === 'true' ? 0 : -1; }));
    }
    function write(restoreSelection = true, deferred = true) {
      rememberView();
      closeMenus();
      win.cancelAnimationFrame(restoreFrame);
      area = 'writing';
      layout();
      setOpen(false);
      if (restoreSelection) restore(deferred);
    }
    function select(next) {
      if (next === 'library') { openLibrary(); return; }
      if (next === 'writing') { write(); return; }
      if (!areas[next] || (area === next && !panel.hidden)) return;
      closeInspector();
      options.loadRegistry?.();
      showView(lastViews[next] || 'sequence');
      setOpen(true);
      render();
      restoreView();
    }
    nav.addEventListener('pointerdown',remember);
    nav.addEventListener('click',event => {
      const button = event.target.closest('[data-work-area]');
      if (button) select(button.dataset.workArea);
    });
    doc.querySelector('#project-library-open').addEventListener('pointerdown',remember);
    doc.querySelector('#project-library-open').addEventListener('click',() => libraryDrawer.hidden || libraryClosing ? openLibrary() : closeLibrary());
    doc.querySelector('#work-area-issues').addEventListener('click',() => select('validation'));
    splitButton.addEventListener('click',() => {
      rememberView();
      doc.querySelector('#actions-menu').open = false;
      splits[area] = !splits[area]; persistPreferences(); layout(); restoreView();
    });
    narrow.addEventListener('change',() => { rememberView(); layout(); restoreView(); });
    doc.addEventListener('docs-layout-change',() => { closeMenus(); layout(); });
    doc.querySelector('#actions-menu').addEventListener('pointerdown',remember);
    doc.querySelector('#scene-settings-toggle').addEventListener('click',event => {
      const view = doc.querySelector('#narrative-presentation');
      const open = view.dataset.settingsOpen !== 'true';
      view.dataset.settingsOpen = String(open);
      event.currentTarget.setAttribute('aria-expanded',String(open));
    });
    panel.querySelector('.narrative-tabs').addEventListener('click',event => { if (event.target.closest('[data-production-view]')) restoreView(); });
    panel.querySelector('.narrative-tabs').addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const buttons = [...panel.querySelectorAll('[data-production-view]')].filter(button => !button.hidden);
      if (!buttons.includes(event.target)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (buttons.indexOf(event.target) + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[index].click(); buttons[index].focus();
    });
    // Menus live outside the surfaces that clip/scroll their working contents.
    const menus = [...doc.querySelectorAll('.sequence-properties,#localization-settings-menu,#narrative-insert-tools,#toolbar-lists,#toolbar-callouts')].map(details => {
      const content = details.querySelector(':scope > div');
      const summary = details.querySelector(':scope > summary');
      return {details,content,summary,parent:content.parentNode,next:content.nextSibling};
    });
    function positionMenu(menu) {
      if (!menu.details.open || menu.content.parentNode !== doc.body) return;
      const rect = menu.summary.getBoundingClientRect();
      const viewport = win.visualViewport;
      const leftEdge = (viewport?.offsetLeft || 0) + 10;
      const topEdge = (viewport?.offsetTop || 0) + 10;
      const rightEdge = leftEdge + (viewport?.width || win.innerWidth) - 20;
      const bottomEdge = topEdge + (viewport?.height || win.innerHeight) - 20;
      if (rect.bottom < topEdge || rect.top > bottomEdge || rect.right < leftEdge || rect.left > rightEdge) { closeMenu(menu); return; }
      const style = menu.content.style;
      style.maxWidth = `${Math.max(0,rightEdge - leftEdge)}px`;
      style.maxHeight = `${Math.max(0,bottomEdge - topEdge)}px`;
      const size = menu.content.getBoundingClientRect();
      style.left = `${Math.max(leftEdge,Math.min(rect.right - size.width,rightEdge - size.width))}px`;
      const below = Math.min(bottomEdge - topEdge,bottomEdge - rect.bottom - 8);
      const above = Math.min(bottomEdge - topEdge,rect.top - topEdge - 8);
      const useBelow = below >= Math.min(size.height,200) || below >= above;
      style.maxHeight = `${Math.max(0,useBelow ? below : above)}px`;
      style.top = `${useBelow ? rect.bottom + 8 : Math.max(topEdge,rect.top - Math.min(size.height,above) - 8)}px`;
    }
    function closeMenu(menu, returnFocus = false) {
      menu.details.open = false;
      menu.summary.setAttribute('aria-expanded','false');
      menu.content.classList.remove('work-area-popover');
      menu.content.removeAttribute('style');
      menu.parent.insertBefore(menu.content,menu.next?.parentNode === menu.parent ? menu.next : null);
      if (returnFocus) menu.summary.focus({preventScroll:true});
    }
    function closeMenus(except = null) {
      menus.forEach(menu => { if (menu !== except && (menu.details.open || menu.content.parentNode === doc.body)) closeMenu(menu); });
    }
    menus.forEach(menu => {
      menu.content.dataset.menuKind = menu.details.classList.contains('toolbar-menu') ? 'toolbar' : menu.details.id === 'narrative-insert-tools' ? 'insert' : menu.details.id === 'localization-settings-menu' ? 'localization' : 'sequence';
      if (!menu.content.id) menu.content.id = `work-area-menu-${menu.details.id}`;
      menu.summary.setAttribute('aria-controls',menu.content.id);
      menu.summary.setAttribute('aria-expanded',String(menu.details.open));
      if (menu.details.classList.contains('toolbar-menu')) {
        menu.content.addEventListener('click',event => {
          if (event.target.closest('button:not([disabled])')) closeMenu(menu);
        });
      }
      menu.details.addEventListener('toggle',() => {
        menu.summary.setAttribute('aria-expanded',String(menu.details.open));
        if (!menu.details.open) { if (menu.content.parentNode === doc.body) closeMenu(menu); return; }
        closeMenus(menu);
        doc.body.append(menu.content);
        menu.content.classList.add('work-area-popover');
        positionMenu(menu);
        if (!menu.details.open) return;
        reveal(menu.content,false);
        menu.content.querySelector('input:not([disabled]):not([type="hidden"]),select:not([disabled]),button:not([disabled])')?.focus({preventScroll:true});
      });
      menu.content.addEventListener('keydown',event => {
        if (event.key !== 'Tab') return;
        const fields = [...menu.content.querySelectorAll('input,select,button,summary')].filter(node => !node.disabled && node.getClientRects().length);
        if ((event.shiftKey && event.target === fields[0]) || (!event.shiftKey && event.target === fields.at(-1))) {
          event.preventDefault(); closeMenu(menu,true);
        }
      });
    });
    const repositionMenus = () => menus.forEach(positionMenu);
    win.addEventListener('resize',repositionMenus);
    win.addEventListener('resize',scheduleEdgeHandle);
    win.visualViewport?.addEventListener('resize',scheduleEdgeHandle);
    win.visualViewport?.addEventListener('scroll',scheduleEdgeHandle);
    doc.addEventListener('scroll',scheduleEdgeHandle,{capture:true,passive:true});
    win.visualViewport?.addEventListener('resize',repositionMenus);
    win.visualViewport?.addEventListener('scroll',repositionMenus);
    doc.addEventListener('scroll',repositionMenus,{capture:true,passive:true});
    doc.addEventListener('pointerdown',event => {
      menus.forEach(menu => { if (!menu.details.contains(event.target) && !menu.content.contains(event.target) && menu.details.open) closeMenu(menu); });
    });
    doc.addEventListener('keydown',event => {
      if (event.key !== 'Escape' || doc.querySelector('dialog[open]')) return;
      const menu = menus.find(item => item.details.open);
      if (menu) { event.preventDefault(); event.stopPropagation(); closeMenu(menu,true); }
      else if (!libraryDrawer.hidden) { event.preventDefault(); closeLibrary(); doc.querySelector('#project-library-open').focus({preventScroll:true}); }
      else if (!inspector.hidden) { event.preventDefault(); closeInspector(); restore(); options.layout?.(); }
    },true);
    doc.addEventListener('selectionchange',() => {
      const selection = win.getSelection();
      if ((['writing','library'].includes(area) || doc.body.classList.contains('work-area-split')) && selection?.rangeCount && inEditor(selection.anchorNode)) {
        savedSelection = { anchor:selection.anchorNode,anchorOffset:selection.anchorOffset,focus:selection.focusNode,focusOffset:selection.focusOffset };
      }
    });
    menus.find(menu => menu.details.id === 'narrative-insert-tools')?.content.addEventListener('pointerdown',event => { if (event.target.closest('[data-insert-narrative]')) event.preventDefault(); });
    menus.find(menu => menu.details.id === 'narrative-insert-tools')?.content.addEventListener('click',event => {
      if (event.target.closest('[data-insert-narrative]')) options.insertBlock?.(event.target.closest('[data-insert-narrative]').dataset.insertNarrative);
    });
    // Existing export/test buttons keep their listeners inside the contextual actions menu.
    doc.querySelector('#work-area-story-actions').append(doc.querySelector('#narrative-test-current'),doc.querySelector('#story-export-open'));
    panel.querySelector('#narrative-actions').hidden = true;
    const glossaryView = doc.querySelector('#narrative-glossary-view');
    glossaryView.append(doc.querySelector('#localization-glossary'));
    let inspectorBindings = [];
    function closeInspector() {
      if (inspector.contains(doc.activeElement)) doc.activeElement.blur();
      inspector.hidden = true;
      doc.body.classList.remove('writing-inspector-open');
      if (inspectedBlock) {
        delete inspectedBlock.dataset.inspectorOpen;
        inspectedBlock.querySelector(':scope > .narrative-marker')?.setAttribute('aria-expanded','false');
      }
      inspectedBlock = null;
      inspectorBindings = [];
    }
    function inspectorContext() {
      if (!inspectedBlock) return;
      const text = inspectedBlock.querySelector('.narrative-text,.narrative-choice-prompt,.narrative-variation-version[data-active="true"]')?.textContent?.replace(/\s+/g,' ').trim();
      doc.querySelector('#writing-inspector-context').textContent = text ? text.slice(0,180) + (text.length > 180 ? '…' : '') : 'Ação sem texto de leitura.';
    }
    function inspect(block) {
      if (!block?.isConnected) return;
      win.cancelAnimationFrame(restoreFrame);
      remember();
      if (area !== 'writing') write(false);
      closeInspector();
      inspectedBlock = block;
      block.dataset.inspectorOpen = 'true';
      block.querySelector(':scope > .narrative-marker')?.setAttribute('aria-expanded','true');
      doc.querySelector('#writing-inspector-title').textContent = block.querySelector(':scope > .narrative-marker')?.textContent || 'Trecho';
      inspectorFields.replaceChildren();
      inspectorContext();
      doc.querySelector('#writing-inspector-jump').textContent = block.dataset.readingEmpty === 'true' ? 'Continuar escrevendo após a ação' : 'Editar texto no documento';
      const editable = options.canEdit?.() !== false;
      const technical = doc.createElement('details');
      const summary = doc.createElement('summary'); summary.textContent = 'Identificadores'; technical.append(summary);
      block.querySelectorAll(':scope > .narrative-meta .narrative-field,:scope > .narrative-meta select').forEach(field => {
        const label = doc.createElement('label');
        label.textContent = field.getAttribute('aria-label') || field.dataset.placeholder || 'Valor';
        const control = field.tagName === 'SELECT' ? field.cloneNode(true) : doc.createElement('input');
        control.disabled = !editable || field.disabled === true;
        control.removeAttribute('id'); control.removeAttribute('contenteditable');
        control.value = field.tagName === 'SELECT' ? field.value : field.textContent;
        const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
        let mutation = null;
        control.addEventListener('focus',() => { mutation = options.beginMutation?.(); });
        control.addEventListener(eventName,() => {
          if (!block.isConnected) { closeInspector(); return; }
          if (field.tagName === 'SELECT') field.value = control.value;
          else field.textContent = control.value;
          field.dispatchEvent(new win.Event(eventName,{bubbles:true}));
        });
        inspectorBindings.push({field,control});
        control.addEventListener('keydown',event => {
          if (event.key !== 'Enter' || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || field.tagName === 'SELECT') return;
          event.preventDefault(); control.blur(); closeInspector();
          if (block.isConnected) options.resumeBlock?.(block);
          options.layout?.();
        });
        control.addEventListener('blur',() => { field.dispatchEvent(new win.FocusEvent('focusout',{bubbles:true})); if (mutation) options.endMutation?.(mutation); mutation = null; });
        label.append(control);
        (field.classList.contains('narrative-localization-id') ? technical : inspectorFields).append(label);
      });
      if (technical.childElementCount > 1) inspectorFields.append(technical);
      doc.querySelector('#writing-inspector-delete').disabled = !editable;
      inspector.hidden = false;
      doc.body.classList.add('writing-inspector-open');
      options.layout?.();
      reveal(inspector);
    }
    doc.querySelector('#writing-inspector-close').addEventListener('click',() => { closeInspector(); restore(); options.layout?.(); });
    doc.querySelector('#writing-inspector-jump').addEventListener('click',() => {
      const block = inspectedBlock; closeInspector();
      if (block?.isConnected) options.resumeBlock(block);
    });
    doc.querySelector('#writing-inspector-delete').addEventListener('click',() => {
      const block = inspectedBlock; closeInspector();
      if (block?.isConnected) options.removeBlock(block);
    });
    let inspectorFrame = 0;
    new win.MutationObserver(() => {
      if (!inspectedBlock) return;
      win.cancelAnimationFrame(inspectorFrame);
      inspectorFrame = win.requestAnimationFrame(() => {
        if (!inspectedBlock) return;
        if (!inspectedBlock.isConnected || inspectorBindings.some(({field}) => !inspectedBlock.contains(field))) { closeInspector(); options.layout?.(); return; }
        inspectorContext();
        inspectorBindings.forEach(({field,control}) => {
          if (control === doc.activeElement) return;
          control.disabled = options.canEdit?.() === false || field.disabled === true;
          if (field.tagName === 'SELECT') control.replaceChildren(...[...field.children].map(option => option.cloneNode(true)));
          control.value = field.tagName === 'SELECT' ? field.value : field.textContent;
        });
      });
    }).observe(editor,{childList:true,characterData:true,subtree:true});
    if (win.ResizeObserver) {
      new win.ResizeObserver(syncSplitAccessibility).observe(panel);
      const edgeObserver = new win.ResizeObserver(scheduleEdgeHandle);
      [editorArea,panel,...panel.querySelectorAll('.narrative-view,.localization-list,.localization-project-summary,.narrative-character-list,.narrative-variable-list,.localization-glossary')].forEach(node => edgeObserver.observe(node));
    }
    let sidebarLayoutFrame = 0;
    const sidebarClasses = ['focus-mode','zen-sidebar-open','zen-sidebar-pinned','zen-sidebar-dismissed','library-drawer-open'];
    let sidebarState = sidebarClasses.map(name => doc.body.classList.contains(name)).join(':');
    new win.MutationObserver(() => {
      const next = sidebarClasses.map(name => doc.body.classList.contains(name)).join(':');
      if (next === sidebarState) return;
      sidebarState = next;
      win.cancelAnimationFrame(sidebarLayoutFrame);
      sidebarLayoutFrame = win.requestAnimationFrame(() => {
        repositionMenus(); scheduleEdgeHandle(); syncSplitAccessibility(); options.layout?.();
      });
    }).observe(doc.body,{attributes:true,attributeFilter:['class']});
    layout();
    return { select, activateView, inspect, closeInspector, write, remember, openLibrary,
      previewDocument() { if (narrow.matches) write(false); else { splits[area] = true; layout(); } },
      documentChanged() { closeMenus(); closeInspector(); if (!libraryDrawer.hidden) options.renderLibraryView?.(lastViews.library); savedSelection = null; currentView = null; if (area !== 'writing') showView(lastViews[area]); },
      resizeSplit(width, save = false) {
        if (!widths[area] || !Number.isFinite(width)) return;
        widths[area] = Math.max(420,Math.min(splitMaximum(),width));
        doc.documentElement.style.setProperty('--narrative-panel-width',`${widths[area]}px`);
        syncSplitAccessibility();
        if (save) persistPreferences();
      },
      saveLayout:persistPreferences,
      panelVisibility(open) {
        if (open) {
          if (!panelWasOpen) reveal(panel.querySelector('.narrative-panel'));
          panelWasOpen = true;
          scheduleEdgeHandle();
          return;
        }
        panelWasOpen = false;
        if (area === 'writing') { doc.body.classList.remove('work-area-split'); return; }
        remember(); closeMenus(); area = 'writing'; layout(); restore();
      },
      get area() { return area; },
      updateIssues(count) { const button = doc.querySelector('#work-area-issues'); button.textContent = count ? `Pendências · ${count}` : 'Sem pendências'; button.dataset.hasIssues = String(count > 0); }
    };
  }
  root.HeartspaceProductionWorkspaces = { mount, areaForView };
})(globalThis);
