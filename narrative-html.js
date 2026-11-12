/* Generates a self-contained game. Only application-owned JavaScript is embedded. */
(function (root) {
  function mountNarrativePlayer(runtime, story) {
    const runner = runtime.createRunner(story);
    const byId = id => document.getElementById(id);
    const menu = byId('menu'), stage = byId('stage'), card = byId('card');
    const speaker = byId('speaker'), copy = byId('copy'), choices = byId('choices');
    const hint = byId('hint'), next = byId('next'), announcement = byId('announcement');
    let typing = null, typingTimer = null, pauseTimer = null, selectedChoice = 0, playing = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { clearInterval(typingTimer); clearTimeout(pauseTimer); typing = null; };
    const announce = text => { announcement.textContent = text; };
    const finishTyping = () => {
      if (!typing) return false;
      clearInterval(typingTimer);
      const current = typing; typing = null;
      copy.textContent = current.text;
      copy.removeAttribute('aria-hidden');
      announce(`${speaker.textContent ? speaker.textContent + '. ' : ''}${current.text}`);
      current.done();
      return true;
    };
    const typeText = (text, speed, done) => {
      const letters = Array.from(text);
      copy.textContent = '';
      if (!speed || reducedMotion.matches || !letters.length) {
        copy.textContent = text; copy.removeAttribute('aria-hidden');
        announce(`${speaker.textContent ? speaker.textContent + '. ' : ''}${text}`);
        done(); return;
      }
      copy.setAttribute('aria-hidden', 'true');
      typing = { text, done };
      let index = 0;
      hint.textContent = 'Toque, clique ou pressione Enter para revelar';
      typingTimer = setInterval(() => {
        index += 1; copy.textContent = letters.slice(0, index).join('');
        if (index >= letters.length) finishTyping();
      }, speed);
    };
    const applyPresentation = raw => {
      const presentation = raw || {};
      const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
      stage.dataset.model = ['panel','subtitle','card'].includes(presentation.model) ? presentation.model : 'panel';
      stage.dataset.position = ['top','center','bottom'].includes(presentation.position) ? presentation.position : 'bottom';
      Object.entries({ accent:color(presentation.accent,'#0c8ce9'), surface:color(presentation.surface,'#10161d'), ink:color(presentation.text,'#edf3f7'), scene:color(presentation.scene,'#111923') }).forEach(([key,value]) => stage.style.setProperty(`--${key}`,value));
      return [0,12,24,42].includes(Number(presentation.speed)) ? Number(presentation.speed) : 24;
    };
    const showMenu = () => {
      stop(); playing = false; stage.hidden = true; menu.hidden = false;
      byId('restart').hidden = true; byId('home').hidden = true;
      byId('start').focus({ preventScroll:true });
    };
    const enabledChoices = () => [...choices.querySelectorAll('button:not(:disabled)')];
    const selectChoice = index => {
      const buttons = enabledChoices();
      if (!buttons.length) return;
      selectedChoice = (index + buttons.length) % buttons.length;
      buttons.forEach((button, i) => { button.dataset.active = String(i === selectedChoice); });
      buttons[selectedChoice].focus({ preventScroll:true });
    };
    const choose = index => {
      if (!playing || typing || !runner.choose(index)) return;
      stop(); render();
    };
    const advance = () => {
      if (!playing || finishTyping()) return;
      if (runner.current().node?.type === 'choice') {
        enabledChoices()[selectedChoice]?.click(); return;
      }
      if (runner.advance()) { stop(); render(); }
    };
    const render = () => {
      stop();
      // Signals are integration metadata. They never execute content as code.
      while (runner.current().node?.type === 'signal') runner.advance();
      const { sequence, node, missing } = runner.current();
      const speed = applyPresentation(sequence?.presentation);
      if (node?.type === 'pause') {
        choices.replaceChildren(); choices.hidden = true; selectedChoice = 0;
        if (!copy.textContent) copy.textContent = '…';
        hint.textContent = 'Pausa · Enter ou clique para continuar';
        next.hidden = false; next.disabled = false;
        const duration = Math.max(0, Math.min(60000, Number(node.duration_ms) || 0));
        pauseTimer = setTimeout(advance, duration);
        return;
      }
      choices.replaceChildren(); choices.hidden = true; selectedChoice = 0;
      speaker.textContent = ''; copy.removeAttribute('aria-hidden');
      card.dataset.narration = String(node?.type === 'narration' || node?.type === 'variation');
      next.hidden = false; next.disabled = false; hint.textContent = '';
      if (!node) {
        speaker.textContent = missing ? 'História indisponível' : 'Fim';
        copy.textContent = missing ? 'Não foi possível encontrar esta parte da história.' : 'Você chegou ao fim deste caminho.';
        next.hidden = true;
        const restart = document.createElement('button'); restart.type = 'button'; restart.textContent = 'Jogar novamente';
        restart.addEventListener('click', start);
        choices.append(restart); choices.hidden = false;
        announce(copy.textContent); stage.focus({ preventScroll:true }); return;
      }
      let text = node.text || '';
      if (node.type === 'dialogue') {
        speaker.textContent = (story.character_registry || []).find(character => character.id === node.character_id)?.name || node.character || '';
        if (node.expression) speaker.textContent += `${speaker.textContent ? ' · ' : ''}${node.expression}`;
      } else if (node.type === 'variation') text = runtime.resolveVariation(node, runner.state.variables)?.text || '';
      if (node.type === 'choice') {
        text = node.prompt || 'Escolha uma opção'; next.hidden = true;
        (node.options || []).forEach((option,index) => {
          const button = document.createElement('button'); button.type = 'button';
          button.textContent = `${index + 1}. ${option.text || 'Continuar'}`;
          button.dataset.choiceIndex = String(index);
          button.disabled = !runtime.conditionMatches(option.condition, runner.state.variables);
          if (button.disabled) button.title = 'Esta opção não está disponível neste caminho';
          button.addEventListener('click', () => choose(index));
          choices.append(button);
        });
      }
      typeText(text, speed, () => {
        if (node.type === 'choice') {
          choices.hidden = false;
          const buttons = enabledChoices();
          if (buttons.length) { buttons[0].dataset.active = 'true'; hint.textContent = 'Escolha uma opção · ↑ ↓ e Enter, ou clique'; }
          else {
            hint.textContent = 'Nenhuma opção disponível neste caminho. Você pode recomeçar.';
            announce(`${text}. ${hint.textContent}`);
          }
        } else hint.textContent = 'Enter, Espaço ou clique para continuar';
      });
      stage.focus({ preventScroll:true });
    };
    function start() {
      stop(); runner.restart(); playing = true;
      menu.hidden = true; stage.hidden = false;
      byId('restart').hidden = false; byId('home').hidden = false;
      copy.textContent = ''; render();
    }
    byId('start').addEventListener('click', start);
    byId('restart').addEventListener('click', start);
    byId('home').addEventListener('click', showMenu);
    next.addEventListener('click', advance);
    stage.addEventListener('click', event => { if (!event.target.closest('button,a')) advance(); });
    document.addEventListener('keydown', event => {
      if (!playing || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.key === 'Escape') { event.preventDefault(); showMenu(); return; }
      const inChoices = !!event.target.closest('#choices');
      if (event.target.closest('button') && !inChoices && event.target !== next) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (inChoices && !typing) event.target.closest('button')?.click();
        else advance();
        return;
      }
      if (typing || choices.hidden || runner.current().node?.type !== 'choice') return;
      if (['ArrowDown','ArrowUp'].includes(event.key)) {
        event.preventDefault();
        const focusedIndex = enabledChoices().indexOf(document.activeElement);
        selectChoice((focusedIndex >= 0 ? focusedIndex : selectedChoice) + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (/^[1-9]$/.test(event.key)) {
        const button = choices.querySelector(`[data-choice-index="${Number(event.key) - 1}"]`);
        if (button && !button.disabled) { event.preventDefault(); button.click(); }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { finishTyping(); clearTimeout(pauseTimer); }
      else if (playing && runner.current().node?.type === 'pause') render();
    });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finishTyping(); });
    showMenu();
  }
  const styles = `
    :root{color-scheme:dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf3f7;background:#090f17}
    *{box-sizing:border-box}body{margin:0}button{font:inherit;cursor:pointer}button:focus-visible{outline:2px solid #81cfff;outline-offset:4px}button:disabled{opacity:.4;cursor:not-allowed}[hidden]{display:none!important}
    .shell{display:flex;flex-direction:column;min-height:100vh;min-height:100dvh}.topbar{display:flex;align-items:center;gap:12px;padding:14px clamp(16px,4vw,48px);border-bottom:1px solid #ffffff12;background:#0b111b}.title{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:#a9bacd}.topbar button{padding:7px 10px;border:1px solid #ffffff20;border-radius:7px;background:#ffffff08;color:#d9e4ed;font-size:12px}
    .menu{flex:1;display:grid;place-content:center;justify-items:center;gap:20px;padding:48px 24px;text-align:center;background:radial-gradient(ellipse at 50% 35%,#223149,#090f17 72%)}.eyebrow{color:#81bfe9;font-size:11px;letter-spacing:.18em;text-transform:uppercase}.menu h1{max-width:900px;margin:0;font-size:clamp(30px,6vw,64px);line-height:1.1;overflow-wrap:anywhere}.menu p{max-width:500px;color:#a9bacd;line-height:1.6}.menu button{padding:13px 38px;border:1px solid #5aafe5;border-radius:8px;background:#17608e;color:white}
    .stage{--accent:#0c8ce9;--surface:#10161d;--ink:#edf3f7;--scene:#111923;flex:1;display:flex;align-items:flex-end;justify-content:center;padding:clamp(20px,5vh,64px) clamp(16px,6vw,100px);background:radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--scene) 70%,#506070),var(--scene) 75%);outline:0;min-height:0}.stage[data-position=top]{align-items:flex-start}.stage[data-position=center]{align-items:center}
    .card{display:grid;gap:16px;min-width:0;width:min(980px,100%);padding:clamp(18px,3vw,32px);border:1px solid #ffffff30;border-left:3px solid var(--accent);border-radius:12px;color:var(--ink);background:var(--surface);box-shadow:0 18px 70px #0008;animation:enter .2s ease-out}.speaker{color:var(--accent);font-size:12px;font-weight:750;letter-spacing:.08em;overflow-wrap:anywhere}.speaker:empty{display:none}.copy{min-height:3.1em;font-size:clamp(17px,2.1vw,23px);line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}.card[data-narration=true] .copy{font-style:italic}.controls{display:flex;align-items:center;gap:14px}.hint{flex:1;color:var(--ink);opacity:.65;font-size:11px;line-height:1.5}.next{padding:9px 15px;border:1px solid var(--accent);border-radius:7px;color:var(--ink);background:transparent;font-size:13px}
    .choices{display:grid;gap:8px}.choices button{width:100%;padding:12px 15px;border:1px solid #ffffff30;border-radius:8px;color:var(--ink);background:#ffffff08;text-align:left;overflow-wrap:anywhere;line-height:1.45}.choices button:hover:not(:disabled),.choices button[data-active=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent)}
    .stage[data-model=subtitle] .card{border:0;background:transparent;box-shadow:none;text-align:center;text-shadow:0 2px 8px #000}.stage[data-model=card] .card{width:min(620px,100%);border-left-width:1px;border-top:3px solid var(--accent);text-align:center}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    @keyframes enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}@media(max-width:480px){.topbar{flex-wrap:wrap;padding:10px 14px;gap:8px}.title{flex-basis:100%}.stage{padding:18px 12px}.card{padding:18px 16px;gap:12px}.controls{align-items:flex-end}.copy{font-size:18px}}
  `;
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const buildHtml = story => {
    const json = JSON.stringify(story).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return `<!doctype html>
<html lang="${escape(story.locale || 'pt-BR')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; connect-src 'none'"><title>${escape(story.title)}</title><style>${styles}</style></head>
<body><div class="shell"><header class="topbar"><span class="title">${escape(story.title)}</span><button id="restart" type="button" hidden>Recomeçar</button><button id="home" type="button" hidden>Início</button></header>
<main id="menu" class="menu"><span class="eyebrow">História interativa</span><h1>${escape(story.title)}</h1><p>Leia no seu ritmo e escolha os caminhos da história.</p><button id="start" type="button">Começar</button><p>Enter ou Espaço avança · Setas escolhem · Esc volta ao início</p></main>
<main id="stage" class="stage" tabindex="-1" aria-label="História" hidden><section id="card" class="card"><div id="speaker" class="speaker"></div><div id="copy" class="copy"></div><div id="choices" class="choices" aria-label="Escolhas" hidden></div><footer class="controls"><span id="hint" class="hint"></span><button id="next" class="next" type="button">Continuar</button></footer></section></main></div><div id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<script id="story-data" type="application/json">${json}</script>
<script>(()=>{const runtime=(${root.HeartspaceNarrativeRuntime.source})();const story=JSON.parse(document.getElementById('story-data').textContent);(${mountNarrativePlayer.toString()})(runtime,story);})();</script></body></html>`;
  };
  root.HeartspaceNarrativeHtml = { buildHtml };
})(globalThis);
