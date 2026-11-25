/* Private Docs history utility. No persistent schema or transport contract. */
(function(root){
  'use strict';
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const equal=(a,b)=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;if(Array.isArray(a))return a.length===b.length&&a.every((v,i)=>equal(v,b[i]));const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>own(b,k)&&equal(a[k],b[k]));};
  const own=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
  const keyFor=(a,b)=>['id','block_id','element_id'].find(k=>[a,b].every(list=>list.every(x=>x&&typeof x==='object'&&typeof x[k]==='string')&&new Set(list.map(x=>x[k])).size===list.length));
  function diff(before,after,path=[],out=[]){
    if(equal(before,after))return out;
    if(Array.isArray(before)&&Array.isArray(after)){
      const key=keyFor(before,after);
      if(key){
        const ids=[...new Set([...before,...after].map(x=>x[key]))];
        for(const id of ids)diff(before.find(x=>x[key]===id),after.find(x=>x[key]===id),[...path,{key,id}],out);
        const a=before.map(x=>x[key]),b=after.map(x=>x[key]);
        if(!equal(a,b))out.push({path,order:key,before:a,after:b});
        return out;
      }
    }
    if(before&&after&&!Array.isArray(before)&&!Array.isArray(after)&&typeof before==='object'&&typeof after==='object'&&!['asset','project_ref','background','music'].includes(path.at(-1))){
      for(const k of new Set([...Object.keys(before),...Object.keys(after)]))diff(before[k],after[k],[...path,k],out);
    }else out.push({path,before:clone(before),after:clone(after),beforeExists:before!==undefined,afterExists:after!==undefined});
    return out;
  }
  function locate(root,path){let parent=null,key=null,value=root;for(const step of path){parent=value;key=typeof step==='object'?Array.isArray(parent)?parent.findIndex(x=>x?.[step.key]===step.id):-1:step;value=parent?.[key];}return {parent,key,value};}
  function apply(current,changes,redo=false){
    const from=redo?'before':'after',to=redo?'after':'before';
    // Validate everything before touching even the disposable clone.
    for(const change of changes){const {value}=locate(current,change.path);if(change.order){if(!Array.isArray(value)||!equal(value.map(x=>x[change.order]),change[from]))return null;}else if(!equal(value,change[from])|| (value!==undefined)!==change[from+'Exists'])return null;}
    let result=clone(current);
    for(const change of changes.filter(c=>!c.order)){
      const {parent,key}=locate(result,change.path),value=clone(change[to]),last=change.path.at(-1);
      if(!change.path.length){result=value;continue;}
      if(!parent)return null;
      if(typeof last==='object'){
        if(!Array.isArray(parent))return null;
        if(!change[to+'Exists']){if(key>=0)parent.splice(key,1);}else if(key<0)parent.push(value);else parent[key]=value;
      }else if(change[to+'Exists'])parent[key]=value;else delete parent[key];
    }
    for(const change of changes.filter(c=>c.order)){
      const {value}=locate(result,change.path);if(!Array.isArray(value))return null;
      const ids=change[to];if(value.length!==ids.length)return null;
      const ordered=ids.map(id=>value.find(x=>x[change.order]===id));if(ordered.some(x=>!x))return null;
      value.splice(0,value.length,...ordered);
    }
    return result;
  }
  root.HeartspaceDocsHistoryPatch=Object.freeze({clone,equal,diff,apply});
})(globalThis);
