const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {mountExportedHtml,scriptBlocks} = require('./player-dom.cjs');
const fixtures = require('./fixtures/stage0.js');
const context = vm.createContext({atob,btoa,Uint8Array,Uint32Array,TextEncoder,TextDecoder,DataView});
for (const file of ['authoring-project.js','narrative-runtime.js','narrative-media.js','narrative-html.js','narrative-package.js','image-optimizer.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const media = context.HeartspaceNarrativeMedia, authoring = context.HeartspaceDocsAuthoring;
const plain = value => JSON.parse(JSON.stringify(value));
const image = {name:'teste.png',mime:'image/png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};
const ref = {schema_version:1,kind:'artifact',project_id:'stage0-project',source_app_id:'canvas',artifact_id:'test-art',type:'image',revision:1,path:'test/a.png',sha256:createHash('sha256').update(Buffer.from(image.data.split(',')[1],'base64')).digest('hex'),policy:'pinned'};
const makeSource = () => fixtures.current(image,ref);
const scene = source => source.documents[0].narrative.sequences[0].presentation;
const resolved = (source,index) => media.resolveScene(scene(source),fixtures.nodes(),index);
const extract = html => JSON.parse(scriptBlocks(html).find(script=>/id="story-data"/.test(script.attributes)).source);

test('C01 synthetic pre-cue source retains IDs, content and empty presentation through editor adapter',() => {
  const old = fixtures.legacy(), before = JSON.stringify(old), restored = authoring.fromEditor(authoring.toEditor(old));
  assert.equal(JSON.stringify(old),before);
  // Older omitted optional fields are materialized by the existing authoring adapter.
  assert.equal(restored.documents[0].id,old.documents[0].id);
  assert.equal(restored.documents[0].content.body,old.documents[0].content.body);
  assert.deepEqual(plain(scene(restored)),{});
  assert.deepEqual(plain(authoring.fromEditor(authoring.toEditor(restored))),plain(restored));
});
test('C02 current source and working-copy cache preserve composition, provenance, translations and revisions',() => {
  const source = makeSource(), state = authoring.toEditor(source);
  state.documents[0].remoteVersion = 7; state.documents[0].dirty = true;
  state.documents[0].localization = {sourceLocale:'pt-BR',translations:{en:{line:{text:'Room',source:'Sala'}}}};
  state.syncWorkspace = {schema_version:1,registry:{},recovery:[{id:'test-recovery'}]};
  const before = JSON.stringify(state), cache = authoring.cacheFromEditor(state), reopened = authoring.readCache(cache);
  assert.equal(JSON.stringify(state),before);
  assert.equal(reopened.documents[0].remoteVersion,7); assert.equal(reopened.documents[0].dirty,true);
  assert.deepEqual(plain(authoring.fromEditor(reopened)),plain(authoring.fromEditor(state)));
  assert.deepEqual(plain(reopened.syncWorkspace),plain(state.syncWorkspace));
  assert.equal(JSON.stringify(cache.source).includes('remoteVersion'),false);
});
test('C03 book, loose note, archived/trash state and empty book survive authoring adapters',() => {
  const source = makeSource(), loose = structuredClone(source.documents[0]);
  loose.id='note'; loose.bookId=null; loose.kind='note'; loose.editorial.notebook=true; loose.editorial.archivedAt='2026-11-01'; loose.editorial.trashedAt='2026-11-02';
  source.documents.push(loose); source.books.push({...structuredClone(source.books[0]),id:'empty',name:'Vazio'});
  const restored=authoring.fromEditor(authoring.toEditor(source));
  assert.deepEqual(plain(restored.books),source.books.map(book=>({...book,bookStyle:null})));
  const note=restored.documents[1]; assert.equal(note.bookId,null); assert.equal(note.kind,'note'); assert.equal(note.editorial.trashedAt,'2026-11-02');
  assert.deepEqual(plain(scene(restored)),scene(source));
});
test('C04 patches inherit only changed properties; source stays immutable',() => {
  const source=makeSource(), before=JSON.stringify(source), door=resolved(source,1).elements.find(item=>item.id==='door');
  assert.equal(door.x,40); assert.equal(door.rotation,10); assert.equal(door.asset.data,image.data);
  const later=resolved(source,2); assert.equal(later.elements.find(item=>item.id==='door').x,40); assert.equal(later.elements.find(item=>item.id==='label').text,'Escolha');
  assert.equal(JSON.stringify(source),before);
});
test('C05 reset, orphaned cue and reordered stable block IDs resolve deterministically',() => {
  const source=makeSource(), p=scene(source), nodes=fixtures.nodes();
  assert.equal(resolved(source,3).elements.find(item=>item.id==='door').x,20);
  assert.equal(resolved(source,2).elements.find(item=>item.id==='door').x,40);
  const restoredNodes=[...nodes,{id:'removed-block',type:'narration'}];
  assert.equal(media.resolveScene(p,restoredNodes,4).elements.find(item=>item.id==='door').x,99);
  const reordered=[nodes[1],nodes[0],nodes[2]];
  assert.equal(media.resolveScene(p,reordered,0).elements.find(item=>item.id==='door').x,40);
  assert.ok(p.cues.some(cue=>cue.block_id==='removed-block'));
});
test('C06 removal of base element does not recreate empty art from later partial patch',() => {
  const source=makeSource(); scene(source).elements=scene(source).elements.filter(item=>item.id!=='door');
  assert.equal(resolved(source,1).elements.some(item=>item.id==='door'),false);
});
test('C07 explicit equal override survives normalization; sceneDiff currently drops that intent',() => {
  const p=media.presentation({elements:[{id:'e',type:'text',x:20}],cues:[{block_id:'b',set:[{id:'e',x:20}]}]});
  assert.equal(p.cues[0].set[0].x,20);
  const final=media.resolveScene(p,[{id:'b'}],0);
  assert.equal(media.sceneDiff(media.sceneState(p),final).set.length,0);
  // Characterization of existing behavior, not approval of this future editing rule.
});
test('C08 animation plan preserves times and final pose and is independent of scene inspection',() => {
  const source=makeSource(), before=JSON.stringify(source), plan=media.sceneMotion(scene(source),fixtures.nodes(),1);
  assert.equal(plan.duration,700); assert.equal(plan.tracks[0].delay_ms,100); assert.equal(plan.tracks[0].to.x,40);
  assert.equal(plan.tracks[0].keyframes.some(frame=>frame.x===30),true);
  assert.equal(JSON.stringify(source),before);
});
test('C09 provenance separates artifact identity, revision, hash and file path',() => {
  assert.deepEqual(plain(media.projectRef(ref)),ref);
  const file={schema_version:1,kind:'file',project_id:ref.project_id,path:ref.path,sha256:ref.sha256,policy:'pinned'};
  assert.equal(media.projectRef(file).artifact_id,undefined);
  assert.equal(media.projectRef({...ref,schema_version:999}),null);
  assert.equal(media.normalize({...image,project_ref:{...ref,sha256:'bad'}},'image'),null);
});
test('C10 HTML and ZIP preserve moment composition/animation but omit private provenance from data',() => {
  const input=fixtures.story(makeSource()), before=JSON.stringify(input), html=context.HeartspaceNarrativeHtml.buildHtml(input), data=extract(html), packed=context.HeartspaceNarrativePackage.buildPackage(input);
  assert.equal(JSON.stringify(input),before); assert.equal(JSON.stringify(data).includes('project_ref'),false);
  assert.equal(packed.files.filter(file=>file.name.startsWith('assets/')).length,1);
  for(let index=-1;index<fixtures.nodes().length;index++) {
    const expected=plain(media.resolveScene(input.sequences[0].presentation,fixtures.nodes(),index));
    const actual=plain(media.resolveScene(data.sequences[0].presentation,fixtures.nodes(),index));
    const strip=object=>JSON.parse(JSON.stringify(object,(key,value)=>key==='project_ref'?undefined:value));
    assert.deepEqual(actual,strip(expected));
    assert.equal(media.resolveScene(packed.story.sequences[0].presentation,fixtures.nodes(),index).elements.find(item=>item.id==='door').asset.src,'assets/image-001.png');
  }
  assert.deepEqual(plain(media.sceneMotion(data.sequences[0].presentation,fixtures.nodes(),1)),JSON.parse(JSON.stringify(media.sceneMotion(input.sequences[0].presentation,fixtures.nodes(),1),(key,value)=>key==='project_ref'?undefined:value)));
});
test('C11 narrative runner and exported text choice apply the same effects and restore without replay',() => {
  const input=fixtures.story(makeSource()), runner=context.HeartspaceNarrativeRuntime.createRunner(input);
  runner.advance();runner.advance(); assert.equal(runner.choose(1),false); assert.equal(runner.choose(0),true);
  const ui=mountExportedHtml(context.HeartspaceNarrativeHtml.buildHtml(input),true);ui.click('start');ui.key('Enter');ui.key('Enter');ui.key('1');
  const saved=JSON.parse([...ui.storage.entries()].find(([key])=>key.endsWith(':progress'))[1]);
  assert.deepEqual(saved.snapshot,plain(runner.snapshot()));
  const reload=mountExportedHtml(context.HeartspaceNarrativeHtml.buildHtml(input),true,{storage:ui.storage}); reload.click('resume');
  assert.equal(reload.elements.get('copy').textContent,'Fim do teste.');
  assert.equal(JSON.parse([...reload.storage.entries()].find(([key])=>key.endsWith(':progress'))[1]).snapshot.variables.opened,true);
});
test('C12 visual choice and text choice share the exported runner and availability',() => {
  const input=fixtures.story(makeSource()), ui=mountExportedHtml(context.HeartspaceNarrativeHtml.buildHtml(input),true);ui.click('start');ui.key('Enter');ui.key('Enter');
  const hit=ui.document.querySelector('[data-scene-element="region"]').querySelector('.scene-element-hit');
  assert.equal(hit.disabled,false); hit.click();
  assert.equal(ui.elements.get('copy').textContent,'Fim do teste.');
  const saved=JSON.parse([...ui.storage.entries()].find(([key])=>key.endsWith(':progress'))[1]); assert.equal(saved.snapshot.variables.opened,true); assert.equal(saved.history.at(-1).choice,'Abrir');
});
test('C13 bootstrap is executed; unsupported core APIs expose compatibility message',() => {
  const html=context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(makeSource()));
  const ui=mountExportedHtml(html,false,{missingUrl:true,allowBootFailure:true});
  assert.equal(ui.window.heartspacePlayerBoot.supported,false); assert.equal(ui.elements.get('player-startup').style.display,'block');
  assert.match(ui.elements.get('player-startup-message').textContent,/não conseguiu iniciar/);
});
test('C14 initialization errors cannot silently pass through the harness',() => {
  const html=context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(makeSource())).replace("const menu = byId('menu')","throw new Error('stage0 boot fault'); const menu = byId('menu')");
  assert.throws(()=>mountExportedHtml(html),/failed to boot/i);
});
test('C15 modal capture blocks narrative input and retains all visibility handlers',() => {
  const ui=mountExportedHtml(context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(makeSource())),true);ui.click('start');ui.click('preferences-open');
  ui.key('Enter'); assert.equal(ui.elements.get('copy').textContent,'Uma sala de teste.');
  ui.key('Escape');assert.equal(ui.elements.get('utility-dialog').open,false);
  assert.throws(()=>ui.click('history-open'),/Hidden control/);
});
test('S0-P02 composer image import must use a supported optimizer profile',async()=>{
  const composer=fs.readFileSync(path.join(__dirname,'..','scene-composer.js'),'utf8');
  const purpose=composer.match(/media\.readFile\(file,'image',\{purpose:'([^']+)'\}/)[1];
  // The exact profile supplied by the existing compositor must be accepted.
  assert.ok(context.HeartspaceImageOptimizer.profiles[purpose],`Unsupported compositor profile: ${purpose}`);
});
test('C16 frozen portable fixture media are complete and checksummed',()=>{
  for(const name of ['stage0-legacy.hdocs','stage0-current.hdocs','stage0-editor-saved.hdocs']){
    const packed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',name),'utf8'));
    assert.equal(packed.format,'heartspace.docs.project-file');assert.equal(packed.schema_version,1); authoring.validate(packed.source);
    for(const asset of packed.assets){const bytes=Buffer.from(asset.base64,'base64');assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.checksum.value);}
  }
});
test('C17 real editor save retains artwork identity, animation, orphan and intended edit',()=>{
  const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',name),'utf8'));
  const before=read('stage0-current.hdocs'), after=read('stage0-editor-saved.hdocs');
  assert.deepEqual(after.assets,before.assets);assert.equal(after.source.project.id,before.source.project.id);
  assert.deepEqual(after.source.documents.map(doc=>doc.id),before.source.documents.map(doc=>doc.id));
  const p=scene(after.source),cue=p.cues.find(cue=>cue.block_id==='detail');
  assert.equal(cue.set.find(item=>item.id==='door').x,45);
  assert.deepEqual(cue.animations,scene(before.source).cues.find(cue=>cue.block_id==='detail').animations);
  assert.ok(p.cues.some(cue=>cue.block_id==='removed-block'));
  assert.deepEqual(p.elements.map(item=>item.id),scene(before.source).elements.map(item=>item.id));
  assert.deepEqual(p.elements[0].asset.project_ref,scene(before.source).elements[0].asset.project_ref);
  for(const id of ['intro','detail','choose','reset','end'])assert.ok(after.source.documents[0].content.body.includes(`data-narrative-id="${id}"`));
});

