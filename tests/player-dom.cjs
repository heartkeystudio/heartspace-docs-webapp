// DOM harness for interaction tests; deliberately does not model layout or browser rendering.
const vm = require('node:vm');
function mountExportedHtml(html, reducedMotion = false) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const elements = new Map(), events = new Map(), timers = new Map();
  let nextTimer = 0;
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
      this.handlers = new Map(); this.style = {setProperty(){}}; this._text = '';
    }
    set textContent(text) { this._text = String(text); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    addEventListener(name,handler) { this.handlers.set(name,handler); }
    click() { if (!this.disabled) this.handlers.get('click')?.({target:this}); }
    focus() { document.activeElement = this; }
    setAttribute(name,value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    append(child) { child.parentElement = this; this.children.push(child); }
    replaceChildren() { this.children = []; this._text = ''; }
    closest(selector) {
      if (selector === '#choices' && this.id === 'choices') return this;
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
  for (const id of ['menu','stage','card','speaker','copy','choices','hint','next','announcement','restart','home','start','story-data']) {
    elements.set(id,new Element(['next','restart','home','start'].includes(id) ? 'button' : 'div',id));
  }
  for (const [parent,child] of [['stage','card'],['card','speaker'],['card','copy'],['card','choices'],['card','next'],['card','hint'],['menu','start']]) elements.get(parent).append(elements.get(child));
  elements.get('story-data').textContent = scripts[0][2];
  const schedule = (callback,delay,interval) => { const id = ++nextTimer; timers.set(id,{callback,delay,interval}); return id; };
  const context = vm.createContext({
    document, window:{matchMedia:() => ({matches:reducedMotion,addEventListener(){}})},
    setTimeout:(cb,delay) => schedule(cb,delay,false), setInterval:(cb,delay) => schedule(cb,delay,true),
    clearTimeout:id => timers.delete(id), clearInterval:id => timers.delete(id)
  });
  vm.runInContext(scripts[1][2],context);
  return {
    elements, timers,
    click:id => elements.get(id).click(),
    key:(key,target = elements.get('stage')) => events.get('keydown')({key,target,preventDefault(){}}),
    tick:() => { for (const [id,timer] of [...timers]) if (timers.has(id)) { if (!timer.interval) timers.delete(id); timer.callback(); } },
    setHidden:hidden => { document.hidden = hidden; events.get('visibilitychange')(); }
  };
}
module.exports = { mountExportedHtml };
