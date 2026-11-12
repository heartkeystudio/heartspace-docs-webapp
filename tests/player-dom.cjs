// DOM harness for interaction tests; deliberately does not model layout or browser rendering.
const vm = require('node:vm');
function mountExportedHtml(html, reducedMotion = false, options = {}) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const elements = new Map(), events = new Map(), timers = new Map(), windowEvents = new Map();
  const storage = options.storage || new Map();
  let nextTimer = 0, now = 1000;
  const document = {
    hidden:false, activeElement:null,
    getElementById:id => elements.get(id),
    createElement:tag => new Element(tag),
    addEventListener:(name,callback) => events.set(name,callback)
  };
  class Element {
    constructor(tag = 'div', id = '') {
      this.tagName = tag.toUpperCase(); this.id = id; this.children = []; this.parentElement = null;
      this.hidden = false; this.disabled = false; this.dataset = {}; this.attributes = {};
      this.open = false; this.isConnected = true; this.value = '';
      this.ownerDocument = document; this.paused = true; this.playCalls = 0; this.pauseCalls = 0;
      this.handlers = new Map(); this._text = '';
      const properties = new Map(); this.style = {setProperty:(key,value) => properties.set(key,value),getPropertyValue:key => properties.get(key)};
    }
    set textContent(text) { this._text = String(text); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    addEventListener(name,handler) { this.handlers.set(name,handler); }
    click() { if (!this.disabled) this.handlers.get('click')?.({target:this}); }
    showModal() { this.open = true; }
    close() { if (this.open) { this.open = false; this.handlers.get('close')?.({target:this}); } }
    focus() { document.activeElement = this; }
    play() { this.playCalls += 1; if (options.blockAudio) return Promise.reject(new Error('Autoplay blocked')); this.paused = false; return Promise.resolve(); }
    pause() { this.pauseCalls += 1; this.paused = true; }
    load() { this.paused = true; }
    setAttribute(name,value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; if (name === 'src') this.src = ''; }
    append(...children) { children.forEach(child => { child.parentElement = this; this.children.push(child); }); }
    prepend(child) { child.parentElement = this; this.children.unshift(child); }
    contains(child) { return this === child || this.children.some(item => item.contains(child)); }
    replaceWith(next) {
      if (!this.parentElement) return;
      const siblings = this.parentElement.children; next.parentElement = this.parentElement;
      siblings.splice(siblings.indexOf(this),1,next); this.parentElement = null; this.isConnected = false;
    }
    remove() { if (this.parentElement) { const siblings = this.parentElement.children; siblings.splice(siblings.indexOf(this),1); } this.isConnected = false; }
    replaceChildren() { this.children = []; this._text = ''; }
    closest(selector) {
      if (selector === '#' + this.id) return this;
      if (selector.split(',').some(tag => tag.trim().toUpperCase() === this.tagName)) return this;
      return this.parentElement?.closest(selector) || null;
    }
    querySelectorAll(selector) {
      const children = this.children.flatMap(child => [child,...child.querySelectorAll('button')]);
      return children.filter(child => child.tagName === 'BUTTON' && (!selector.includes(':not(:disabled)') || !child.disabled));
    }
    querySelector(selector) {
      const match = selector.match(/data-choice-index="(\d+)"/);
      return this.querySelectorAll('button').find(child => child.dataset.choiceIndex === match?.[1]) || null;
    }
  }
  for (const match of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"([^>]*)>/g)) {
    const element = new Element(match[1],match[2]); element.hidden = /\bhidden(?:\s|=|$)/.test(match[3]);
    elements.set(match[2],element);
  }
  document.body = new Element('body'); document.activeElement = document.body;
  for (const [parent,child] of [['stage','card'],['card','speaker'],['card','copy'],['card','choices'],['card','next'],['card','hint'],['menu','start'],['menu','resume'],['utility-dialog','history-view'],['history-view','history-list'],['utility-dialog','preferences-view'],['utility-dialog','confirm-view'],['utility-dialog','utility-close'],['preferences-view','restart'],['preferences-view','preference-speed'],['preferences-view','preference-motion'],['preferences-view','preference-text-size'],['preferences-view','preference-sound'],['preferences-view','preference-volume'],['confirm-view','new-game-confirm'],['confirm-view','new-game-cancel']]) elements.get(parent).append(elements.get(child));
  elements.get('story-data').textContent = scripts[0][2];
  const schedule = (callback,delay,interval) => { const id = ++nextTimer; timers.set(id,{callback,delay,interval,due:now + delay}); return id; };
  const mediaListeners = [];
  const media = {matches:reducedMotion,addEventListener:(_,callback) => mediaListeners.push(callback)};
  const window = {matchMedia:() => media,location:{search:options.search || ''},addEventListener:(name,callback) => windowEvents.set(name,callback)};
  Object.defineProperty(window,'localStorage',{ get() {
    if (options.blockStorageAccess) throw new Error('Storage unavailable');
    return { getItem:key => {
      if (options.blockStorageRead) throw new Error('Storage unavailable');
      return storage.get(key) ?? null;
    }, setItem:(key,value) => {
      if (options.blockStorageWrite) throw new Error('Quota exceeded');
      storage.set(key,value);
    } };
  } });
  class ClockDate extends Date { static now() { return now; } }
  const context = vm.createContext({
    document, window, URLSearchParams, Date:ClockDate,atob,btoa,Uint8Array,
    setTimeout:(cb,delay) => schedule(cb,delay,false), setInterval:(cb,delay) => schedule(cb,delay,true),
    clearTimeout:id => timers.delete(id), clearInterval:id => timers.delete(id)
  });
  vm.runInContext(scripts[1][2],context);
  const runDue = () => {
    for (const [id,timer] of [...timers]) if (timers.has(id) && timer.due <= now) {
      if (!timer.interval) timers.delete(id); else timer.due = now + timer.delay;
      timer.callback();
    }
  };
  return {
    elements, timers, storage, document,
    click:id => elements.get(id).click(),
    key:(key,target = elements.get('stage')) => {
      let prevented = false;
      events.get('keydown')({key,target,preventDefault(){prevented = true;}});
      if (!prevented && key === 'Escape' && elements.get('utility-dialog').open) elements.get('utility-dialog').handlers.get('cancel')({preventDefault(){}});
      else if (!prevented && ['Enter',' '].includes(key) && target.tagName === 'BUTTON') target.click();
    },
    change:(id,value) => { const control = elements.get(id); control.value = value; control.handlers.get('change')?.({target:control}); },
    tick:() => { if (timers.size) { now = Math.min(...[...timers.values()].map(timer => timer.due)); runDue(); } },
    elapse:duration => {
      const end = now + duration; let limit = 10000;
      while (timers.size && Math.min(...[...timers.values()].map(timer => timer.due)) <= end && limit-- > 0) {
        now = Math.min(...[...timers.values()].map(timer => timer.due)); runDue();
      }
      now = end;
    },
    setHidden:hidden => { document.hidden = hidden; events.get('visibilitychange')(); },
    pagehide:() => windowEvents.get('pagehide')?.(),
    setReducedMotion:value => { media.matches = value; mediaListeners.forEach(callback => callback()); }
  };
}
module.exports = { mountExportedHtml };
