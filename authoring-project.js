/* Native authoring data. Storage, authentication and editor projections are adapters. */
(function (root) {
  'use strict';
  const FORMAT = 'heartspace.docs.authoring';
  const SCHEMA_VERSION = 1;
  const CACHE_VERSION = 3;
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const string = value => typeof value === 'string' ? value : '';
  const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
  const data = value => object(value) ? clone(value) : {};
  const list = value => Array.isArray(value) ? clone(value) : [];
  const fail = message => { throw new Error(`Projeto Docs: ${message}`); };
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const id = value => string(value).trim();
  const newId = () => `docs-project-${root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

  function createProject(value = {}) {
    return {id:id(value.id) || newId(), name:string(value.name) || 'Projeto local'};
  }

  function registry(value) {
    return {characters:list(value?.characters), variables:list(value?.variables), glossary:list(value?.glossary), sceneSettings:data(value?.sceneSettings || value?.scene_settings)};
  }

  function validateMarginNotes(value) {
    if (value === undefined) return; // Sources written before margin notes remain valid.
    const colors=['amber','blue','rose','sage'], ids=new Set(), finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
    if (!Array.isArray(value) || value.length>200) fail('notas de margem inválidas.');
    for (const note of value) {
      if (!object(note)||!id(note.id)||note.id.length>100||ids.has(note.id)||typeof note.text!=='string'||note.text.length>4000||!colors.includes(note.color)||typeof note.resolved!=='boolean'||!['left','right'].includes(note.side)||!finite(note.offset,0,4000)||!finite(note.y,0,1000000)||typeof note.updatedAt!=='string') fail('nota de margem inválida.');
      ids.add(note.id);const a=note.anchor;
      if (a!==null && (!object(a)||typeof a.quote!=='string'||!a.quote||a.quote.length>800||typeof a.prefix!=='string'||a.prefix.length>40||typeof a.suffix!=='string'||a.suffix.length>40||!Number.isSafeInteger(a.start)||a.start<0||(a.textVersion!==undefined&&(typeof a.textVersion!=='string'||a.textVersion.length>40)))) fail('vínculo de nota inválido.');
    }
  }

  function validateBookStyle(value) {
    if (value == null) return;
    if (!object(value) || value.schema_version !== 1) fail('versão dos estilos do livro incompatível.');
    const ranges={fontSize:[12,28],lineHeight:[1,2.5],paragraphSpace:[0,40],firstIndent:[0,4],headingSize:[18,64],openingSpace:[0,200],numberSize:[10,32],numberGap:[0,120],textGap:[0,200]};
    for (const [key,[min,max]] of Object.entries(ranges)) if (value[key] !== undefined && (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key]<min || value[key]>max)) fail('medida do estilo do livro inválida.');
    const enums={font:['serif','classic','sans'],headingFont:['serif','classic','sans'],align:['left','justify'],headingAlign:['left','center','right'],language:['pt-BR','pt-PT','en','es','fr','de'],numberFormat:['label','arabic','roman']};
    for (const [key,values] of Object.entries(enums)) if (value[key] !== undefined && !values.includes(value[key])) fail('opção do estilo do livro inválida.');
    for (const key of ['enabled','skipFirstIndent','hyphenate','smallCaps']) if (value[key] !== undefined && typeof value[key] !== 'boolean') fail('opção do estilo do livro inválida.');
    if (value.numberLabel !== undefined && (typeof value.numberLabel !== 'string' || value.numberLabel.length>40)) fail('nome da numeração inválido.');
    const edition=value.edition;
    if(edition!=null){
      if(!object(edition)||edition.schema_version!==1)fail('composição do livro incompatível.');
      for(const [key,[min,max]] of Object.entries({inner:[24,160],outer:[24,160],top:[32,160],bottom:[32,160],startNumber:[1,99999],frontStart:[1,99999]}))if(edition[key]!==undefined&&(!Number.isInteger(edition[key])||edition[key]<min||edition[key]>max))fail('medida da composição inválida.');
      for(const [key,values] of Object.entries({paper:['a4','a5','letter'],orientation:['portrait','landscape'],numberPosition:['outer','center'],headers:['none','book-chapter','chapter','custom'],footnoteNumbering:['book','section']}))if(edition[key]!==undefined&&!values.includes(edition[key]))fail('opção da composição inválida.');
      for(const key of ['mirrored','pageNumbers','frontRoman','hideOpening','contents','illustrations'])if(edition[key]!==undefined&&typeof edition[key]!=='boolean')fail('opção da composição inválida.');
      for(const key of ['leftHeader','rightHeader'])if(edition[key]!==undefined&&(typeof edition[key]!=='string'||edition[key].length>160))fail('cabeçalho da composição inválido.');
    }
  }
  function validateChapterHeading(value) {
    if (value == null) return;
    if (!object(value) || value.schema_version !== 1 || typeof value.enabled !== 'boolean' || value.alignment != null && !['left','center','right','justify'].includes(value.alignment) || !['auto','custom','none'].includes(value.numbering) || !Number.isInteger(value.number) || value.number<1 || value.number>9999) fail('abertura do capítulo inválida.');
  }
  function validateBookSection(value){
    if(value==null)return;
    if(!object(value)||value.schema_version!==1||!['cover','title','credits','dedication','epigraph','preface','part','prologue','chapter','epilogue','appendix'].includes(value.role)||!['next','recto','verso'].includes(value.start)||!['auto','arabic','roman','none'].includes(value.numbering)||typeof value.include!=='boolean'||typeof value.showHeading!=='boolean')fail('função editorial da seção inválida.');
  }

  // This is a format/relationship check, not an HTML sanitizer or an authorization check.
  function validate(source) {
    if (!object(source) || source.format !== FORMAT) fail('formato autoral não reconhecido.');
    if (source.schema_version !== SCHEMA_VERSION) fail('versão autoral incompatível; o conteúdo existente deve ser preservado.');
    if (!object(source.project) || !id(source.project.id) || typeof source.project.name !== 'string') fail('identidade do projeto inválida.');
    if (!Array.isArray(source.books) || !Array.isArray(source.documents) || !object(source.resources)) fail('estrutura autoral incompleta.');
    const books = new Map(), documents = new Set();
    for (const book of source.books) {
      if (!object(book) || !id(book.id) || books.has(book.id) || typeof book.name !== 'string' || !['book','board'].includes(book.kind)) fail('livro/prancheta inválido ou com ID repetido.');
      if (!object(book.planning) || !Array.isArray(book.preservedChapterPlans) || !Array.isArray(book.migratedChapterIds)) fail('planejamento de livro inválido.');
      if (typeof book.updatedAt !== 'string' || book.migratedChapterIds.some(value => !id(value)) || book.preservedChapterPlans.some(value => !object(value) || !id(value.documentId) || typeof value.title !== 'string' || !object(value.plan))) fail('fontes preservadas do planejamento inválidas.');
      validateBookStyle(book.bookStyle);
      books.set(book.id, book);
    }
    for (const document of source.documents) {
      if (!object(document) || !id(document.id) || documents.has(document.id)) fail('documento inválido ou com ID repetido.');
      documents.add(document.id);
      if (!['chapter','section','document','note'].includes(document.kind)) fail('tipo de documento inválido.');
      if (document.bookId !== null && (!id(document.bookId) || !books.has(document.bookId))) fail('o agrupador de um documento não existe.');
      const book = books.get(document.bookId);
      if ((book && document.kind !== (book.kind === 'book' ? 'chapter' : 'section')) || (!book && !['document','note'].includes(document.kind))) fail('tipo de documento incompatível com seu agrupador.');
      if (typeof document.title !== 'string' || typeof document.subtitle !== 'string' || !object(document.content) || document.content.format !== 'heartspace-html-v1' || typeof document.content.body !== 'string') fail('conteúdo de documento inválido.');
      if (!object(document.narrative) || !Array.isArray(document.narrative.sequences) || !object(document.page) || !object(document.appearance) || !object(document.editorial) || !object(document.typography) || !object(document.legacyPlanning)) fail('metadados de documento incompletos.');
      if (!['book','canvas'].includes(document.page.layout)) fail('layout de documento inválido.');
      if (!['a4','letter','a5'].includes(document.page.size) || !['portrait','landscape'].includes(document.page.orientation) || !['narrow','normal','wide'].includes(document.page.margin)) fail('configuração de página inválida.');
      if (![document.typography.titleAlign,document.typography.subtitleAlign].every(value => ['left','center','right','justify'].includes(value))) fail('alinhamento de documento inválido.');
      if (document.typography.introSpacing != null && (typeof document.typography.introSpacing !== 'number' || !Number.isFinite(document.typography.introSpacing) || document.typography.introSpacing < 0 || document.typography.introSpacing > 200)) fail('distância até o texto inválida.');
      validateBookStyle(document.typography.bookStyle); validateChapterHeading(document.typography.chapterHeading);
      validateMarginNotes(document.editorial.marginNotes);
      validateBookSection(document.editorial.bookSection);
      if (!['draft','production','final'].includes(document.editorial.status) || !Array.isArray(document.editorial.tags) || document.editorial.tags.some(value => typeof value !== 'string') || typeof document.editorial.notebook !== 'boolean') fail('estado editorial inválido.');
      if (![document.editorial.archivedAt,document.editorial.trashedAt,document.editorial.trashedBy,document.updatedAt].every(value => typeof value === 'string') || !Number.isFinite(document.order)) fail('metadados editoriais inválidos.');
      if (!['prose','script'].includes(document.narrative.readingProfile) || typeof document.narrative.entrySequenceId !== 'string' || !object(document.narrative.localization)) fail('configuração narrativa inválida.');
      const sequences = new Set();
      for (const sequence of document.narrative.sequences) {
        if (!object(sequence) || !id(sequence.id) || sequences.has(sequence.id) || typeof sequence.title !== 'string' || !object(sequence.presentation)) fail('sequência inválida ou com ID repetido no documento.');
        sequences.add(sequence.id);
      }
    }
    for (const key of ['characters','variables','glossary']) if (!Array.isArray(source.resources[key])) fail('recursos do projeto inválidos.');
    if (!object(source.resources.sceneSettings)) fail('configuração de cena inválida.');
    return source;
  }

  function fromEditor(state) {
    const folders = new Map();
    for (const folder of state.libraryFolders || []) {
      if (!object(folder) || !id(folder.id) || folders.has(folder.id)) fail('agrupador inválido ou repetido no editor.');
      folders.set(folder.id, folder);
    }
    // Old cloud records may be the only surviving copy of a collection.
    for (const record of state.documents || []) {
      if (!id(record.folderId) || folders.has(record.folderId)) continue;
      const candidates = state.documents.filter(item => item.folderId === record.folderId && item.collection?.id === record.folderId);
      candidates.sort((a,b) => (Date.parse(b.collection.updatedAt) || 0) - (Date.parse(a.collection.updatedAt) || 0));
      folders.set(record.folderId, candidates[0]?.collection || {id:record.folderId, name:record.folderName || 'Livro', layout:record.layout});
    }
    const books = [...folders.values()].map(folder => ({
      id:folder.id, name:string(folder.name) || 'Livro', kind:folder.layout === 'canvas' ? 'board' : 'book',bookStyle:folder.bookStyle == null ? null : data(folder.bookStyle),
      planning:data(folder.storyPlanning), preservedChapterPlans:list(folder.legacyPlans).map(value => ({documentId:string(value?.documentId),title:string(value?.title) || 'Capítulo',plan:data(value?.plan)})), migratedChapterIds:list(folder.migratedDocuments), updatedAt:string(folder.updatedAt)
    }));
    const documents = (state.documents || []).map(record => {
      const book = folders.get(record.folderId);
      return {
        id:record.id, bookId:book?.id || null,
        kind:book ? (book.layout === 'canvas' ? 'section' : 'chapter') : record.isNotebook ? 'note' : 'document',
        title:string(record.title), subtitle:string(record.subtitle),
        content:{format:'heartspace-html-v1', body:string(record.body)},
        // Preserved for migration/recovery; shared planning belongs to books[].planning.
        legacyPlanning:data(record.storyPlanning),
        narrative:{entrySequenceId:string(record.narrativeEventId), sequences:list(record.narrativeSequences).map((sequence,index) => ({id:string(sequence?.id || sequence?.event_id),title:string(sequence?.title) || `Sequência ${index + 1}`,presentation:data(sequence?.presentation || sequence?.preview || sequence?.player)})), readingProfile:['script','game'].includes(record.narrativeProfile) ? 'script' : 'prose', localization:data(record.localization)},
        page:{layout:record.layout === 'canvas' ? 'canvas' : 'book', size:string(record.paperSize) || 'a4', orientation:string(record.pageOrientation) || 'portrait', margin:string(record.pageMargin) || 'normal'},
        typography:{bookStyle:record.bookStyle == null ? null : data(record.bookStyle),chapterHeading:record.chapterHeading == null ? null : data(record.chapterHeading),introSpacing:record.introSpacing ?? null,titleAlign:string(record.titleAlign) || 'left', subtitleAlign:string(record.subtitleAlign) || 'left'},
        appearance:{ambience:data(record.ambience)},
        editorial:{bookSection:record.bookSection==null?null:data(record.bookSection),marginNotes:list(record.marginNotes),status:string(record.status) || 'draft', tags:list(record.tags), notebook:record.isNotebook === true, archivedAt:string(record.archivedAt), trashedAt:string(record.trashedAt), trashedBy:string(record.trashedBy)},
        order:Number.isFinite(record.sortOrder) ? record.sortOrder : 0, updatedAt:string(record.savedAt)
      };
    });
    return validate({format:FORMAT, schema_version:SCHEMA_VERSION, project:createProject(state.project), books, documents, resources:registry(state.registry)});
  }

  function toEditor(value) {
    const source = clone(validate(value));
    const libraryFolders = source.books.map(book => ({id:book.id, name:book.name, layout:book.kind === 'board' ? 'canvas' : 'book', bookStyle:book.bookStyle ?? null, updatedAt:book.updatedAt, storyPlanning:book.planning, legacyPlans:book.preservedChapterPlans, migratedDocuments:book.migratedChapterIds}));
    const folders = new Map(libraryFolders.map(folder => [folder.id, folder]));
    const documents = source.documents.map(document => ({
      id:document.id, folderId:document.bookId || '', folderName:folders.get(document.bookId)?.name || '', collection:null,
      bookSection:document.editorial.bookSection??null,isNotebook:document.editorial.notebook === true || document.kind === 'note', title:document.title, subtitle:document.subtitle, body:document.content.body,
      storyPlanning:document.legacyPlanning, narrativeEventId:document.narrative.entrySequenceId, narrativeSequences:document.narrative.sequences,
      narrativeProfile:document.narrative.readingProfile, localization:document.narrative.localization,
      layout:document.page.layout, paperSize:document.page.size, pageOrientation:document.page.orientation, pageMargin:document.page.margin,
      bookStyle:document.typography.bookStyle ?? null, chapterHeading:document.typography.chapterHeading ?? null, introSpacing:document.typography.introSpacing ?? null, titleAlign:document.typography.titleAlign, subtitleAlign:document.typography.subtitleAlign, ambience:document.appearance.ambience,
      marginNotes:list(document.editorial.marginNotes), status:document.editorial.status, tags:document.editorial.tags, archivedAt:document.editorial.archivedAt, trashedAt:document.editorial.trashedAt, trashedBy:document.editorial.trashedBy,
      sortOrder:document.order, savedAt:document.updatedAt
    }));
    return {project:source.project, documents, libraryFolders, registry:source.resources};
  }

  const syncFields = ['remoteId','projectId','remoteUpdatedAt','remoteConflict','remoteVersion','lastEditor','lastEditedAt','dirty','editRevision','remoteCreateId','syncAttempt','remoteMissing','syncError'];
  function cacheFromEditor(state) {
    const source = fromEditor(state);
    return {
      version:CACHE_VERSION, source,
      workspace:{
        activeDocumentId:string(state.activeDocumentId), selectedCollectionId:string(state.selectedCollectionId),
        books:(state.libraryFolders || []).map(folder => ({id:folder.id, expanded:folder.expanded !== false})),
        documents:(state.documents || []).map(record => ({id:record.id, favorite:record.favorite === true, activeNarrativeSequenceId:string(record.activeNarrativeSequenceId), sync:Object.fromEntries(syncFields.filter(key => own(record,key)).map(key => [key,clone(record[key])]))})),
        registrySettingsDirty:state.registrySettingsDirty === true,
        sync:clone(state.syncWorkspace || {schema_version:1,registry:{},recovery:[]})
      }
    };
  }

  function readCache(value, context = {}) {
    if (value == null) return null;
    if (!object(value)) fail('armazenamento local inválido.');
    if (value.version === CACHE_VERSION) {
      const state = toEditor(value.source);
      if (!object(value.workspace) || !Array.isArray(value.workspace.documents) || !Array.isArray(value.workspace.books)) fail('estado local incompleto.');
      if (value.workspace.sync && value.workspace.sync.schema_version !== 1) fail('estado de sincronização de versão desconhecida.');
      const documents = new Map(value.workspace.documents.map(item => [item.id,item]));
      const books = new Map(value.workspace.books.map(item => [item.id,item]));
      state.documents.forEach(record => {
        const local = documents.get(record.id);
        if (local) {
          for (const key of syncFields) if (object(local.sync) && own(local.sync,key)) record[key] = clone(local.sync[key]);
          record.favorite = local.favorite === true;
          record.activeNarrativeSequenceId = string(local.activeNarrativeSequenceId);
        }
      });
      state.libraryFolders.forEach(folder => { folder.expanded = books.get(folder.id)?.expanded !== false; });
      state.activeDocumentId = string(value.workspace.activeDocumentId);
      state.selectedCollectionId = string(value.workspace.selectedCollectionId);
      state.registrySettingsDirty = value.workspace.registrySettingsDirty === true;
      state.syncWorkspace = clone(value.workspace.sync || {schema_version:1,registry:{dirty:state.registrySettingsDirty || Object.values(state.registry).some(value => Array.isArray(value) ? value.length > 0 : Object.keys(value || {}).length > 0)},recovery:[]});
      return state;
    }
    if (value.version !== undefined && value.version !== 1 && value.version !== 2) fail('versão de armazenamento incompatível; os dados não serão substituídos.');
    let documents;
    if (value.version === 2 && Array.isArray(value.documents)) documents = clone(value.documents);
    else if (typeof value.title === 'string' && typeof value.body === 'string') documents = [{id:`document-${newId()}`, title:value.title.replace(/<[^>]*>/g, '').trim() || 'Sem título', subtitle:string(value.subtitle), body:value.body, savedAt:string(value.savedAt)}];
    else fail('armazenamento antigo não reconhecido.');
    if (documents.some(record => !object(record) || !id(record.id) || typeof record.body !== 'string')) fail('documento antigo inválido; os dados não serão substituídos.');
    if (value.libraryFolders !== undefined && !Array.isArray(value.libraryFolders)) fail('agrupadores antigos inválidos; os dados não serão substituídos.');
    const state = {project:createProject(context.project), documents, libraryFolders:list(value.libraryFolders), registry:registry(context.registry), registrySettingsDirty:context.registrySettingsDirty === true, activeDocumentId:string(value.activeDocumentId) || documents[0]?.id || '', selectedCollectionId:''};
    state.syncWorkspace = {schema_version:1,registry:{dirty:state.registrySettingsDirty || Object.values(state.registry).some(value => Array.isArray(value) ? value.length > 0 : Object.keys(value || {}).length > 0)},recovery:[]};
    // Validate before the caller writes a migrated copy. Never silently discard documents.
    fromEditor(state);
    return state;
  }

  function serialize(source) { return JSON.stringify(validate(source), null, 2); }
  function parse(text) { return clone(validate(JSON.parse(text))); }
  const api = Object.freeze({FORMAT, SCHEMA_VERSION, CACHE_VERSION, createProject, validate, fromEditor, toEditor, cacheFromEditor, readCache, serialize, parse});
  root.HeartspaceDocsAuthoring = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
