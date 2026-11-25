/* Test-only support: exercise the standard input/download fallback and retain a
   copy of generated downloads for browser automation. No production file loads it. */
window.showOpenFilePicker = undefined;
window.showSaveFilePicker = undefined;
document.addEventListener('click',event => {
  const link = event.target.closest?.('a[download]');
  if (!link || !link.href.startsWith('blob:') || link.dataset.stage0Copy) return;
  const name = link.download;
  // Observe bytes immediately, before the application's normal URL revocation.
  fetch(link.href).then(response => response.blob()).then(blob => {
    let panel = document.getElementById('stage0-observed-downloads');
    if (!panel) { panel = document.createElement('aside'); panel.id = 'stage0-observed-downloads'; panel.style.cssText='position:fixed;bottom:0;right:0;z-index:99999;background:white;color:black;padding:8px;font:12px sans-serif;max-width:420px'; document.body.append(panel); }
    const copy = document.createElement('a'); copy.dataset.stage0Copy='true'; copy.href=URL.createObjectURL(blob); copy.download=name; copy.textContent='Cópia observada: '+name; copy.style.display='block'; panel.append(copy);
  }).catch(error => { console.error('stage0 download observation:',error.message); });
},true);
