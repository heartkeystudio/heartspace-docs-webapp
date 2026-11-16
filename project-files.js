/* Portable, editable .hdocs files; independent of accounts and sync providers. */
(function (root) {
  'use strict';
  const FORMAT = 'heartspace.docs.project-file', VERSION = 1;
  const limits = Object.freeze({file:256*1024*1024, decoded:192*1024*1024, asset:24*1024*1024, assets:10000});
  const mimeTypes = new Set(['image/png','image/jpeg','image/webp','audio/mpeg','audio/ogg','audio/wav','audio/webm','audio/mp4']);
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  function guardTree(value) {
    const pending = [[value,0]]; let count = 0;
    while (pending.length) {
      const [item,depth] = pending.pop();
      if (++count > 500000 || depth > 80) fail('A estrutura deste projeto é grande ou profunda demais para abrir neste editor.');
      if (item && typeof item === 'object') for (const key in item) {
        if (!Object.prototype.hasOwnProperty.call(item,key)) continue;
        if (pending.length + count >= 500000) fail('A estrutura deste projeto contém elementos demais para abrir neste editor.');
        pending.push([item[key],depth+1]);
      }
    }
  }
  async function walk(value,visitor,depth = 0) {
    if (depth > 80) fail('A estrutura do projeto é profunda demais.');
    if (!value || typeof value !== 'object') return;
    if (await visitor(value)) return;
    for (const child of Object.values(value)) await walk(child,visitor,depth+1);
  }
  function htmlFragment(html,doc) {
    const template = doc.createElement('template'); template.innerHTML = html;
    const allowed = new Set('p br hr div span section aside h1 h2 h3 h4 h5 h6 blockquote strong b em i u s del mark small sub sup pre code kbd ul ol li table thead tbody tfoot tr th td colgroup col figure figcaption img a details summary button label input textarea select option'.split(' '));
    const globals = new Set('id class title role hidden contenteditable spellcheck draggable tabindex'.split(' '));
    const attrs = {a:new Set(['href','target','rel']),img:new Set(['src','alt','width','height','loading']),input:new Set(['type','value','checked','disabled','placeholder','min','max','step']),button:new Set(['type','disabled']),textarea:new Set(['rows','cols','placeholder','disabled']),select:new Set(['disabled']),option:new Set(['value','selected']),td:new Set(['colspan','rowspan']),th:new Set(['colspan','rowspan','scope']),col:new Set(['span']),ol:new Set(['start','reversed']),li:new Set(['value']),details:new Set(['open'])};
    const forbidden = new Set('script style iframe object embed link meta base template svg math canvas audio video source track'.split(' '));
    const reserved = new Set([...doc.querySelectorAll('[id]')].filter(element => !element.closest('#editor')).map(element => element.id));
    let removed = 0;
    for (const element of [...template.content.querySelectorAll('*')]) {
      const tag = element.localName;
      if (forbidden.has(tag)) { element.remove(); removed++; continue; }
      if (!allowed.has(tag)) { element.replaceWith(...element.childNodes); removed++; continue; }
      for (const attribute of [...element.attributes]) {
        const key = attribute.name, value = attribute.value;
        if (key === 'style') {
          const safe = doc.createElement('span');
          for (const property of Array.from(element.style)) {
            const css = element.style.getPropertyValue(property);
            if (/^(color|background-color|font-(size|family|weight|style)|text-(align|decoration|indent)|line-height|white-space|vertical-align|margin(-\w+)?|padding(-\w+)?|border(-\w+)?|width|height|max-width|min-height|--[a-z0-9-]+)$/.test(property) && !/url\s*\(|expression\s*\(|@|\\|behavior|binding/i.test(css)) safe.style.setProperty(property,css);
          }
          element.setAttribute('style',safe.style.cssText); continue;
        }
        if (!(globals.has(key) || /^data-[a-z0-9-]+$/.test(key) || /^aria-[a-z-]+$/.test(key) || attrs[tag]?.has(key)) || (key === 'id' && reserved.has(value))) { element.removeAttribute(key); removed++; }
      }
      if (tag === 'a') {
        const href = element.getAttribute('href') || '';
        if (!/^(#|https?:\/\/|mailto:|tel:)/i.test(href.trim())) { element.removeAttribute('href'); removed++; }
        else if (/^https?:/i.test(href.trim())) { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
      }
      if (tag === 'button') element.type = 'button';
      if (tag === 'input' && !['text','number','checkbox','range','color','hidden'].includes(element.type)) element.type = 'text';
    }
    return {template,removed};
  }
  function bytesFromBase64(value) {
    if (typeof value !== 'string' || !value.length || value.length % 4 || !/^[a-z0-9+/]+={0,2}$/i.test(value) || value.length > Math.ceil(limits.asset*4/3)+4) fail('Uma mídia contém dados inválidos ou excede o tamanho suportado.');
    return Uint8Array.from(atob(value),character => character.charCodeAt(0));
  }
  async function checksum(bytes,algorithm = root.crypto?.subtle ? 'sha256' : 'crc32') {
    if (algorithm === 'sha256') {
      if (!root.crypto?.subtle) fail('Este navegador não consegue conferir a integridade deste projeto. Abra em um navegador atualizado.');
      return {algorithm,value:[...new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes))].map(byte => byte.toString(16).padStart(2,'0')).join('')};
    }
    if (algorithm !== 'crc32') fail('Verificação de integridade não reconhecida.');
    return {algorithm,value:root.HeartspaceNarrativePackage.crc32(bytes).toString(16).padStart(8,'0')};
  }
  async function validateAsset(bytes,mime) {
    if (!mimeTypes.has(mime) || !bytes.length || bytes.length > limits.asset) fail('Tipo ou tamanho de mídia não suportado no projeto.');
    const blob = new Blob([bytes],{type:mime});
    if (mime.startsWith('image/')) {
      const info = await root.HeartspaceImageOptimizer.validateOriginal(blob);
      if (info.mime !== mime) fail('O tipo declarado de uma imagem não corresponde ao arquivo.');
    } else {
      const head = String.fromCharCode(...bytes.subarray(0,16));
      const matches = {'audio/mpeg':head.startsWith('ID3') || bytes[0] === 255 && (bytes[1]&224) === 224,'audio/ogg':head.startsWith('OggS'),'audio/wav':head.startsWith('RIFF') && head.slice(8,12) === 'WAVE','audio/webm':[26,69,223,163].every((byte,index) => bytes[index] === byte),'audio/mp4':head.slice(4,8) === 'ftyp'};
      if (!matches[mime]) fail('O tipo declarado de um áudio não corresponde ao arquivo.');
    }
    return blob;
  }
  async function blobData(blob) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Não foi possível ler uma mídia do projeto.')); reader.readAsDataURL(blob);
    });
  }
  async function verifyProjectRef(value,bytes) {
    if (value === undefined) return;
    const ref = root.HeartspaceNarrativeMedia.projectRef(value);
    if (!ref) fail('Um vínculo de recurso do projeto está inválido ou pertence a uma versão não suportada.');
    const actual = await checksum(bytes,'sha256');
    if (actual.value !== ref.sha256) fail('A cópia de um recurso não corresponde à versão fixada. Selecione o recurso novamente antes de salvar.');
  }
  function imageProjectRef(image) {
    if (!image.hasAttribute('data-project-ref')) return undefined;
    let value; try { value = JSON.parse(image.dataset.projectRef); } catch (_) { fail('Uma imagem contém um vínculo inválido.'); }
    const ref = root.HeartspaceNarrativeMedia.projectRef(value);
    if (!ref) fail('Uma imagem contém um vínculo de versão não suportada.');
    image.dataset.projectRef = JSON.stringify(ref);
    return ref;
  }
  async function build(source,options) {
    root.HeartspaceDocsAuthoring.validate(source);
    const packed = clone(source), assets = [], seen = new Map(), handled = new WeakSet(); let total = 0;
    const add = async (blob,name = '') => {
      if (!blob) fail(`Uma mídia está indisponível${name ? `: ${name}` : ''}. O arquivo completo não foi gerado.`);
      const base64 = await blobData(blob), key = `${blob.type}:${base64}`;
      if (seen.has(key)) return seen.get(key);
      const bytes = bytesFromBase64(base64); await validateAsset(bytes,blob.type);
      total += bytes.length;
      if (total > limits.decoded || assets.length >= limits.assets) fail('O projeto excede a capacidade deste formato de arquivo. Separe-o em projetos menores.');
      const id = `asset-${assets.length+1}`;
      assets.push({id,mime:blob.type,bytes:bytes.length,base64,checksum:await checksum(bytes)}); seen.set(key,id); return id;
    };
    const aliases = options.documentAliases || new Map();
    for (const document of packed.documents) {
      const {template} = htmlFragment(document.content.body,options.document);
      for (const image of template.content.querySelectorAll('img')) {
        let blob;
        const src = image.getAttribute('src') || '';
        if (image.dataset.localImage || image.dataset.remoteImage) blob = await options.resolveImage({localId:image.dataset.localImage || '',remotePath:image.dataset.remoteImage || ''});
        else if (/^data:image\/(png|jpeg|webp);base64,/i.test(src)) {
          const comma = src.indexOf(','); blob = new Blob([bytesFromBase64(src.slice(comma+1))],{type:src.slice(5,src.indexOf(';')).toLowerCase()});
        } else fail('Uma imagem do documento não está incorporada. Importe-a do dispositivo antes de salvar o projeto completo.');
        const ref = imageProjectRef(image);
        if (ref && blob) await verifyProjectRef(ref,new Uint8Array(await blob.arrayBuffer()));
        image.dataset.projectAsset = await add(blob,image.alt);
        image.removeAttribute('src'); delete image.dataset.localImage; delete image.dataset.remoteImage;
      }
      for (const link of template.content.querySelectorAll('[data-doc-ref]')) {
        if (!aliases.has(link.dataset.docRef)) continue;
        link.dataset.docRef = aliases.get(link.dataset.docRef); link.setAttribute('href',`#heartspace-doc=${encodeURIComponent(link.dataset.docRef)}`);
      }
      document.content.body = template.innerHTML;
    }
    await walk(packed,async value => {
      if (handled.has(value)) return true;
      if (typeof value.data === 'string' && value.data.startsWith('data:') && typeof value.mime === 'string') {
        const match = value.data.match(/^data:([^;,]+);base64,(.+)$/s);
        if (!match || match[1] !== value.mime) fail('Uma mídia narrativa está inválida.');
        const bytes = bytesFromBase64(match[2]);
        await verifyProjectRef(value.project_ref,bytes);
        value.projectAsset = await add(new Blob([bytes],{type:value.mime}),value.name);
        delete value.data; delete value.src; return true;
      }
      if (value.project_ref !== undefined) fail('Um recurso vinculado não possui sua cópia offline.');
      if (value.texture && typeof value.texture === 'object') {
        const texture = value.texture;
        const blob = await options.resolveImage(texture);
        if (texture.project_ref !== undefined && blob) await verifyProjectRef(texture.project_ref,new Uint8Array(await blob.arrayBuffer()));
        const projectAsset = await add(blob,texture.name);
        value.texture = {projectAsset,name:typeof texture.name === 'string' ? texture.name : 'Textura',...(texture.project_ref ? {project_ref:clone(texture.project_ref)} : {})};
        handled.add(value.texture);
      }
      if (typeof value.documentId === 'string' && aliases.has(value.documentId)) value.documentId = aliases.get(value.documentId);
      if (Array.isArray(value.migratedChapterIds)) value.migratedChapterIds = value.migratedChapterIds.map(id => aliases.get(id) || id);
      return false;
    });
    const output = new Blob([JSON.stringify({format:FORMAT,schema_version:VERSION,source:packed,assets})],{type:'application/json'});
    if (output.size > limits.file) fail('O projeto excede a capacidade deste formato de arquivo. Separe-o em projetos menores.');
    return output;
  }
  async function read(file,options) {
    if (!file?.size || file.size > limits.file) fail('O arquivo está vazio ou é grande demais para abrir neste editor.');
    const packed = JSON.parse(await file.text()); guardTree(packed);
    if (packed?.format !== FORMAT || packed.schema_version !== VERSION || !Array.isArray(packed.assets) || packed.assets.length > limits.assets) fail('Arquivo de projeto não reconhecido ou de versão incompatível. Use um arquivo .hdocs.');
    root.HeartspaceDocsAuthoring.validate(packed.source);
    const assets = new Map(); let total = 0, removed = 0;
    for (const asset of packed.assets) {
      if (!/^asset-[1-9][0-9]*$/.test(asset?.id) || assets.has(asset.id)) fail('Identidade de mídia inválida ou repetida.');
      const bytes = bytesFromBase64(asset.base64); total += bytes.length;
      if (bytes.length !== asset.bytes || total > limits.decoded) fail('Tamanho de mídia inválido ou projeto grande demais.');
      const actual = await checksum(bytes,asset.checksum?.algorithm);
      if (actual.value !== asset.checksum?.value) fail('Uma mídia do projeto está corrompida. O projeto atual foi preservado.');
      const blob = await validateAsset(bytes,asset.mime);
      assets.set(asset.id,{blob,base64:asset.base64,mime:asset.mime,localId:`ambience-${root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`});
    }
    const source = packed.source, images = new Map(), handled = new WeakSet();
    const get = id => assets.get(id) || fail('O arquivo referencia uma mídia que não está incluída.');
    for (const document of source.documents) {
      const sanitized = htmlFragment(document.content.body,options.document); removed += sanitized.removed;
      for (const image of sanitized.template.content.querySelectorAll('img')) {
        if (!image.dataset.projectAsset) fail('O arquivo contém uma imagem sem os dados necessários para reabertura.');
        const asset = get(image.dataset.projectAsset);
        if (!asset.mime.startsWith('image/')) fail('Uma imagem referencia uma mídia incompatível.');
        await verifyProjectRef(imageProjectRef(image),bytesFromBase64(asset.base64));
        image.dataset.localImage = asset.localId; images.set(asset.localId,asset.blob);
        delete image.dataset.projectAsset; delete image.dataset.remoteImage; image.removeAttribute('src');
      }
      document.content.body = sanitized.template.innerHTML;
    }
    await walk(source,async value => {
      if (handled.has(value)) return true;
      if (value.texture?.projectAsset) {
        const asset = get(value.texture.projectAsset);
        if (!asset.mime.startsWith('image/')) fail('Uma textura referencia uma mídia incompatível.');
        await verifyProjectRef(value.texture.project_ref,bytesFromBase64(asset.base64));
        value.texture = {localId:asset.localId,remotePath:'',name:value.texture.name || 'Textura',...(value.texture.project_ref ? {project_ref:clone(value.texture.project_ref)} : {})}; images.set(asset.localId,asset.blob); handled.add(value.texture);
      } else if (value.texture?.localId || value.texture?.remotePath) fail('O projeto contém uma textura sem os dados necessários para reabertura.');
      if (value.projectAsset) {
        const asset = get(value.projectAsset);
        await verifyProjectRef(value.project_ref,bytesFromBase64(asset.base64));
        value.data = `data:${asset.mime};base64,${asset.base64}`; value.mime = asset.mime;
        if (!root.HeartspaceNarrativeMedia.normalize(value,asset.mime.startsWith('image/') ? 'image' : 'audio')) fail('Uma mídia narrativa excede o formato ou tamanho suportado pelo editor.');
        delete value.projectAsset; delete value.src; return true;
      }
      if (value.project_ref !== undefined) fail('Um recurso vinculado não possui sua cópia no pacote.');
      if (typeof value.data === 'string' && value.data.startsWith('data:') || typeof value.src === 'string' && /^(https?:|blob:|file:)/i.test(value.src)) fail('O projeto contém mídia fora do pacote.');
      return false;
    });
    root.HeartspaceDocsAuthoring.validate(source);
    return {source,images,removed};
  }
  function sanitizeSource(value,doc) {
    const source = clone(root.HeartspaceDocsAuthoring.validate(value)); let removed = 0;
    source.documents.forEach(document => { const result = htmlFragment(document.content.body,doc); document.content.body = result.template.innerHTML; removed += result.removed; });
    return {source,removed};
  }
  const sanitizeBody = (body,doc) => {
    const {template} = htmlFragment(body,doc);
    template.content.querySelectorAll('img').forEach(image => {
      if (image.dataset.localImage || image.dataset.remoteImage || !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(image.getAttribute('src') || '')) image.removeAttribute('src');
    });
    return template.innerHTML;
  };
  root.HeartspaceDocsProjectFiles = Object.freeze({FORMAT,VERSION,limits,build,read,sanitizeSource,sanitizeBody});
})(globalThis);
