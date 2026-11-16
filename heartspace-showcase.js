/* A real Docs story: sequences, choices, scene cues and a collection-owned plan.
   No slideshow runtime, remote assets or executable content in the story. */
(function (root) {
  'use strict';
  const scriptUrl = typeof document === 'object' ? document.currentScript?.src : '';
  let assetLoad = null;
  const loadAssets = () => {
    if (root.HeartspaceShowcaseAssets) return Promise.resolve(root.HeartspaceShowcaseAssets);
    if (assetLoad) return assetLoad;
    assetLoad = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = new URL('heartspace-showcase-assets.js',scriptUrl).href;
      script.onload = () => { script.remove(); if (root.HeartspaceShowcaseAssets) resolve(root.HeartspaceShowcaseAssets); else reject(new Error('As artes da apresentação não ficaram disponíveis.')); };
      script.onerror = () => { script.remove(); reject(new Error('Não foi possível carregar as artes da apresentação. Tente novamente.')); };
      document.head.append(script);
    }).catch(error => { assetLoad = null; throw error; });
    return assetLoad;
  };
  const title = 'HeartSpace · Uma ideia ganha mundo';
  const order = ['opening','planning','canvas','scene','paths','share','future','credits'];
  const copy = {
    opening:{label:'UMA IDEIA GANHA MUNDO',heading:'Antes de virar mundo,\nera uma ideia.',summary:'Planeje o que importa. Dê forma ao que imagina. Convide alguém a viver essa história.',text:'Uma ideia pode começar em uma frase. No HeartSpace, ela pode ganhar planejamento, texto, arte e uma apresentação interativa. Esta apresentação também é uma dessas histórias.'},
    planning:{label:'01 / DOCS',heading:'Lembre o destino.\nDescubra o caminho.',summary:'Um planejamento para o livro inteiro. Espaço para descobrir cada capítulo.',text:'No Docs, começo, meio e fim ficam no planejamento do livro, junto dos marcos, personagens, lugares e regras do mundo. Os capítulos guardam a escrita, e suas folhas aparecem na hierarquia conforme o texto cresce.'},
    canvas:{label:'02 / CANVAS',heading:'Uma imagem.\nMuitas possibilidades.',summary:'Separe as camadas. Construa uma composição. Dê profundidade à sua ideia.',text:'As três camadas visuais desta apresentação foram compostas em documentos Draw e exportadas pelo Canvas. Os PNGs entram na Cena do Docs como imagens independentes: você escolhe posição, escala e profundidade do parallax. As fontes editáveis acompanham o exemplo.'},
    scene:{label:'03 / CENA',heading:'A mesma história.\nUm novo jeito de mostrar.',summary:'Imagens, texto e movimento acompanham os acontecimentos da sequência.',text:'A composição pode mudar quando um bloco avança: elementos aparecem, se deslocam e assumem um novo estado. Neste exemplo, o mundo de papel se aproxima na próxima etapa. O texto continua disponível no perfil e-ink.'},
    paths:{label:'ESCOLHA SEU CAMINHO',heading:'Quem apresenta\ntambém pode ouvir.',summary:'Uma escolha pode abrir outra conversa. Um objeto pode ser uma porta de entrada.',text:'Os botões nesta cena são objetos ligados às mesmas escolhas narrativas da lista. Você pode revisitar o planejamento, a arte ou a composição. O mapa de caminhos do Docs mostra esses ramos e seus destinos.'},
    share:{label:'DA CRIAÇÃO AO ENCONTRO',heading:'Sua apresentação\npode sair daqui.',summary:'Envie um HTML. Leve um ZIP. Compartilhe uma experiência com caminhos.',text:'O Docs exporta esta apresentação como HTML único ou ZIP com as mídias. O player oferece histórico, retomada local, tela cheia e interface limpa. O leitor escolhe texto maior, perfil e-ink e orientação. Um endereço publicado pode ser incorporado em outro site.'},
    future:{label:'A PRÓXIMA CAMADA',heading:'E quando essa ideia\ntambém tiver som?',summary:'O Beats faz parte da direção que queremos construir para o ecossistema.',text:'Beats entra aqui como visão de futuro. Esta apresentação não tem trilha nem efeitos sonoros produzidos nele. Hoje, a demonstração reúne Docs e artes exportadas pelo Canvas; o próximo encontro pode incluir a criação sonora quando esse fluxo estiver pronto.'},
    credits:{label:'FEITO COM HEARTSPACE',heading:'Da primeira ideia\naté esta apresentação.',summary:'Planejamento, texto e apresentação visual no Docs. Artes compostas e exportadas pelo Canvas.',text:'Desde o planejamento e o texto até a apresentação visual, esta experiência usa os recursos do HeartSpace Docs. As artes foram compostas em documentos Draw e exportadas pelo HeartSpace Canvas. Você está vendo o mesmo player que leva uma história interativa até outras pessoas. Agora, imagine a sua.'}
  };
  const build = (assets, namespace = 'heartspace.showcase') => {
    const prefix = String(namespace).replace(/[^a-z0-9_.-]/gi,'').slice(0,90) || 'heartspace.showcase';
    const sid = key => `${prefix}.${key}`;
    const bid = (key,part) => `${sid(key)}.${part}`;
    const text = (id,value,x,y,width,height,size,color = '#f1eddf') => ({id,name:value.split('\n')[0],type:'text',text:value,x,y,width,height,font_size:size,color,align:'left',anchor_x:0,anchor_y:0});
    const image = (id,asset,parallax) => ({id,name:id === 'paper-world' ? 'Mundo de papel · Canvas' : 'Caminhos · Canvas',type:'image',asset,x:50,y:50,width:100,height:100,anchor_x:50,anchor_y:50,parallax_x:parallax,parallax_y:parallax * .5});
    const sequences = order.map((key,index) => {
      const c = copy[key], choiceId = bid(key,'choose');
      let destinations = [];
      if (key === 'opening') destinations = [['guided','Conhecer o fluxo','planning'],['explore','Explorar os caminhos','paths']];
      else if (key === 'paths') destinations = [['continue','Como compartilhar','share'],['docs','Planejamento no Docs','planning'],['art','Arte no Canvas','canvas'],['visual','Composição de cena','scene']];
      else if (key === 'credits') destinations = [['finish','Encerrar a apresentação',''],['explore','Explorar os caminhos','paths'],['restart','Voltar ao começo','opening']];
      else destinations = [['continue',key === 'future' ? 'Ver os créditos' : 'Continuar o percurso',order[index + 1]],['explore','Escolher outro caminho','paths']];
      // The guided path goes from scene to the branch map, then onward to sharing.
      const nodes = [{id:bid(key,'read'),type:'narration',text:c.text},
        ...(key === 'scene' ? [{id:bid(key,'closer'),type:'narration',text:'A arte mudou de posição e escala no mesmo cenário. Esse movimento é uma alteração vinculada a este bloco, com uma animação curta entre o enquadramento anterior e o estado final. Em leitura estática, você vê diretamente o resultado.'}] : []),
        {id:choiceId,type:'choice',prompt:'',options:destinations.map(([id,label,target],i) => ({id:`${choiceId}.${id}`,text:label,target_event:target ? sid(target) : '',canonical:i === 0}))}];
      const elements = [image('paper-world',assets.paperWorld,.65),image('constellation',assets.constellation,1.2),
        text('brand','HEARTSPACE',6.4,5.4,38,4,17,'#bddfce'),
        text('eyebrow',c.label,6.4,16,48,5,17,'#dfaf91'),
        text('headline',c.heading,6.1,22,54,24,key === 'credits' ? 54 : 57),
        text('folio',`${String(index + 1).padStart(2,'0')} / 08     •     UMA IDEIA GANHA MUNDO`,6.4,91,70,4,14,'#a2b9b2')];
      if (key === 'paths') {
        // Real scene buttons: normal narrative options remain available in every profile.
        destinations.filter(([id]) => id !== 'continue').forEach(([id,label],i) => elements.push({id:`route-${id}`,name:label,type:'button',text:label,choice_block_id:choiceId,choice_option_id:`${choiceId}.${id}`,x:65,y:14 + i * 11,width:28,height:9,anchor_x:0,anchor_y:0,font_size:18,color:'#c5e4d4'}));
      }
      const reveal = {block_id:bid(key,'read'),animations:[{element_id:'headline',duration_ms:650,easing:'ease-out',keyframes:[{at:0,y:26,opacity:0}]}]};
      const cues = [reveal];
      if (key === 'scene') cues.push({block_id:bid(key,'closer'),set:[{id:'paper-world',x:45,scale:1.13},{id:'constellation',opacity:.4}],animations:[{element_id:'paper-world',duration_ms:950,easing:'ease-in-out',keyframes:[{at:0,x:50,scale:1}]}]});
      if (key === 'paths') cues.push({block_id:choiceId,settings:{dialogue_visible:false},set:[{id:'paper-world',visible:false},{id:'constellation',opacity:.2}]});
      return {event_id:sid(key),title:({opening:'A ideia',planning:'Planejamento no Docs',canvas:'Arte no Canvas',scene:'Composição em movimento',paths:'Escolha seu caminho',share:'Compartilhar',future:'O que vem depois',credits:'Feito com HeartSpace'})[key],nodes,
        presentation:{model:'panel',position:'bottom',speed:0,scene:'#0b151e',surface:'#142532',text:'#f1eddf',accent:'#b8ddc8',background:assets.backdrop,background_dim:0,transition:'none',parallax_enabled:true,parallax_strength:.7,parallax_smoothing_ms:190,elements,cues}};
    });
    return {format:'heartspace-html-story-v1',version:1,storage_id:prefix,title,locale:'pt-BR',start_event_id:sid('opening'),viewport:{aspect:'16:9',width:1280,height:720},player_settings:{hide_interface:false,profile:'standard',orientation:'auto'},character_registry:[],variable_registry:[],sequences};
  };
  const plan = (story,documentId) => ({version:5,guide:'basic',beginning:'Uma ideia procura uma forma de ser contada. Apresentar o HeartSpace em um percurso curto, com liberdade para explorar.',middle:'Mostrar o planejamento do livro, a arte produzida no Canvas e a composição interativa no Docs. Permitir revisitar os caminhos e depois compartilhar a apresentação.',ending:'Revelar como a apresentação foi construída. Convidar quem assiste a imaginar sua própria história. Identificar o Beats como direção futura.',
    worldEntries:[{id:'creative-space',type:'place',title:'Um mundo de papel',summary:'Noite azul, papel claro, coral e verde suave: uma oficina de ideias.',details:{atmosphere:'Curiosidade, acolhimento e espaço para criar.',features:'Folhas em camadas, uma estrela e caminhos de uma constelação.',tensions:'Transformar uma visão em algo que outras pessoas consigam experimentar.'}},
      {id:'honest-credits',type:'rule',title:'Mostrar o que existe',summary:'Distinguir o fluxo demonstrado de planos futuros.',details:{scope:'Docs e Canvas são usados na construção do exemplo.',limits:'Beats aparece como visão de futuro; não há áudio atribuído a ele.',consequences:'Os créditos mantêm a origem de cada material conferível.'}}],
    milestones:story.sequences.map((sequence,index) => ({id:`beat-${index + 1}`,title:sequence.title,summary:sequence.nodes[0].text,phase:index < 2 ? 'beginning' : index < 6 ? 'middle' : 'ending',links:[{documentId,sequenceId:sequence.event_id,title:sequence.title}],worldLinks:index === 7 ? [{entryId:'honest-credits',title:'Mostrar o que existe'}] : [{entryId:'creative-space',title:'Um mundo de papel'}]}))});
  const notes = () => '<h2>Uma apresentação feita com uma história</h2><p>Este livro contém o roteiro e um planejamento compartilhado. Cada sequência é uma etapa da apresentação; as escolhas ligam os caminhos. Abra Cena para editar as composições ou História → Mapa para acompanhar as conexões.</p><h2>Como apresentar</h2><p>Selecione a sequência “A ideia” e use Testar sequência. O percurso guiado dura aproximadamente três minutos, conforme o ritmo de quem apresenta. O caminho “Explorar” permite visitar os temas em outra ordem. No player, F abre tela cheia e H alterna a interface.</p><h2>Como adaptar</h2><p>Edite textos e escolhas no roteiro. Use as camadas Mundo de papel e Caminhos na Cena para ajustar a composição, os momentos, as animações e o parallax. O formato recomendado para esta peça é 16:9. A cópia usa o formato atual do projeto; mudar Tela do jogo afeta todas as sequências do projeto.</p><h2>Materiais e créditos</h2><p>As imagens foram compostas em documentos Draw e geradas pelos exportadores do Canvas. As fontes e as instruções de reconstrução estão em examples/heartspace/canvas, no pacote-fonte deste exemplo. Nenhuma trilha sonora foi incluída; o Beats é apresentado como direção futura.</p><h2>Compartilhar</h2><p>Use Exportar a partir da sequência “A ideia” para incluir todos os caminhos. HTML único incorpora as imagens; ZIP separa as mídias. O player permite tamanho de texto, orientação e perfil e-ink. A compatibilidade com Kindle ainda precisa ser conferida no aparelho.</p>';
  root.HeartspaceShowcase = {title,build,plan,notes,loadAssets};
})(globalThis);
