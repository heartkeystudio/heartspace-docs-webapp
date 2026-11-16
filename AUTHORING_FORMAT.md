# Docs — formato autoral e entidades

## Estado das fatias 1 a 4

Implementado em `authoring-project.js`, integrado à persistência do editor web e
à entrada desktop. O formato é `heartspace.docs.authoring`, `schema_version: 1`.
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

## Conferência desta entrega

Conferência estática realizada: leitura das mudanças, sintaxe dos scripts e
`git diff --check`; a CSP desktop foi regenerada. Não há testes funcionais novos
nem execução de cenários no navegador.
Migração com dados reais, retomada offline e colaboração ficam para validação.

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
