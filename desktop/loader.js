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
  const mountEditor = async source => {
    const html = source
      .replaceAll('./assets/', `${rootPrefix}assets/`)
      .replaceAll('./vendor/', `${rootPrefix}vendor/`)
      .replace('src="desktop/adapter.js"', `src="${fixtureMode ? '../' : './'}adapter.js"`)
      .replace('src="config.js"', `src="${rootPrefix}config.js"`)
      .replace('src="narrative-runtime.js"', `src="${rootPrefix}narrative-runtime.js"`)
      .replace('src="narrative-html.js"', `src="${rootPrefix}narrative-html.js"`);
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const scripts = [...parsed.querySelectorAll('script')].map(original => {
      const attributes = [...original.attributes].map(attribute => [attribute.name, attribute.value]);
      const text = original.textContent || '';
      original.remove();
      return { attributes, text };
    });
    document.documentElement.lang = parsed.documentElement.lang || 'pt-BR';
    document.head.replaceChildren(...parsed.head.childNodes);
    document.body.replaceWith(parsed.body);
    for (const definition of scripts) {
      const script = document.createElement('script');
      for (const [name, value] of definition.attributes) script.setAttribute(name, value);
      script.textContent = definition.text;
      if (script.src) {
        script.async = false;
        await new Promise((resolve, reject) => {
          script.addEventListener('load', resolve, { once: true });
          script.addEventListener('error', () => reject(new Error(`Recurso indisponível: ${script.src}`)), { once: true });
          document.body.append(script);
        });
      } else {
        document.body.append(script);
      }
    }
    if (fixtureMode) window.HeartspaceDesktopFixture?.mountControls();
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
    .then(mountEditor)
    .catch(showFailure);
})();
