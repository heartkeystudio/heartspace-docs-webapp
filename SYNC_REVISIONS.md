# Sincronização, revisões e conflitos — fatia 4

Implementação: `sync-state.js`, `sync-review.js`, persistência autoral/local e
adaptadores do editor em `index.html`. Contrato SQL em
`website/supabase/migrations/20261116000100_docs_recoverable_sync.sql`.

## Escopo entregue

- Documentos e recursos narrativos têm envios recuperáveis e comparação de versão.
- Revisão permite comparar, escolher uma versão, guardar versões anteriores,
  restaurar um rascunho e exportar uma recuperação `.hdocs`.
- Atualização remota preserva texto em edição e registros locais não retornados.
- Cópias de trabalho online são separadas por conta, projeto e janela.
- Título/conteúdo passam por uma gravação atômica. O cliente não faz mais PATCH
  separado do título nem upsert cego do registro narrativo.

O formato autoral continua v1; o envelope de trabalho continua v3. Metadados de
sincronização são uma extensão opcional do workspace, com versão própria 1.

## Envio durável e confirmação

Antes de enviar, o editor captura o trecho pendente do DOM, cria uma operação
com UUID, versão esperada e conteúdo congelado e aguarda a persistência local.
Um documento novo recebe também um UUID de linha remota, persistido antes da
primeira tentativa. O ID autoral permanece separado e estável.

Sem confirmação, a mesma operação e o mesmo payload permanecem no cache. Retorno
da conexão, reabertura ou tentativa manual repetem essa operação. Alterações
feitas durante o envio ficam para a operação seguinte; a resposta não substitui
o título atual nem limpa o rascunho mais novo.

O servidor guarda recibos por usuário/operação, vinculados ao hash do pedido.
Repetir um pedido aceito devolve sua confirmação anterior, sem duplicar documento
ou revisão. Reutilizar o mesmo UUID com outro conteúdo é recusado. Recibos não
contêm outra cópia das mídias; conservam resultado e hash. Eles não têm FK de
exclusão em cascata para o documento, evitando ressuscitar uma criação cujo
reconhecimento se perdeu antes de uma exclusão definitiva.

A confirmação do servidor e a gravação local são etapas distintas. Se a última
gravação local falhar, a operação persistida anteriormente continua repetível.
O navegador pode negar armazenamento ou ser encerrado antes de um commit; um
arquivo salvo fora dele continua sendo a cópia externa independente.

Falhas de conexão retomam com intervalo crescente, de 1,5 até 60 segundos.
Conflitos suspendem o envio da entidade. Falta da RPC v2 mantém a fila local e
informa que o servidor precisa ser atualizado, sem fallback para gravação cega.
Permissões são verificadas novamente pelo servidor em cada tentativa.

## Leitura e reconciliação

O polling consulta primeiro um índice paginado de IDs/versões. Conteúdo completo
é buscado para documentos novos/alterados, em grupos de 20 e até três pedidos em
paralelo. O registro narrativo também consulta primeiro seu timestamp quando a
base já é conhecida. Não é necessário transferir novamente todas as mídias a
cada ciclo sem mudanças.

Respostas de contexto anterior, versões anteriores à base já aceita e resultados
de uma leitura iniciada antes de criar/excluir/retirar um documento são ignorados.
O comparador conserva a precisão de microssegundos das versões do Postgres.

Uma atualização não troca o registro-base enquanto mantém o DOM antigo em foco.
Ela fica disponível para comparação. Registros sujos e operações ainda não
confirmadas conservam sua base. Um documento ausente de uma listagem não é prova
de exclusão: a cópia local é mantida, com envio suspenso. A revisão permite salvar
essa cópia em arquivo ou guardá-la fora da biblioteca ativa.

Personagens, variáveis, glossário e formato de Cena têm estado sujo/base própria.
Atualizar/reabrir preserva recursos pendentes. Caches antigos sem esse estado
são tratados conservadoramente: divergência precisa de escolha, sem descartar
automaticamente a versão local. Polling não recria os campos que estão em edição
nem reinicia a composição da Cena quando nada mudou.

## Revisão e recuperação

O botão **Revisão** abre documentos pendentes, recursos em conflito, versões
guardadas e recuperações de outras janelas/sessões do mesmo contexto.

- **Usar meu rascunho** guarda as versões comparadas e envia a escolha local
  contra a versão remota observada. Outra alteração posterior gera novo conflito.
