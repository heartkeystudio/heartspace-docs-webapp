/* Generates a self-contained game. Only application-owned JavaScript is embedded. */
(function (root) {
  function mountNarrativePlayer(runtime, story, media) {
    const runner = runtime.createRunner(story);
    const byId = id => document.getElementById(id);
    const menu = byId('menu'), stage = byId('stage'), card = byId('card');
    const gameViewport = media.viewport(story.viewport || story.sequences?.find(sequence => sequence.event_id === story.start_event_id)?.presentation?.viewport);
    const viewport = media.createViewport(stage,{kind:'player'});
    const speaker = byId('speaker'), copy = byId('copy'), choices = byId('choices');
    const hint = byId('hint'), next = byId('next'), announcement = byId('announcement');
    const utility = byId('utility-dialog'), historyList = byId('history-list');
    let typing = null, typingTimer = null, pauseTimer = null, selectedChoice = 0, playing = false;
    let choiceReadyNode = null;
    let pauseDeadline = 0, pauseRemaining = null, returnFocus = null;
    let transcript = [], savedGame = null, storageAvailable = true, saveNotice = '';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = media.createScene(stage,{characters:() => story.character_registry || [],
      onInteraction:({block_id,option_id}) => {
        const {sequence,node} = runner.current();
        if (node?.id !== block_id || sequence.nodes.filter(candidate => candidate.id === block_id).length !== 1) return;
        const matches = (node.options || []).map((option,index) => ({option,index})).filter(item => item.option.id === option_id);
        if (matches.length === 1) choose(matches[0].index,node);
      },
      reducedMotion:() => motionReduced(),
      onAudioIssue:message => { byId('media-status').textContent = message; },
      onImageIssue:message => { byId('media-status').textContent = message; }
    });
    let sceneCharacter = null;
    const storagePrefix = `heartspace-player:${story.persistence.id}:`;
    const readStorage = name => {
      try { return window.localStorage.getItem(storagePrefix + name); }
      catch (_) { storageAvailable = false; return null; }
    };
    const writeStorage = (name,value) => {
      try { window.localStorage.setItem(storagePrefix + name,JSON.stringify(value)); storageAvailable = true; }
      catch (_) { storageAvailable = false; }
    };
    const normalizePreferences = raw => ({
      speed:['story','0','12','24','42'].includes(raw?.speed) ? raw.speed : 'story',
      motion:raw?.motion === 'reduce' ? 'reduce' : 'system',
      textSize:['0.9','1','1.15','1.3'].includes(raw?.textSize) ? raw.textSize : '1',
      sound:raw?.sound === 'off' ? 'off' : 'on',
      volume:['0','0.25','0.5','0.75','1'].includes(raw?.volume) ? raw.volume : '0.5'
    });
    let preferences;
    try { preferences = normalizePreferences(JSON.parse(readStorage('preferences'))); }
    catch (_) { preferences = normalizePreferences(); }
    const motionReduced = () => preferences.motion === 'reduce' || reducedMotion.matches;
    const updateProgressUi = () => {
      byId('resume').hidden = !savedGame;
      byId('start').textContent = savedGame ? 'Nova partida' : 'Começar';
      const message = !storageAvailable ? 'O navegador não permite salvar aqui. Você pode continuar nesta aba; ao fechá-la, o progresso pode ser perdido.'
        : saveNotice || (savedGame ? 'Progresso salvo neste navegador.' : 'O progresso será salvo automaticamente neste navegador.');
      byId('progress-status').textContent = message;
      byId('preferences-save-status').textContent = message;
    };
    const persistProgress = () => {
      if (!playing) return;
      savedGame = { format:'heartspace-player-save-v1', revision:story.persistence.revision, snapshot:runner.snapshot(), history:transcript.slice(-200), updatedAt:Date.now() };
      saveNotice = '';
      writeStorage('progress',savedGame); updateProgressUi();
    };
    const loadProgress = () => {
      const raw = readStorage('progress');
      if (raw) try {
        const saved = JSON.parse(raw);
        if (saved.format !== 'heartspace-player-save-v1' || saved.revision !== story.persistence.revision) saveNotice = 'A história mudou desde a última partida. Comece novamente para jogar esta versão.';
        else if (!runner.restore(saved.snapshot)) saveNotice = 'Não foi possível recuperar o progresso salvo. Você pode começar uma nova partida.';
        else {
          savedGame = { ...saved, snapshot:runner.snapshot(), history:Array.isArray(saved.history) ? saved.history.slice(-200).filter(line => line && typeof line.text === 'string' && typeof line.speaker === 'string' && typeof line.choice === 'string').map(line => ({speaker:line.speaker,text:line.text,choice:line.choice})) : [] };
        }
      } catch (_) { saveNotice = 'Não foi possível recuperar o progresso salvo. Você pode começar uma nova partida.'; }
      runner.restart(); updateProgressUi();
    };
    const applyPreferences = () => {
      document.body.dataset.motion = motionReduced() ? 'reduce' : 'normal';
      scene.refreshMotion();
      stage.style.setProperty('--text-scale',preferences.textSize);
      utility.style.setProperty('--text-scale',preferences.textSize);
      byId('preference-speed').value = preferences.speed;
      byId('preference-motion').value = preferences.motion;
      byId('preference-text-size').value = preferences.textSize;
      byId('preference-sound').value = preferences.sound;
      byId('preference-volume').value = preferences.volume;
      scene.setSound(preferences.sound !== 'off',Number(preferences.volume));
    };
    const stop = () => {
      clearInterval(typingTimer); clearTimeout(pauseTimer);
      typingTimer = null; pauseTimer = null; pauseRemaining = null; typing = null;
    };
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
      if (!speed || motionReduced() || !letters.length) {
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
    const applyPresentation = (raw,character,motion) => {
      const presentation = raw || {};
      viewport.update({...presentation,viewport:gameViewport});
      scene.update(presentation,character);
      scene.setActive(playing && !utility.open && !document.hidden);
      if (motion && playing && !utility.open && !document.hidden) scene.playAnimations(motion);
      const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
      stage.dataset.model = ['panel','subtitle','card'].includes(presentation.model) ? presentation.model : 'panel';
      stage.dataset.position = ['top','center','bottom'].includes(presentation.position) ? presentation.position : 'bottom';
      Object.entries({ accent:color(presentation.accent,'#0c8ce9'), surface:color(presentation.surface,'#10161d'), ink:color(presentation.text,'#edf3f7'), scene:color(presentation.scene,'#111923') }).forEach(([key,value]) => stage.style.setProperty(`--${key}`,value));
      if (presentation.dialogue_visible === false) return 0;
      return preferences.speed !== 'story' ? Number(preferences.speed) : [0,12,24,42].includes(Number(presentation.speed)) ? Number(presentation.speed) : 24;
    };
    const schedulePause = duration => {
      pauseRemaining = duration;
      if (document.hidden || utility.open || !playing || pauseTimer !== null) return;
      pauseDeadline = Date.now() + duration;
      pauseTimer = setTimeout(() => { pauseTimer = null; pauseRemaining = null; advance(); },duration);
    };
    const suspendPlayback = () => {
      finishTyping();
      scene.setActive(false);
      if (pauseTimer !== null) {
        pauseRemaining = Math.max(0,pauseDeadline - Date.now()); clearTimeout(pauseTimer); pauseTimer = null;
      }
    };
    const resumePlayback = () => {
      if (playing && !utility.open && !document.hidden) {
        scene.setActive(true);
        if (runner.current().node?.type === 'pause' && pauseRemaining !== null) schedulePause(pauseRemaining);
      }
    };
    const currentHistoryLine = optionIndex => {
      const { node } = runner.current();
      if (!node || ['pause','signal'].includes(node.type)) return null;
      return {
        speaker:node.type === 'dialogue' ? (story.character_registry || []).find(character => character.id === node.character_id)?.name || node.character || 'Diálogo' : node.type === 'choice' ? 'Escolha' : 'Narração',
        text:node.type === 'variation' ? runtime.resolveVariation(node,runner.state.variables)?.text || '' : node.type === 'choice' ? (node.prompt || '').trim() : node.text || '',
        choice:node.type === 'choice' && Number.isInteger(optionIndex) ? node.options?.[optionIndex]?.text || '' : ''
      };
    };
    const recordHistory = line => {
      if (!line) return;
      transcript.push(line); if (transcript.length > 200) transcript.shift();
    };
    const renderHistory = () => {
      historyList.replaceChildren();
      const current = playing ? currentHistoryLine() : null;
      const lines = [...transcript,...(current ? [current] : [])];
      if (!lines.length) {
        const empty = document.createElement('li'); empty.textContent = 'As falas e escolhas do seu caminho aparecerão aqui.'; historyList.append(empty);
      }
      lines.forEach(line => {
        const row = document.createElement('li');
        const name = document.createElement('strong'); name.textContent = line.speaker;
        row.append(name);
        if (line.text) { const text = document.createElement('p'); text.textContent = line.text; row.append(text); }
        if (line.choice) { const choice = document.createElement('p'); choice.className = 'history-choice'; choice.textContent = `Você escolheu: ${line.choice}`; row.append(choice); }
        historyList.append(row);
      });
      historyList.scrollTop = historyList.scrollHeight;
    };
    const openUtility = view => {
      if (!utility.open) { returnFocus = document.activeElement; suspendPlayback(); }
      byId('history-view').hidden = view !== 'history';
      byId('preferences-view').hidden = view !== 'preferences';
      byId('confirm-view').hidden = view !== 'confirm';
      byId('utility-title').textContent = view === 'history' ? 'Histórico de falas' : view === 'confirm' ? 'Começar nova partida?' : 'Opções de leitura';
      if (view === 'history') renderHistory();
      if (!utility.open) utility.showModal();
      byId('utility-close').focus({preventScroll:true});
    };
    const showMenu = (focus = true) => {
      suspendPlayback(); persistProgress();
      stop(); playing = false; stage.hidden = true; menu.hidden = false;
      byId('history-open').hidden = true; byId('home').hidden = true;
      updateProgressUi();
      if (focus) (savedGame ? byId('resume') : byId('start')).focus({ preventScroll:true });
    };
    const enabledChoices = () => [...choices.querySelectorAll('button:not(:disabled)')];
    const selectChoice = index => {
      const buttons = enabledChoices();
      if (!buttons.length) return;
      selectedChoice = (index + buttons.length) % buttons.length;
      buttons.forEach((button, i) => { button.dataset.active = String(i === selectedChoice); });
      buttons[selectedChoice].focus({ preventScroll:true });
    };
    const choose = (index,expectedNode) => {
      if (!playing || typing || utility.open || document.hidden || runner.current().node !== expectedNode || choiceReadyNode !== expectedNode) return;
      const line = currentHistoryLine(index);
      if (!runner.choose(index)) return;
      recordHistory(line);
      stop(); render();
    };
    const advance = () => {
      if (!playing || utility.open || document.hidden || finishTyping()) return;
      if (runner.current().node?.type === 'choice') {
        enabledChoices()[selectedChoice]?.click(); return;
      }
      const line = currentHistoryLine();
      if (runner.advance()) { recordHistory(line); stop(); render(); }
    };
    const render = (animate = true) => {
      choiceReadyNode = null; scene.setInteractions();
      stop();
      // Signals are integration metadata. They never execute content as code.
      while (runner.current().node?.type === 'signal') runner.advance();
      const { sequence, node, missing } = runner.current();
      persistProgress();
      sceneCharacter = media.resolveSceneCharacter(sequence?.nodes || [],runner.state.index,story.character_registry || []);
      const speed = applyPresentation(media.resolveScene(sequence?.presentation,sequence?.nodes || [],runner.state.index),sceneCharacter,animate && node ? media.sceneMotion(sequence?.presentation,sequence?.nodes || [],runner.state.index) : null);
      if (node?.type === 'pause') {
        choices.replaceChildren(); choices.hidden = true; selectedChoice = 0;
        if (!copy.textContent) { copy.hidden = false; copy.textContent = '…'; }
        hint.textContent = 'Pausa · Enter ou clique para continuar';
        next.hidden = false; next.disabled = false;
        const duration = Math.max(0, Math.min(60000, Number(node.duration_ms) || 0));
        schedulePause(duration);
        return;
      }
      choices.replaceChildren(); choices.hidden = true; selectedChoice = 0;
      speaker.textContent = ''; copy.hidden = false; copy.removeAttribute('aria-hidden');
      card.dataset.narration = String(node?.type === 'narration' || node?.type === 'variation');
      next.hidden = false; next.disabled = false; hint.textContent = '';
      if (!node) {
        stage.dataset.dialogueVisible = 'true';
        speaker.textContent = missing ? 'História indisponível' : 'Fim';
        copy.textContent = missing ? 'Não foi possível encontrar esta parte da história.' : 'Você chegou ao fim deste caminho.';
        next.hidden = true;
        const restart = document.createElement('button'); restart.type = 'button'; restart.textContent = 'Jogar novamente';
        restart.addEventListener('click', requestStart);
        choices.append(restart); choices.hidden = false;
        announce(copy.textContent); stage.focus({ preventScroll:true }); return;
      }
      let text = node.text || '';
      if (node.type === 'dialogue') {
        speaker.textContent = (story.character_registry || []).find(character => character.id === node.character_id)?.name || node.character || '';
        if (node.expression) speaker.textContent += `${speaker.textContent ? ' · ' : ''}${node.expression}`;
      } else if (node.type === 'variation') text = runtime.resolveVariation(node, runner.state.variables)?.text || '';
      if (node.type === 'choice') {
        text = (node.prompt || '').trim(); copy.hidden = !text; next.hidden = true;
        (node.options || []).forEach((option,index) => {
          const button = document.createElement('button'); button.type = 'button';
          button.textContent = `${index + 1}. ${option.text || 'Continuar'}`;
          button.dataset.choiceIndex = String(index);
          button.disabled = !runtime.conditionMatches(option.condition, runner.state.variables);
          if (button.disabled) button.title = 'Esta opção não está disponível neste caminho';
          button.addEventListener('click', () => choose(index,node));
          choices.append(button);
        });
      }
      typeText(text, speed, () => {
        if (node.type === 'choice') {
          choices.hidden = false;
          choiceReadyNode = node;
          scene.setInteractions(node,(node.options || []).map((option,index) => ({id:option.id,text:option.text,enabled:!choices.children[index].disabled})));
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
      stop(); runner.restart(); transcript = []; playing = true;
      menu.hidden = true; stage.hidden = false;
      byId('history-open').hidden = false; byId('home').hidden = false;
      copy.textContent = ''; render();
    }
    function requestStart() {
      if (savedGame && (savedGame.history.length || savedGame.snapshot.eventId !== story.start_event_id || savedGame.snapshot.index > 0)) openUtility('confirm');
      else { if (utility.open) utility.close(); start(); }
    }
    byId('start').addEventListener('click', requestStart);
    byId('restart').addEventListener('click', requestStart);
    byId('resume').addEventListener('click', () => {
      if (!savedGame || !runner.restore(savedGame.snapshot)) return;
      stop(); transcript = savedGame.history.slice(); playing = true;
      menu.hidden = true; stage.hidden = false;
      byId('history-open').hidden = false; byId('home').hidden = false;
      copy.textContent = ''; render(false);
    });
    byId('home').addEventListener('click', () => showMenu());
    byId('history-open').addEventListener('click', () => openUtility('history'));
    byId('preferences-open').addEventListener('click', () => openUtility('preferences'));
    byId('utility-close').addEventListener('click', () => utility.close());
    byId('new-game-cancel').addEventListener('click', () => utility.close());
    byId('new-game-confirm').addEventListener('click', () => { utility.close(); start(); });
    utility.addEventListener('cancel', event => { event.preventDefault(); utility.close(); });
    utility.addEventListener('close', () => {
      resumePlayback();
      if (returnFocus?.isConnected && !returnFocus.hidden && !returnFocus.closest('dialog')) returnFocus.focus({preventScroll:true});
    });
    ['preference-speed','preference-motion','preference-text-size','preference-sound','preference-volume'].forEach(id => byId(id).addEventListener('change', () => {
      preferences = normalizePreferences({speed:byId('preference-speed').value,motion:byId('preference-motion').value,textSize:byId('preference-text-size').value,sound:byId('preference-sound').value,volume:byId('preference-volume').value});
      writeStorage('preferences',preferences); applyPreferences(); updateProgressUi();
    }));
    next.addEventListener('click', advance);
    stage.addEventListener('click', event => {
      if (event.target.closest('button,a')) return;
      if (runner.current().node?.type === 'choice') { finishTyping(); return; }
      advance();
    });
    document.addEventListener('keydown', event => {
      if (utility.open) return;
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
      if (document.hidden) { suspendPlayback(); persistProgress(); }
      else resumePlayback();
    });
    window.addEventListener('pagehide',() => { persistProgress(); scene.setActive(false); });
    reducedMotion.addEventListener('change', () => { applyPreferences(); if (motionReduced()) finishTyping(); });
    document.body.dataset.embedded = String(new URLSearchParams(window.location.search).get('embed') === '1');
    applyPreferences(); loadProgress(); showMenu(false);
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
    .shell{height:100vh;height:100dvh;min-height:0}.topbar{flex-shrink:0;padding-top:max(10px,env(safe-area-inset-top));padding-right:max(16px,env(safe-area-inset-right));padding-left:max(16px,env(safe-area-inset-left))}.topbar button,button,select{touch-action:manipulation}.topbar button{min-height:44px}.menu{min-height:0;overflow-y:auto;place-content:start center;place-content:safe center;gap:16px}.menu p{margin:0}.menu-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}.menu-actions button{min-height:46px}.menu .secondary{border-color:#ffffff30;background:#ffffff09}.menu .save-status{max-width:520px;font-size:12px;line-height:1.5}
    .stage{flex-direction:column;align-items:center!important;justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;padding-bottom:max(20px,env(safe-area-inset-bottom));padding-right:max(16px,env(safe-area-inset-right));padding-left:max(16px,env(safe-area-inset-left))}.card{flex:0 0 auto;margin-block-start:auto}.stage[data-position=top] .card{margin-block:0 auto}.stage[data-position=center] .card{margin-block:auto}.copy{font-size:calc(clamp(17px,2.1vw,23px)*var(--text-scale,1))}.choices button,.next{min-height:44px}.controls{flex-wrap:wrap}.hint{min-width:120px}.next{margin-inline-start:auto}body[data-motion=reduce] *{animation:none!important;scroll-behavior:auto!important}
    .player-dialog{width:min(640px,calc(100vw - 24px));max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);padding:0;border:1px solid #ffffff25;border-radius:14px;color:#edf3f7;background:#101923;box-shadow:0 24px 80px #0009}.player-dialog::backdrop{background:#03070dcc;backdrop-filter:blur(6px)}.utility-layout{display:flex;flex-direction:column;max-height:calc(100dvh - 28px)}.utility-heading{display:flex;align-items:center;gap:16px;padding:14px 18px;border-bottom:1px solid #ffffff15;flex:0 0 auto}.utility-heading h2{min-width:0;flex:1;margin:0;font-size:18px}.utility-heading button,.utility-view button{min-height:44px;padding:8px 14px;border:1px solid #ffffff30;border-radius:7px;color:#edf3f7;background:#ffffff09}.utility-view{min-height:0;overflow:auto;padding:20px;overscroll-behavior:contain}.preference-fields{display:grid;gap:18px}.preference-fields label{display:grid;gap:8px;font-size:13px}.preference-fields select{width:100%;min-height:44px;padding:8px 10px;border:1px solid #ffffff25;border-radius:7px;font:inherit;color:#edf3f7;background:#182536}.utility-view p{color:#a9bacd;font-size:13px;line-height:1.6}.history-list{max-height:60vh;max-height:60dvh;overflow:auto;margin:0;padding:0;list-style:none;overscroll-behavior:contain}.history-list li{padding:14px 0;border-bottom:1px solid #ffffff12}.history-list li:first-child{padding-top:0}.history-list strong{color:#83c6e8;font-size:12px}.history-list p{margin:8px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;color:#dce7ef}.history-list .history-choice{color:#b7dbb9}.confirm-actions{display:flex;flex-wrap:wrap;gap:10px}.confirm-actions button:last-child{border-color:#5aafe5;background:#17608e}
    .history-list p{font-size:calc(15px*var(--text-scale,1))}
    .stage{position:relative;isolation:isolate}.stage>.card{position:relative;z-index:2}
    body[data-embedded=true] .menu{padding:24px 16px}body[data-embedded=true] .eyebrow{display:none}@media(max-width:480px){.topbar{gap:6px}.topbar button{font-size:12px;flex:1}.copy{font-size:calc(18px*var(--text-scale,1))}.stage{padding:14px max(12px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}.utility-view{padding:16px}.menu button{padding-inline:24px}}@media(max-height:500px){.topbar{padding-block:6px}.topbar .title{flex-basis:auto}.menu{padding-block:16px;gap:12px}.menu h1{font-size:28px}.menu p{font-size:12px}.stage{padding-block:12px}.card{padding:16px;gap:10px}}
  `;
  const fingerprint = value => {
    const text = String(value);
    let first = 2166136261, second = 2246822507;
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      first = Math.imul(first ^ code,16777619);
      second = Math.imul(second ^ code,3266489909);
    }
    return (first >>> 0).toString(16).padStart(8,'0') + (second >>> 0).toString(16).padStart(8,'0');
  };
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const buildHtml = story => {
    story = { ...story, persistence:{
      id:fingerprint(JSON.stringify([story.storage_id || [story.title,story.start_event_id],story.locale || 'pt-BR'])),
      revision:fingerprint(JSON.stringify({start:story.start_event_id,variables:story.variable_registry,characters:story.character_registry?.map(character => ({id:character.id,name:character.name})),sequences:(story.sequences || []).map(sequence => ({event_id:sequence.event_id,nodes:(sequence.nodes || []).map(node => {
        if (node.type !== 'variation' || !node.default_version_id) return node;
        const {active_version_id,...readingNode} = node;
        return readingNode;
      })}))}))
    } };
    const json = JSON.stringify(story).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return `<!doctype html>
<html lang="${escape(story.locale || 'pt-BR')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob: file:; media-src 'self' data: blob: file:; base-uri 'none'; form-action 'none'; connect-src 'none'"><title>${escape(story.title)}</title><style>${styles}${root.HeartspaceNarrativeMedia.styles}</style></head>
<body><div class="shell"><header class="topbar"><span class="title">${escape(story.title)}</span><button id="history-open" type="button" hidden>Histórico</button><button id="preferences-open" type="button">Opções</button><button id="home" type="button" hidden>Início</button></header>
<main id="menu" class="menu"><span class="eyebrow">História interativa</span><h1>${escape(story.title)}</h1><p>Leia no seu ritmo e escolha os caminhos da história.</p><div class="menu-actions"><button id="resume" type="button" hidden>Continuar</button><button id="start" class="secondary" type="button">Começar</button></div><p id="progress-status" class="save-status" role="status"></p><p>Enter ou Espaço avança · Setas escolhem · Esc volta ao início</p></main>
<main id="stage" class="stage" tabindex="-1" aria-label="História" hidden><section id="card" class="card"><div id="speaker" class="speaker"></div><div id="copy" class="copy"></div><div id="choices" class="choices" aria-label="Escolhas" hidden></div><footer class="controls"><span id="hint" class="hint"></span><button id="next" class="next" type="button">Continuar</button></footer></section></main></div><div id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<dialog id="utility-dialog" class="player-dialog" aria-labelledby="utility-title"><section class="utility-layout"><header class="utility-heading"><h2 id="utility-title">Opções de leitura</h2><button id="utility-close" type="button">Voltar</button></header>
<section id="history-view" class="utility-view" aria-label="Histórico de falas" hidden><p>Até 200 trechos anteriores e o trecho atual. Consultar o histórico não altera a partida.</p><ol id="history-list" class="history-list"></ol></section>
<section id="preferences-view" class="utility-view" hidden><div class="preference-fields"><label>Velocidade do texto<select id="preference-speed"><option value="story">Definida pela história</option><option value="0">Texto instantâneo</option><option value="12">Rápida</option><option value="24">Normal</option><option value="42">Lenta</option></select></label><label>Movimento<select id="preference-motion"><option value="system">Seguir configuração do sistema</option><option value="reduce">Reduzir movimento</option></select></label><label>Tamanho do texto<select id="preference-text-size"><option value="0.9">Pequeno</option><option value="1">Normal</option><option value="1.15">Grande</option><option value="1.3">Muito grande</option></select></label></div><div class="preference-fields"><label>Som<select id="preference-sound"><option value="on">Ativado</option><option value="off">Silenciado</option></select></label><label>Volume<select id="preference-volume"><option value="0">Sem volume</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option></select></label></div><p id="media-status" role="status"></p><p id="preferences-save-status" role="status"></p><button id="restart" type="button">Nova partida</button></section>
<section id="confirm-view" class="utility-view" hidden><p>Começar novamente substitui o progresso e o histórico desta partida. Suas preferências de leitura serão mantidas.</p><div class="confirm-actions"><button id="new-game-cancel" type="button">Manter partida</button><button id="new-game-confirm" type="button">Começar nova partida</button></div></section></section></dialog>
<script id="story-data" type="application/json">${json}</script>
<script>(()=>{const runtime=(${root.HeartspaceNarrativeRuntime.source})();const media=(${root.HeartspaceNarrativeMedia.sourceCode})();const story=JSON.parse(document.getElementById('story-data').textContent);(${mountNarrativePlayer.toString()})(runtime,story,media);})();</script></body></html>`;
  };
  root.HeartspaceNarrativeHtml = { buildHtml, fingerprint };
})(globalThis);
