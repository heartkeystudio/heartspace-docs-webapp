# Exportação de história HTML

## Uso

Abra a área **História** ou **Cena** e clique em **Exportar** na barra superior.
Escolha nome, sequência inicial, idioma e formato. **HTML único** inclui as
mídias no próprio arquivo. **Pacote ZIP** separa `index.html` e a pasta `assets`.
O mesmo diálogo mantém a opção de baixar o JSON do documento atual.

O arquivo abre diretamente no navegador, sem servidor, conexão ou conta do Docs.
Pode ser enviado a outra pessoa ou servido como uma página HTML em hospedagem
que aceite JavaScript. Sinais externos não executam código; sua presença gera
um aviso na exportação.

A escolha da sequência inicial determina o pacote: todas as opções de escolhas
são seguidas para reunir as sequências alcançáveis, inclusive em outros documentos
carregados no projeto. Ciclos são permitidos; IDs duplicados e destinos ausentes
impedem a exportação. Documentos não conectados ficam fora do arquivo.

O pacote contém os blocos narrativos dessas sequências. Texto comum do documento,
controles de produção, dados da conta, credenciais e documentos completos não são
incluídos. A configuração da aba **Cena** acompanha cada sequência. Quando uma
tradução estiver ausente, usa-se o trecho original e o diálogo informa a quantidade
de fallbacks; traduções desatualizadas também geram aviso.

## Fatias

1. **História jogável — implementada.** Nome e sequência inicial, seleção de idioma,
   diálogos, narração, personagens, escolhas, variáveis, condições, efeitos,
   variações, pausas, modelos de apresentação e reinício. Um único HTML sem assets
   externos. Movimento reduzido do sistema já é respeitado.
2. **Compartilhamento — implementada.** Continuar de onde parou, histórico de
   falas e escolhas, preferências persistentes de velocidade, tamanho do texto e
   movimento. Painéis suspendem a reprodução; pausas retomam o tempo restante.
   Layout com rolagem interna, áreas seguras e alvos de toque de pelo menos 44 px.
   Código de incorporação disponível no diálogo de exportação e modo `?embed=1`,
   sem capturar foco ao carregar em outra página.
3. **Cena visual — implementada.** Fundo por sequência, retrato por personagem,
   encaixe, foco e escurecimento do fundo, posição e tamanho do retrato,
   transições simples e música/ambiente em loop. HTML único com mídia embutida ou
   ZIP com imagens e áudio em arquivos separados, deduplicados. A amostra, o
   simulador do Docs e o HTML usam a mesma camada visual.

Godot vem depois dessa sequência.

## Motor e apresentação

- `narrative-runtime.js`: motor sem DOM, rede ou execução de strings. Estados,
  condições, efeitos, resolução de versões, avanço, escolha, restauração,
  reinício e descoberta dos caminhos conectados.
- `narrative-html.js`: apresentador e geração do HTML independente. Embute o
  motor da aplicação e JSON escapado; insere os textos com `textContent`.
- `narrative-media.js`: validação dos arquivos, normalização da apresentação e
  camada visual/áudio compartilhada. Só aceita mídia embutida validada ou os
  caminhos gerados dentro de `assets/`, sem URLs externas.
- `narrative-package.js`: empacotamento ZIP sem dependências, com CRC32,
  deduplicação e reescrita dos caminhos. Não inclui arquivos de fora da história.
- `index.html`: seleção, validação e montagem dos dados do jogo. O simulador
  existente usa o mesmo motor e mantém suas ferramentas de inspeção e histórico.

No HTML: Enter/Espaço/clique revelam ou avançam; setas e números escolhem;
Escape volta ao início. Pausas podem ser puladas. Sinais são ignorados. O final
oferece reinício. Uma escolha sem opções disponíveis apresenta uma mensagem e
permite recomeçar. **Continuar** recupera o progresso salvo. **Nova partida** pede
confirmação antes de substituir uma partida em andamento. As preferências são
mantidas ao recomeçar.

## Progresso e histórico

O player salva a posição e as variáveis a cada transição, com o histórico dos
últimos 200 trechos concluídos. Uma fala em animação retoma do começo dessa fala.
Consultar o histórico é somente leitura: não reaplica efeitos nem retrocede a
história. A fala atual também pode ser consultada, sem duplicar os registros.

Cada exportação do Docs recebe uma identidade estável da história; o idioma
separa os slots de salvamento. Na mesma origem de armazenamento, alterar o nome,
o design, os fundos e os retratos mantém o progresso. Alterar o conteúdo
narrativo, os nomes/IDs dos personagens ou o registro de
variáveis invalida saves anteriores, com mensagem ao leitor. Alternar a aba de
edição de uma variação com versão padrão não invalida o save.

O salvamento usa o armazenamento local do navegador. O progresso não acompanha o
HTML quando o arquivo é enviado a outra pessoa e não sincroniza entre aparelhos.
Se o armazenamento estiver bloqueado ou sem espaço, o jogador é avisado e ainda
pode continuar na aba atual. Saves corrompidos ou incompatíveis são ignorados sem
sobrescrever o registro até que uma nova partida seja iniciada. O motor valida
sequência, posição, variáveis e tipos antes de restaurar qualquer estado.

