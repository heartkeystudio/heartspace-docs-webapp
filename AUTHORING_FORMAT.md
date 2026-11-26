# Docs — formato autoral e entidades

## Estado do formato

Implementado em `authoring-project.js`, integrado à persistência do editor web e
à entrada desktop. O formato é `heartspace.docs.authoring`, com schemas autorais
1 e 2. O schema 1 continua sendo escrito quando não há recursos exclusivos de
v2.
O envelope interno de trabalho é `version: 3`. A fatia 2 acrescenta arquivos
portáteis `.hdocs`, cópias de trabalho em IndexedDB e recuperação entre sessões.
Um ponteiro pequeno `version: 4` em localStorage indica esse armazenamento;
ele não é uma nova versão do conteúdo autoral.

A fatia 3 acrescenta `project_ref` opcional em mídias, imagens do documento e
texturas, com identidade/caminho, revisão quando disponível e SHA-256 da cópia
fixada. A fonte continua v1. Ver `PROJECT_ASSETS.md` para seleção local,
consumo de catálogos, atualização explícita e distribuição portátil.

A fatia 4 acrescenta fila recuperável, versão esperada, recibos de envio e
comparação/recuperação para documentos e recursos narrativos. A integração
remota exige o contrato SQL v2; ver `SYNC_REVISIONS.md`. Esse estado permanece
em `workspace.sync`, fora da fonte e dos arquivos portáteis normais.

A interface oferece novo projeto local, abrir, salvar, salvar como e recuperar.
O pacote inclui as mídias necessárias para reabrir a fonte. O acesso nativo a
pastas pelo Core, os adaptadores de livros/mídias e a publicação continuam nas
etapas seguintes. Detalhes de uso e formato em
[LOCAL_PROJECT_FILES.md](LOCAL_PROJECT_FILES.md).

## Direção de produto

- O modo local oferece a criação prática completa sem conta ou Hub obrigatório.
- A nuvem acrescenta sincronização, colaboração e serviços. Cotas comerciais
  permanecem indefinidas; esta fatia não implementa franquias nem pagamentos.
- O mesmo modelo autoral atende um projeto independente e um projeto HeartSpace.
- Exportar um jogo, salvar a fonte editável e publicar uma revisão são operações
  distintas. HTML de apresentação e JSON de runtime não substituem a fonte.
- Serviços de transporte, credenciais e autorização não pertencem ao conteúdo.

## Entidades e propriedade

| Entidade | Identidade e responsabilidade |
| --- | --- |
| Projeto | `project.id`; agrupa a área autoral do Docs e seus recursos compartilhados |
| Livro/prancheta | `books[].id`; `kind: book` ou `board`; existe mesmo vazio e possui seu planejamento |
| Capítulo/seção | `documents[].id`; vínculo opcional `bookId`; é conteúdo editável, não uma folha |
| Documento/anotação avulsa | O mesmo documento, com `bookId: null` e `kind: document` ou `note` |
| Folha | Projeção calculada pela paginação; não é entidade autoral, arquivo ou documento separado |
| Sequência/bloco/linha traduzível | Conserva os IDs semânticos atuais dentro do documento |

Documentos em livro têm `kind: chapter`; em prancheta, `kind: section`. Mover um
documento altera o vínculo e seu papel, preservando sua identidade e conteúdo.
Layout de página continua sendo uma configuração do documento.

`books[].planning` é o planejamento compartilhado. `preservedChapterPlans` e
`migratedChapterIds` preservam a migração anterior dos planos de capítulos.
`documents[].legacyPlanning` conserva o dado antigo para recuperação; não é um
segundo planejamento compartilhado. A adaptação existente de planejamento
continua qualificando links com documento e sequência.

## Fonte autoral v1

O objeto possui:

- `format`, `schema_version` e `project: {id, name}`;
- `books`: identidade, nome, tipo, planejamento e fontes antigas preservadas;
- `documents`: identidade, agrupador, papel, título, subtítulo, conteúdo,
  narrativa, traduções, aparência, tipografia, página, estado editorial e ordem;
- `resources`: personagens, variáveis, glossário e configurações globais de cena.

`documents[].content` mantém `format: heartspace-html-v1` e o HTML semântico já
utilizado pelo editor. Não há uma segunda cópia de texto para mapa, leitura,
tradução ou cena. `narrative.sequences` conserva as apresentações e os IDs das
sequências; as traduções ficam em `narrative.localization`.

A paginação por linhas é uma projeção do editor: fragmentos visuais de um
parágrafo são reunidos antes de salvar ou exportar. Envoltórios de folha,
marcadores `data-book-fragment`/`data-book-continuation` e ajustes temporários de
altura não pertencem ao HTML autoral. Um parágrafo que ocupa várias folhas
continua sendo um único parágrafo na fonte, inclusive para as traduções.

