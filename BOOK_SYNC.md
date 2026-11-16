# Livros na nuvem — integração, fatia 5A

Implementação: `book-sync.js`, adaptadores em `index.html`, `sync-state.js` e
`sync-review.js`. SQL: `website/supabase/migrations/20261116000200_docs_books.sql`,
posterior a `20261116000100_docs_recoverable_sync.sql`.

## Fonte e transporte

O livro/prancheta é uma entidade independente no servidor, assim como já era no
formato autoral local. Livros vazios podem ser enviados e recuperados sem criar
um capítulo artificial. Cada livro tem ID autoral de texto, fonte, versão,
histórico e marca de remoção, separados dos documentos.

- `docs_books`: projeção aceita atual, inclusive marcas de remoção.
- `docs_book_revisions`: fontes imutáveis anteriores, com origem e autoria.
- `docs_book_receipts`: confirmações de operações repetíveis, sem duplicar a fonte.
- `heartspace_save_book_v1`: gravação por versão esperada, com capacidade `docs_edit`.

Leitura exige `docs_view`; escrita direta nas três tabelas é negada aos clientes.
O ID do livro é preservado; não é convertido em UUID, pois fontes anteriores
usam IDs como `folder-doc-…`. O recibo é próprio de livros para admitir esses IDs.

No cliente, `workspace.sync.books` tem versão 1 e guarda vínculos, operações,
conflitos e fontes de remoções pendentes. A fonte `.hdocs` continua com esquema 1,
sem esses metadados privados. Os livros atuais permanecem em `source.books`.

O documento passa a enviar `organization.schema_version: 2`, identidade do pai
e nome de conveniência. `organization.collection` deixa de transportar o plano
compartilhado. Leituras antigas e operações já congeladas continuam reconhecidas,
mas seus snapshots não substituem um livro que já tem vínculo próprio.

## Migração dos planejamentos anteriores

A migração coleta as fontes em `organization.collection` dos documentos existentes.
Ela cria uma projeção inicial por projeto/livro e preserva **cada fonte distinta**
no histórico com origem `legacy-document`. A escolha inicial usa a versão do
capítulo no servidor, com desempate por ID, sem confiar no relógio do cliente.

Planejamentos antigos em `story_planning` também entram nas fontes preservadas.
O cliente qualifica os vínculos pelo documento de origem e elimina repetições
idênticas, mantendo alternativas diferentes do mesmo capítulo. Conteúdo antigo
não é removido dos documentos pela migração.

Um livro que só existia localmente é enviado como entidade própria. Se o cache
antigo divergir da nova projeção remota, abre-se comparação; nenhuma escolha
silenciosa substitui o planejamento do usuário.

## Envios e concorrência

Antes da rede, o cliente guarda operação, conteúdo congelado e versão esperada,
aguardando a gravação local. Uma perda de confirmação repete o mesmo pedido.
Uma edição feita durante o envio permanece para a operação seguinte.

A criação de capítulos aguarda a confirmação do livro de destino. Cada alteração
de planejamento tem seu próprio controle de versão; não depende do CAS de algum
capítulo. Índices paginados consultam versões antes de carregar fontes alteradas.
Leituras antigas, respostas de outra conta/projeto/janela e listas iniciadas antes
de uma confirmação nova não reassumem a base. Uma consulta sem alterações não
reescreve o cache completo. Campos em edição mantêm seus objetos e rascunhos.

## Remover e recuperar

Remover um livro guarda primeiro sua fonte e contexto nas cópias protegidas.
Localmente, seus documentos vão para a Caixa de entrada; o texto não é apagado.
No servidor, a remoção grava uma marca persistente e move os capítulos ainda
vinculados **na mesma transação**, usando suas fontes atuais e criando revisões
normais dos documentos. Um bloqueio comum por projeto serializa esse movimento
com as alterações de vínculo. Um capítulo não pode ser gravado apontando para um
livro inexistente/removido. Repetir uma confirmação antiga não recria o livro.

Se outra pessoa remover um livro enquanto há capítulos/planejamento locais
pendentes, o cliente conserva o contexto e oferece comparação. Escolher a versão
do projeto move os capítulos locais para a Caixa de entrada, preservando seu
texto. Escolher o rascunho permite restaurar explicitamente o livro contra a
versão da remoção; uma alteração posterior produz novo conflito.

**Revisão** mostra livros atuais, removidos e pendentes. O histórico carrega em
páginas e permite guardar uma versão como cópia protegida. A partir dela é possível
exportar `.hdocs` ou restaurar **o planejamento como rascunho**, mantendo a base
atual. Restaurar o planejamento não reverte automaticamente textos e movimentos
de capítulos feitos depois. A exportação inclui os capítulos atualmente
associados como contexto; não representa um snapshot atômico histórico deles.
Se um documento antigo for restaurado e seu livro já não existir, ele fica na
Caixa de entrada; restaurar a biblioteca é uma decisão separada.

## Aplicação e limites

Nenhuma migração foi aplicada por esta tarefa. Cliente e SQL precisam de aplicação
coordenada; sem tabela/RPC nova, o editor mantém a cópia local e informa a atualização
necessária. O SQL estabiliza a leitura dos documentos durante sua instalação;
planejar uma janela de atualização evita clientes antigos gravando durante a troca.
A lista provisória e dependências estão em `MIGRATION_ROLLOUT.md`.

Esta é a parte estrutural da quinta fatia de arquitetura. Permanecem separados:

1. Extrair mídias incorporadas de cenas/retratos para um transporte de arquivos
   com identidade/hash, mantendo cópia offline e arquivos portáveis completos.
2. Ligar catálogo/arquivos aos contratos efetivamente disponíveis no Core/Hub.
   A ponte web v1 atual não expõe filesystem nem credenciais de Drive ao Docs.
3. Fechar o adaptador de publicação/wiki com snapshots e permissões apropriadas.

Não foram criados limites comerciais, assinaturas ou dependência de conta para
produção local. Ordenação continua no contrato existente; não há CRDT/merge de
campos nem transação de toda a fonte autoral do projeto.

Conferência desta tarefa: sintaxe JavaScript, leitura estática dos fluxos/SQL,
diff e CSP desktop. Nenhum teste, execução SQL ou validação no ambiente remoto
foi realizado. Concorrência, retomada, UI e instalação das migrações aguardam
validação funcional/QA.

## Complemento da fatia 5B

O transporte externo de livros agora usa `heartspace_save_book_v2`, que valida
as referências de mídia antes de chamar a gravação condicional interna. A fila
guarda fonte e pedido de transporte separados, sem mudar `source.books`. Ver
`MEDIA_TRANSPORT.md`; a primeira pendência acima foi tratada para novas gravações
compatíveis, sem reescrever todo o histórico legado. Migrações continuam pendentes.
