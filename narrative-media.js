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
    const presentation = value => {
      const input = value && typeof value === 'object' ? value : {};
      const color = (candidate,fallback) => /^#[0-9a-f]{6}$/i.test(String(candidate || '')) ? String(candidate).toLowerCase() : fallback;
      return {
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
    const createScene = (container,options = {}) => {
      const doc = container.ownerDocument || document;
      const layer = doc.createElement('div'); layer.className = 'narrative-scene-media'; layer.setAttribute('aria-hidden','true');
      const shade = doc.createElement('div'); shade.className = 'scene-shade';
      const audio = doc.createElement('audio'); audio.loop = true; audio.preload = 'none'; audio.hidden = true;
      let background = doc.createElement('img'), portrait = doc.createElement('img');
      background.className = 'scene-background'; portrait.className = 'scene-portrait'; background.alt = ''; portrait.alt = '';
      background.hidden = true; portrait.hidden = true;
      layer.append(background,shade,portrait,audio); container.prepend(layer);
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
        if (!container.contains(layer)) container.prepend(layer);
        const value = presentation(raw);
        const nextBackground = source(value.background,'image');
        const nextPortrait = source(character?.portrait,'image');
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
        layer,update,
        setActive:value => { active = Boolean(value); play(); },
        setSound:(enabled,level = .5) => { muted = !enabled; volume = Math.max(0,Math.min(1,Number(level) || 0)); play(); },
        dispose:() => { active = false; audio.pause(); audio.removeAttribute('src'); audio.load?.(); layer.remove(); }
      };
    };
    return {limits,extensions,normalize,source,presentation,position,createScene,sniff};
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
  root.HeartspaceNarrativeMedia = media;
})(globalThis);