A composição do livro usa `books[].bookStyle.edition` (ou
`documents[].typography.bookStyle.edition` em avulsos) e a função editorial
opcional `documents[].editorial.bookSection`. A função é metadado do documento:
não altera seu ID nem seu tipo autoral `chapter`/`section`. Páginas numeradas,
cabeçalhos, margens espelhadas e páginas em branco calculadas são projeções, não
novos documentos. Os contratos, opções e limites estão em `BOOK_COMPOSITION.md`.
Essas adições opcionais mantêm a fonte v1 e não requerem migração SQL.

`documents[].typography.introSpacing` é opcional: `null` ou ausente preserva o
espaçamento padrão; um número de 0 a 200 define a distância, em pixels sem zoom,
entre o cabeçalho (título/subtítulo) e o primeiro bloco do texto. O controle fica
em **Configurações da página → Distância até o texto**, aplica durante a edição
e recalcula a paginação. O espaço superior do primeiro bloco é removido apenas
quando esse ajuste está ativo, para não somar duas margens ao valor escolhido.
O campo acompanha `.hdocs`, cache, cópias e modelos; no transporte remoto usa
`content.page.intro_spacing`, e no Markdown, `intro_spacing` nos metadados.
A adição mantém a fonte v1 e não requer migração SQL.

Exemplo de projeto com um livro vazio e independente:

```json
{
  "format": "heartspace.docs.authoring",
  "schema_version": 1,
  "project": {"id": "docs-project-exemplo", "name": "Minha aventura"},
  "books": [{
    "id": "book-exemplo",
    "name": "Primeiro livro",
    "kind": "book",
    "planning": {},
    "preservedChapterPlans": [],
    "migratedChapterIds": [],
    "updatedAt": ""
  }],
  "documents": [],
  "resources": {
    "characters": [],
    "variables": [],
    "glossary": [],
    "sceneSettings": {}
  }
}
```

## Grupos persistentes — fonte autoral v2 opt-in

O primeiro grupo persistente altera o schema da fonte `.hdocs` de 1 para 2.
Documentos sem grupos continuam em v1. A composição que entra em v2 recebe
`presentation.layer_groups_version: 1`, `presentation.groups` e
`elements[].group_id`. Cada grupo contém `id`, `name`, `parent_id` e a lista
ordenada `element_ids`; grupos podem ser aninhados. O marcador por apresentação
permanece após desagrupar o último grupo, portanto salvar de novo não faz
downgrade automático.

A estrutura de grupos é autoral: fixa entre momentos e separada de `cues[].set`.
Ela não altera a ordem de desenho (`elements` e `cues[].order`), identidades dos
elementos, recursos, vínculos de escolha, transformações ou animações. Validadores
rejeitam grupos malformados, ciclos, membros duplicados e metadados de grupo em
uma fonte v1. Adaptadores, cache, recuperação e arquivos portáteis preservam a
versão e a hierarquia. A primeira criação de grupo avisa que versões anteriores
sem suporte a v2 não abrirão esse arquivo; a antiga versão consolidada
0.1.0-internal.3 foi verificada com uma fonte v2 e a rejeitou sem instalá-la ou
substituir o projeto aberto.

Na exportação, os grupos e seus marcadores são removidos; as entidades visuais
seguem planas na ordem anterior e cada momento é resolvido normalmente. Grupos
não chegam ao runtime como objetos programáveis.

O transporte remoto atual ainda não declara suporte ao schema autoral v2. Para
evitar que consumidores antigos descartem a hierarquia, a sincronização de um
documento que usa grupos fica bloqueada localmente e o trabalho permanece
marcado como pendente até que o contrato e os consumidores remotos sejam
atualizados. A fonte pode ser salva e recuperada localmente em `.hdocs`; a
liberação de sync remoto exige decisão transversal do Heartspace Master. Não há
migração em massa nem mudança de contrato remoto nesta entrega.

A API `fromEditor` constrói a fonte por campos explícitos; `toEditor` restaura a
projeção atual. `serialize` e `parse` atendem o JSON autoral. A validação verifica
versão, identidades únicas, relações e estrutura básica. Ela **não** higieniza
HTML nem decide autorização. As correções de segurança identificadas na análise
pré-QA continuam necessárias.

## Identidade autoral e vínculo remoto

O primeiro envio para a nuvem não substitui mais `record.id` pelo ID da linha do
banco. O adaptador mantém `remoteId` separadamente e envia
`content.authoring: {schema_version: 1, document_id: record.id}` no contrato remoto
atual. A leitura remota usa essa identidade, preservando a identidade conhecida
da cópia local durante atualizações e restaurações de versões antigas.

