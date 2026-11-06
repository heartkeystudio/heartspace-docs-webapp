(() => {
  const normalizedPath = location.pathname.replace(/\/+$/, '');
  const loopbackHost = location.hostname === 'localhost'
    || location.hostname === '127.0.0.1'
    || location.hostname === '::1'
    || location.hostname === '[::1]';
  const fixturePath = normalizedPath === '/desktop/fixture';
  const fixtureMode = fixturePath && loopbackHost;
  const rootPrefix = fixtureMode ? '../../' : '../';
  const showFailure = () => {
    document.body.innerHTML = '<main><h1>Não foi possível abrir o HeartSpace Docs</h1><p>Feche esta janela e abra o Docs novamente pelo HeartSpace.</p></main>';
  };
  if (fixturePath && !loopbackHost) {
    showFailure();
    return;
  }
  fetch(`${rootPrefix}index.html`, { cache: 'no-store', credentials: 'omit' })
    .then(response => {
      if (!response.ok) throw new Error('Editor indisponível');
      return response.text();
    })
    .then(source => {
      const html = source
        .replaceAll('./assets/', `${rootPrefix}assets/`)
        .replaceAll('./vendor/', `${rootPrefix}vendor/`)
        .replace('src="desktop/adapter.js"', `src="${fixtureMode ? '../' : './'}adapter.js"`)
        .replace('src="config.js"', `src="${rootPrefix}config.js"`);
      document.open();
      document.write(html);
      document.close();
      if (fixtureMode) window.setTimeout(() => window.HeartspaceDesktopFixture?.mountControls(), 0);
    })
    .catch(showFailure);
})();
