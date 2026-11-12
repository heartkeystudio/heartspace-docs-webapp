const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({atob,btoa,Uint8Array,Uint32Array,DataView,TextEncoder,TextDecoder});
for (const name of ['narrative-runtime.js','narrative-media.js','narrative-html.js','narrative-package.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
const runtime = context.HeartspaceNarrativeRuntime;
const htmlExporter = context.HeartspaceNarrativeHtml;
const { mountExportedHtml } = require('./player-dom.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const story = () => ({
  title:'A floresta', locale:'pt-BR', start_event_id:'start',
  variable_registry:[{id:'trust',type:'number',default:0},{id:'met',type:'boolean',default:false}],
  sequences:[
    {event_id:'start', nodes:[{type:'dialogue',text:'Olá!'}, {type:'choice',prompt:'Qual caminho?',options:[
      {text:'Ajudar',target_event:'ending',effects:[{variable:'trust',operation:'add',value:2},{variable:'met',operation:'toggle'}]},
      {text:'Atalho',target_event:'ending',condition:{variable:'trust',operator:'gte',value:1}}
    ]}]},
    {event_id:'ending',nodes:[{type:'variation',default_version_id:'alone',active_version_id:'manual',versions:[
      {id:'alone',text:'Você segue sozinho.'},
      {id:'together',text:'Alex segue com você.',condition:{variable:'met',operator:'eq',value:true}},
      {id:'manual',text:'Rascunho manual.'}
    ]},{type:'pause',duration_ms:100},{type:'signal'},{type:'narration',text:'Fim.'}]},
    {event_id:'unrelated',nodes:[{type:'narration',text:'Documento privado fora do caminho.'}]}
  ]
});
test('connected story excludes unrelated sequences and terminates graph cycles', () => {
  const input = story(); input.sequences[1].nodes.push({type:'choice',options:[{target_event:'start'}]});
  const result = runtime.reachableSequences(input.sequences,'start');
  assert.deepEqual(plain(result.sequences.map(sequence => sequence.event_id)),['start','ending']);
  assert.equal(result.missing.length,0);
});
test('reachable missing and duplicate targets are reported', () => {
  const input = story(); input.sequences.push({...input.sequences[1]});
  input.sequences[0].nodes[1].options.push({target_event:'missing'});
  const result = runtime.reachableSequences(input.sequences,'start');
  assert.deepEqual(plain(result.missing),['missing']);
  assert.deepEqual(plain(result.duplicates),['ending']);
});
test('choice guards prevent effects until an available option is selected', () => {
  const runner = runtime.createRunner(story());
  assert.equal(runner.choose(0),false);
  assert.equal(runner.advance(),true);
  assert.equal(runner.advance(),false);
  assert.equal(runner.choose(1),false);
  assert.equal(runner.state.variables.trust,0);
  assert.equal(runner.choose(0),true);
  assert.equal(runner.state.eventId,'ending');
  assert.deepEqual(plain(runner.state.variables),{trust:2,met:true});
  assert.equal(runtime.resolveVariation(runner.current().node,runner.state.variables).id,'together');
});
test('restoration and restart reset effects and re-resolve the default variation', () => {
  const runner = runtime.createRunner(story()); runner.advance();
  const before = runner.snapshot(); runner.choose(0);
  assert.equal(runner.restore(before),true);
  assert.equal(runner.state.eventId,'start'); assert.equal(runner.state.variables.met,false);
  assert.equal(runtime.resolveVariation(story().sequences[1].nodes[0],runner.state.variables).id,'alone');
  runner.choose(0); runner.restart();
  assert.equal(runner.state.index,0); assert.equal(runner.state.eventId,'start'); assert.equal(runner.state.variables.trust,0);
  assert.equal(runner.restore({eventId:'absent',index:0}),false);
});
test('variation priority is deterministic, manual tabs do not override the default', () => {
  const node = story().sequences[1].nodes[0];
  node.versions.push({id:'also',condition:{variable:'trust',operator:'gte',value:1}});
  assert.equal(runtime.resolveVariation(node,{trust:2,met:true}).id,'together');
  assert.equal(runtime.resolveVariation(node,{trust:2,met:false}).id,'also');
  assert.equal(runtime.resolveVariation(node,{trust:0,met:false}).id,'alone');
  assert.equal(runtime.conditionMatches({variable:'missing',operator:'neq',value:0},{}),false);
});
test('effects reject inherited variable names and preserve typed initial values', () => {
  const values = runtime.initialVariables([{id:'a',type:'boolean',default:'sim'},{id:'n',type:'number',default:'1,5'},{id:'t',type:'string',default:42}]);
  runtime.applyEffects([{variable:'toString',operation:'set',value:'bad'},{variable:'n',operation:'subtract',value:.5},{variable:'t',operation:'set',value:'done'}],values);
  assert.deepEqual(plain(values),{a:true,n:1,t:'done'});
  assert.equal(Object.hasOwn(values,'toString'),false);
});
test('HTML safely embeds script-like titles and dialogue without remote dependencies', () => {
  const input = story(); const hostile = '</script><script>globalThis.attacked=true</script><img src=x onerror=alert(1)>';
  input.title = hostile; input.sequences[0].nodes[0].text = hostile;
  const html = htmlExporter.buildHtml(input);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,2); assert.equal(/<script\b[^>]*\bsrc\s*=/.test(html),false);
  assert.equal(/<link\b|<img\b|<iframe\b/.test(html),false);
  const embedded = JSON.parse(scripts[0][2]);
  assert.equal(embedded.title,hostile); assert.equal(embedded.sequences[0].nodes[0].text,hostile);
  assert.ok(html.includes("connect-src 'none'"));
  new vm.Script(scripts[1][2]);
});
test('serialized runtime runs independently from the editor globals', () => {
  const isolated = vm.runInNewContext(`(${runtime.source})()`);
  const runner = isolated.createRunner(story()); runner.advance(); runner.choose(0);
  while(runner.advance()) {}
  assert.equal(runner.current().ended,true);
});
test('exported player handles reveal, keyboard choice, effects, pauses and completion', () => {
  const ui = mountExportedHtml(htmlExporter.buildHtml(story()));
  ui.click('start');
  assert.equal(ui.elements.get('copy').textContent,'');
  ui.key('Enter'); assert.equal(ui.elements.get('copy').textContent,'Olá!');
  ui.key('Enter'); ui.key('Enter');
  assert.equal(ui.elements.get('choices').hidden,false);
  assert.equal(ui.elements.get('choices').children[1].disabled,true);
  ui.key('2'); assert.equal(ui.elements.get('copy').textContent,'Qual caminho?');
  ui.key('ArrowDown'); ui.key('Enter'); ui.key('Enter');
  assert.equal(ui.elements.get('copy').textContent,'Alex segue com você.');
  ui.key('Enter'); assert.match(ui.elements.get('hint').textContent,/Pausa/);
  ui.tick(); ui.key('Enter'); assert.equal(ui.elements.get('copy').textContent,'Fim.');
  ui.key('Enter'); assert.match(ui.elements.get('copy').textContent,/fim deste caminho/);
  assert.equal(ui.elements.get('next').hidden,true);
});
test('home and restart cancel typing and pause timers', () => {
  const ui = mountExportedHtml(htmlExporter.buildHtml(story()));
  ui.click('start'); assert.ok(ui.timers.size);
  ui.key('Escape'); assert.equal(ui.timers.size,0); assert.equal(ui.elements.get('menu').hidden,false);
  ui.click('start'); ui.key('Enter'); ui.key('Enter'); ui.key('Enter'); ui.key('1'); ui.key('Enter'); ui.key('Enter');
  assert.ok([...ui.timers.values()].some(timer => timer.delay === 100));
  ui.click('home'); assert.equal(ui.timers.size,0);
  ui.click('start'); assert.equal(ui.elements.get('utility-dialog').open,true);
  ui.click('new-game-confirm'); ui.key('Enter'); assert.equal(ui.elements.get('copy').textContent,'Olá!');
});
test('Enter respects a choice focused by Tab and the final restart button', () => {
  const input = story();
  const option = input.sequences[0].nodes[1].options[1];
  delete option.condition; option.target_event = 'alternative';
  input.sequences.push({event_id:'alternative',nodes:[{type:'narration',text:'Outro caminho.'}]});
  const ui = mountExportedHtml(htmlExporter.buildHtml(input),true);
  ui.click('start'); ui.key('Enter');
  const second = ui.elements.get('choices').children[1]; second.focus();
  ui.key('Enter',second); assert.equal(ui.elements.get('copy').textContent,'Outro caminho.');
  ui.key('Enter');
  const restart = ui.elements.get('choices').children[0]; restart.focus(); ui.key('Enter',restart);
  assert.equal(ui.elements.get('utility-dialog').open,true); ui.click('new-game-confirm');
  assert.equal(ui.elements.get('copy').textContent,'Olá!');
});
test('reduced motion skips typing; blocked choices offer a clear dead-end message', () => {
  const input = story(); input.sequences[0].nodes = [input.sequences[0].nodes[1]];
  input.sequences[0].nodes[0].options = [input.sequences[0].nodes[0].options[1]];
  const ui = mountExportedHtml(htmlExporter.buildHtml(input),true); ui.click('start');
  assert.equal(ui.timers.size,0);
  assert.equal(ui.elements.get('choices').hidden,false);
  assert.match(ui.elements.get('hint').textContent,/Nenhuma opção disponível/);
  ui.key('Enter'); assert.equal(ui.elements.get('copy').textContent,'Qual caminho?');
  ui.click('restart'); assert.equal(ui.elements.get('copy').textContent,'Qual caminho?');
});
test('actual export adapter strips document metadata and handles translations across documents', () => {
  const editor = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const begin = editor.indexOf('      const buildStandaloneNarrativeStory =');
  const end = editor.indexOf('      const reviewStandaloneNarrativeStory =',begin);
  const input = story();
  const records = [
    {title:'Original',access_token:'DO-NOT-EXPORT',localization:{sourceLocale:'pt-BR',translations:{'en-US':{line:{text:'Hello!',source:'Olá!'}}}}},
    {title:'Final',localization:{sourceLocale:'pt-BR',translations:{}}}
  ];
  input.sequences[0].nodes[0].localization_id = 'line';
  const entries = input.sequences.map((sequence,index) => ({id:sequence.event_id,record:records[index ? 1 : 0],sequence:{title:sequence.event_id,presentation:{}},nodes:sequence.nodes}));
  const exportContext = vm.createContext({
    HeartspaceNarrativeRuntime:runtime, HeartspaceNarrativeHtml:htmlExporter, HeartspaceNarrativeMedia:context.HeartspaceNarrativeMedia, buildNarrativeRegistry:() => ({entries,byId:new Map(entries.map(entry => [entry.id,entry]))}),
    validateNarrativeRegistry:() => [], localizationDataFor:record => record.localization,
    normalizeNarrativePresentation:value => value, narrativeCharacters:[], narrativeVariables:input.variable_registry,
    coerceNarrativeValue:runtime.coerce
  });
  const result = vm.runInContext(editor.slice(begin,end) + '\nbuildStandaloneNarrativeStory("start","en-US","My story");',exportContext);
  assert.equal(result.story.sequences.length,2);
  assert.equal(result.story.sequences[0].nodes[0].text,'Hello!');
  assert.equal(result.story.sequences[1].nodes[0].versions[0].text,'Você segue sozinho.');
  assert.ok(result.issues.some(issue => issue.title.includes('sem tradução')));
  assert.equal(JSON.stringify(result.story).includes('DO-NOT-EXPORT'),false);
  assert.equal(JSON.stringify(result.story).includes('Documento privado'),false);
});
test('export validation catches missing targets and rules invalidated by variable type changes', () => {
  const editor = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const begin = editor.indexOf('      const validateNarrativeRegistry =');
  const end = editor.indexOf('      const renderNarrativeValidation =',begin);
  const input = story();
  const options = input.sequences[0].nodes[1].options;
  options[0].effects = [{variable:'met',operation:'set',value:'not-a-boolean'}];
  options[1].condition = {variable:'met',operator:'gt',value:true};
  const entries = input.sequences.slice(0,2).map(sequence => ({id:sequence.event_id,nodes:sequence.nodes,routes:[]}));
  entries.push({id:'absent',nodes:[],routes:[],provisional:true});
  const registry = {entries,byId:new Map(entries.map(entry => [entry.id,entry])),duplicateIds:new Set()};
  const validationContext = vm.createContext({
    registry,characterById:() => null,
    narrativeVariableById:id => input.variable_registry.find(variable => variable.id === id)
  });
  const issues = vm.runInContext(editor.slice(begin,end) + '\nvalidateNarrativeRegistry(registry,"start");',validationContext);
  assert.ok(issues.some(issue => issue.title.includes('Destino ausente') && issue.severity === 'error'));
  assert.ok(issues.some(issue => issue.title === 'Comparação incompatível' && issue.severity === 'error'));
  assert.ok(issues.some(issue => issue.title === 'Valor incompatível no efeito' && issue.severity === 'error'));
});
test('progress resumes across page loads with variables and no duplicated choice effects', () => {
  const html = htmlExporter.buildHtml(story()); const storage = new Map();
  const first = mountExportedHtml(html,true,{storage});
  first.click('start'); first.key('Enter'); first.key('1'); first.pagehide();
  const saved = JSON.parse([...storage.values()][0]);
  assert.equal(saved.snapshot.variables.trust,2); assert.equal(saved.snapshot.eventId,'ending');
  const second = mountExportedHtml(html,true,{storage});
  assert.equal(second.elements.get('resume').hidden,false);
  second.click('resume'); assert.equal(second.elements.get('copy').textContent,'Alex segue com você.');
  second.click('history-open');
  const text = second.elements.get('history-list').textContent;
  assert.match(text,/Olá!/); assert.match(text,/Você escolheu: Ajudar/); assert.match(text,/Alex segue com você/);
  second.click('utility-close'); second.key('Escape');
  const restored = JSON.parse([...storage.values()][0]);
  assert.equal(restored.snapshot.variables.trust,2); assert.equal(restored.history.length,2);
});
test('history is read-only and opening it repeatedly does not duplicate lines', () => {
  const ui = mountExportedHtml(htmlExporter.buildHtml(story()),true);
  ui.click('start'); ui.key('Enter');
  const savedBefore = [...ui.storage.values()][0];
  ui.click('history-open'); const first = ui.elements.get('history-list').textContent;
  ui.key('Enter'); ui.key('1'); assert.equal(ui.elements.get('copy').textContent,'Qual caminho?');
  ui.key('Escape'); assert.equal(ui.elements.get('utility-dialog').open,false);
  ui.click('history-open'); assert.equal(ui.elements.get('history-list').textContent,first);
  ui.click('utility-close'); assert.equal([...ui.storage.values()][0],savedBefore);
});
test('new-game confirmation preserves progress on cancel and resets it on confirm', () => {
  const ui = mountExportedHtml(htmlExporter.buildHtml(story()),true);
  ui.click('start'); ui.key('Enter'); ui.key('1'); ui.key('Escape');
  ui.click('start'); assert.equal(ui.elements.get('confirm-view').hidden,false);
  ui.click('new-game-cancel'); ui.click('resume');
  assert.equal(ui.elements.get('copy').textContent,'Alex segue com você.');
  ui.click('preferences-open'); ui.click('restart'); ui.click('new-game-confirm');
  assert.equal(ui.elements.get('copy').textContent,'Olá!');
  const saved = JSON.parse([...ui.storage.values()][0]);
  assert.deepEqual(saved.snapshot.variables,{trust:0,met:false}); assert.equal(saved.history.length,0);
});
test('preferences persist independently and affect future text without advancing the game', () => {
  const html = htmlExporter.buildHtml(story()); const storage = new Map();
  const first = mountExportedHtml(html,false,{storage});
  first.click('preferences-open'); first.change('preference-speed','0'); first.change('preference-text-size','1.3'); first.change('preference-motion','reduce');
  first.click('utility-close'); first.click('start');
  assert.equal(first.elements.get('copy').textContent,'Olá!'); assert.equal(first.timers.size,0);
  assert.equal(first.elements.get('stage').style.getPropertyValue('--text-scale'),'1.3');
  const second = mountExportedHtml(html,false,{storage});
  assert.equal(second.elements.get('preference-speed').value,'0');
  assert.equal(second.elements.get('preference-text-size').value,'1.3');
  assert.equal(second.document.body.dataset.motion,'reduce');
  second.click('resume'); assert.equal(second.elements.get('copy').textContent,'Olá!');
});
test('modal and background suspension preserve the remaining pause duration', () => {
  const input = story(); input.sequences[0].nodes = [{type:'pause',duration_ms:1000},{type:'narration',text:'Depois da pausa.'}];
  const ui = mountExportedHtml(htmlExporter.buildHtml(input),true);
  ui.click('start'); ui.elapse(300); ui.click('preferences-open');
  assert.equal(ui.timers.size,0); ui.elapse(5000); ui.click('utility-close');
  assert.equal([...ui.timers.values()][0].delay,700);
  ui.elapse(200); ui.setHidden(true); ui.elapse(5000); ui.setHidden(false);
  assert.equal([...ui.timers.values()][0].delay,500);
  ui.elapse(499); assert.notEqual(ui.elements.get('copy').textContent,'Depois da pausa.');
  ui.elapse(1); assert.equal(ui.elements.get('copy').textContent,'Depois da pausa.');
});
test('blocked storage and write quota keep a session playable and clearly warn the reader', () => {
  for (const options of [{blockStorageAccess:true},{blockStorageWrite:true}]) {
    const html = htmlExporter.buildHtml(story()); const ui = mountExportedHtml(html,true,options);
    ui.click('start'); ui.key('Enter'); ui.key('1'); ui.key('Escape');
    assert.match(ui.elements.get('progress-status').textContent,/não permite salvar/);
    assert.equal(ui.elements.get('resume').hidden,false); ui.click('resume');
    assert.equal(ui.elements.get('copy').textContent,'Alex segue com você.');
    const reload = mountExportedHtml(html,true,options); assert.equal(reload.elements.get('resume').hidden,true);
  }
});
test('corrupt or incompatible progress is rejected without overwriting the stored save', () => {
  const input = story(); const html = htmlExporter.buildHtml(input); const storage = new Map();
  const first = mountExportedHtml(html,true,{storage}); first.click('start'); first.key('Enter'); first.key('1');
  const key = [...storage.keys()][0]; const valid = storage.get(key);
  const corruptions = ['invalid JSON', JSON.stringify({...JSON.parse(valid),snapshot:{eventId:'ending',index:999,variables:{trust:2,met:true}}}), JSON.stringify({...JSON.parse(valid),snapshot:{eventId:'ending',index:0,variables:{trust:'bad',met:true}}})];
  for (const corrupt of corruptions) {
    storage.set(key,corrupt); const ui = mountExportedHtml(html,true,{storage});
    assert.equal(ui.elements.get('resume').hidden,true); assert.match(ui.elements.get('progress-status').textContent,/recuperar/);
    assert.equal(storage.get(key),corrupt);
  }
  storage.set(key,valid); input.sequences[1].nodes[0].versions[0].text += ' Alteração.';
  const changed = mountExportedHtml(htmlExporter.buildHtml(input),true,{storage});
  assert.equal(changed.elements.get('resume').hidden,true); assert.match(changed.elements.get('progress-status').textContent,/história mudou/);
  assert.equal(storage.get(key),valid);
});
test('story and locale save slots are isolated while presentation changes keep progress', () => {
  const input = story(); input.storage_id = 'stable-story'; const storage = new Map();
  const first = mountExportedHtml(htmlExporter.buildHtml(input),true,{storage}); first.click('start'); first.key('Enter');
  input.title = 'Nome alterado'; input.sequences[0].presentation = {accent:'#abcdef',speed:0};
  input.sequences[1].nodes[0].active_version_id = 'together';
  const redesigned = mountExportedHtml(htmlExporter.buildHtml(input),true,{storage});
  assert.equal(redesigned.elements.get('resume').hidden,false);
  input.locale = 'en-US'; const translated = mountExportedHtml(htmlExporter.buildHtml(input),true,{storage});
  assert.equal(translated.elements.get('resume').hidden,true);
  input.locale = 'pt-BR'; input.storage_id = 'another-story';
  assert.equal(mountExportedHtml(htmlExporter.buildHtml(input),true,{storage}).elements.get('resume').hidden,true);
});
test('completed paths resume their ending and do not repeat effects', () => {
  const html = htmlExporter.buildHtml(story()); const storage = new Map();
  const first = mountExportedHtml(html,true,{storage}); first.click('start'); first.key('Enter'); first.key('1'); first.key('Enter'); first.key('Enter'); first.key('Enter');
  assert.match(first.elements.get('copy').textContent,/fim deste caminho/);
  const second = mountExportedHtml(html,true,{storage}); second.click('resume');
  assert.match(second.elements.get('copy').textContent,/fim deste caminho/);
  second.click('history-open'); assert.match(second.elements.get('history-list').textContent,/Fim\./);
});
test('embedded startup does not steal focus; system motion updates apply immediately', () => {
  const ui = mountExportedHtml(htmlExporter.buildHtml(story()),false,{search:'?embed=1'});
  assert.equal(ui.document.body.dataset.embedded,'true'); assert.equal(ui.document.activeElement,ui.document.body);
  ui.click('start'); assert.ok(ui.timers.size); ui.setReducedMotion(true);
  assert.equal(ui.elements.get('copy').textContent,'Olá!'); assert.equal(ui.timers.size,0);
  assert.equal(ui.document.body.dataset.motion,'reduce');
});
test('long looping stories bound saved history without losing the current position', () => {
  const input = {title:'Loop',start_event_id:'loop',sequences:[{event_id:'loop',nodes:[{type:'narration',text:'Mais uma volta.'},{type:'choice',prompt:'Continuar?',options:[{text:'Sim',target_event:'loop'}]}]}]};
  const ui = mountExportedHtml(htmlExporter.buildHtml(input),true); ui.click('start');
  for (let turn = 0; turn < 105; turn += 1) { ui.key('Enter'); ui.key('1'); }
  const save = JSON.parse([...ui.storage.values()][0]);
  assert.equal(save.history.length,200); assert.equal(save.snapshot.index,0); assert.equal(save.snapshot.eventId,'loop');
  ui.click('history-open'); assert.equal(ui.elements.get('history-list').children.length,201);
});
test('invalid restored snapshots leave the runtime untouched', () => {
  const runner = runtime.createRunner(story()); runner.advance(); const before = plain(runner.snapshot());
  for (const snapshot of [
    {eventId:'ending',index:0,variables:{trust:2}},
    {eventId:'ending',index:0,variables:{trust:2,met:true,extra:1}},
    {eventId:'ending',index:0,variables:{trust:Infinity,met:true}},
    {eventId:'ending',index:-1,variables:{trust:2,met:true}},
    {eventId:'ending',index:0.5,variables:{trust:2,met:true}}
  ]) { assert.equal(runner.restore(snapshot),false); assert.deepEqual(plain(runner.snapshot()),before); }
});
test('invalid preferences are normalized and untrusted history is rendered as plain text', () => {
  const html = htmlExporter.buildHtml(story()); const storage = new Map();
  const first = mountExportedHtml(html,true,{storage}); first.click('start'); first.key('Enter');
  const key = [...storage.keys()][0]; const save = JSON.parse(storage.get(key));
  save.history.push({speaker:'<script>',text:'<img src=x onerror=alert(1)>',choice:''},null,{text:42});
  storage.set(key,JSON.stringify(save));
  storage.set(key.replace(/progress$/,'preferences'),JSON.stringify({speed:'-1',motion:'unsafe',textSize:'900'}));
  const second = mountExportedHtml(html,true,{storage});
  assert.equal(second.elements.get('preference-speed').value,'story'); assert.equal(second.elements.get('preference-text-size').value,'1');
  second.click('resume'); second.click('history-open');
  assert.match(second.elements.get('history-list').textContent,/<img src=x onerror=alert\(1\)>/);
  assert.equal(second.elements.get('history-list').children[1].children[1].tagName,'P');
});
test('embed code follows the HTML filename and escapes a title containing markup', () => {
  const editor = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const begin = editor.indexOf('      const updateStoryEmbedCode =');
  const end = editor.indexOf("      document.querySelector('#story-export-open')",begin);
  const fields = {'#story-export-name':{value:'Livro "><script>alert(1)</script>'},'#story-embed-code':{value:''},'#story-export-format':{value:'html'}};
  const embedContext = vm.createContext({
    document:{querySelector:selector => fields[selector]},
    narrativeSlug:value => value.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''),
    escapeHtml:value => value.replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
  });
  vm.runInContext(editor.slice(begin,end) + '\nupdateStoryEmbedCode();',embedContext);
  assert.match(fields['#story-embed-code'].value,/src="\.\/livro_script_alert_1_script\.html\?embed=1"/);
  assert.equal(fields['#story-embed-code'].value.includes('<script>'),false);
  assert.match(fields['#story-embed-code'].value,/&quot;&gt;&lt;script&gt;/);
  fields['#story-export-format'].value = 'zip';
  vm.runInContext('updateStoryEmbedCode();',embedContext);
  assert.match(fields['#story-embed-code'].value,/src="\.\/index\.html\?embed=1"/);
});