Documentos remotos antigos sem esse metadado conservam seu ID anterior. Não há
renumeração em massa de projetos, capítulos, sequências, blocos ou traduções.
Novas referências entre documentos e novas exportações usam o ID autoral;
referências e CSVs antigos com `remoteId` continuam sendo reconhecidos pelo editor.

O metadado remoto é aditivo, sem migração SQL nesta fatia. Clientes antigos ainda
podem ignorá-lo; o beta deve atualizar seus clientes em conjunto. Não há garantia
de identidade estável ao alternar com uma versão antiga do editor.

## Estado local separado da fonte

O envelope interno `version: 3` contém:

```text
source:    objeto autoral v1
workspace: seleção, expansão da árvore, favoritos, sequência selecionada,
           vínculos remotos, revisões conhecidas, pendências e conflitos
```

Uma coleção é escrita uma única vez em `source.books`, inclusive vazia. Não há
snapshot do livro em cada documento da fonte autoral. Os recursos narrativos
entram no mesmo envelope, em vez de novas gravações separadas de personagens,
variáveis e formato de cena.

Sessões, tokens, permissões e preferências de zoom não entram na fonte. Os dados
de sincronização do envelope não concedem autorização e não devem ser incluídos
no futuro arquivo autoral exportado.

## Migração e recuperação

1. Ler e validar o armazenamento anterior antes de alterar a biblioteca.
2. Aceitar a biblioteca v2 e o antigo registro único de título/corpo.
3. Recuperar livros presentes apenas nos snapshots de documentos antigos.
4. Incorporar os registros narrativos e o formato de cena das chaves antigas.
5. Preservar o valor original no registro de migração da recuperação e, quando
   houver espaço, em `<chave>:before-authoring-v1`. As chaves antigas de recursos
   também não são apagadas.
6. Gravar o envelope em uma transação IndexedDB e atualizar o ponteiro em
   localStorage somente após a confirmação. Se IndexedDB for negado, tentar uma
   cópia pequena em localStorage, com aviso de recuperação reduzida.

Falha ao criar a cópia ou gravar o envelope mantém o armazenamento anterior.
Formato desconhecido, versão futura, ID duplicado ou agrupador inválido não
autorizam descartar documentos. A leitura rejeita a estrutura; o editor informa
o erro e bloqueia a substituição desse armazenamento.

A cópia de migração exige espaço adicional no navegador. As cópias em IndexedDB
e os arquivos `.hdocs` foram implementados na fatia 2. Limpar os dados do site
ainda pode apagar a recuperação; o arquivo salvo fora do navegador é o backup
portátil. Recuperação não equivale a colaboração ou resolução entre abas.

## Fronteiras ainda abertas

- A sincronização remota continua usando os registros legados e snapshots de
  coleção por documento. Livros vazios já são independentes na fonte/cache, mas
  ainda não são entidades independentes no servidor.
- O arquivo `.hdocs` materializa as mídias referenciadas numa tabela deduplicada.
  O editor ainda utiliza mídias incorporadas e IndexedDB internamente. A fatia 3
  consome mídias compatíveis de catálogos públicos e arquivos selecionados;
  ligação automática ao Hub e extração dos caches do transporte remoto ficam pendentes.
- A estrutura física entre apps e o catálogo de assets exigem contratos comuns;
  este módulo não inventa uma nova árvore Canvas/Beats nem modifica fontes deles.
- Revisões colaborativas, fila durável, resolução de conflitos e publicação
  usam esse modelo. A fila e a reconciliação de documentos/recursos foram
  implementadas na fatia 4; publicação e adaptação remota de livros continuam
  pendentes. As falhas pré-QA ainda precisam de validação funcional.

## Validação de A5 e v2

Em 2026-11-25, fixtures descartáveis validaram os adaptadores v1/v2, cache,
abertura/salvamento/reabertura de `.hdocs`, agrupamento, aninhamento, duplicação,
remoção, undo/redo e a projeção de todos os momentos na exportação. Foram
executados 26 casos de compatibilidade autoral, 59 cenários no editor, e as
baterias de narrativa/runtime, histórico, herança e transações. Todos os casos
executados passaram. A matriz utiliza eventos sintéticos para a entrada do
seletor de arquivo; não certifica o seletor nativo, IME ou tecnologias
assistivas.

A versão consolidada 0.1.0-internal.3 foi aberta como artefato histórico e
rejeitou uma fonte sintética com `schema_version: 2`, preservando a área já
aberta. Essa constatação refere-se à versão/tag existente; ela não foi alterada.
Não foram usados documentos de produção nem feitas migrações em massa. Os
consumidores remotos não foram atualizados; a sincronização de fontes com grupos
permanece bloqueada até decisão e contrato compatível.

