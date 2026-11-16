/* Publication is a separate, reviewed operation; never publish a live DOM draft. */
(function(root){
  'use strict';
  const el=(tag,text)=>Object.assign(document.createElement(tag),text===undefined?{}:{textContent:text});
  const button=(text,run)=>{const b=el('button',text);b.type='button';b.addEventListener('click',run);return b;};
  function mount(o){
    const dialog=el('dialog');dialog.className='docs-publication-dialog';dialog.setAttribute('aria-labelledby','docs-publication-title');
    const header=el('header'),heading=el('h2','Publicar no HeartSpace');heading.id='docs-publication-title';header.append(heading,button('Fechar',()=>dialog.close()));
    const message=el('p');message.setAttribute('role','status');
    const form=el('div'),controls=el('div'),preview=el('section');preview.className='docs-publication-preview';preview.setAttribute('aria-label','Página preparada para publicação');
    dialog.append(header,message,form,controls,preview);document.body.append(dialog);
    let context=null,model=null,prepared=null,pending=null,busy=false,serial=0,imagesPending=0;const urls=new Set();
    const valid=()=>dialog.open&&context&&context.key===o.context()?.key;
    const assert=()=>{if(!valid())throw new Error('A conta ou o projeto mudou. Abra a publicação novamente.');};
    const scopeKey=()=>`heartspace-docs-publication:${context.storeKey}`;
    const clearImages=()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();};
    const field=(label,node)=>{const row=el('label');row.append(el('span',label),node);form.append(row);return node;};
    const input=(label,value,max)=>{const node=el('input');node.value=value||'';node.maxLength=max;return field(label,node);};
    const option=(select,value,label)=>{const item=el('option',label);item.value=value;select.append(item);};
    const request=(action,extra={},blob=false)=>{assert();return o.request({...extra,action,project_id:context.projectId,document_id:context.documentId},blob).then(result=>{assert();return result;});};
    async function protect(value){assert();await o.storage.publicationWrite(scopeKey(),value,pending?.operation_id || null);assert();pending=value;}
    async function run(action){if(busy)return;busy=true;dialog.setAttribute('aria-busy','true');controls.querySelectorAll('button').forEach(b=>b.disabled=true);form.querySelectorAll('input,select').forEach(n=>n.disabled=true);
      try{await action();}catch(error){if(valid())message.textContent=error.message||'Não foi possível preparar a publicação.';}finally{busy=false;dialog.removeAttribute('aria-busy');if(valid())renderActions();}}
    function renderSnapshot(snapshot,revisionId){
      clearImages();preview.replaceChildren();const token=++serial,loads=new Map(),lanes=Array(4).fill(Promise.resolve());let lane=0;imagesPending=0;
      const schedule=work=>{const n=lane++%4;const task=lanes[n].catch(()=>{}).then(work);lanes[n]=task;return task;};
      for(const block of snapshot.blocks){
        if(block.type==='image'){
          const asset=snapshot.assets.find(a=>a.id===block.asset);if(!asset)continue;
          imagesPending++;const image=el('img');image.alt=block.alt||'';const figure=el('figure'),status=el('figcaption','Carregando imagem…');figure.append(image,status);preview.append(figure);
          if(!loads.has(asset.id))loads.set(asset.id,schedule(()=>request('get_docs_publication_preview_asset',{revision_id:revisionId,asset_id:asset.id},true).then(async blob=>{
            if(blob.size!==asset.bytes||blob.type!==asset.mime)throw new Error('Imagem incompleta.');
            const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');
            if(actual!==asset.id)throw new Error('Imagem inválida.');assert();if(token!==serial)throw new Error('Prévia encerrada.');
            const url=URL.createObjectURL(blob);urls.add(url);return url;
          })));
          loads.get(asset.id).then(async url=>{if(valid()&&token===serial){image.src=url;await image.decode();if(valid()&&token===serial){status.remove();imagesPending--;renderActions();}}}).catch(()=>{if(valid()&&token===serial){image.remove();status.textContent='Imagem indisponível. Prepare a página novamente antes de publicar.';prepared=null;renderActions();}});continue;
        }
        const tag=block.type==='heading'?'h'+block.level:({'paragraph':'p','list-item':'p',quote:'blockquote',code:'pre'})[block.type];if(tag)preview.append(el(tag,block.type==='list-item'?'• '+block.text:block.text));
      }
      if(snapshot.omissions.length){const omitted=el('aside','Esta página de leitura não inclui: '+snapshot.omissions.map(x=>`${x.kind} (${x.count})`).join(', ')+'. Para distribuir o jogo interativo, use a exportação de Cena.');preview.prepend(omitted);}
    }
    let revisionSelect,pageSelect,title,slug,summary,visibility;
    function renderForm(){
      form.replaceChildren();clearImages();preview.replaceChildren();prepared=null;
      revisionSelect=field('Revisão do documento',el('select'));
      model.revisions.forEach(r=>option(revisionSelect,r.id,`Versão ${r.revision_number} · ${r.approved_at?'aprovada':'aguarda aprovação'}`));
      pageSelect=field('Página de destino',el('select'));option(pageSelect,'','Criar página');model.publications.forEach(p=>option(pageSelect,p.id,`${p.title} · ${p.status}`));
      title=input('Título público',model.document.title,160);slug=input('Endereço curto',slugify(model.document.title),160);summary=input('Resumo','',500);
      visibility=field('Visibilidade',el('select'));option(visibility,'unlisted','Não listada (acesso pelo link)');option(visibility,'public','Pública');
      pageSelect.addEventListener('change',()=>{const page=model.publications.find(p=>p.id===pageSelect.value);title.value=page?.title||model.document.title;slug.value=page?.slug||slugify(model.document.title);summary.value=page?.summary||'';visibility.value=page?.visibility||'unlisted';});
      form.oninput=invalidate;
      form.onchange=invalidate;
    }
    function invalidate(){prepared=null;++serial;clearImages();preview.replaceChildren();renderActions();form.oninput=invalidate;}
    function slugify(value){return String(value||'pagina').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,160).replace(/-$/,'')||'pagina';}
    function renderActions(){
      controls.replaceChildren();form.querySelectorAll('input,select').forEach(n=>n.disabled=busy||Boolean(pending));
      if(!model)return;
      if(pending){
        message.textContent='Há um pedido confirmado neste dispositivo. Retome o mesmo pedido para consultar ou concluir o envio.';
        const details=el('p',`${pending.title} · revisão ${pending.source.revision_number} · ${pending.visibility==='public'?'pública':'não listada'}`);controls.append(details,button('Retomar publicação',()=>run(()=>send(pending))),button('Encerrar pedido',()=>run(async()=>{
          message.textContent='Confira a página no HeartSpace antes de fazer outro pedido: um envio sem confirmação pode já ter sido aceito.';await protect(null);prepared=null;
        })));return;
      }
      const prepare=button('Preparar página',()=>run(async()=>{
        const id=revisionSelect.value;if(!id)throw new Error('Salve o documento no projeto para criar uma revisão.');
        if(!title.value.trim()||!slug.value.trim())throw new Error('Preencha o título e o endereço curto.');
        if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value.trim()))throw new Error('Use letras minúsculas, números e hífens no endereço curto.');
        const result=await request('prepare_docs_publication',{revision_id:id});
        prepared=result;renderSnapshot(result.snapshot,id);message.textContent=result.approved_at?'Confira a página abaixo. Publicar disponibiliza apenas esta revisão.':'Confira a página abaixo antes de aprovar esta revisão.';
      }));controls.append(prepare);
      if(prepared&&!imagesPending&&!prepared.approved_at&&model.can_approve)controls.append(button('Aprovar esta revisão',()=>run(async()=>{
        const id=prepared.source.revision_id;const result=await o.approve(id);assert();if(result?.success!==true)throw new Error('A revisão não pôde ser aprovada. Confira seu acesso.');
        prepared=await request('prepare_docs_publication',{revision_id:id});renderSnapshot(prepared.snapshot,id);message.textContent='Revisão aprovada. A publicação ainda precisa ser confirmada.';
      })));
      if(prepared?.approved_at&&!imagesPending)controls.append(button('Publicar esta revisão',()=>run(async()=>{
        const page=model.publications.find(p=>p.id===pageSelect.value);
        const operation={action:'publish_docs_revision',project_id:context.projectId,studio_id:model.studio_id,document_id:context.documentId,
          operation_id:crypto.randomUUID(),source:prepared.source,prepared_digest:prepared.prepared_digest,title:title.value.trim(),slug:slug.value.trim(),summary:summary.value.trim(),visibility:visibility.value,source_url:page?.source_url||'',
          ...(page?{publication_id:page.id,expected_current_revision_id:page.current_revision_id,expected_updated_at:page.updated_at}:{})};
        await protect(operation);await send(operation);
      })));
      controls.querySelectorAll('button').forEach(b=>b.disabled=busy);
    }
    async function send(operation){
      const result=await request('publish_docs_revision',operation);await protect(null);prepared=null;preview.replaceChildren();
      try{model=await request('docs_publication_context');renderForm();}catch(_){assert();form.replaceChildren();model=null;controls.replaceChildren();}
      message.replaceChildren(el('span','Publicação confirmada. '));
      if(typeof result.public_url==='string'&&/^https:\/\//i.test(result.public_url)){const link=el('a','Abrir página pública');link.href=result.public_url;link.target='_blank';link.rel='noopener noreferrer';message.append(link);}
    }
    async function open(){
      if(dialog.open){dialog.focus();return;}context=o.context();model=null;pending=null;dialog.showModal();form.replaceChildren();controls.replaceChildren();preview.replaceChildren();
      if(!context){message.textContent=o.unavailable();return;}
      await run(async()=>{await o.flush();assert();model=await request('docs_publication_context');const saved=await o.storage.read(scopeKey());assert();pending=saved?.current?.cache||null;
        if(pending&&(pending.project_id!==context.projectId||pending.document_id!==context.documentId||!pending.operation_id))throw new Error('O pedido pendente pertence a outro documento. Abra o documento original para retomá-lo.');
        renderForm();message.textContent=context.dirty?'Há alterações locais. A página usará a revisão escolhida abaixo; seu rascunho não é publicado automaticamente.':'Escolha uma revisão e confira a página antes de publicar.';
      });
    }
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
    header.querySelector('button').addEventListener('click',event=>{if(busy){event.stopImmediatePropagation();}},true);
    dialog.addEventListener('close',()=>{++serial;clearImages();prepared=null;});
    o.button.addEventListener('click',()=>{document.querySelector('#actions-menu')?.removeAttribute('open');void open();});
    return Object.freeze({close(){if(dialog.open)dialog.close();}});
  }
  root.HeartspaceDocsPublication=Object.freeze({mount});
})(globalThis);
