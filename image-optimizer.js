/* Prepare a bounded, metadata-free raster before local persistence or cloud upload. */
(function (root) {
  'use strict';
  const KiB = 1024, MiB = KiB * KiB;
  const profiles = {
    document:{edge:1920,target:700 * KiB,maximum:1536 * KiB,floor:640},
    background:{edge:1920,target:900 * KiB,maximum:1536 * KiB,floor:640},
    portrait:{edge:1024,target:250 * KiB,maximum:512 * KiB,floor:384},
    texture:{edge:512,target:128 * KiB,maximum:256 * KiB,floor:128}
  };
  const inputLimit = 24 * MiB, pixelLimit = 40 * 1000 * 1000;
  const prepared = new WeakMap(), pending = new WeakMap();
  let queue = Promise.resolve();
  const textAt = (bytes,offset,text) => [...text].every((value,index) => bytes[offset + index] === value.charCodeAt(0));
  function inspect(bytes) {
    const data = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if (bytes.length >= 24 && bytes[0] === 137 && textAt(bytes,1,'PNG\r\n\x1a\n')) {
      let offset = 8;
      while (offset + 12 <= bytes.length) {
        const size = data.getUint32(offset);
        if (textAt(bytes,offset + 4,'acTL')) throw new Error('Imagens animadas precisam de um fluxo próprio. Use uma versão PNG, JPEG ou WebP estática.');
        if (textAt(bytes,offset + 4,'IDAT')) break;
        offset += size + 12;
      }
      return {mime:'image/png',width:data.getUint32(16),height:data.getUint32(20)};
    }
    if (bytes.length >= 12 && textAt(bytes,0,'RIFF') && textAt(bytes,8,'WEBP')) {
      let offset = 12, width = 0, height = 0;
      while (offset + 8 <= bytes.length) {
        const size = data.getUint32(offset + 4,true);
        if (textAt(bytes,offset,'ANIM') || textAt(bytes,offset,'ANMF')) throw new Error('Use um WebP estático. A otimização não remove a animação silenciosamente.');
        if (textAt(bytes,offset,'VP8X') && size >= 10 && offset + 18 <= bytes.length) {
          if (bytes[offset + 8] & 2) throw new Error('Use uma imagem estática para adicionar ao documento.');
          width = 1 + bytes[offset + 12] + (bytes[offset + 13] << 8) + (bytes[offset + 14] << 16);
          height = 1 + bytes[offset + 15] + (bytes[offset + 16] << 8) + (bytes[offset + 17] << 16);
        }
        if (textAt(bytes,offset,'VP8 ') && size >= 10 && offset + 18 <= bytes.length && textAt(bytes,offset + 11,'\x9d\x01\x2a')) {
          width = data.getUint16(offset + 14,true) & 16383; height = data.getUint16(offset + 16,true) & 16383;
        }
        if (textAt(bytes,offset,'VP8L') && size >= 5 && offset + 13 <= bytes.length && bytes[offset + 8] === 47) {
          width = 1 + bytes[offset + 9] + ((bytes[offset + 10] & 63) << 8);
          height = 1 + (bytes[offset + 10] >> 6) + (bytes[offset + 11] << 2) + ((bytes[offset + 12] & 15) << 10);
        }
        offset += 8 + size + size % 2;
      }
      return {mime:'image/webp',width,height};
    }
    if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
      let offset = 2;
      while (offset + 4 <= bytes.length) {
        if (bytes[offset++] !== 255) break;
        while (bytes[offset] === 255) offset += 1;
        const marker = bytes[offset++];
        if (marker === 218 || marker === 217) break;
        if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
        if (offset + 2 > bytes.length) break;
        const size = data.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && size >= 7) return {mime:'image/jpeg',width:data.getUint16(offset + 5),height:data.getUint16(offset + 3)};
        offset += size;
      }
      return {mime:'image/jpeg',width:0,height:0};
    }
    throw new Error('Use uma imagem PNG, JPEG ou WebP estática.');
  }
  function checkDimensions(width,height) {
    if (width && height && (width * height > pixelLimit || Math.max(width,height) > 20000)) throw new Error('A imagem é grande demais para processar com segurança. Reduza para até 40 megapixels antes de inserir.');
  }
  async function decode(blob) {
    if (root.createImageBitmap) {
      try { const image = await root.createImageBitmap(blob); return {image,width:image.width,height:image.height,close:() => image.close()}; }
      catch (_) { /* Some browser/image combinations require the image element decoder. */ }
    }
    const url = URL.createObjectURL(blob), image = new Image();
    try {
      await new Promise((resolve,reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Não foi possível abrir esta imagem.')); image.src = url; });
      return {image,width:image.naturalWidth,height:image.naturalHeight,close:() => { image.src = ''; URL.revokeObjectURL(url); }};
    } catch (error) { URL.revokeObjectURL(url); throw error; }
  }
  const encode = (canvas,mime,quality) => new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('O navegador não conseguiu otimizar a imagem.')),mime,quality));
  async function optimize(file,purpose) {
    if (!file || !file.size || file.size > inputLimit) throw new Error('Escolha uma imagem de até 24 MB para otimizar.');
    const profile = profiles[purpose];
    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = inspect(bytes); checkDimensions(header.width,header.height);
    const decoded = await decode(new Blob([bytes],{type:header.mime}));
    const canvas = document.createElement('canvas');
    try {
      checkDimensions(decoded.width,decoded.height);
      if (!decoded.width || !decoded.height) throw new Error('A imagem não possui dimensões válidas.');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('A otimização de imagens não está disponível neste navegador.');
      let edge = Math.min(profile.edge,Math.max(decoded.width,decoded.height)), best = null, bestWidth = 0, bestHeight = 0;
      let format = 'image/webp';
      for (let round = 0; round < 7; round += 1) {
        const scale = Math.min(1,edge / Math.max(decoded.width,decoded.height));
        canvas.width = Math.max(1,Math.round(decoded.width * scale)); canvas.height = Math.max(1,Math.round(decoded.height * scale));
        context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
        context.drawImage(decoded.image,0,0,canvas.width,canvas.height);
        for (const quality of format === 'image/png' ? [1] : [.86,.78,.72]) {
          let candidate = await encode(canvas,format,quality);
          if (format === 'image/webp' && candidate.type !== 'image/webp') { format = 'image/png'; candidate = await encode(canvas,format,1); }
          if (!best || candidate.size < best.size) { best = candidate; bestWidth = canvas.width; bestHeight = canvas.height; }
          if (candidate.size <= profile.target) return finish(candidate,canvas.width,canvas.height,file,purpose);
          if (format === 'image/png') break;
        }
        if (edge <= profile.floor) break;
        edge = Math.max(profile.floor,Math.round(edge * .8));
      }
      if (!best || best.size > profile.maximum) throw new Error('A imagem continuou pesada após otimizar. Use uma versão menor para inserir.');
      return finish(best,bestWidth,bestHeight,file,purpose);
    } finally { decoded.close(); canvas.width = 0; canvas.height = 0; }
  }
  function finish(blob,width,height,original,purpose) {
    const base = String(original.name || 'imagem').replace(/\.[^.]*$/,'').replace(/[\x00-\x1f/\\]/g,'').slice(0,110) || 'imagem';
    const name = `${base}.${blob.type === 'image/webp' ? 'webp' : 'png'}`;
    const output = typeof File === 'function' ? new File([blob],name,{type:blob.type}) : blob;
    prepared.set(output,{width,height,purpose,originalBytes:original.size,bytes:output.size});
    return output;
  }
  function prepare(file,{purpose = 'document'} = {}) {
    if (!profiles[purpose]) return Promise.reject(new Error('Perfil de imagem inválido.'));
    const known = file && prepared.get(file), profile = profiles[purpose];
    if (known && Math.max(known.width,known.height) <= profile.edge && file.size <= profile.maximum) return Promise.resolve(file);
    if (!file || typeof file.arrayBuffer !== 'function') return Promise.reject(new Error('Arquivo de imagem inválido.'));
    let requests = pending.get(file);
    if (!requests) { requests = new Map(); pending.set(file,requests); }
    if (!requests.has(purpose)) {
      const operation = queue.then(() => optimize(file,purpose));
      queue = operation.catch(() => {});
      requests.set(purpose,operation);
      operation.catch(() => requests.delete(purpose));
    }
    return requests.get(purpose);
  }
  root.HeartspaceImageOptimizer = {prepare,profiles,inputLimit,info:file => prepared.get(file) || null};
})(globalThis);
