// Generate disposable local test pages; never modifies index.html or user sources.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'), output=path.join(__dirname,'.stage0-output');
fs.mkdirSync(output,{recursive:true});
let editor=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/"><meta http-equiv="Content-Security-Policy" content="connect-src \'self\' blob:"><script src="tests/stage0-editor-support.js"></script>');
for (const name of ['authoring-project.js','narrative-media.js','narrative-package.js','scene-composer.js','scene-workspace.js','local-projects.js','book-pagination.js','authoring-history-patch.js']) {
  const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex').slice(0,16);
  editor=editor.replace(`src="${name}"`,`src="${name}?stage0=${hash}"`);
}
fs.writeFileSync(path.join(output,'editor.html'),editor);
// Read-only observation hook, injected only into a separate disposable test page.
const probeAnchor = '      const rememberNarrativeMutation =';
if (editor.split(probeAnchor).length !== 2) throw Error('Editor history probe anchor changed');
const matrixEditor = editor.replace(probeAnchor,`      window.Stage0EditorRead = () => JSON.parse(JSON.stringify({source:authoringCache().source,body:serializeEditorBody(),documentId:activeDocumentId,key:storageKey,nativeAllowed:nativeNarrativeHistoryAllowed,moment:sceneMomentBlockId,nodes:sceneMomentContext().nodes,runtime:narrativeTestState?.runner.snapshot() || null,history:narrativeMutationHistory,redo:narrativeMutationRedo}));
      window.Stage0EditorSetRemoteV2 = async () => { const record=documents.find(item=>item.id===activeDocumentId); if(!record)throw Error('Documento sintético ausente'); currentUser={id:'stage0-test-account'}; currentProjectId='stage0-test-project'; currentAccessToken='synthetic-test-token'; projectCapabilities={docs_edit:true}; cloudCacheBase='heartspace-docs-web-v2:stage0-test-account:docs:stage0-test-project'; cloudWindowId='stage0-test-window'; storageKey=cloudCacheBase+':window:'+cloudWindowId; record.remoteId='stage0-test-remote-document'; record.projectId=currentProjectId; record.dirty=true; record.syncAttempt=null; setSaveStatus('Rascunho salvo neste dispositivo'); const before={label:document.querySelector('#save-state').textContent,title:document.querySelector('#save-state').getAttribute('aria-label')}; await syncRecord(record); return {before,after:{label:document.querySelector('#save-state').textContent,title:document.querySelector('#save-state').getAttribute('aria-label')},dirty:record.dirty,syncError:record.syncError||'',syncAttempt:record.syncAttempt||null,remoteId:record.remoteId}; };
${probeAnchor}`).replace('</body>','<script src="tests/stage0-editor-matrix.js?stage0='+Date.now()+'"></script></body>');
fs.writeFileSync(path.join(output,'editor-matrix.html'),matrixEditor);
fs.writeFileSync(path.join(output,'editor-native.html'),matrixEditor.replace('tests/stage0-editor-matrix.js','tests/stage0-native-input.js'));


const context=vm.createContext({atob,btoa,Uint8Array,Uint32Array,DataView,TextEncoder,TextDecoder});
for(const file of ['narrative-runtime.js','narrative-media.js','narrative-html.js','narrative-package.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const packed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/stage0-current.hdocs'),'utf8'));
const materialize=value=>{
  if(!value||typeof value!=='object')return;
  if(value.projectAsset){const asset=packed.assets.find(item=>item.id===value.projectAsset);if(!asset)throw Error('Missing test media');value.data=`data:${asset.mime};base64,${asset.base64}`;value.mime=asset.mime;delete value.projectAsset;}
  Object.values(value).forEach(materialize);
};
materialize(packed.source);
const story=require('./fixtures/stage0.js').story(packed.source);
fs.writeFileSync(path.join(output,'player.html'),context.HeartspaceNarrativeHtml.buildHtml(story));
const zip=context.HeartspaceNarrativePackage.buildPackage(story);
fs.writeFileSync(path.join(output,'player.zip'),zip.bytes);
for(const file of zip.files){const dest=path.join(output,'zip',file.name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,file.data);}
console.log('Prepared tests/.stage0-output/editor.html, player.html and zip/index.html. Synthetic fixtures only.');
