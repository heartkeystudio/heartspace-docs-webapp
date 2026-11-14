/* ZIP (store method), without dependencies, network access or executable templates. */
(function (root) {
  const encoder = new TextEncoder();
  const crcTable = Uint32Array.from({length:256},(_,index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  const crc32 = bytes => {
    let value = 0xffffffff;
    bytes.forEach(byte => { value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); });
    return (value ^ 0xffffffff) >>> 0;
  };
  const zip = files => {
    if (files.length > 1000) throw new Error('O pacote excede o limite de 1000 arquivos.');
    const local = [], central = [];
    let offset = 0, centralSize = 0;
    files.forEach(file => {
      if (!/^(index\.html|LEIA-ME\.txt|assets\/[a-z0-9_-]+\.[a-z0-9]+)$/.test(file.name)) throw new Error('Caminho inválido no pacote.');
      const name = encoder.encode(file.name), bytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
      if (!(bytes instanceof Uint8Array)) throw new Error('Arquivo inválido no pacote.');
      if (offset + bytes.length > 100 * 1024 * 1024) throw new Error('O pacote excede 100 MB. Reduza as mídias antes de exportar.');
      const crc = crc32(bytes);
      const header = new Uint8Array(30 + name.length), view = new DataView(header.buffer);
      view.setUint32(0,0x04034b50,true); view.setUint16(4,20,true); view.setUint16(6,0x800,true);
      view.setUint16(12,33,true); view.setUint32(14,crc,true); view.setUint32(18,bytes.length,true); view.setUint32(22,bytes.length,true); view.setUint16(26,name.length,true); header.set(name,30);
      local.push(header,bytes);
      const directory = new Uint8Array(46 + name.length), dirView = new DataView(directory.buffer);
      dirView.setUint32(0,0x02014b50,true); dirView.setUint16(4,20,true); dirView.setUint16(6,20,true); dirView.setUint16(8,0x800,true);
      dirView.setUint16(14,33,true); dirView.setUint32(16,crc,true); dirView.setUint32(20,bytes.length,true); dirView.setUint32(24,bytes.length,true); dirView.setUint16(28,name.length,true); dirView.setUint32(42,offset,true); directory.set(name,46);
      central.push(directory); centralSize += directory.length; offset += header.length + bytes.length;
    });
    const end = new Uint8Array(22), view = new DataView(end.buffer);
    view.setUint32(0,0x06054b50,true); view.setUint16(8,files.length,true); view.setUint16(10,files.length,true); view.setUint32(12,centralSize,true); view.setUint32(16,offset,true);
    const output = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    [...local,...central,end].forEach(bytes => { output.set(bytes,cursor); cursor += bytes.length; });
    return output;
  };
  const buildPackage = story => {
    const media = root.HeartspaceNarrativeMedia;
    const packed = JSON.parse(JSON.stringify(story));
    const files = [], seen = new Map();
    const add = (value,kind) => {
      if (!value) return null;
      const asset = media.normalize(value,kind);
      if (!asset) throw new Error('Uma mídia não pôde ser incluída. Adicione o arquivo novamente na aba Cena ou Personagens.');
      if (!seen.has(asset.data)) {
        const path = `assets/${kind}-${String(files.length + 1).padStart(3,'0')}.${media.extensions[asset.mime]}`;
        const binary = atob(asset.data.slice(asset.data.indexOf(',') + 1));
        files.push({name:path,data:Uint8Array.from(binary,character => character.charCodeAt(0))}); seen.set(asset.data,path);
      }
      return {name:asset.name,mime:asset.mime,src:seen.get(asset.data)};
    };
    (packed.sequences || []).forEach(sequence => {
      const presentation = media.presentation(sequence.presentation);
      const mapAssets = (state,partial = false) => {
        if (!partial || Object.prototype.hasOwnProperty.call(state,'background')) state.background = add(state.background,'image');
        if (!partial || Object.prototype.hasOwnProperty.call(state,'music')) state.music = add(state.music,'audio');
      };
      mapAssets(presentation);
      presentation.elements.forEach(item => { item.asset = add(item.asset,'image'); });
      presentation.cues.forEach(cue => {
        mapAssets(cue.settings,true);
        cue.set.forEach(patch => { if (Object.prototype.hasOwnProperty.call(patch,'asset')) patch.asset = add(patch.asset,'image'); });
      });
      sequence.presentation = presentation;
    });
    (packed.character_registry || []).forEach(character => { character.portrait = add(character.portrait,'image'); });
    files.unshift({name:'index.html',data:root.HeartspaceNarrativeHtml.buildHtml(packed)});
    files.push({name:'LEIA-ME.txt',data:'Extraia todos os arquivos antes de jogar. Abra index.html no navegador. Para publicar, envie index.html e a pasta assets juntos, preservando os nomes. O jogo funciona sem conta ou conexão. Progresso e preferências ficam no navegador de cada leitor, conforme suas permissões. Para incorporar, use index.html?embed=1 em um iframe.\n'});
    return { bytes:zip(files), files, story:packed };
  };
  root.HeartspaceNarrativePackage = {buildPackage,zip,crc32};
})(globalThis);