As opções de leitura ficam em um registro separado do progresso. O padrão usa a
velocidade definida na aba Cena e respeita movimento reduzido do sistema; o
leitor pode escolher texto instantâneo, outra velocidade, fonte maior e redução
de movimento. Histórico e opções abrem em um painel com foco contido pelo
`dialog`, sem permitir que os atalhos avancem a história ao fundo.

## Artes e ambiente

Na aba **Cena**, expanda **Artes e ambiente** para adicionar um fundo, escolher
o encaixe e foco da imagem, escurecimento, tamanho/posição do retrato e transição.
Também é possível adicionar uma faixa de música ou ambiente para tocar em loop
durante a sequência. Sem faixa configurada na próxima sequência, o áudio para.
A amostra estática não toca áudio; use **Testar sequência** para ouvir.

Na aba **Personagens**, expanda **Adicionar retrato** ou **Retrato e posição**.
Escolha a imagem e a posição padrão. Use **Salvar personagens** para sincronizar
o registro com o projeto. A posição da aba Cena pode substituir a posição
padrão do personagem apenas naquela sequência. A imagem acompanha o personagem
que está falando, fica atrás do painel de texto e some em narrações e escolhas.
Ela não altera o texto nem a paginação do documento. Retratos por expressão e
integração direta com Canvas ficam para evoluções posteriores.

Formatos aceitos: PNG, JPEG e WebP (até 4 MB por imagem); MP3, OGG, WAV, WebM e
M4A (até 8 MB por áudio). O formato é conferido pelo conteúdo do arquivo. O
suporte à reprodução de cada codec depende do navegador; uma falha de imagem
ou áudio é informada e não impede a leitura. O navegador pode exigir uma ação
do leitor para iniciar o som. Em **Opções**, o leitor controla som e volume;
essas preferências são salvas. Música pausa ao abrir ferramentas, voltar ao
início ou ocultar a aba. As transições respeitam movimento reduzido.

As mídias ficam na apresentação da sequência e no registro de personagens,
preservados no cache e no conteúdo sincronizado. Arquivos grandes podem exceder
o armazenamento local do editor; use mídias menores e acompanhe o estado de
salvamento. Se um retrato exceder o cache, o editor avisa para salvá-lo no projeto
ou usar uma versão menor.

## Pacote ZIP

Selecione **Pacote ZIP** e clique em **Baixar ZIP**. Extraia **todos** os arquivos
antes de abrir `index.html`. Para publicar, envie o HTML e `assets` juntos,
preservando os caminhos. O pacote inclui `LEIA-ME.txt` com essas orientações.
Imagens ou áudios repetidos são incluídos uma única vez. Nomes dos arquivos são
gerados pelo exportador, sem usar caminhos fornecidos pelo usuário. O limite do
pacote é 100 MB e 1000 arquivos. O ZIP usa o método store: não comprime novamente
mídias que já costumam vir comprimidas.

O HTML único permanece disponível para enviar uma história inteira em um só
arquivo. Ele usa mídia embutida; o ZIP usa caminhos locais em `assets/`. Os dois
formatos compartilham a mesma identidade e revisão de jogo, embora permissões e
particionamento do armazenamento do navegador possam separar arquivos locais e
endereços hospedados.

## Incorporar em outro site

Abra **Como incorporar em outro site** no diálogo de exportação. Hospede o HTML
e ajuste o `src` do código fornecido, por exemplo:

```html
<iframe src="./minha_historia.html?embed=1"
        title="Minha história" width="100%" height="720"
        loading="lazy" style="border:0"></iframe>
```

O parâmetro `embed=1` compacta a introdução. A altura é definida pelo site que
incorpora; o conteúdo tem rolagem própria em telas baixas e em celular na
horizontal. O carregamento inicial não altera o foco da página que hospeda o
jogo. A plataforma precisa permitir JavaScript no iframe. Restrições de
armazenamento de terceiros ou um sandbox com origem opaca podem impedir a
persistência: o player mostra o aviso e continua funcionando na sessão. Não há
comunicação com a página hospedeira nem dependências de rede.

Para o ZIP, o código de incorporação fornecido aponta para `index.html?embed=1`.
Preserve a pasta `assets` junto desse HTML.

A CSP do arquivo impede conexões externas. A exportação não usa `eval`, não
carrega scripts remotos e não transforma textos, expressões ou sinais em código.

## Verificação

Execute `node --test tests/narrative-html.test.cjs tests/narrative-media.test.cjs` para verificar o motor,
descoberta de caminhos, efeitos, restauração, prioridade das variações,
serialização segura, adaptação de idiomas e controles do player em um DOM
simulado. A suíte também cobre recarga com save, preferência persistente,
histórico, confirmação de reinício, saves inválidos, fim de jogo, restrição de
armazenamento, isolamento entre histórias/idiomas e suspensão de timers.
Esse harness não mede layout nem substitui a conferência visual.
Os testes de mídia cobrem validação de formatos, arquivos rejeitados, retrato,
posições, movimento reduzido, pausa/mute/volume, falhas de reprodução, saves
compatíveis com alterações visuais, ZIP, caminhos e deduplicação. O ZIP também
foi aberto com o leitor independente `zipfile` do Python para verificar os CRCs
e os arquivos referenciados.

Após mudanças no script inline do editor, atualize a política desktop com
`python3 scripts/generate_desktop_csp.py`.
