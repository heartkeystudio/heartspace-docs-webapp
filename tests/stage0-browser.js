/* Browser-only integration runner. The application modules are loaded unchanged. */
'use strict';
const authoring = HeartspaceDocsAuthoring, files = HeartspaceDocsProjectFiles, storage = HeartspaceDocsProjectStorage, media = HeartspaceNarrativeMedia;
const results = [], assert = (condition,message) => { if (!condition) throw Error(message); };
const canonical = value => JSON.stringify(value,(key,item) => {
  if (key === 'body' && typeof item === 'string') { const template = document.createElement('template'); template.innerHTML = item; return template.innerHTML; }
  return item && !Array.isArray(item) && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a],[b]) => a.localeCompare(b))) : item;
});
const equal = (actual,expected,message) => assert(canonical(actual) === canonical(expected),message);
const testKey = 'heartspace-docs-local:stage0-compatibility-only';
const options = {document,resolveImage:async () => { throw Error('Recurso inesperado'); }};
const clone = value => JSON.parse(JSON.stringify(value));
function display() { document.querySelector('#report').textContent = JSON.stringify({userAgent:navigator.userAgent,origin:location.origin,passed:results.filter(result => result.status === 'pass').length,failed:results.filter(result => result.status === 'fail').length,results},null,2); }
async function check(name,run) {
  try { await run(); results.push({name,status:'pass'}); }
  catch (error) { results.push({name,status:'fail',error:error.message}); }
  const row = document.createElement('li'); row.textContent = `${results.at(-1).status.toUpperCase()} — ${name}${results.at(-1).error ? ': '+results.at(-1).error : ''}`;
  document.querySelector('#results').append(row); display();
}
const rejects = async (run,pattern) => { try { await run(); } catch (error) { assert(pattern.test(error.message),error.message); return; } throw Error('Falha esperada não ocorreu'); };
function download(name,blob) { const link = document.createElement('a'); link.textContent = name; link.download = name; link.href = URL.createObjectURL(blob); document.querySelector('#downloads').append(link); }
async function execute() {
  document.querySelector('#run').disabled = true;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16;
  canvas.getContext('2d').fillStyle = '#4080c0'; canvas.getContext('2d').fillRect(0,0,16,16);
  const image = {name:'quadrado-sintetico.png',mime:'image/png',data:canvas.toDataURL('image/png')};
  const bytes = Uint8Array.from(atob(image.data.split(',')[1]),char => char.charCodeAt(0));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte => byte.toString(16).padStart(2,'0')).join('');
  const ref = {schema_version:1,kind:'artifact',project_id:'stage0-project',artifact_id:'stage0-art',source_app_id:'canvas',type:'image',revision:1,path:'test/square.png',sha256:hash,policy:'pinned'};
  const source = Stage0Fixtures.current(image,ref), original = canonical(source);
  let packed, reopened;
  await check('B01 legado sem cues abre, grava e reabre duas vezes',async () => {
    const old = Stage0Fixtures.legacy(); const first = await files.build(old,options); const opened = await files.read(first,options); const second = await files.read(await files.build(opened.source,options),options);
    equal(second.source,old,'Conteúdo legado alterado'); download('stage0-legado.hdocs',first);
  });
  await check('B02 composição completa preserva IDs, patches, animações, mídia e referência fixada',async () => {
    packed = await files.build(source,options); reopened = await files.read(packed,options); equal(reopened.source,source,'Fonte divergente na reabertura');
    equal((await files.read(await files.build(reopened.source,options),options)).source,source,'Segunda gravação divergente');
    equal(canonical(source),original,'Build alterou a fonte'); const container = JSON.parse(await packed.text()); assert(container.assets.length === 1,'Mídia não deduplicada');
    download('stage0-composicao.hdocs',packed);
  });
  await check('B03 edição, cache e recuperação IndexedDB preservam a composição',async () => {
    const state = authoring.toEditor(reopened.source); state.activeDocumentId = 'stage0-doc';
    const cache = authoring.cacheFromEditor(state); equal(authoring.fromEditor(authoring.readCache(cache)),authoring.fromEditor(state),'Cache mudou a fonte');
    await storage.write(testKey,cache); equal((await storage.read(testKey)).current.cache,cache,'IndexedDB divergente');
    await storage.write(testKey+'-other',{marker:'outro projeto de teste'}); equal((await storage.read(testKey)).current.cache,cache,'Mistura entre chaves');
  });
  await check('B04 mídia corrompida e referência ausente são recusadas sem mutar a fonte aberta',async () => {
    const container = JSON.parse(await packed.text()); container.assets[0].checksum.value = '0'.repeat(64);
    await rejects(() => files.read(new Blob([JSON.stringify(container)]),options),/corrompida/);
    container.assets = []; await rejects(() => files.read(new Blob([JSON.stringify(container)]),options),/não está incluída/);
    equal(source,reopened.source,'Falha alterou a fonte');
  });
  await check('B05 versões desconhecidas e referência sem cópia são recusadas',async () => {
    const container = JSON.parse(await packed.text()); container.schema_version = 999;
    await rejects(() => files.read(new Blob([JSON.stringify(container)]),options),/versão incompatível/);
    container.schema_version = 1; container.source.schema_version = 999;
    await rejects(() => files.read(new Blob([JSON.stringify(container)]),options),/versão autoral incompatível/);
    const missing = clone(source); delete missing.documents[0].narrative.sequences[0].presentation.background.data;
    await rejects(() => files.build(missing,options),/cópia offline/);
  });
  await check('B06 normalização e resolvedor preservam momentos e reset após arquivo portátil',async () => {
    const nodes = Stage0Fixtures.nodes(); const before = source.documents[0].narrative.sequences[0].presentation, after = reopened.source.documents[0].narrative.sequences[0].presentation;
    for (let index=-1;index<nodes.length;index++) equal(media.resolveScene(after,nodes,index),media.resolveScene(before,nodes,index),'Momento divergente '+index);
    assert(media.resolveScene(after,nodes,1).elements.find(item => item.id==='door').x===40,'Patch ausente');
    assert(media.resolveScene(after,nodes,3).elements.find(item => item.id==='door').x===20,'Reset ausente');
  });
  await check('B07 otimizador e decodificador reais aceitam imagem e recusam SVG',async () => {
    const file = new File([bytes],'imagem.extensao-errada',{type:'text/plain'});
    const asset = await media.readFile(file,'image',{purpose:'background'}); assert(asset.mime.startsWith('image/'),'Imagem não preparada');
    await HeartspaceImageOptimizer.validateOriginal(new Blob([bytes],{type:'image/png'}));
    await rejects(() => media.readFile(new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'}),'image'),/PNG|JPEG|WebP|imagem/);
  });
  await check('B08 HTML e ZIP não alteram a fonte e preservam mídias dos momentos',async () => {
    const story = Stage0Fixtures.story(reopened.source), before = canonical(story);
    const html = HeartspaceNarrativeHtml.buildHtml(story), zip = HeartspaceNarrativePackage.buildPackage(story);
    equal(canonical(story),before,'Exportação alterou fonte'); const exportedData = JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert(!JSON.stringify(exportedData).includes('project_ref'),'Origem privada nos dados do HTML');
    assert(zip.files.filter(file=>file.name.startsWith('assets/')).length===1,'Deduplicação ZIP divergente');
    download('stage0-player.html',new Blob([html],{type:'text/html'})); download('stage0-player.zip',new Blob([zip.bytes],{type:'application/zip'}));
  });
  await check('S0-P02 importação de elemento com perfil background aceita PNG válido',async () => {
    await media.readFile(new File([bytes],'teste.png',{type:'image/png'}),'image',{purpose:'background'});
  });
  await check('S0-P01 ZIP recusa mídia inválida de fundo e de patch sem alterar a fonte',async () => {
    const story = Stage0Fixtures.story(source); const original = canonical(story);
    const invalid = {src:'https://example.com/not-embedded.png',mime:'image/png'};
    const badBase = clone(story); badBase.sequences[0].presentation.background = invalid;
    await rejects(() => HeartspaceNarrativePackage.buildPackage(badBase),/mídia.*fundo/);
    const badPatch = clone(story); badPatch.sequences[0].presentation.cues[0].set[0].asset = invalid;
    await rejects(() => HeartspaceNarrativePackage.buildPackage(badPatch),/mídia.*detail.*door/);
    equal(canonical(story),original,'Erro de exportação alterou fonte');
  });
  download('stage0-resultados.json',new Blob([document.querySelector('#report').textContent],{type:'application/json'}));
  document.querySelector('#report').dataset.complete = 'true';
}
document.querySelector('#run').addEventListener('click',() => execute().catch(error => {results.push({name:'Execução',status:'fail',error:error.message});display();}));
document.querySelector('#reload').addEventListener('click',async () => {
  await check('B09 recuperação persiste após recarregar a página',async () => {
    const saved = await storage.read(testKey); assert(saved?.current?.cache,'Sem cópia preparada pela execução anterior');
    const state = authoring.readCache(saved.current.cache); const source = authoring.fromEditor(state);
    assert(source.project.id==='stage0-project','Projeto errado'); assert(source.documents[0].narrative.sequences[0].presentation.elements[0].id==='door','Identidade perdida');
    equal((await files.read(await files.build(source,options),options)).source,source,'Regravação após reload divergente');
  });
});
