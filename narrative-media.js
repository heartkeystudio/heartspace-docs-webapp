/* Portable scene/media rules shared by authoring, preview and exported games. */
(function (root) {
  function createNarrativeMedia() {
    const limits = { image:4 * 1024 * 1024, audio:8 * 1024 * 1024 };
    const extensions = { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/webm':'webm','audio/mp4':'m4a' };
    const validated = new Map();
    const sniff = bytes => {
      const ascii = (offset,text) => [...text].every((letter,index) => bytes[offset + index] === letter.charCodeAt(0));
      if (bytes[0] === 137 && ascii(1,'PNG\r\n\x1a\n')) return 'image/png';
      if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
      if (ascii(0,'RIFF') && ascii(8,'WEBP')) return 'image/webp';
      if (ascii(0,'RIFF') && ascii(8,'WAVE')) return 'audio/wav';
      if (ascii(0,'OggS')) return 'audio/ogg';
      if (ascii(0,'ID3') || (bytes[0] === 255 && (bytes[1] & 224) === 224)) return 'audio/mpeg';
      if (ascii(4,'ftyp')) return 'audio/mp4';
      if ([26,69,223,163].every((value,index) => bytes[index] === value)) return 'audio/webm';
      return '';
    };
    const normalize = (value,kind,packaged = false) => {
      if (!value || typeof value !== 'object') return null;
      const name = String(value.name || '').replace(/[\x00-\x1f]/g,'').slice(0,160);
      if (packaged && typeof value.src === 'string' && /^assets\/[a-z0-9_-]+\.(png|jpg|webp|mp3|ogg|wav|webm|m4a)$/.test(value.src)) {
        if (!extensions[value.mime] || !value.mime.startsWith(kind + '/') || !value.src.endsWith('.' + extensions[value.mime])) return null;
        return { name,mime:value.mime,src:value.src };
      }
      if (typeof value.data !== 'string' || value.data.length > Math.ceil(limits[kind] * 4 / 3) + 100) return null;
      if (validated.has(value.data)) {
        const mime = validated.get(value.data);
        return mime.startsWith(kind + '/') ? {name,mime,data:value.data} : null;
      }
      const match = value.data.match(/^data:([a-z]+\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})$/i);
      if (!match || !extensions[match[1]] || !match[1].startsWith(kind + '/') || match[2].length % 4) return null;
      const size = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
      if (size > limits[kind]) return null;
      let mime;
      try { mime = sniff(Uint8Array.from(atob(match[2].slice(0,64)),character => character.charCodeAt(0))); }
      catch (_) { return null; }
      if (mime !== match[1]) return null;
      if (validated.size >= 24) validated.delete(validated.keys().next().value);
      validated.set(value.data,mime);
      return {name,mime,data:value.data};
    };
    const source = (value,kind) => {
      const asset = normalize(value,kind,true);
      return asset?.data || asset?.src || '';
    };
    const position = value => ['left','center','right'].includes(value) ? value : 'left';
    const viewportPresets = { '16:9':[1280,720], '4:3':[1024,768], '9:16':[720,1280], '1:1':[1080,1080] };
    const viewport = value => {
      const input = value && typeof value === 'object' ? value : {};
      const aspect = ['free','custom',...Object.keys(viewportPresets)].includes(input.aspect) ? input.aspect : 'free';
      const dimension = (candidate,fallback) => Number.isFinite(Number(candidate)) && Number(candidate) > 0 ? Math.max(320,Math.min(4096,Math.round(Number(candidate)))) : fallback;
      const [width,height] = viewportPresets[aspect] || [dimension(input.width,1280),dimension(input.height,720)];
      return {aspect,width,height};
    };
    const number = (value,fallback,min,max) => value !== null && value !== '' && Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
    const element = (input,index = 0) => {
      input = input && typeof input === 'object' ? input : {};
      const type = ['image','character','text','button','hotspot'].includes(input.type) ? input.type : 'image';
      const compact = ['text','button','hotspot'].includes(type);
      return {
        id:String(input.id || `element-${index + 1}`).replace(/[^a-z0-9_.-]/gi,'').slice(0,80) || `element-${index + 1}`,
        name:String(input.name || ({image:'Imagem',character:'Personagem',text:'Texto',button:'Botão',hotspot:'Região clicável'})[type]).slice(0,120), type,
        choice_block_id:String(input.choice_block_id || '').slice(0,160), choice_option_id:String(input.choice_option_id || '').slice(0,160),
        parallax_x:number(input.parallax_x,0,-15,15), parallax_y:number(input.parallax_y,0,-15,15),
        asset:normalize(input.asset,'image',true), character_id:String(input.character_id || '').slice(0,160),
        text:String(input.text || '').slice(0,10000), visible:input.visible !== false,
        x:number(input.x,50,-100,200), y:number(input.y,compact ? 30 : 100,-100,200),
        width:number(input.width,type === 'button' ? 24 : compact ? 60 : 40,1,300), height:number(input.height,type === 'button' ? 10 : compact ? 20 : 65,1,300),
        scale:number(input.scale,1,.05,8), rotation:number(input.rotation,0,-360,360), opacity:number(input.opacity,1,0,1),
        flip_x:input.flip_x === true, flip_y:input.flip_y === true,
        anchor_x:number(input.anchor_x,50,0,100), anchor_y:number(input.anchor_y,compact ? 50 : 100,0,100),
        fit:['contain','cover','original'].includes(input.fit) ? input.fit : 'contain',
        focus_x:number(input.focus_x,50,0,100), focus_y:number(input.focus_y,type === 'character' ? 100 : 50,0,100),
        font_size:number(input.font_size,36,12,160), color:/^#[0-9a-f]{6}$/i.test(input.color || '') ? input.color : '#ffffff',
        align:['left','center','right'].includes(input.align) ? input.align : 'center'
      };
    };
    const elements = value => {
      const seen = new Set();
      return (Array.isArray(value) ? value : []).slice(0,80).map(element).filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
    };
    const sceneState = value => {
      const input = value && typeof value === 'object' ? value : {};
      const color = (candidate,fallback) => /^#[0-9a-f]{6}$/i.test(String(candidate || '')) ? String(candidate).toLowerCase() : fallback;
      return {
        viewport:viewport(input.viewport), // Legacy input only; current games override this with their global viewport.
        elements:elements(input.elements), dialogue_visible:input.dialogue_visible !== false,
        parallax_enabled:input.parallax_enabled === true,
        parallax_strength:number(input.parallax_strength,1,0,2), parallax_smoothing_ms:number(input.parallax_smoothing_ms,160,0,1000),
        model:['panel','subtitle','card'].includes(input.model) ? input.model : 'panel',
        position:['top','center','bottom'].includes(input.position) ? input.position : 'bottom',
        accent:color(input.accent,'#0c8ce9'),surface:color(input.surface,'#10161d'),text:color(input.text,'#edf3f7'),scene:color(input.scene,'#111923'),
        speed:[0,12,24,42].includes(Number(input.speed)) ? Number(input.speed) : 24,
        background:normalize(input.background,'image',true),music:normalize(input.music,'audio',true),
        background_fit:input.background_fit === 'contain' ? 'contain' : 'cover',
        background_focus:['top','center','bottom'].includes(input.background_focus) ? input.background_focus : 'center',
        background_dim:Number.isFinite(Number(input.background_dim)) ? Math.max(0,Math.min(.8,Number(input.background_dim))) : .3,
        portrait_position:['left','center','right'].includes(input.portrait_position) ? input.portrait_position : 'auto',
        portrait_size:[35,50,65,80].includes(Number(input.portrait_size)) ? Number(input.portrait_size) : 65,
        transition:['none','fade','slide'].includes(input.transition) ? input.transition : 'fade',
        transition_ms:[200,400,700].includes(Number(input.transition_ms)) ? Number(input.transition_ms) : 400
      };
    };
    const has = (object,key) => Object.prototype.hasOwnProperty.call(object || {},key);
    const sceneKeys = Object.keys(sceneState()).filter(key => !['elements','viewport'].includes(key));
    const elementKeys = Object.keys(element()).filter(key => key !== 'id');
    const elementId = value => String(value || '').replace(/[^a-z0-9_.-]/gi,'').slice(0,80);
    const idList = value => [...new Set((Array.isArray(value) ? value : []).slice(0,80).map(elementId).filter(Boolean))];
    const motionKeys = ['x','y','width','height','scale','rotation','opacity','anchor_x','anchor_y'];
    const motionEasings = {'linear':'linear','ease':'ease','ease-in':'ease-in','ease-out':'ease-out','ease-in-out':'ease-in-out','back':'cubic-bezier(.34,1.56,.64,1)'};
    const sceneAnimations = value => {
      const tracks = new Map();
      (Array.isArray(value) ? value : []).slice(0,80).forEach(raw => {
        const element_id = elementId(raw?.element_id); if (!element_id) return;
        const frames = new Map();
        (Array.isArray(raw.keyframes) ? raw.keyframes : []).slice(0,32).forEach(frame => {
          if (!frame || !Number.isFinite(Number(frame.at)) || Number(frame.at) < 0 || Number(frame.at) >= 100) return;
          const at = Math.round(Number(frame.at)), normalized = element(frame);
          if (at >= 100) return;
          frames.set(at,{at,...Object.fromEntries(motionKeys.filter(key => has(frame,key)).map(key => [key,normalized[key]]))});
        });
        tracks.set(element_id,{element_id,enabled:raw.enabled !== false,duration_ms:Math.round(number(raw.duration_ms,700,50,60000)),delay_ms:Math.round(number(raw.delay_ms,0,0,60000)),
          easing:has(motionEasings,raw.easing) ? raw.easing : 'ease-in-out',keyframes:[...frames.values()].sort((left,right) => left.at - right.at)});
      });
      return [...tracks.values()];
    };
    const sceneCues = input => {
      const byBlock = new Map();
      (Array.isArray(input) ? input : []).slice(0,1000).forEach(raw => {
        const block_id = String(raw?.block_id || '').slice(0,160); if (!block_id) return;
        const settings = sceneState(raw.settings), patches = new Map();
        (Array.isArray(raw.set) ? raw.set : []).slice(0,80).forEach(patch => {
          const id = elementId(patch?.id); if (!id) return;
          const normalized = element(patch);
          patches.set(id,{id,...Object.fromEntries(elementKeys.filter(key => has(patch,key)).map(key => [key,normalized[key]]))});
        });
        byBlock.set(block_id,{
          block_id,reset:raw.reset === true,animations:sceneAnimations(raw.animations),
          settings:Object.fromEntries(sceneKeys.filter(key => has(raw.settings,key)).map(key => [key,settings[key]])),
          set:[...patches.values()],remove:idList(raw.remove),order:Array.isArray(raw.order) ? idList(raw.order) : null
        });
      });
      return [...byBlock.values()];
    };
    const presentation = value => ({...sceneState(value),cues:sceneCues(value?.cues)});
    const same = (left,right) => left === right || Boolean(left && right && typeof left === 'object' && typeof right === 'object' && Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => has(right,key) && left[key] === right[key]));
    const sceneDiff = (previous,next) => {
      const before = sceneState(previous), after = sceneState(next), byId = new Map(before.elements.map(item => [item.id,item]));
      return {
        reset:false,
        settings:Object.fromEntries(sceneKeys.filter(key => !same(before[key],after[key])).map(key => [key,after[key]])),
        set:after.elements.flatMap(item => {
          const old = byId.get(item.id);
          const values = Object.fromEntries(elementKeys.filter(key => !old || !same(old[key],item[key])).map(key => [key,item[key]]));
          return Object.keys(values).length ? [{id:item.id,...values}] : [];
        }),
        remove:before.elements.filter(item => !after.elements.some(candidate => candidate.id === item.id)).map(item => item.id),
        order:same(before.elements.map(item => item.id),after.elements.map(item => item.id)) ? null : after.elements.map(item => item.id)
      };
    };
    const applySceneCue = (current,cue,base) => {
      const start = cue.reset ? sceneState(base) : sceneState(current);
      const byId = new Map(start.elements.filter(item => !cue.remove.includes(item.id)).map(item => [item.id,item]));
      cue.set.forEach(patch => {
        // A transform of a removed base element must not recreate an empty image.
        if (byId.has(patch.id) || has(patch,'type')) byId.set(patch.id,element({...byId.get(patch.id),...patch}));
      });
      const rank = new Map((cue.order || []).map((id,index) => [id,index]));
      const list = [...byId.values()];
      if (cue.order) list.sort((left,right) => (rank.get(left.id) ?? 1000) - (rank.get(right.id) ?? 1000));
      return sceneState({...start,...cue.settings,elements:list});
    };
    const resolveScene = (raw,nodes = [],index = -1) => {
      const base = sceneState(raw), cues = new Map(sceneCues(raw?.cues).map(cue => [cue.block_id,cue]));
      let current = base;
      const end = Math.min(nodes.length - 1,Number.isFinite(index) ? Math.floor(index) : -1);
      for (let cursor = 0; cursor <= end; cursor += 1) {
        const cue = cues.get(nodes[cursor]?.id);
        if (cue) current = applySceneCue(current,cue,base);
      }
      return current;
    };
    const sceneMotion = (raw,nodes = [],index = -1) => {
      const cue = sceneCues(raw?.cues).find(item => item.block_id === nodes[index]?.id);
      const before = resolveScene(raw,nodes,index - 1), after = resolveScene(raw,nodes,index);
      const tracks = (cue?.animations || []).filter(track => track.enabled).flatMap(track => {
        const old = before.elements.find(item => item.id === track.element_id);
        const target = after.elements.find(item => item.id === track.element_id);
        if ((!old?.visible && !target?.visible) || (!old && !target)) return [];
        const from = {...(old || target),opacity:old?.visible ? old.opacity : 0};
        const to = {...(target || old),opacity:target?.visible ? target.opacity : 0};
        const initial = track.keyframes.find(frame => frame.at === 0);
        const pose = item => Object.fromEntries(motionKeys.map(key => [key,item[key]]));
        const first = {...from,...initial};
        return [{...track,from:old || target,to:target || null,
          frames:[{at:0,...pose(first)},...track.keyframes.filter(frame => frame.at > 0).map(frame => ({...pose(first),...frame})),{at:100,...pose(to)}]}];
      });
      return {before,after,tracks,duration:tracks.reduce((max,track) => Math.max(max,track.delay_ms + track.duration_ms),0)};
    };
    const resolveSceneCharacter = (nodes = [],index = -1,characters = []) => {
      let cursor = Math.min(index,nodes.length - 1);
      while (cursor >= 0 && ['pause','signal'].includes(nodes[cursor]?.type)) cursor -= 1;
      const node = nodes[cursor];
      return node?.type === 'dialogue' ? characters.find(character => character.id === node.character_id) || null : null;
    };
    const sceneStates = raw => {
      const base = presentation(raw);
      return [sceneState(base),...base.cues.map(cue => ({...cue.settings,elements:cue.set}))];
    };
    const sceneInteractionIssues = (raw,nodes = []) => {
      const base = sceneState(raw), cues = new Map(sceneCues(raw?.cues).map(cue => [cue.block_id,cue]));
      const issues = [], seen = new Set();
      const nodesById = new Map();
      nodes.forEach(node => { const group = nodesById.get(node.id) || []; group.push(node); nodesById.set(node.id,group); });
      const inspect = state => state.elements.forEach(item => {
        const linked = Boolean(item.choice_block_id || item.choice_option_id);
        if (!linked && (!item.visible || !['button','hotspot'].includes(item.type))) return;
        const key = JSON.stringify([item.id,item.choice_block_id,item.choice_option_id]);
        if (seen.has(key)) return;
        seen.add(key);
        const matches = nodesById.get(item.choice_block_id) || [];
        const options = matches.length === 1 && matches[0].type === 'choice' ? (matches[0].options || []).filter(option => option.id && option.id === item.choice_option_id) : [];
        const reason = !linked ? 'unlinked' : matches.length > 1 || options.length > 1 ? 'ambiguous' : matches.length !== 1 || options.length !== 1 ? 'missing' : '';
        if (!reason) return;
        issues.push({element_id:item.id,name:item.name,reason});
      });
      let state = base;
      if (!nodes.length) inspect(state);
      nodes.forEach(node => { const cue = cues.get(node.id); if (cue) state = applySceneCue(state,cue,base); inspect(state); });
      return issues;
    };
    const createViewport = (surface,options = {}) => {
      const doc = surface.ownerDocument, win = doc.defaultView;
      const host = doc.createElement('div'); host.className = 'scene-viewport'; host.dataset.sceneHost = options.kind || 'player';
      surface.before(host); host.append(surface); surface.classList.add('scene-canvas');
      const guide = doc.createElement('div'); guide.className = 'scene-safe-area'; guide.setAttribute('aria-hidden','true'); guide.hidden = true; surface.append(guide);
      let value = presentation(), frame = 0;
      const fit = () => {
        host.hidden = surface.hidden;
        if (surface.hidden || value.viewport.aspect === 'free') return;
        const width = host.clientWidth, height = host.clientHeight;
        if (!width || !height) return;
        const scale = Math.min(width / value.viewport.width,height / value.viewport.height);
        surface.style.setProperty('--frame-scale',String(scale));
        surface.style.setProperty('--frame-left',`${Math.max(0,(width - value.viewport.width * scale) / 2)}px`);
        surface.style.setProperty('--frame-top',`${Math.max(0,(height - value.viewport.height * scale) / 2)}px`);
      };
      const schedule = () => { win.cancelAnimationFrame(frame); frame = win.requestAnimationFrame(fit); };
      const observer = win.ResizeObserver ? new win.ResizeObserver(schedule) : null; observer?.observe(host);
      const visibilityObserver = new win.MutationObserver(schedule); visibilityObserver.observe(surface,{attributes:true,attributeFilter:['hidden']});
      win.addEventListener('resize',schedule);
      const update = raw => {
        value = presentation(raw);
        const fixed = value.viewport.aspect !== 'free';
        host.dataset.sceneFixed = surface.dataset.sceneFixed = String(fixed);
        surface.dataset.model = value.model; surface.dataset.position = value.position;
        surface.style.setProperty('--frame-width',`${value.viewport.width}px`);
        surface.style.setProperty('--frame-height',`${value.viewport.height}px`);
        Object.entries({accent:value.accent,surface:value.surface,text:value.text,scene:value.scene}).forEach(([key,color]) => surface.style.setProperty(`--frame-${key}`,color));
        fit(); schedule();
      };
      update(value);
      return {host,guide,update,fit:schedule,setGuide:enabled => { guide.hidden = !Boolean(enabled); },dispose:() => { win.cancelAnimationFrame(frame); observer?.disconnect(); visibilityObserver.disconnect(); win.removeEventListener('resize',schedule); guide.remove(); host.replaceWith(surface); surface.classList.remove('scene-canvas'); delete surface.dataset.sceneFixed; }};
    };
    const createScene = (container,options = {}) => {
      const doc = container.ownerDocument || document;
      const layer = doc.createElement('div'); layer.className = 'narrative-scene-media'; layer.setAttribute('aria-hidden','true');
      const shade = doc.createElement('div'); shade.className = 'scene-shade';
      const audio = doc.createElement('audio'); audio.loop = true; audio.preload = 'none'; audio.hidden = true;
      let background = doc.createElement('img'), portrait = doc.createElement('img');
      background.className = 'scene-background'; portrait.className = 'scene-portrait'; background.alt = ''; portrait.alt = '';
      background.hidden = true; portrait.hidden = true;
      const objects = doc.createElement('div'); objects.className = 'scene-elements-layer';
      // Text elements carry content, while the legacy art is decorative.
      layer.removeAttribute('aria-hidden');
      [background,shade,portrait].forEach(node => node.setAttribute('aria-hidden','true'));
      layer.append(background,shade,portrait,objects,audio); container.prepend(layer);
      const elementNodes = new Map();
      let finalElements = new Map(), interactionNode = null, interactionOptions = [];
      const win = doc.defaultView;
      let parallaxSettings = {enabled:false,strength:1,smoothing:160}, parallaxElements = new Map(), parallaxPreview = false;
      let parallaxFrame = 0, parallaxTime = 0, parallaxHeld = false, parallaxDisposed = false;
      let parallaxWidth = 0, parallaxHeight = 0;
      const parallaxTarget = {x:0,y:0}, parallaxCurrent = {x:0,y:0};
      const hoverPointer = win.matchMedia?.('(any-hover: hover) and (any-pointer: fine)');
      const parallaxSupported = win.CSS?.supports?.('translate','1px 1px') === true;
      const canParallax = () => !parallaxDisposed && parallaxSettings.enabled && parallaxSettings.strength > 0 && parallaxElements.size > 0 &&
        (options.authoring ? parallaxPreview : active) && !doc.hidden && !options.reducedMotion?.() && hoverPointer?.matches && parallaxSupported;
      // Independent translation composes with timeline transforms and carries the hit target too.
      const paintParallax = () => elementNodes.forEach((node,id) => {
        const item = parallaxElements.get(id);
        if (!item || (!parallaxCurrent.x && !parallaxCurrent.y)) { node.style.removeProperty('translate'); return; }
        const x = -parallaxCurrent.x * item.parallax_x * parallaxWidth * parallaxSettings.strength / 100;
        const y = -parallaxCurrent.y * item.parallax_y * parallaxHeight * parallaxSettings.strength / 100;
        node.style.translate = `${x}px ${y}px`;
      });
      const resetParallax = () => {
        win.cancelAnimationFrame(parallaxFrame); parallaxFrame = 0; parallaxTime = 0; parallaxHeld = false;
        parallaxTarget.x = parallaxTarget.y = parallaxCurrent.x = parallaxCurrent.y = 0; paintParallax();
      };
      const tickParallax = time => {
        parallaxFrame = 0;
        if (!canParallax()) { resetParallax(); return; }
        if (parallaxHeld) return;
        const elapsed = Math.max(0,Math.min(64,parallaxTime ? time - parallaxTime : 16)); parallaxTime = time;
        const amount = parallaxSettings.smoothing ? 1 - Math.exp(-elapsed / parallaxSettings.smoothing) : 1;
        parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * amount;
        parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * amount;
        const settled = Math.max(Math.abs(parallaxTarget.x - parallaxCurrent.x),Math.abs(parallaxTarget.y - parallaxCurrent.y)) < .0005;
        if (settled) { parallaxCurrent.x = parallaxTarget.x; parallaxCurrent.y = parallaxTarget.y; }
        paintParallax();
        if (!settled) parallaxFrame = win.requestAnimationFrame(tickParallax); else parallaxTime = 0;
      };
      const scheduleParallax = () => {
        if (!canParallax()) { resetParallax(); return; }
        if (!parallaxHeld && !parallaxFrame) parallaxFrame = win.requestAnimationFrame(tickParallax);
      };
      const leaveParallax = () => { parallaxTarget.x = parallaxTarget.y = 0; scheduleParallax(); };
      const moveParallax = event => {
        if (event.pointerType === 'touch') { resetParallax(); return; }
        if (!['mouse','pen'].includes(event.pointerType) || event.buttons || !canParallax()) return;
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { leaveParallax(); return; }
        parallaxTarget.x = Math.max(-1,Math.min(1,(event.clientX - rect.left) / rect.width * 2 - 1));
        parallaxTarget.y = Math.max(-1,Math.min(1,(event.clientY - rect.top) / rect.height * 2 - 1)); scheduleParallax();
      };
      const holdParallax = event => {
        if (event.pointerType === 'touch') { resetParallax(); return; }
        if (!['mouse','pen'].includes(event.pointerType) || !canParallax()) return;
        parallaxHeld = true; win.cancelAnimationFrame(parallaxFrame); parallaxFrame = 0; parallaxTime = 0;
      };
      const releaseParallax = event => { if (parallaxHeld) { parallaxHeld = false; moveParallax(event); scheduleParallax(); } };
      const measureParallax = () => { parallaxWidth = container.clientWidth; parallaxHeight = container.clientHeight; paintParallax(); };
      container.addEventListener('pointermove',moveParallax,{passive:true});
      container.addEventListener('pointerleave',leaveParallax,{passive:true});
      container.addEventListener('pointerdown',holdParallax,{passive:true});
      container.addEventListener('pointercancel',resetParallax,{passive:true});
      win.addEventListener('pointerup',releaseParallax,{passive:true});
      win.addEventListener('blur',resetParallax);
      win.addEventListener('resize',measureParallax);
      doc.addEventListener('visibilitychange',resetParallax);
      hoverPointer?.addEventListener?.('change',resetParallax);
      const parallaxObserver = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(measureParallax) : null;
      parallaxObserver?.observe(container);
      let motion = null, motionFrame = 0, motionClock = null, motionPlaying = false, motionSuspended = false, motionGeneration = 0;
      const moving = new Map();
      const transform = item => `translate(${-item.anchor_x}%,${-item.anchor_y}%) rotate(${item.rotation}deg) scale(${item.scale})`;
      const motionStyle = item => ({left:`${item.x}%`,top:`${item.y}%`,width:`${item.width}%`,height:`${item.height}%`,transform:transform(item),transformOrigin:`${item.anchor_x}% ${item.anchor_y}%`,opacity:item.opacity});
      const motionTime = () => motionClock ? Math.max(0,Math.min(motion?.duration || 0,Number(motionClock.currentTime) || 0)) : 0;
      const interactionOption = item => {
        if (!item?.choice_option_id || interactionNode?.type !== 'choice' || item.choice_block_id !== interactionNode.id) return null;
        const matches = interactionOptions.filter(option => option.id === item.choice_option_id);
        return matches.length === 1 ? matches[0] : null;
      };
      const refreshInteractions = () => {
        elementNodes.forEach((node,id) => {
          const item = finalElements.get(id), option = interactionOption(item);
          const linked = Boolean(options.onInteraction && item?.choice_block_id && item.choice_option_id && interactionNode?.type === 'choice' && item.choice_block_id === interactionNode.id);
          let hit = node.querySelector('.scene-element-hit');
          if (!linked) { hit?.remove(); node.firstElementChild?.removeAttribute('aria-hidden'); delete node.dataset.sceneChoice; return; }
          if (!hit) {
            hit = doc.createElement('button'); hit.type = 'button'; hit.className = 'scene-element-hit';
            hit.addEventListener('click',event => {
              event.preventDefault(); event.stopPropagation();
              const current = finalElements.get(id), choice = interactionOption(current);
              if (!active || hit.disabled || !choice?.enabled || !current?.visible || node.hidden || node.firstElementChild.hidden || Number(win.getComputedStyle(node).opacity) <= .01) return;
              options.onInteraction?.({block_id:interactionNode.id,option_id:choice.id});
            });
            node.append(hit);
          }
          const track = moving.get(id)?.track;
          const waiting = Boolean(track && motionTime() < track.delay_ms + track.duration_ms);
          hit.disabled = !active || !option?.enabled || !item.visible || item.opacity <= .01 || node.firstElementChild.hidden || waiting;
          hit.setAttribute('aria-label',item.text || option?.text || item.name);
          node.firstElementChild.setAttribute('aria-hidden','true');
          hit.title = option?.enabled ? (option.text || item.name) : 'Esta escolha não está disponível neste caminho';
          node.dataset.sceneChoice = hit.disabled ? 'unavailable' : 'available';
          if (item.type === 'button' && !item.text && option?.text && node.firstElementChild.textContent !== option.text) node.firstElementChild.textContent = option.text;
        });
      };
      // The runner supplies availability; scene objects never execute their own routes or effects.
      const setInteractions = (node = null,choices = []) => {
        interactionNode = node; interactionOptions = choices; refreshInteractions();
      };
      const notifyMotion = () => options.onAnimationState?.({active:Boolean(motion),playing:motionPlaying,time:motionTime(),duration:motion?.duration || 0});
      const syncMotionVisibility = time => { moving.forEach(({node,track}) => { const hidden = !track.to?.visible && time >= track.delay_ms + track.duration_ms; if (node.hidden !== hidden) node.hidden = hidden; }); refreshInteractions(); };
      const tickMotion = () => {
        if (!motion || !motionPlaying) return;
        syncMotionVisibility(motionTime()); notifyMotion();
        motionFrame = win.requestAnimationFrame(tickMotion);
      };
      const stopAnimations = (notify = true) => {
        motionGeneration += 1; win.cancelAnimationFrame(motionFrame); motionClock?.cancel(); motionClock = null;
        moving.forEach(({animation,node,track}) => {
          animation.cancel();
          if (track.to) node.hidden = !track.to.visible;
          else { node.remove(); elementNodes.delete(track.element_id); parallaxElements.delete(track.element_id); }
        });
        moving.clear(); motion = null; motionPlaying = false; motionSuspended = false;
        refreshInteractions();
        if (notify) notifyMotion();
      };
      const pauseAnimations = () => {
        const time = motionTime();
        motionClock?.pause(); if (motionClock) motionClock.currentTime = time; moving.forEach(({animation}) => { animation.pause(); animation.currentTime = time; }); motionPlaying = false; motionSuspended = false;
        win.cancelAnimationFrame(motionFrame); notifyMotion();
      };
      const resumeAnimations = () => {
        if (!motion || options.reducedMotion?.()) { stopAnimations(); return; }
        if (motionTime() >= motion.duration) return;
        const time = motionTime(), start = doc.timeline?.currentTime;
        motionPlaying = true; motionSuspended = false; motionClock?.play();
        if (Number.isFinite(start)) motionClock.startTime = start - time;
        moving.forEach(({animation,track}) => {
          animation.currentTime = time;
          // Completed tracks stay settled when a longer track is resumed.
          if (time < track.delay_ms + track.duration_ms) { animation.play(); if (Number.isFinite(start)) animation.startTime = start - time; }
        });
        win.cancelAnimationFrame(motionFrame); tickMotion();
      };
      const seekAnimations = time => {
        if (!motion) return;
        pauseAnimations();
        const value = number(time,0,0,motion.duration);
        motionClock.currentTime = value; moving.forEach(({animation}) => { animation.currentTime = value; });
        syncMotionVisibility(value); notifyMotion();
      };
      const updateElements = list => {
        parallaxElements = new Map(list.filter(item => item.parallax_x || item.parallax_y).map(item => [item.id,item]));
        const ids = new Set(list.map(item => item.id));
        elementNodes.forEach((node,id) => { if (!ids.has(id)) { node.remove(); elementNodes.delete(id); } });
        list.forEach((item,index) => {
          let node = elementNodes.get(item.id);
          if (!node || node.dataset.elementType !== item.type) {
            node?.remove(); node = doc.createElement('div'); node.className = 'scene-element';
            node.dataset.sceneElement = item.id; node.dataset.elementType = item.type;
            const art = ['image','character'].includes(item.type);
            const content = doc.createElement(art ? 'img' : 'div'); content.className = 'scene-element-content';
            if (art) { content.alt = ''; content.draggable = false; content.addEventListener('error',() => { content.hidden = true; refreshInteractions(); options.onImageIssue?.('Uma imagem da composição não pôde ser exibida.'); }); }
            node.append(content); objects.append(node); elementNodes.set(item.id,node);
          }
          node.hidden = !item.visible;
          const content = node.firstElementChild;
          Object.assign(node.style,{left:`${item.x}%`,top:`${item.y}%`,width:`${item.width}%`,height:`${item.height}%`,
            transform:transform(item),
            transformOrigin:`${item.anchor_x}% ${item.anchor_y}%`,opacity:String(item.opacity),zIndex:String(index + 1)});
          node.style.setProperty('--element-anchor-x',`${item.anchor_x}%`); node.style.setProperty('--element-anchor-y',`${item.anchor_y}%`);
          if (!['image','character'].includes(item.type)) {
            content.textContent = item.type === 'hotspot' ? item.name : item.text || (item.type === 'button' ? item.name : '');
            Object.assign(content.style,{fontSize:`${item.font_size}px`,color:item.color,textAlign:item.align,justifyContent:item.align === 'left' ? 'flex-start' : item.align === 'right' ? 'flex-end' : 'center'});
          } else {
            const character = item.type === 'character' ? options.characters?.().find(candidate => candidate.id === item.character_id) : null;
            const src = source(item.type === 'character' ? character?.portrait : item.asset,'image');
            if (content.getAttribute('src') !== src) { if (src) content.src = src; else content.removeAttribute('src'); content.hidden = !src; }
            Object.assign(content.style,{objectFit:item.fit === 'original' ? 'none' : item.fit,objectPosition:`${item.focus_x}% ${item.focus_y}%`});
          }
          content.style.transform = `scale(${item.flip_x ? -1 : 1},${item.flip_y ? -1 : 1})`;
        });
        refreshInteractions();
        measureParallax();
      };
      const playAnimations = plan => {
        stopAnimations(false);
        if (!plan?.tracks?.length || options.reducedMotion?.() || typeof objects.animate !== 'function') { notifyMotion(); return; }
        const generation = motionGeneration;
        motion = plan;
        const list = [...plan.after.elements];
        plan.tracks.forEach(track => { if (!list.some(item => item.id === track.element_id)) list.push(track.from); });
        updateElements(list);
        try {
          plan.tracks.forEach(track => {
            const node = elementNodes.get(track.element_id); if (!node) return;
            node.hidden = false;
            const animation = node.animate(track.frames.map(frame => ({...motionStyle(frame),offset:frame.at / 100,easing:motionEasings[track.easing]})),
              {duration:track.duration_ms,delay:track.delay_ms,easing:'linear',fill:'both'});
            animation.onfinish = () => { if (generation === motionGeneration) syncMotionVisibility(motionTime()); };
            moving.set(track.element_id,{node,track,animation});
          });
          // One invisible clock keeps tracks with different delays aligned for scrubbing.
          motionClock = objects.animate([{opacity:1},{opacity:1}],{duration:plan.duration,fill:'both'});
          motionClock.onfinish = () => {
            if (generation !== motionGeneration || !motion) return;
            motionPlaying = false; win.cancelAnimationFrame(motionFrame); syncMotionVisibility(plan.duration); notifyMotion();
          };
          const start = doc.timeline?.currentTime;
          if (Number.isFinite(start)) { motionClock.startTime = start; moving.forEach(({animation}) => { animation.startTime = start; }); }
          motionPlaying = true; tickMotion();
        } catch (_) { stopAnimations(); updateElements(plan.after.elements); }
      };
      let lastBackground = '', lastPortrait = '', lastMusic = '', active = false, muted = false, volume = .5, attempting = false, attemptGeneration = 0;
      const reduced = () => options.reducedMotion?.() || false;
      const play = () => {
        audio.muted = muted; audio.volume = volume;
        if (!active || muted || !lastMusic) { attemptGeneration += 1; attempting = false; audio.pause(); return; }
        if (attempting || !audio.paused) return;
        attempting = true; const generation = ++attemptGeneration;
        try {
          Promise.resolve(audio.play()).then(() => {
            if (!active || muted) audio.pause();
            if (generation === attemptGeneration) attempting = false;
          },() => {
            if (generation !== attemptGeneration) return;
            attempting = false; options.onAudioIssue?.('O navegador não iniciou o áudio. Tente ativar o som nas opções.');
          });
        } catch (_) { attempting = false; options.onAudioIssue?.('Não foi possível reproduzir o áudio desta cena.'); }
      };
      const replaceImage = (image,src,className,transition) => {
        const next = doc.createElement('img'); next.className = className; next.alt = ''; next.hidden = !src;
        next.dataset.transition = 'none';
        next.addEventListener('load',() => { next.dataset.transition = reduced() ? 'none' : transition; });
        next.addEventListener('error',() => { next.hidden = true; options.onImageIssue?.('Não foi possível exibir uma imagem desta cena.'); });
        if (src) next.src = src;
        image.replaceWith(next);
        return next;
      };
      const update = (raw,character) => {
        resetParallax();
        setInteractions();
        stopAnimations();
        if (!container.contains(layer)) container.prepend(layer);
        const value = presentation(raw);
        parallaxSettings = {enabled:value.parallax_enabled,strength:value.parallax_strength,smoothing:value.parallax_smoothing_ms};
        finalElements = new Map(value.elements.map(item => [item.id,item]));
        const nextBackground = source(value.background,'image');
        const nextPortrait = value.elements.some(item => item.type === 'character') ? '' : source(character?.portrait,'image');
        container.dataset.dialogueVisible = String(value.dialogue_visible);
        updateElements(value.elements);
        const nextMusic = source(value.music,'audio');
        shade.hidden = !nextBackground;
        layer.style.setProperty('--scene-transition',`${value.transition_ms}ms`);
        layer.style.setProperty('--scene-dim',String(value.background_dim));
        layer.style.setProperty('--portrait-size',`${value.portrait_size}%`);
        layer.dataset.portraitPosition = value.portrait_position === 'auto' ? position(character?.portrait_position) : value.portrait_position;
        layer.dataset.motion = reduced() ? 'reduce' : 'normal';
        if (nextBackground !== lastBackground) { background = replaceImage(background,nextBackground,'scene-background',value.transition); lastBackground = nextBackground; }
        background.style.objectFit = value.background_fit; background.style.objectPosition = value.background_focus;
        if (nextPortrait !== lastPortrait) { portrait = replaceImage(portrait,nextPortrait,'scene-portrait',value.transition); lastPortrait = nextPortrait; }
        if (nextMusic !== lastMusic) {
          attemptGeneration += 1; attempting = false; audio.pause(); lastMusic = nextMusic;
          if (nextMusic) audio.src = nextMusic;
          else { audio.removeAttribute('src'); audio.load?.(); }
        }
        play();
      };
      return {
        layer,update,setInteractions,playAnimations,pauseAnimations,resumeAnimations,seekAnimations,stopAnimations,
        setParallaxPreview:enabled => { parallaxPreview = options.authoring === true && Boolean(enabled); resetParallax(); },
        refreshMotion:() => { resetParallax(); if (reduced()) stopAnimations(); },
        setActive:value => {
          active = Boolean(value);
          if (!active) resetParallax();
          refreshInteractions();
          if (!active) { const wasPlaying = motionPlaying || motionSuspended; pauseAnimations(); motionSuspended = wasPlaying; }
          else if (motionSuspended) resumeAnimations();
          play();
        },
        setSound:(enabled,level = .5) => { muted = !enabled; volume = Math.max(0,Math.min(1,Number(level) || 0)); play(); },
        dispose:() => {
          parallaxDisposed = true; resetParallax(); parallaxObserver?.disconnect();
          container.removeEventListener('pointermove',moveParallax); container.removeEventListener('pointerleave',leaveParallax);
          container.removeEventListener('pointerdown',holdParallax); container.removeEventListener('pointercancel',resetParallax);
          win.removeEventListener('pointerup',releaseParallax); win.removeEventListener('blur',resetParallax); win.removeEventListener('resize',measureParallax);
          doc.removeEventListener('visibilitychange',resetParallax); hoverPointer?.removeEventListener?.('change',resetParallax);
          stopAnimations(); active = false; audio.pause(); audio.removeAttribute('src'); audio.load?.(); layer.remove();
        }
      };
    };
    return {limits,extensions,normalize,source,presentation,position,viewport,element,elements,sceneState,sceneCues,sceneDiff,resolveScene,sceneAnimations,sceneMotion,motionKeys,resolveSceneCharacter,sceneStates,sceneInteractionIssues,createViewport,createScene,sniff};
  }
  const media = createNarrativeMedia();
  media.sourceCode = createNarrativeMedia.toString();
  media.readFile = async (file,kind,options = {}) => {
    if (kind === 'image') {
      if (!root.HeartspaceImageOptimizer) throw new Error('A otimização de imagens não está disponível. Recarregue o Docs.');
      file = await root.HeartspaceImageOptimizer.prepare(file,options);
    }
    if (!file || file.size > media.limits[kind]) throw new Error(kind === 'image' ? 'Use uma imagem de até 4 MB (PNG, JPEG ou WebP).' : 'Use um áudio de até 8 MB (MP3, OGG, WAV, WebM ou M4A).');
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Infer from signatures; names and browser-provided MIME types are not trusted.
    const mime = media.sniff(bytes);
    if (!mime.startsWith(kind + '/')) throw new Error(kind === 'image' ? 'Formato não reconhecido. Use PNG, JPEG ou WebP.' : 'Formato de áudio não reconhecido.');
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset,offset + 16384));
    const base64 = btoa(binary);
    const asset = media.normalize({name:file.name,data:`data:${mime};base64,${base64}`},kind);
    if (asset) return asset;
    throw new Error(kind === 'image' ? 'Formato não reconhecido. Use PNG, JPEG ou WebP.' : 'Formato de áudio não reconhecido.');
  };
  media.styles = `
    .narrative-scene-media{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:inherit}.scene-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.scene-shade{position:absolute;inset:0;background:#000;opacity:var(--scene-dim,.3)}.scene-portrait{position:absolute;bottom:0;left:2%;width:40%;max-width:480px;height:var(--portrait-size,65%);object-fit:contain;object-position:bottom center}.narrative-scene-media[data-portrait-position=right] .scene-portrait{left:auto;right:2%}.narrative-scene-media[data-portrait-position=center] .scene-portrait{left:25%;width:50%;max-width:none}.scene-background[data-transition=fade],.scene-background[data-transition=slide]{animation:scene-fade var(--scene-transition,400ms) ease-out}.scene-portrait[data-transition=fade]{animation:scene-fade var(--scene-transition,400ms) ease-out}.scene-portrait[data-transition=slide]{animation:scene-slide var(--scene-transition,400ms) ease-out}.narrative-scene-media[data-motion=reduce] img{animation:none!important}@keyframes scene-fade{from{opacity:0}to{opacity:1}}@keyframes scene-slide{from{opacity:0;translate:0 12px}to{opacity:1;translate:0 0}}@media(prefers-reduced-motion:reduce){.narrative-scene-media img{animation:none!important}}@media(max-width:480px){.scene-portrait{width:58%;left:0}.narrative-scene-media[data-portrait-position=right] .scene-portrait{right:0}.narrative-scene-media[data-portrait-position=center] .scene-portrait{left:15%;width:70%}}
  `;
  media.styles += `
    .scene-viewport{display:contents}.scene-viewport[hidden],.scene-safe-area[hidden]{display:none!important}
    .scene-viewport[data-scene-fixed=true]{display:block;position:relative;isolation:isolate;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:#090909}
    .scene-viewport[data-scene-host=player][data-scene-fixed=true]{flex:1;height:auto}
    .scene-safe-area{position:absolute;z-index:4;inset:5%;border:2px dashed #fff9;box-shadow:0 0 0 1px #0008;pointer-events:none}
    .scene-viewport[data-scene-fixed=true]>.scene-canvas{position:absolute!important;inset:auto!important;left:var(--frame-left,0px)!important;top:var(--frame-top,0px)!important;width:var(--frame-width)!important;height:var(--frame-height)!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;box-sizing:border-box;transform:scale(var(--frame-scale,0));transform-origin:top left;display:flex;flex-direction:column;align-items:center!important;justify-content:flex-end;padding:48px 64px;border:0;border-radius:0;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--frame-scene) 70%,#506070),var(--frame-scene) 75%);box-shadow:none;isolation:isolate}
    .scene-canvas[data-scene-fixed=true][data-position=top]{justify-content:flex-start}.scene-canvas[data-scene-fixed=true][data-position=center]{justify-content:center}
    .scene-canvas[data-scene-fixed=true]>:is(.narrative-presentation-card,.narrative-player-box,.card){position:relative;z-index:2;display:grid;gap:12px;flex:0 1 auto;width:min(980px,100%);min-height:0;max-height:100%;margin:0;padding:28px;overflow:auto;border:1px solid #ffffff30;border-left:3px solid var(--frame-accent);border-radius:12px;color:var(--frame-text);background:var(--frame-surface);box-shadow:0 18px 70px #0008;backdrop-filter:none;text-align:left;font-size:23px}
    .scene-canvas[data-scene-fixed=true][data-model=subtitle]>:is(.narrative-presentation-card,.narrative-player-box,.card){border:0;background:transparent;box-shadow:none;text-align:center;text-shadow:0 2px 8px #000}
    .scene-canvas[data-scene-fixed=true][data-model=card]>:is(.narrative-presentation-card,.narrative-player-box,.card){width:min(620px,100%);border-left-width:1px;border-top:3px solid var(--frame-accent);text-align:center}
    .scene-canvas[data-scene-fixed=true] :is(.speaker,.narrative-test-speaker,.narrative-presentation-card>strong){font-size:12px;line-height:1.4;color:var(--frame-accent);letter-spacing:.08em}
    .scene-canvas[data-scene-fixed=true] :is(.copy,.narrative-test-copy,.narrative-presentation-card>span){font-size:calc(23px * var(--text-scale,1));line-height:1.6;min-height:3.1em;overflow-wrap:anywhere}
    .scene-canvas[data-scene-fixed=true] :is(.choices,.narrative-test-choices){display:grid;gap:8px;margin-top:5px}
    .scene-canvas[data-scene-fixed=true] :is(.choices,.narrative-test-choices) button{font-size:18px;line-height:1.45;min-height:44px;padding:12px 15px}
    .scene-canvas[data-scene-fixed=true] :is(.hint,.narrative-test-advance-hint){font-size:11px}.scene-canvas[data-scene-fixed=true] .next{font-size:14px}
    .scene-canvas[data-scene-fixed=true] .scene-portrait{left:2%;right:auto;width:40%;max-width:480px}
    .scene-canvas[data-scene-fixed=true] .narrative-scene-media[data-portrait-position=right] .scene-portrait{left:auto;right:2%}
    .scene-canvas[data-scene-fixed=true] .narrative-scene-media[data-portrait-position=center] .scene-portrait{left:25%;right:auto;width:50%;max-width:none}
  `;
  media.styles += `
    .scene-elements-layer{position:absolute;inset:0;pointer-events:none}.scene-element{position:absolute;box-sizing:border-box;pointer-events:none;overflow:visible}.scene-element[hidden],.scene-element-content[hidden]{display:none!important}
    .scene-element-content{display:block;width:100%;height:100%;max-width:none!important;max-height:none!important;box-sizing:border-box;transform-origin:center}
    div.scene-element-content{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.3;overflow:hidden}
    .scene-element[data-element-type=button]>.scene-element-content{display:flex;align-items:center;justify-content:center;padding:12px;border:2px solid currentColor;border-radius:10px;background:#10161de6;box-shadow:0 3px 12px #0005}
    .scene-element[data-element-type=hotspot]>.scene-element-content{visibility:hidden}
    .narrative-scene-media .scene-element>.scene-element-hit{display:block;position:absolute;inset:0;width:100%;height:100%;min-width:0;min-height:0;max-width:none;margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;color:transparent;pointer-events:auto;cursor:pointer;transform:none;touch-action:manipulation}
    .narrative-scene-media .scene-element>.scene-element-hit:disabled{cursor:default}
    .narrative-scene-media .scene-element>.scene-element-hit:focus-visible{outline:3px solid #ffe09b;outline-offset:3px;box-shadow:0 0 0 2px #121212}
    .scene-editing .scene-element>.scene-element-hit{display:none!important}
    .scene-editing .scene-element[data-element-type=hotspot]>.scene-element-content{visibility:visible;display:flex;align-items:center;justify-content:center;padding:8px;border:2px dashed #ffe09baa;background:#ffe09b15;color:#ffe09b!important}
    .scene-canvas[data-dialogue-visible=false]>.narrative-presentation-card{display:none!important}
    .scene-canvas[data-dialogue-visible=false]>:is(.narrative-player-box,.card){background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important}
    .scene-canvas[data-dialogue-visible=false]>:is(.narrative-player-box,.card)>:is(.speaker,.copy,.narrative-test-speaker,.narrative-test-copy){display:none!important}
  `;
  root.HeartspaceNarrativeMedia = media;
})(globalThis);