## Integração de livros (fatia 5A)

O adaptador remoto agora persiste livros/pranchetas em entidade própria, inclusive
vazios. `source.books` permanece a fonte autoral; `workspace.sync.books` v1 guarda
CAS, fila, conflitos e remoções pendentes. O `.hdocs` normal não inclui esse estado
privado. Detalhes: `BOOK_SYNC.md`; aplicação SQL pendente: `MIGRATION_ROLLOUT.md`.

## Mídias no transporte (fatia 5B)

O esquema autoral não muda: objetos de mídia locais conservam os bytes. Somente
`attempt.wireContent` usa `storage_ref`/manifesto v1 para a gravação na nuvem;
leituras materializam e verificam esses bytes antes do editor. `transportVersion`
identifica o codec da fila e mantém as repetições do pedido final estáveis.
Detalhes e limites em `MEDIA_TRANSPORT.md`.

## Publicação (fatia 5C)

O snapshot público v2 é uma projeção estática de uma revisão conferida/aprovada,
com imagens distribuíveis próprias. Não substitui `.hdocs`, a fonte colaborativa
ou a exportação interativa. Não contém referências privadas de autoria. Contrato
e limites: `PUBLICATION_TRANSPORT.md`.

## Notas autorais na margem

`documents[].editorial.marginNotes` é um campo opcional aditivo do esquema 1.
Fontes anteriores sem esse campo equivalem a uma lista vazia. Cada nota contém
ID, texto, cor, estado resolvido, margem, afastamento, altura, data e uma ligação
opcional por citação/contexto. O transporte de edição usa `authoring_notes` v1.
As notas pertencem à fonte, não ao HTML de leitura ou ao runtime exportado.
Ver `MARGIN_NOTES.md` para formato, uso e limites da ligação ao texto.

## Estilos compartilhados e abertura de capítulos

A fatia 1 do projeto gráfico acrescenta os campos opcionais `books[].bookStyle`,
`documents[].typography.bookStyle` (avulso) e
`documents[].typography.chapterHeading`. O estilo pertence ao livro e a abertura
pertence ao capítulo. Número automático é calculado pela ordem, sem alterar o
texto do título. Fonte v1 e contratos de sincronização atuais são mantidos.
Detalhes de uso, precedência, transporte e etapas seguintes em
[BOOK_TYPOGRAPHY.md](BOOK_TYPOGRAPHY.md).


## Controles de autoria — fonte v3 opt-in

A primeira persistência de visibilidade ou bloqueio próprios de Camadas evolui a fonte `.hdocs` para schema 3. A apresentação afetada recebe `authoring_controls_version: 1`; elementos e grupos podem registrar `authoring_visible` e `locked`. A ausência desses campos significa visível e desbloqueado. A marca de versão é preservada após desfazer, remoção dos controles ou exclusão de grupos/documentos, sem downgrade automático. Documentos v1 e v2 que não usam esses controles permanecem nos formatos originais.

`authoring_visible` é uma máscara exclusiva de autoria, combinada com os grupos ancestrais sem substituir as preferências locais dos descendentes. Ela é separada de `elements[].visible`, que continua representando a visibilidade narrativa existente. `locked` impede edição e transformação no editor; não altera reprodução, interações, condições ou efeitos. A exportação narrativa remove esses metadados e mantém elementos planos, sua visibilidade narrativa, vínculos e ordem.

Versões anteriores que não reconhecem schema 3 rejeitam o documento antes de instalá-lo ou gravá-lo. A sincronização remota continua bloqueada para schemas 2, 3 e 4 até confirmação de suporte dos consumidores remotos; gravação local permanece distinta de sincronização.

## Primitivas geométricas — fonte v4 opt-in

A primeira criação persistente de retângulo, elipse, linha ou seta marca a fonte autoral como schema 4, após confirmação explícita. A cena que utiliza as primitivas guarda `scene_primitives_version: 1`; as formas permanecem elementos editáveis com identidade e transformações comuns. Retângulos e elipses persistem preenchimento, contorno e espessura. Linhas e setas persistem os extremos locais, contorno e espessura. A ausência de primitivas não remove o marcador de uma fonte v4 já confirmada; não há downgrade automático.

O schema v4 é local. A sincronização remota permanece bloqueada até que os consumidores declarem suporte. O editor diferencia gravação local de sincronização e informa a incompatibilidade antes de confirmar a primeira primitiva. Leitores anteriores que aceitam apenas schemas 1–3 rejeitam a fonte v4 antes de instalá-la ou gravá-la. A exportação usa a projeção de Cena, remove o marcador e os metadados autorais, e conserva as primitivas necessárias à apresentação.
