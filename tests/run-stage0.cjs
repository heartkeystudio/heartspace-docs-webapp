// Run files directly so every test case (including known TODO failures) is visible.
const {spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs');
let transcript='';
const strict=process.argv.includes('--strict-known');
const totals={tests:0,pass:0,fail:0,cancelled:0,skipped:0,todo:0};
let failed=false;
for(const file of ['narrative-html.test.cjs','narrative-media.test.cjs','stage0-compatibility.test.cjs','stage0-inheritance.test.cjs','stage0-history.test.cjs','authoring-history-patch.test.cjs']){
  const child=spawnSync(process.execPath,[path.join(__dirname,file)],{encoding:'utf8',env:{...process.env,DOCS_STAGE0_STRICT:strict?'1':'0'}});
  transcript+=(child.stdout||'')+(child.stderr||'');
  process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');
  if(child.error){console.error(child.error);failed=true;}
  if(child.status!==0)failed=true;
  if(/^ok \d+ .*# TODO/m.test(child.stdout||'')){console.error('Known failure unexpectedly passed; review and remove its TODO.');failed=true;}
  for(const key of Object.keys(totals)){const match=(child.stdout||'').match(new RegExp(`^# ${key} (\\d+)$`,'m'));if(match)totals[key]+=Number(match[1]);else failed=true;}
}
console.log('STAGE0_TOTALS '+JSON.stringify(totals));
const output=path.join(__dirname,'.stage0-output');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,strict?'node-strict.tap':'node.tap'),transcript+'\nSTAGE0_TOTALS '+JSON.stringify(totals)+'\n');
fs.writeFileSync(path.join(output,strict?'node-strict.json':'node.json'),JSON.stringify({node:process.version,strict,totals},null,2)+'\n');
if(totals.todo)console.log('Known product failures remain pending authorization; exit 0 is not product acceptance. Use --strict-known to fail on those cases.');
process.exitCode=failed?1:0;