// Characterization only: these adapter tests do not implement an editor replacement command.
test('C19 replacing only media retains instance identity, pose and narrative links',() => {
  const before=media.element({id:'visual',type:'image',asset:image,x:31,y:42,width:20,height:30,scale:1.3,rotation:25,anchor_x:17,anchor_y:82,parallax_x:3,choice_block_id:'pick',choice_option_id:'inspect'});
  const after=media.element({...before,asset:{...image,name:'definitiva.png'}});
  const withoutAsset=value=>{const result=plain(value);delete result.asset;return result;};
  assert.deepEqual(withoutAsset(after),withoutAsset(before));
  assert.equal(after.asset.name,'definitiva.png');
});
test('C20 equal media bytes do not merge different instance or artifact identities',() => {
  const list=media.elements([{id:'one',asset:{...image,project_ref:ref}},{id:'two',asset:{...image,project_ref:{...ref,artifact_id:'other'}}}]);
  assert.equal(list.length,2);assert.notEqual(list[0].id,list[1].id);
  assert.notEqual(list[0].asset.project_ref.artifact_id,list[1].asset.project_ref.artifact_id);
  assert.equal(list[0].asset.data,list[1].asset.data);
});
test('C21 authoring group membership is retained while unrelated parent/entity fields remain unsupported',() => {
  const element=media.element({id:'child',parent_id:'group',group_id:'group',children:['other']});
  assert.equal('parent_id' in element,false);assert.equal(element.group_id,'group');assert.equal('children' in element,false);
  const list=media.elements([{id:'second'},{id:'first'},{id:'second'}]);
  assert.deepEqual(plain(list.map(item=>item.id)),['second','first']);
});
test('C22 image fit changes do not implicitly reposition independent interactive regions',() => {
  const state=media.sceneState({elements:[{id:'art',type:'image',asset:image,fit:'cover'},{id:'hit',type:'hotspot',x:25,y:35,width:15,height:10,choice_block_id:'pick',choice_option_id:'inspect'}]});
  const after=media.sceneState({...state,elements:state.elements.map(item=>item.id==='art'?{...item,fit:'contain',width:70}:item)});
  assert.deepEqual(plain(after.elements[1]),plain(state.elements[1]));
});
test('C23 v1 remains v1 while the first persistent group opts the authoring source into v2',()=>{
  const source=makeSource(),plainAgain=authoring.fromEditor(authoring.toEditor(source));
  assert.equal(source.schema_version,1);assert.equal(plainAgain.schema_version,1);
  const p=scene(source);p.layer_groups_version=1;p.groups=[{id:'group-room',name:'Sala',parent_id:'',element_ids:['door','label']}];
  p.elements[0].group_id='group-room';p.elements[1].group_id='group-room';
  source.schema_version=2;authoring.validate(source);
  const restored=authoring.fromEditor(authoring.toEditor(source));
  assert.equal(restored.schema_version,2);assert.deepEqual(plain(scene(restored).groups),plain(p.groups));
  assert.equal(scene(restored).elements[0].group_id,'group-room');
});
test('C24 v2 marker survives cache, save projection and removal of the last group without downgrade',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=2;p.layer_groups_version=1;p.groups=[];
  const state=authoring.toEditor(source),cache=authoring.cacheFromEditor(state),reopened=authoring.readCache(cache),saved=authoring.fromEditor(reopened);
  assert.equal(saved.schema_version,2);assert.equal(scene(saved).layer_groups_version,1);assert.deepEqual(plain(scene(saved).groups),[]);
});
test('C25 invalid or v1 group metadata is rejected without normalization loss',()=>{
  const source=makeSource(),p=scene(source);p.layer_groups_version=1;p.groups=[{id:'group-bad',name:'Inválido',parent_id:'missing',element_ids:['door']}];
  assert.throws(()=>authoring.validate(source),/versão autoral 2/);
  source.schema_version=2;assert.throws(()=>authoring.validate(source),/hierarquia de grupos inválida/);
});
test('C26 exported runtime flattens authoring groups and preserves every resolved moment',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=2;p.layer_groups_version=1;p.groups=[{id:'group-room',name:'Sala',parent_id:'',element_ids:['door','label']}];
  p.elements[0].group_id='group-room';p.elements[1].group_id='group-room';authoring.validate(source);
  const input=fixtures.story(source),packed=context.HeartspaceNarrativePackage.buildPackage(input),runtime=packed.story.sequences[0].presentation;
  assert.equal('groups' in runtime,false);assert.equal('layer_groups_version' in runtime,false);assert.equal(runtime.elements.some(item=>'group_id' in item),false);
  for(let index=-1;index<fixtures.nodes().length;index++){
    const expected=media.resolveScene(p,fixtures.nodes(),index),actual=media.resolveScene(runtime,fixtures.nodes(),index);
    const strip=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='project_ref'||key==='group_id'?undefined:['asset','background','music'].includes(key)&&item&&typeof item==='object'?{name:item.name,mime:item.mime}:item));
    assert.deepEqual(strip(actual),strip(expected));
  }
});
test('C27 v3 authoring controls survive normalization, cache and local re-open while v1/v2 stay opt-in',()=>{
  const v1=makeSource(),v2=makeSource(),source=makeSource(),p=scene(source);
  assert.equal(authoring.fromEditor(authoring.toEditor(v1)).schema_version,1);
  p.layer_groups_version=1;p.groups=[{id:'group-room',name:'Sala',parent_id:'',element_ids:['door','label'],authoring_visible:false,locked:true}];
  p.elements[0].group_id='group-room';p.elements[1].group_id='group-room';p.elements[0].authoring_visible=false;p.elements[1].locked=true;p.authoring_controls_version=1;source.schema_version=3;
  authoring.validate(source);const invalidV2=makeSource();invalidV2.schema_version=2;const v2Scene=scene(invalidV2);v2Scene.authoring_controls_version=1;v2Scene.elements[0].locked=true;assert.throws(()=>authoring.validate(invalidV2),/versão autoral 3/);
  const state=authoring.toEditor(source),cache=authoring.cacheFromEditor(state),reopened=authoring.readCache(cache),saved=authoring.fromEditor(reopened),result=scene(saved);
  assert.equal(saved.schema_version,3);assert.equal(result.authoring_controls_version,1);assert.deepEqual(plain(result.groups),plain(p.groups));
  assert.equal(result.elements.find(item=>item.id==='door').authoring_visible,false);assert.equal(result.elements.find(item=>item.id==='label').locked,true);
  const packed=context.HeartspaceNarrativePackage.buildPackage(fixtures.story(saved)),runtime=packed.story.sequences[0].presentation;
  assert.equal(runtime.groups,undefined);assert.equal(runtime.authoring_controls_version,undefined);assert.equal(runtime.elements.some(item=>'locked' in item||'authoring_visible' in item),false);assert.equal(runtime.elements.find(item=>item.id==='door').visible,true);
  const html=extract(context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(saved))),htmlPresentation=html.sequences[0].presentation;
  assert.equal(htmlPresentation.groups,undefined);assert.equal(htmlPresentation.authoring_controls_version,undefined);assert.equal(htmlPresentation.elements.some(item=>'locked'in item||'authoring_visible'in item||'group_id'in item),false);
  const retainedV2=makeSource();retainedV2.schema_version=2;scene(retainedV2).layer_groups_version=1;scene(retainedV2).groups=[];assert.equal(authoring.fromEditor(authoring.toEditor(retainedV2)).schema_version,2);
  const emptied=authoring.toEditor(saved);emptied.documents=[];assert.equal(authoring.fromEditor(emptied).schema_version,3,'A exclusão do último documento apagou a versão opt-in já confirmada.');
});
test('C28 future incompatible schema is rejected before the supplied source can be replaced',()=>{
  const source=makeSource(),original=JSON.stringify(source);source.schema_version=7;
  assert.throws(()=>authoring.validate(source),/versão autoral incompatível/);assert.equal(JSON.stringify(source),JSON.stringify({...JSON.parse(original),schema_version:7}));
});
test('C29 v4 geometric primitives roundtrip through cache and export without losing editable source',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=4;p.scene_primitives_version=1;
  p.elements=[
    {id:'rect',type:'rectangle',name:'Parede',x:10,y:20,width:30,height:25,fill:'#123456',stroke:'#abcdef',stroke_width:3},
    {id:'oval',type:'ellipse',x:45,y:20,width:20,height:25,fill:'#234567',stroke:'#bcdefa',stroke_width:2},
    {id:'line',type:'line',x:15,y:60,width:40,height:20,x1:0,y1:100,x2:100,y2:0,stroke:'#345678',stroke_width:4},
    {id:'arrow',type:'arrow',x:60,y:60,width:25,height:20,x1:10,y1:90,x2:90,y2:5,stroke:'#456789',stroke_width:5}
  ];
  p.cues=[{block_id:'detail',set:[{id:'arrow',x2:75,y2:15}],reset:false,animations:[],settings:{},remove:[],order:null}];
  authoring.validate(source);
  const state=authoring.toEditor(source),cache=authoring.cacheFromEditor(state),reopened=authoring.readCache(cache),saved=authoring.fromEditor(reopened),restored=scene(saved);
  assert.equal(saved.schema_version,4);assert.equal(restored.scene_primitives_version,1);
  for(const id of ['rect','oval','line','arrow'])assert.deepEqual(plain(restored.elements.find(item=>item.id===id)),plain(p.elements.find(item=>item.id===id)));
  assert.deepEqual(plain(restored.cues[0].set),plain(p.cues[0].set));
  const oldReaderSource=structuredClone(saved);oldReaderSource.schema_version=3;
  assert.throws(()=>authoring.validate(oldReaderSource),/exigem a versão autoral 4/);
  const packed=context.HeartspaceNarrativePackage.buildPackage(fixtures.story(saved)),runtime=packed.story.sequences[0].presentation;
  assert.equal(runtime.scene_primitives_version,undefined);assert.deepEqual(plain(runtime.elements.map(item=>item.type)),['rectangle','ellipse','line','arrow']);
  assert.deepEqual(plain(runtime.elements.map(item=>item.stroke_width)),[3,2,4,5]);
  const html=extract(context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(saved))).sequences[0].presentation;
  assert.equal(html.scene_primitives_version,undefined);assert.deepEqual(plain(html.elements.map(item=>item.type)),['rectangle','ellipse','line','arrow']);
});
test('B2-01 generic native objects stay distinct from art needs and v5 is opt-in',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=5;p.scene_primitives_version=1;p.elements=[{id:'door-instance',type:'native',native_id:'door',name:'Porta',x:12,y:20,width:20,height:50,scale:1,rotation:0,anchor_x:50,anchor_y:50}];p.art_needs_version=1;
  const state=authoring.toEditor(source);assert.equal(authoring.fromEditor(state).schema_version,5);assert.equal(scene(authoring.fromEditor(state)).art_needs,undefined);
  const plain=makeSource();assert.equal(authoring.fromEditor(authoring.toEditor(plain)).schema_version,1,'Documento sem capacidades novas evoluiu incidentalmente.');
});
test('B2-02 explicit placeholder links roundtrip through editor, cache and portable source',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=5;p.scene_primitives_version=1;p.art_needs_version=1;p.art_needs=[{id:'need-door',name:'Porta da estação',category:'object',description:'Porta antiga de madeira.'}];
  p.elements=[{id:'door-a',type:'rectangle',name:'Representação provisória',x:18,y:22,width:19,height:44,rotation:12,anchor_x:4,anchor_y:7,group_id:'set-group',art_need_id:'need-door'},{id:'door-b',type:'native',native_id:'door',name:'Outra ocorrência',x:50,y:22,width:19,height:44,art_need_id:'need-door'}];
  p.groups=[{id:'set-group',name:'Cenário',parent_id:'',element_ids:['door-a']}];p.layer_groups_version=1;
  const state=authoring.toEditor(source),cache=authoring.cacheFromEditor(state),saved=authoring.fromEditor(authoring.readCache(cache)),restored=scene(saved);
  assert.equal(saved.schema_version,5);assert.equal(restored.elements[0].id,'door-a');assert.equal(restored.elements[0].art_need_id,'need-door');assert.equal(restored.elements[0].rotation,12);assert.equal(restored.elements[0].group_id,'set-group');
  assert.equal(restored.elements[1].art_need_id,'need-door');assert.equal(restored.art_needs[0].description,'Porta antiga de madeira.');
  assert.equal(saved.schema_version,5);assert.equal(authoring.validate(saved).schema_version,5);
});
test('B2-03 removing one placeholder link preserves its representation and other linked occurrences',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=5;p.scene_primitives_version=1;p.art_needs_version=1;p.art_needs=[{id:'need-shared',name:'',category:'object',description:''}];
  p.elements=[{id:'a',type:'ellipse',art_need_id:'need-shared',x:10,y:20,width:10,height:10},{id:'b',type:'native',native_id:'box',art_need_id:'need-shared',x:30,y:20,width:10,height:10}];
  delete p.elements[0].art_need_id;const saved=authoring.fromEditor(authoring.toEditor(source)),restored=scene(saved);
  assert.equal(restored.elements[0].id,'a');assert.equal(restored.elements[0].type,'ellipse');assert.equal(restored.elements[0].art_need_id,undefined);assert.equal(restored.elements[1].art_need_id,'need-shared');assert.equal(restored.art_needs[0].id,'need-shared');assert.equal(saved.schema_version,5);
});
test('B2-04 authoring metadata is omitted from HTML and ZIP while the provisional visual remains',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=5;p.art_needs_version=1;p.art_needs=[{id:'private-need',name:'Do not show',category:'character',description:'Art note'}];
  p.elements=[{id:'silhouette',type:'native',native_id:'full-body-silhouette',name:'Placeholder',art_need_id:'private-need',x:30,y:10,width:25,height:70}];
  p.cues=[{block_id:'detail',set:[{id:'silhouette',art_need_id:'private-need'}],settings:{},remove:[],order:null,animations:[]}];
  const saved=authoring.fromEditor(authoring.toEditor(source)),packed=context.HeartspaceNarrativePackage.buildPackage(fixtures.story(saved)).story.sequences[0].presentation;
  assert.equal(packed.art_needs,undefined);assert.equal(packed.art_needs_version,undefined);assert.equal(packed.elements[0].art_need_id,undefined);assert.equal(packed.elements[0].native_id,'full-body-silhouette');assert.equal(packed.cues[0].set[0].art_need_id,undefined);
  const html=extract(context.HeartspaceNarrativeHtml.buildHtml(fixtures.story(saved))).sequences[0].presentation;
  assert.equal(html.art_needs,undefined);assert.equal(html.elements[0].art_need_id,undefined);assert.equal(html.elements[0].type,'native');
});
test('B3-01 v1-v5 sources remain at their existing schema when no ink data is authored',()=>{
  for(const version of [1,2,3,4,5]){const source=makeSource();source.schema_version=version;const state=authoring.toEditor(source);assert.equal(authoring.fromEditor(state).schema_version,version);}
});
test('B3-02 sketches and private annotations roundtrip through v6 source, cache, save and recovery projection',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=6;p.scene_ink_version=1;
  p.elements=[{id:'pencil-a',type:'sketch',name:'Esboço',x:12,y:20,width:22,height:15,anchor_x:0,anchor_y:0,stroke:'#ff8844',stroke_width:3,points:[{x:0,y:50},{x:24,y:5},{x:60,y:80},{x:100,y:50}],group_id:'sketches',locked:false}];
  p.layer_groups_version=1;p.authoring_controls_version=1;p.groups=[{id:'sketches',name:'Rabiscos',parent_id:'',element_ids:['pencil-a']}];
  p.annotations=[{id:'private-note',type:'note',x:24,y:33,width:18,height:8,color:'#f2cf72',text:'Nota apenas para produção',anchor_element_id:'pencil-a',anchor:{x:50,y:50}}];p.annotations_visible=false;
  authoring.validate(source);const state=authoring.toEditor(source),cache=authoring.cacheFromEditor(state),restored=authoring.fromEditor(authoring.readCache(cache)),out=scene(restored);
  assert.equal(restored.schema_version,6);assert.deepEqual(plain(out.elements[0].points),plain(p.elements[0].points));assert.equal(out.elements[0].id,'pencil-a');assert.equal(out.elements[0].group_id,'sketches');assert.equal(out.annotations[0].anchor_element_id,'pencil-a');assert.equal(out.annotations[0].text,'Nota apenas para produção');assert.equal(out.annotations_visible,false);
  const stripped=authoring.toEditor(restored);stripped.documents[0].narrativeSequences[0].presentation.elements=[];stripped.documents[0].narrativeSequences[0].presentation.groups=[];stripped.documents[0].narrativeSequences[0].presentation.annotations=[];stripped.documents[0].narrativeSequences[0].presentation.annotations_visible=undefined;assert.equal(authoring.fromEditor(stripped).schema_version,6,'A remoção dos últimos traços não deve fazer downgrade do formato confirmado.');
});
test('B3-03 moment cues inherit and locally override sketch geometry without changing base source',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=6;p.scene_ink_version=1;p.elements=[{id:'ink',type:'sketch',x:10,y:10,width:20,height:20,stroke:'#ffffff',stroke_width:2,points:[{x:0,y:0},{x:100,y:100}]}];
  const before=media.sceneState(p),after=media.sceneState({...p,elements:[{...p.elements[0],points:[{x:0,y:100},{x:100,y:0}]}]});
  const cue=media.sceneDiff(before,after),resolved=media.resolveScene({...p,cues:[{...cue,block_id:'detail',animations:[]}]},[{id:'detail'}],0);
  assert.deepEqual(plain(resolved.elements[0].points),[{x:0,y:100},{x:100,y:0}]);assert.deepEqual(plain(p.elements[0].points),[{x:0,y:0},{x:100,y:100}]);
});
test('B3-04 export retains sketch visuals and removes annotation content and authoring controls',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=6;p.scene_ink_version=1;p.annotations_visible=false;
  p.elements=[{id:'visible-ink',type:'sketch',x:15,y:25,width:20,height:15,stroke:'#aabbcc',stroke_width:4,points:[{x:0,y:20},{x:100,y:80}]}];
  p.annotations=[{id:'private-secret-id',type:'note',x:35,y:40,width:18,height:8,color:'#f2cf72',text:'private author note'}];
  const saved=authoring.fromEditor(authoring.toEditor(source)),storyValue=fixtures.story(saved),packed=context.HeartspaceNarrativePackage.buildPackage(storyValue).story.sequences[0].presentation,html=extract(context.HeartspaceNarrativeHtml.buildHtml(storyValue)).sequences[0].presentation;
  for(const output of [packed,html]){assert.equal(output.elements[0].type,'sketch');assert.deepEqual(plain(output.elements[0].points),plain(p.elements[0].points));assert.equal(output.annotations,undefined);assert.equal(output.annotations_visible,undefined);assert.equal(output.scene_ink_version,undefined);}
  const publicText=JSON.stringify(packed)+context.HeartspaceNarrativeHtml.buildHtml(storyValue);assert.equal(publicText.includes('private author note'),false);assert.equal(publicText.includes('private-secret-id'),false);
});
test('B3-05 v6 refuses invalid or excessive strokes and invalid annotation references without altering the source',()=>{
  const source=makeSource(),p=scene(source);source.schema_version=6;p.scene_ink_version=1;p.elements=[{id:'ink',type:'sketch',stroke:'#ffffff',stroke_width:2,points:[{x:0,y:0}]}];const original=JSON.stringify(source);
  assert.throws(()=>authoring.validate(source),/traço de esboço inválido/);assert.equal(JSON.stringify(source),original);
  p.elements[0].points=Array.from({length:2049},(_,index)=>({x:index%101,y:index%99}));assert.throws(()=>authoring.validate(source),/traço de esboço inválido/);
  p.elements[0].points=[{x:0,y:0},{x:100,y:100}];p.annotations=[{id:'note',type:'note',x:1,y:1,width:18,height:8,color:'#ffffff',text:'note',anchor_element_id:'missing',anchor:{x:50,y:50}}];assert.throws(()=>authoring.validate(source),/vínculo de anotação inválido/);
});
