// Deliberately small DOM for rule/interaction tests, not an HTML/layout engine.
// No rendering, image decoding, CSS geometry, fullscreen or native animations.
const vm = require('node:vm');
const assert = require('node:assert/strict');
const scriptBlocks = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((match,index) => ({attributes:match[1],source:match[2],index}));
function mountExportedHtml(html, reducedMotion = false, options = {}) {
  const scripts = scriptBlocks(html), elements = new Map(), timers = new Map();
  const storage = options.storage || new Map();
  let nextTimer = 0, now = 1000;
  class TestEvent {
    constructor(type,init = {}) { this.type = type; Object.assign(this,init); this.defaultPrevented = false; }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this.stopped = true; }
  }
  class Target {
    constructor() { this.listeners = new Map(); this.handlers = new Map(); }
    addEventListener(type,callback,capture = false) {
      const list = this.listeners.get(type) || [];
      list.push({callback,capture:capture === true || capture?.capture === true}); this.listeners.set(type,list);
      // Kept for media tests that explicitly deliver a load/error notification.
      this.handlers.set(type,event => this.dispatchEvent(new TestEvent(type,event)));
    }
    removeEventListener(type,callback) { this.listeners.set(type,(this.listeners.get(type) || []).filter(item => item.callback !== callback)); }
    dispatchEvent(event) {
      if (!event.target) event.target = this;
      const parents = []; let parent = this.parentElement;
      while (parent) { parents.push(parent); parent = parent.parentElement; }
      if (this !== document && this !== window) parents.push(document);
      const call = (target,capture) => {
        for (const item of [...(target.listeners.get(event.type) || [])]) {
          if (item.capture === capture) item.callback(event);
          if (event.stopped) break;
        }
      };
      for (const target of parents.slice().reverse()) { call(target,true); if (event.stopped) return !event.defaultPrevented; }
      call(this,true); if (!event.stopped) call(this,false);
      if (event.bubbles) for (const target of parents) { if (event.stopped) break; call(target,false); }
      return !event.defaultPrevented;
    }
  }
  const document = new Target(), window = new Target();
  Object.assign(document,{hidden:false,activeElement:null,defaultView:window,getElementById:id => elements.get(id) || null,createElement:tag => new Element(tag)});
  const dataKey = name => name.slice(5).replace(/-([a-z])/g,(_,char) => char.toUpperCase());
  class Element extends Target {
    constructor(tag = 'div') {
      super(); this.tagName = tag.toUpperCase(); this.localName = tag.toLowerCase(); this.id = ''; this.className = '';
      this.children = []; this.parentElement = null; this.hidden = false; this.disabled = false; this.dataset = {}; this.attributes = {};
      this.value = ''; this.ownerDocument = document; this.paused = true; this.playCalls = 0; this.pauseCalls = 0;
      this.tabIndex = ['button','input','select','textarea','a'].includes(tag) ? 0 : -1; this._text = '';
      const properties = new Map();
      this.style = {setProperty:(key,value) => properties.set(key,String(value)),getPropertyValue:key => properties.get(key) || '',removeProperty:key => properties.delete(key)};
      this.classList = {add:(...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean),...names])].join(' '); },remove:(...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },contains:name => this.className.split(/\s+/).includes(name)};
    }
    get isConnected() { return this === document.documentElement || Boolean(this.parentElement?.isConnected); }
    get firstElementChild() { return this.children[0] || null; }
    get open() { return this.getAttribute('open') !== null; }
    set textContent(text) { this.replaceChildren(); this._text = String(text); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set src(value) { this.setAttribute('src',value); }
    get src() { return this.getAttribute('src') || ''; }
    get clientWidth() { return 0; } // Explicitly unmeasured; never used as geometry evidence.
    get clientHeight() { return 0; }
    getClientRects() { return this.hidden || this.parentElement && !this.parentElement.getClientRects().length ? [] : [{}]; }
    click() { if (!this.disabled) { this.dispatchEvent(new TestEvent('click',{bubbles:true})); this.onclick?.(); } }
    focus() { document.activeElement = this; this.dispatchEvent(new TestEvent('focusin',{bubbles:true})); }
    play() { this.playCalls += 1; if (options.blockAudio) return Promise.reject(new Error('Autoplay blocked')); this.paused = false; return Promise.resolve(); }
    pause() { this.pauseCalls += 1; this.paused = true; }
    load() { this.paused = true; }
    setAttribute(name,value) {
      this.attributes[name] = String(value);
      if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
      if (name === 'id') { this.id = String(value); elements.set(this.id,this); }
      if (name === 'class') this.className = String(value);
      if (name === 'hidden' || name === 'disabled') this[name] = true;
      if (name === 'tabindex') this.tabIndex = Number(value);
    }
    getAttribute(name) { if (name.startsWith('data-')) return this.dataset[dataKey(name)] ?? null; return this.attributes[name] ?? null; }
    removeAttribute(name) { delete this.attributes[name]; if (name.startsWith('data-')) delete this.dataset[dataKey(name)]; if (['hidden','disabled'].includes(name)) this[name] = false; }
    append(...children) { for (const child of children) { child.remove(); child.parentElement = this; this.children.push(child); } }
    prepend(...children) { for (const child of children.slice().reverse()) { child.remove(); child.parentElement = this; this.children.unshift(child); } }
    before(next) { if (this.parentElement) { next.remove(); const siblings = this.parentElement.children; next.parentElement = this.parentElement; siblings.splice(siblings.indexOf(this),0,next); } }
    contains(child) { return this === child || this.children.some(item => item.contains(child)); }
    replaceWith(next) { if (this.parentElement) { const parent = this.parentElement; this.before(next); this.remove(); assert.equal(next.parentElement,parent); } }
    remove() { if (this.parentElement) { const siblings = this.parentElement.children; siblings.splice(siblings.indexOf(this),1); this.parentElement = null; } }
    replaceChildren(...children) { for (const child of this.children) child.parentElement = null; this.children = []; this._text = ''; this.append(...children); }
    matches(selector) {
      return selector.split(',').some(part => {
        let token = part.trim();
        const notDisabled = token.includes(':not(:disabled)'); token = token.replace(':not(:disabled)','');
        if (notDisabled && this.disabled) return false;
        const attribute = token.match(/\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]/);
        if (attribute && (this.getAttribute(attribute[1]) === null || attribute[2] !== undefined && this.getAttribute(attribute[1]) !== attribute[2])) return false;
        token = token.replace(/\[[^\]]+\]/g,'');
        const id = token.match(/#([\w-]+)/), cls = token.match(/\.([\w-]+)/), tag = token.match(/^[\w-]+/);
        return (!id || this.id === id[1]) && (!cls || this.classList.contains(cls[1])) && (!tag || this.localName === tag[0]);
      });
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []),...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  // Parse the application's body structure instead of hard-coding the old menu.
  document.documentElement = new Element('html'); document.body = new Element('body'); document.documentElement.append(document.body);
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1]; assert.ok(body,'Export must contain a body');
  const stack = [document.body], voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const token of body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').matchAll(/<!--[\s\S]*?-->|<\/?([\w-]+)\b([^>]*)>/g)) {
    const tag = token[1]?.toLowerCase(); if (!tag) continue;
    if (token[0].startsWith('</')) { const index = stack.findLastIndex(item => item.localName === tag); if (index > 0) stack.length = index; continue; }
    const element = new Element(tag);
    for (const attr of token[2].matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) element.setAttribute(attr[1],attr[2] ?? attr[3] ?? attr[4] ?? '');
    stack.at(-1).append(element); if (!voidTags.has(tag) && !token[0].endsWith('/>')) stack.push(element);
  }
  document.querySelector = selector => document.documentElement.querySelector(selector);
  document.querySelectorAll = selector => document.documentElement.querySelectorAll(selector);
  document.activeElement = document.body;
  const dataScript = scripts.find(script => /\bid=["']story-data["']/.test(script.attributes)); assert.ok(dataScript,'Missing story data');
  assert.match(dataScript.attributes,/\btype=["']application\/json["']/);
  // Script tags are omitted from the structural tree; install the actual data node.
  const data = new Element('script'); data.setAttribute('id','story-data'); data.textContent = dataScript.source; document.body.append(data);
  const schedule = (callback,delay,interval) => { const id = ++nextTimer; timers.set(id,{callback,delay,interval,due:now + delay}); return id; };
  const frames = new Map();
  const mediaListeners = new Set();
  const reducedQuery = {matches:reducedMotion,addEventListener:(_,callback) => mediaListeners.add(callback),removeEventListener:(_,callback) => mediaListeners.delete(callback)};
  Object.assign(window,{location:{search:options.search || '',protocol:'file:',href:'file:///test/index.html',reload(){}},
    matchMedia:query => query === '(prefers-reduced-motion: reduce)' ? reducedQuery : {matches:false,addEventListener(){},removeEventListener(){}},
    setTimeout:(cb,delay) => schedule(cb,delay,false),setInterval:(cb,delay) => schedule(cb,delay,true),
    clearTimeout:id => timers.delete(id),clearInterval:id => timers.delete(id),
    requestAnimationFrame:callback => { const id = ++nextTimer; frames.set(id,callback); return id; },cancelAnimationFrame:id => frames.delete(id),Event:TestEvent,getComputedStyle:node => ({opacity:node.style.opacity ?? '1'})});
  Object.defineProperty(window,'localStorage',{get() {
    if (options.blockStorageAccess) throw new Error('Storage unavailable');
    return {getItem:key => { if (options.blockStorageRead) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem:(key,value) => { if (options.blockStorageWrite) throw new Error('Quota exceeded'); storage.set(key,value); }};
  }});
  class ClockDate extends Date { static now() { return now; } }
  const context = vm.createContext({document,window,Element,Event:TestEvent,URL:options.missingUrl ? undefined : URL,URLSearchParams,Date:ClockDate,atob,btoa,Uint8Array,
    setTimeout:window.setTimeout,setInterval:window.setInterval,clearTimeout:window.clearTimeout,clearInterval:window.clearInterval});
  // Execute all application scripts in document order, including compatibility bootstrap.
  for (const script of scripts) if (!/\btype=["']application\/json["']/.test(script.attributes)) vm.runInContext(script.source,context,{filename:`export-script-${script.index}.js`});
  if (!options.allowBootFailure) assert.equal(elements.get('player-startup').style.display,'none','Player failed to boot; inspect harness API support or product error');
  const runDue = () => { for (const [id,timer] of [...timers]) if (timers.has(id) && timer.due <= now) { if (!timer.interval) timers.delete(id); else timer.due = now + timer.delay; timer.callback(); } };
  return {elements,timers,frames,storage,document,window,context,
    click:id => { assert.ok(elements.has(id),`Missing control ${id}`); const control = elements.get(id); assert.ok(control.getClientRects().length,`Hidden control ${id}`); assert.ok(!control.disabled,`Disabled control ${id}`); control.click(); },
    key:(key,target = elements.get('stage'),init = {}) => { const event = new TestEvent('keydown',{key,target,bubbles:true,...init}); target.dispatchEvent(event); if (!event.defaultPrevented && ['Enter',' '].includes(key) && target.tagName === 'BUTTON') target.click(); },
    change:(id,value) => { const control = elements.get(id); assert.ok(control.getClientRects().length,`Hidden control ${id}`); assert.ok(!control.disabled,`Disabled control ${id}`); control.value = value; control.dispatchEvent(new TestEvent('change',{bubbles:true})); },
    tick:() => { if (timers.size) { now = Math.min(...[...timers.values()].map(timer => timer.due)); runDue(); } },
    elapse:duration => { const end = now + duration; let limit = 10000; while (timers.size && Math.min(...[...timers.values()].map(timer => timer.due)) <= end) { assert.ok(limit-- > 0,'Timer loop'); now = Math.min(...[...timers.values()].map(timer => timer.due)); runDue(); } now = end; },
    setHidden:hidden => { document.hidden = hidden; document.dispatchEvent(new TestEvent('visibilitychange')); },
    pagehide:() => window.dispatchEvent(new TestEvent('pagehide')),
    setReducedMotion:value => { reducedQuery.matches = value; for (const callback of mediaListeners) callback(); }
  };
}
module.exports = { mountExportedHtml,scriptBlocks };
