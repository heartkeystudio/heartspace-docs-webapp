const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({atob,btoa,Uint8Array,Uint32Array,TextEncoder,TextDecoder,DataView,structuredClone});
for(const file of ['authoring-project.js','narrative-media.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const authoring=context.HeartspaceDocsAuthoring,plain=value=>JSON.parse(JSON.stringify(value));

function v6Source(){
  const source={format:'heartspace.docs.authoring',schema_version:6,project:{id:'b4-project',name:'Teste B4'},books:[],documents:[],resources:{characters:[],variables:[],glossary:[],sceneSettings:{}}};
  const document=(id,title,sequenceId,needId,name)=>({id,bookId:null,kind:'document',title,subtitle:'',content:{format:'heartspace-html-v1',body:'<p>Fonte preservada.</p>'},legacyPlanning:{},narrative:{entrySequenceId:sequenceId,readingProfile:'prose',localization:{},sequences:[{id:sequenceId,title:sequenceId,presentation:{elements:[{id:`occ-${sequenceId}`,type:'native',native_id:'door',art_need_id:needId}],cues:[{block_id:'beat',set:[{id:`cue-${sequenceId}`,type:'image',art_need_id:needId}]}],art_needs_version:1,art_needs:[{id:needId,name,category:'object',description:`Brief ${name}`} ]}}]},page:{layout:'book',size:'a4',orientation:'portrait',margin:'normal'},typography:{titleAlign:'left',subtitleAlign:'left'},appearance:{},editorial:{status:'draft',tags:[],notebook:false,archivedAt:'',trashedAt:'',trashedBy:''},order:0,updatedAt:''});
  source.documents=[document('doc-a','A','seq-a','legacy-shared-id','Porta A'),document('doc-b','B','seq-b','legacy-shared-id','Porta B')];
  return source;
}

test('B4.0 explicit promotion preserves distinct B2 identities and remaps only colliding occurrence references',()=>{
  const source=v6Source(),before=JSON.stringify(source),promoted=authoring.promoteArtNeeds(source);
  assert.equal(JSON.stringify(source),before,'a fonte v6 não foi mutada');
  assert.equal(promoted.schema_version,7);assert.equal(promoted.project_art_needs_version,1);assert.equal(promoted.art_needs.length,2);
  assert.deepEqual(plain(promoted.art_needs.map(need=>need.name)),['Porta A','Porta B']);
  const first=promoted.documents[0].narrative.sequences[0].presentation,second=promoted.documents[1].narrative.sequences[0].presentation;
  assert.equal(first.elements[0].art_need_id,'legacy-shared-id');
  assert.notEqual(second.elements[0].art_need_id,'legacy-shared-id');
  assert.equal(second.cues[0].set[0].art_need_id,second.elements[0].art_need_id,'a colisão atualizou também o vínculo no cue');
  assert.equal(first.art_needs,undefined);assert.equal(first.art_needs_version,1);
  assert.equal(second.art_needs,undefined);assert.equal(second.art_needs_version,1);
  assert.deepEqual(plain(authoring.validate(promoted)),plain(promoted));
});

test('B4.0 v7 round-trip and local recovery retain shared registry and editor projections',()=>{
  const promoted=authoring.promoteArtNeeds(v6Source()),state=authoring.toEditor(promoted);
  assert.equal(state.authoringSchemaVersion,7);assert.equal(state.artNeeds.length,2);
  assert.equal(state.documents[0].narrativeSequences[0].presentation.art_needs[0].name,'Porta A');
  const cache=authoring.cacheFromEditor(state),recovered=authoring.readCache(cache),roundTrip=authoring.fromEditor(recovered),stable=authoring.fromEditor(authoring.toEditor(roundTrip));
  assert.deepEqual(plain(stable),plain(roundTrip));
  assert.deepEqual(plain(roundTrip.art_needs),plain(promoted.art_needs));
  assert.equal(recovered.artNeeds.length,2);
});

test('B4.0 v1-v6 remain on their original schemas and v7 does not downgrade after records are removed',()=>{
  for(let version=1;version<=6;version++){
    const source=v6Source();source.schema_version=version;
    for(const document of source.documents)for(const sequence of document.narrative.sequences){const p=sequence.presentation;
      if(version<5){delete p.art_needs;delete p.art_needs_version;delete p.elements[0].art_need_id;delete p.cues[0].set[0].art_need_id;p.elements[0].type='image';delete p.elements[0].native_id;}}
    const restored=authoring.fromEditor(authoring.toEditor(source));assert.equal(restored.schema_version,version);
  }
  const state=authoring.toEditor(authoring.promoteArtNeeds(v6Source()));
  state.artNeeds=[];
  for(const document of state.documents)for(const sequence of document.narrativeSequences){const p=sequence.presentation;delete p.art_needs;for(const item of p.elements)delete item.art_need_id;for(const cue of p.cues)for(const item of cue.set)delete item.art_need_id;}
  assert.equal(authoring.fromEditor(state).schema_version,7);
});

test('B4.0 incompatible v6 reader rejects v7 registry and conflicting projections fail without overwriting',()=>{
  const promoted=authoring.promoteArtNeeds(v6Source()),legacyReader={...promoted,schema_version:6};
  assert.throws(()=>authoring.validate(legacyReader),/versão autoral 7/);
  const state=authoring.toEditor(promoted),needId=state.artNeeds[0].id;
  const second=state.documents[1].narrativeSequences[0].presentation;
  second.elements[0].art_need_id=needId;second.cues[0].set[0].art_need_id=needId;second.art_needs=[structuredClone(state.artNeeds[0])];
  state.documents[0].narrativeSequences[0].presentation.art_needs[0].name='Nome A';
  second.art_needs[0].name='Nome B';
  assert.throws(()=>authoring.fromEditor(state),/alterada de maneiras diferentes/);
  assert.equal(promoted.art_needs.find(item=>item.id===needId).name,'Porta A','a fonte v7 original permaneceu intacta');
});

test('B4.2 v7 association is stored on an occurrence and survives projection/cache round-trip across moments',()=>{
  const source=authoring.promoteArtNeeds(v6Source()),needId=source.art_needs[0].id,document=source.documents[0];
  const element={id:'cross-sequence-occurrence',type:'native',native_id:'door',name:'Porta do corredor',art_need_id:needId,x:63,y:41,rotation:17,choice_block_id:'choice-a',choice_option_id:'open'};
  document.narrative.sequences.push({id:'seq-c',title:'Corredor',presentation:{art_needs_version:1,elements:[element],cues:[{block_id:'beat-c',set:[{id:element.id,art_need_id:needId,x:64}]}]}});
  const validated=authoring.validate(source),state=authoring.toEditor(validated),cache=authoring.cacheFromEditor(state),restored=authoring.fromEditor(authoring.readCache(cache));
  const sequence=restored.documents[0].narrative.sequences.find(item=>item.id==='seq-c'),stored=sequence.presentation.elements[0];
  assert.equal(restored.schema_version,7);assert.equal(stored.art_need_id,needId);assert.equal(sequence.presentation.cues[0].set[0].art_need_id,needId);
  assert.deepEqual(plain({x:stored.x,y:stored.y,rotation:stored.rotation,choice_block_id:stored.choice_block_id,choice_option_id:stored.choice_option_id}),{x:63,y:41,rotation:17,choice_block_id:'choice-a',choice_option_id:'open'});
});