- **Usar versão do projeto** guarda a versão local e incorpora a remota.
- Recuperações ficam fora da lista de documentos ativos; seus IDs de sequência,
  bloco e tradução não passam a disputar o registro narrativo da história.
- Restaurar uma recuperação ou uma revisão do histórico modifica o documento
  existente como rascunho, mantendo seu vínculo e sua base atuais. O estado
  anterior é protegido antes da troca. Não há restauração remota incondicional.
- Cada cópia protegida pode ser exportada como fonte `.hdocs`, com as mídias
  necessárias, ou removida explicitamente. Mídia ausente é informada e impede
  gerar um arquivo incompleto, preservando a recuperação. Há limite de 100 cópias por
  área; atingir o limite bloqueia novas substituições, sem apagar as anteriores.

O `.hdocs` normal contém a fonte atual, não a fila e o histórico privado do
workspace. Para guardar uma versão protegida externamente, use sua ação de
exportação na Revisão. Cada exportação de documento inclui seu contexto de livro
e os recursos disponíveis no momento da proteção; não representa um commit
atômico de todo o projeto remoto.

## Conta, janela e sessão

O cache web online usa conta + projeto; a janela tem seu próprio slot. Onde há
Web Locks, uma identidade de sessão reutiliza seu slot ao recarregar e uma aba
duplicada obtém outra identidade. O navegador mantém a exclusividade enquanto o
documento existe. Sem esse recurso, cada abertura recebe um slot novo, preservando
as recuperações anteriores e consumindo espaço adicional.

Caches web antigos sem dono registrado não são incorporados automaticamente à
conta atual. No projeto autorizado, a Revisão oferece exportar a recuperação
anterior para conferência e abertura local. O cache desktop anterior, que já
contém conta e projeto na chave, pode ser adotado no primeiro slot novo.

Sair encerra timers/contexto, limpa credenciais e capacidades e protege a cópia
de trabalho. Se essa proteção falhar, a sessão termina e o rascunho permanece em
memória sem edição, com ação para salvá-lo em arquivo. Respostas e renovações de
token de um contexto anterior não reassumem o contexto novo.

## Contrato e aplicação no servidor

A migration acrescenta:

| RPC | Responsabilidade |
| --- | --- |
| `heartspace_save_doc_v2` | Criar/salvar condicionalmente título e conteúdo, gerar revisão e recibo |
| `heartspace_save_narrative_registry_v2` | Salvar recursos com base esperada, relógio/revisão do servidor e recibo |
| `heartspace_delete_doc_v2` | Excluir somente a versão esperada que continua na lixeira |

Gravação direta de documentos/registro/revisões por clientes autenticados é
revogada. Aprovação de revisão conserva sua RPC com capacidade específica;
clientes não podem fornecer campos de aprovação por INSERT. A ambiguidade de
variável/coluna da aprovação também foi removida. O endpoint antigo de conteúdo
fica condicional e atômico; clientes antigos que dependem de PATCH ou upsert
diretos precisam ser atualizados junto com o banco.

É uma aplicação coordenada: primeiro conferir/aplicar as migrations anteriores,
incluindo formato de Cena, e depois esta migration com o cliente v2. O cliente
mantém trabalho local caso encontre o servidor anterior. Esta tarefa não executou
migration, requisições autenticadas, deploy ou publicação no ambiente remoto.
Não foi verificado se outra operação já aplicou o SQL ao Supabase.

## Limites e próximas fronteiras

- Livros/pranchetas ainda têm fonte independente local, mas o adaptador remoto
  legado replica planejamento nos capítulos. Persistência/versionamento remoto
  próprio de livros, inclusive vazios, ainda pertence à próxima integração;
  o CAS de documento não é uma revisão atômica do livro inteiro.
- Ordenação compartilhada usa o contrato separado existente. Não há merge
  simultâneo de texto, CRDT ou reconciliação automática de campos.
- Cenas/retratos ainda podem conter mídia incorporada no transporte antigo;
  extração desses caches e resolução compartilhada entre apps continuam pendentes.
- Recibos e slots antigos não são apagados automaticamente. Retenção/limpeza
  precisam respeitar operações ainda repetíveis e recuperações do usuário.
- Fila Hub, providers, publicação/wiki e contratos nativos Core seguem como
  adaptadores posteriores; não foram criados tokens ou APIs privadas alternativos.

Conferência realizada: sintaxe JavaScript, leitura estática dos fluxos e do SQL,
diff e CSP desktop. Não foram adicionados nem executados testes. Aplicação SQL,
concorrência em duas sessões, retomada após falha, restauração e revisão visual
permanecem para validação funcional.
