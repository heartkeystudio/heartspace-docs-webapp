const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {mountExportedHtml} = require('./player-dom.cjs');
const context = vm.createContext({atob,btoa,Uint8Array,Uint32Array,DataView,TextEncoder,TextDecoder});
for (const file of ['narrative-runtime.js','narrative-media.js','narrative-html.js','narrative-package.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const media = context.HeartspaceNarrativeMedia, exporter = context.HeartspaceNarrativeHtml, packages = context.HeartspaceNarrativePackage;
const png = {name:'árvore.png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};
function wav() {
  const bytes = new Uint8Array(46), view = new DataView(bytes.buffer);
  const put = (offset,text) => [...text].forEach((letter,index) => {bytes[offset + index] = letter.charCodeAt(0);});
  put(0,'RIFF'); view.setUint32(4,38,true); put(8,'WAVEfmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,22050,true); view.setUint32(28,22050,true); view.setUint16(32,1,true); view.setUint16(34,8,true); put(36,'data'); view.setUint32(40,2,true); bytes[44] = 128; bytes[45] = 128;
  return {name:'rio.wav',mime:'audio/wav',data:'data:audio/wav;base64,' + Buffer.from(bytes).toString('base64')};
}
function story() {
  return {title:'Floresta',locale:'pt-BR',storage_id:'visual-story',start_event_id:'forest',variable_registry:[],character_registry:[{id:'alex',name:'Alex',portrait:png,portrait_position:'right'}],sequences:[
    {event_id:'forest',presentation:{background:png,music:wav(),portrait_position:'auto',portrait_size:65,transition:'slide',speed:0},nodes:[{type:'dialogue',character_id:'alex',text:'Uma trilha.'},{type:'dialogue',character_id:'alex',text:'Vamos seguir?'},{type:'choice',prompt:'Continuar?',options:[{text:'Sim',target_event:'ending'}]}]},
    {event_id:'ending',presentation:{background:png,music:null,transition:'fade',speed:0},nodes:[{type:'narration',text:'A floresta desperta.'}]}
  ]};
}
const layer = ui => ui.elements.get('stage').children.find(child => child.className === 'narrative-scene-media');
test('media signatures and limits reject remote URLs, executable images and invalid base64', () => {
  assert.equal(media.normalize(png,'image').mime,'image/png'); assert.equal(media.normalize(wav(),'audio').mime,'audio/wav');
  for (const input of [{data:'https://example.com/a.png'},{src:'javascript:alert(1)',mime:'image/png'},{data:'data:image/svg+xml;base64,' + btoa('<svg onload="alert(1)"></svg>')},{data:'data:image/png;base64,SGVsbG8='},{data:'data:image/png;base64,abc'},{src:'assets/../../secret.png',mime:'image/png'},{src:'assets/x.png?token=secret',mime:'image/png'}]) assert.equal(media.normalize(input,'image',true),null);
  assert.equal(media.normalize({src:'assets/image-001.png',mime:'image/png'},'image',true).src,'assets/image-001.png');
  assert.equal(media.normalize({src:'assets/image-001.png',mime:'image/jpeg'},'image',true),null);
  assert.equal(media.normalize({data:'data:image/png;base64,' + 'A'.repeat(Math.ceil(media.limits.image * 4 / 3) + 104)},'image'),null);
});
test('file reader infers formats from contents and rejects oversize files before reading', async () => {
  const bytes = Uint8Array.from(atob(png.data.split(',')[1]),character => character.charCodeAt(0));
  const loaded = await media.readFile({name:'photo.wrong-extension',size:bytes.length,type:'text/plain',arrayBuffer:async () => bytes.buffer},'image');
  assert.equal(loaded.mime,'image/png');
  await assert.rejects(media.readFile({size:media.limits.audio + 1,arrayBuffer:() => {throw Error('Must not read');}},'audio'),/até 8 MB/);
  await assert.rejects(media.readFile({name:'bad.svg',size:4,arrayBuffer:async () => Uint8Array.of(1,2,3,4).buffer},'image'),/Formato não reconhecido/);
});
test('presentation normalization keeps media and clamps authoring controls', () => {
  const value = media.presentation({background:png,music:wav(),background_dim:9,portrait_size:999,portrait_position:'right',transition:'execute',transition_ms:-1});
  assert.equal(value.background.mime,'image/png'); assert.equal(value.music.mime,'audio/wav');
  assert.equal(value.background_dim,.8); assert.equal(value.portrait_size,65); assert.equal(value.transition,'fade'); assert.equal(value.transition_ms,400);
  assert.equal(value.portrait_position,'right');
});
test('player renders the speaker portrait outside the card and keeps audio through consecutive lines', async () => {
  const ui = mountExportedHtml(exporter.buildHtml(story())); ui.click('start'); await Promise.resolve();
  const scene = layer(ui), audio = scene.children[3];
  scene.children[2].handlers.get('load')();
  assert.equal(scene.children[0].src,png.data); assert.equal(scene.children[2].src,png.data);
  assert.equal(scene.dataset.portraitPosition,'right'); assert.equal(scene.children[2].dataset.transition,'slide');
  assert.notEqual(ui.elements.get('card').parentElement,scene);
  audio.currentTime = 10; const plays = audio.playCalls; ui.key('Enter'); await Promise.resolve();
  assert.equal(audio.currentTime,10); assert.equal(audio.playCalls,plays);
  ui.key('Enter'); assert.equal(scene.children[2].hidden,true);
  ui.key('1'); assert.equal(audio.src,''); assert.equal(audio.paused,true);
  assert.equal(ui.elements.get('copy').textContent,'A floresta desperta.');
});
test('music pauses for tools, background tabs and home; player volume and mute persist', async () => {
  const input = story(), storage = new Map(), ui = mountExportedHtml(exporter.buildHtml(input),false,{storage});
  ui.click('start'); await Promise.resolve(); const audio = layer(ui).children[3]; assert.equal(audio.paused,false);
  ui.click('preferences-open'); assert.equal(audio.paused,true);
  ui.change('preference-volume','0.25'); ui.change('preference-sound','off'); ui.click('utility-close'); assert.equal(audio.paused,true); assert.equal(audio.volume,.25);
  ui.click('preferences-open'); ui.change('preference-sound','on'); ui.click('utility-close'); await Promise.resolve(); assert.equal(audio.paused,false);
  ui.setHidden(true); assert.equal(audio.paused,true); ui.setHidden(false); await Promise.resolve(); assert.equal(audio.paused,false);
  ui.key('Escape'); assert.equal(audio.paused,true);
  const reload = mountExportedHtml(exporter.buildHtml(input),false,{storage});
  assert.equal(reload.elements.get('preference-volume').value,'0.25'); reload.click('resume'); assert.equal(layer(reload).children[3].volume,.25);
});
test('autoplay rejection and image decode errors leave reading and choices usable', async () => {
  const ui = mountExportedHtml(exporter.buildHtml(story()),false,{blockAudio:true}); ui.click('start'); await new Promise(setImmediate);
  assert.match(ui.elements.get('media-status').textContent,/áudio/);
  layer(ui).children[0].handlers.get('error')(); assert.equal(layer(ui).children[0].hidden,true);
  ui.key('Enter'); ui.key('Enter'); ui.key('1'); assert.equal(ui.elements.get('copy').textContent,'A floresta desperta.');
});
test('reduced motion suppresses portrait entrance and media changes preserve saved progress', () => {
  const input = story(), storage = new Map();
  const first = mountExportedHtml(exporter.buildHtml(input),true,{storage}); first.click('start'); first.key('Enter');
  assert.equal(layer(first).children[2].dataset.transition,'none');
  input.character_registry[0].portrait = null; input.character_registry[0].portrait_position = 'left'; input.sequences[0].presentation.background = null;
  const reload = mountExportedHtml(exporter.buildHtml(input),true,{storage});
  assert.equal(reload.elements.get('resume').hidden,false); reload.click('resume'); assert.equal(reload.elements.get('copy').textContent,'Vamos seguir?');
});
test('ZIP deduplicates assets, rewrites paths and contains all references without changing the input', () => {
  const input = story(), before = JSON.stringify(input), output = packages.buildPackage(input);
  assert.equal(JSON.stringify(input),before); assert.equal(output.files.filter(file => file.name.startsWith('assets/')).length,2);
  assert.equal(output.story.character_registry[0].portrait.src,output.story.sequences[0].presentation.background.src);
  assert.equal(output.story.character_registry[0].portrait.data,undefined);
  const names = output.files.map(file => file.name); assert.ok(names.includes('index.html')); assert.ok(names.includes('LEIA-ME.txt'));
  const html = output.files.find(file => file.name === 'index.html').data;
  assert.equal(html.includes(png.data),false); assert.ok(html.includes("media-src 'self'"));
  const packagedUi = mountExportedHtml(html); packagedUi.click('start'); assert.equal(layer(packagedUi).children[0].src,output.story.sequences[0].presentation.background.src);
  let offset = 0, entries = 0; const view = new DataView(output.bytes.buffer);
  while (view.getUint32(offset,true) === 0x04034b50) {
    const length = view.getUint32(offset + 18,true), nameLength = view.getUint16(offset + 26,true), extraLength = view.getUint16(offset + 28,true);
    const name = new TextDecoder().decode(output.bytes.slice(offset + 30,offset + 30 + nameLength));
    assert.ok(names.includes(name)); assert.equal(view.getUint16(offset + 8,true),0);
    const start = offset + 30 + nameLength + extraLength; assert.equal(packages.crc32(output.bytes.slice(start,start + length)),view.getUint32(offset + 14,true));
    offset = start + length; entries += 1;
  }
  assert.equal(entries,output.files.length); assert.equal(view.getUint32(offset,true),0x02014b50);
  assert.equal(view.getUint32(output.bytes.length - 22,true),0x06054b50);
});
test('ZIP writer rejects unsafe paths and uses the standard CRC32', () => {
  assert.equal(packages.crc32(new TextEncoder().encode('123456789')),0xcbf43926);
  assert.throws(() => packages.zip([{name:'../outside.js',data:new Uint8Array()}]),/Caminho inválido/);
  const input = story(); input.sequences[0].presentation.background = {src:'https://example.com/x.png',mime:'image/png'};
  assert.throws(() => packages.buildPackage(input),/mídia/);
});
test('character normalization preserves portrait across registry reloads', () => {
  const editor = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const begin = editor.indexOf('      const normalizedCharacterRecord ='), end = editor.indexOf('      const normalizeCharacterRegistry =',begin);
  const helper = vm.createContext({HeartspaceNarrativeMedia:media,normalizeCharacterId:value => value,narrativeSlug:value => value});
  const character = vm.runInContext(editor.slice(begin,end) + '\nnormalizedCharacterRecord',helper)({id:'alex',name:'Alex',portrait:png,portrait_position:'right'});
  assert.equal(character.portrait.data,png.data); assert.equal(character.portrait_position,'right');
});
