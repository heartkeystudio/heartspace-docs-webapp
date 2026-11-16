/* Produces the deliverable with the same native story and export modules as Docs.
   Run after canvas/build-art.gd when the source artwork changes. No browser/tests. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'examples/heartspace');
const asset = name => ({name:`${name}.png`,mime:'image/png',data:`data:image/png;base64,${fs.readFileSync(path.join(output,'assets',`${name}.png`)).toString('base64')}`});
const assets = {backdrop:asset('backdrop'),paperWorld:asset('paper-world'),constellation:asset('constellation')};
fs.writeFileSync(path.join(root,'heartspace-showcase-assets.js'),`/* PNGs exported by Canvas Draw; rebuild with scripts/build_heartspace_presentation.cjs. */\n(function(root){root.HeartspaceShowcaseAssets=${JSON.stringify(assets)};})(globalThis);\n`);
require(path.join(root,'narrative-runtime.js'));
require(path.join(root,'narrative-media.js'));
require(path.join(root,'narrative-html.js'));
require(path.join(root,'narrative-package.js'));
require(path.join(root,'heartspace-showcase.js'));
const story = globalThis.HeartspaceShowcase.build(assets);
fs.writeFileSync(path.join(output,'heartspace.story.json'),JSON.stringify(story,null,2)+'\n');
fs.writeFileSync(path.join(output,'heartspace.html'),globalThis.HeartspaceNarrativeHtml.buildHtml(story));
const packed = globalThis.HeartspaceNarrativePackage.buildPackage(story);
fs.writeFileSync(path.join(output,'heartspace.zip'),packed.bytes);
fs.writeFileSync(path.join(output,'planning.json'),JSON.stringify(globalThis.HeartspaceShowcase.plan(story,'showcase-script'),null,2)+'\n');
console.log(`Apresentação gerada: ${output}/heartspace.html e heartspace.zip`);
