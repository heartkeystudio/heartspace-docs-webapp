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
    const checkedAsset = (value,kind,location = 'recurso') => {
      if (value == null) return null;
      const asset = media.normalize(value,kind);
      if (!asset) throw new Error(`Uma mídia não pôde ser incluída (${location}). Adicione o arquivo novamente na aba Cena ou Personagens.`);
      return asset;
    };
    const checkState = (state,location) => {
      checkedAsset(state?.background,'image',`${location} · fundo`);
      checkedAsset(state?.music,'audio',`${location} · áudio`);
    };
    // Inspect declared media before presentation normalization can turn invalid
    // input into null. Work only on the export copy; never repair authored data.
    (packed.sequences || []).forEach(sequence => {
      const raw = sequence.presentation, location = sequence.title || sequence.event_id || 'Cena';
      checkState(raw,location);
      (Array.isArray(raw?.elements) ? raw.elements : []).forEach(item => {
        checkedAsset(item?.asset,'image',`${location} · ${item?.name || item?.id || 'elemento'}`);
      });
      (Array.isArray(raw?.cues) ? raw.cues : []).forEach(cue => {
        const moment = `${location} · ${cue?.block_id || 'momento'}`;
        checkState(cue?.settings,moment);
        (Array.isArray(cue?.set) ? cue.set : []).forEach(patch => {
          checkedAsset(patch?.asset,'image',`${moment} · ${patch?.id || 'elemento'}`);
        });
      });
    });
    const add = (value,kind) => {
      const asset = checkedAsset(value,kind);
      if (!asset) return null;
      if (!seen.has(asset.data)) {
        const path = `assets/${kind}-${String(files.length + 1).padStart(3,'0')}.${media.extensions[asset.mime]}`;
        const binary = atob(asset.data.slice(asset.data.indexOf(',') + 1));
        files.push({name:path,data:Uint8Array.from(binary,character => character.charCodeAt(0))}); seen.set(asset.data,path);
      }
      return {name:asset.name,mime:asset.mime,src:seen.get(asset.data)};
    };
    (packed.sequences || []).forEach(sequence => {
      const presentation = media.presentation(sequence.presentation);
      // Persistent groups organize authoring only. The runtime receives the
      // existing flat element order, with group metadata removed deliberately.
      presentation.elements = presentation.elements.map(item => { const copy = {...item}; delete copy.group_id; delete copy.authoring_visible; delete copy.locked; return copy; });
      delete presentation.groups; delete presentation.layer_groups_version; delete presentation.authoring_controls_version;
      delete presentation.scene_primitives_version;
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
    files.push({name:'LEIA-ME.txt',data:'Extraia todos os arquivos antes de jogar. Abra index.html no navegador. Para publicar, envie index.html e a pasta assets juntos, preservando os nomes. O jogo funciona sem conta ou conexão. Progresso e preferências ficam no navegador de cada leitor, conforme suas permissões. Para incorporar, use index.html?embed=1 em um iframe com allow="fullscreen" e allowfullscreen. O formato da tela é preservado; use o código gerado na exportação para o tamanho responsivo. F alterna tela cheia e H alterna a interface. Esc recupera controles antes de voltar ao início. Com a interface oculta, toque no canto superior direito para mostrá-la. Diálogos e escolhas permanecem disponíveis. Em Menu > Opções de leitura e som > Perfil de exibição, E-ink oferece texto instantâneo, ilustrações em tons de cinza, som desligado e avanço manual, inclusive nas pausas. O texto e as escolhas ficam fora da ilustração para manter o tamanho legível. Em Orientação de leitura, Automática segue a tela; Paisagem (direita ou esquerda) e Retrato giram a área inteira do jogo somente se necessário, sem mudar o formato da história. Menu > Sobre este navegador informa os recursos disponíveis. No Kindle, use o navegador do aparelho para abrir o endereço publicado; o HTML interativo não funciona como e-book na biblioteca ou no Send to Kindle. Navegadores sem os recursos essenciais mostram uma orientação de abertura, em vez de controles inativos. A compatibilidade por modelo/firmware ainda requer validação física; o perfil e-ink não moderniza o JavaScript do dispositivo. Compartilhar no menu copia o endereço quando o jogo está hospedado; arquivos locais devem ser enviados como HTML único ou ZIP completo.\n'});
    return { bytes:zip(files), files, story:packed };
  };
  root.HeartspaceNarrativePackage = {buildPackage,zip,crc32};
})(globalThis);
