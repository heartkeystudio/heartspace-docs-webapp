> Atualização 16/11/2026 — fatia 5C: publicação de revisão escolhida, aprovação
> explícita após conferência, projeção no servidor, imagens distribuíveis privadas,
> recibos e comparação de versão da página; leitor público e contrato da fila Hub
> atualizados. Ver `PUBLICATION_TRANSPORT.md`. Somente conferência estática; SQL,
> deploy, permissões e comportamento real permanecem pendentes de QA.

> Atualização 16/11/2026 — fatia 5B: transporte de mídia por arquivos privados/hash,
> materialização antes do editor, cache por conta/projeto e pedido final durável.
> A migração nova não foi aplicada. Conferência estática apenas; upload, RLS, cache,
> retomada de operações antigas, mídia ausente e exports precisam de QA funcional.
> Ver `MEDIA_TRANSPORT.md` e `MIGRATION_ROLLOUT.md`.

> Atualização 16/11/2026 — fatia 5A: livros remotos independentes, inclusive vazios,
> receberam fonte, CAS/fila, histórico e remoção com movimento transacional dos
> capítulos. QA de estrutura compartilhada (incluindo QA11 abaixo) precisa considerar
> o novo contrato descrito em `BOOK_SYNC.md`. Migrations não aplicadas; nenhuma
> validação funcional foi executada nesta etapa. `MIGRATION_ROLLOUT.md` acompanha
> a relação de aplicação ainda pendente.

# Revisão antes do QA — HeartSpace Docs

Data: 14/11/2026. Escopo: implementação atual do editor web/desktop, persistência, sincronização, permissões, ações da interface, exportação e SQL/Functions relacionados ao Docs.

**Resultado:** há problemas a corrigir antes de encaminhar esta versão como candidata a QA. Os riscos principais estão em concorrência, persistência e sessão; os botões sem ação são a parte menor.

Atualização de implementação em 16/11/2026: as fatias de autoria/local acrescentam
o formato de projeto, arquivos `.hdocs`, ícones de abrir/salvar conectados e
recuperação IndexedDB. O trecho pendente é capturado ao ocultar/sair, e o estado
local pendente participa da proteção de fechamento. Isso altera partes de
QA-04/QA-10/QA-11; o relatório abaixo conserva a análise original, não representa
uma revalidação dessas correções. Sincronização, entidade remota de livro e os
demais achados continuam pendentes. Ver [LOCAL_PROJECT_FILES.md](LOCAL_PROJECT_FILES.md).

Atualização da fatia 4 em 16/11/2026: há implementação de envios recuperáveis,
RPCs condicionais/atômicas, isolamento de conta/janela e revisão com cópias fora
da história ativa. Isso altera os caminhos de QA-01/02/03/05/06/07/08/09/10/12/13.
O SQL está preparado, mas sua aplicação e os cenários de concorrência não foram
executados nesta tarefa; os achados originais abaixo não passam a ser considerados
validados. Livros remotos independentes (QA-11), transportes/mídias/publicação e
suite desatualizada (QA-14) continuam pendentes. Ver [SYNC_REVISIONS.md](SYNC_REVISIONS.md).

## Alcance e limites

- Revisão estática dos arquivos atuais, incluindo as alterações ainda não commitadas das fatias recentes.
- Os problemas abaixo são sustentados pelo fluxo do código. Os cenários descrevem como a falha pode ser exercitada; não representam execução realizada nesta revisão.
- Não foram executados testes, interações no browser, requisições autenticadas, alterações no banco, deploys ou publicação. O acesso automatizado à página local segue bloqueado.
- As conclusões sobre SQL referem-se às migrations versionadas. A presença efetiva dessas definições no Supabase publicado ainda precisa ser conferida. Não há alegação de exploração ou de alteração de dados remotos.
- Nesta etapa foi criado apenas este relatório; as correções do produto ainda não foram aplicadas.

## Como o programa está organizado hoje

| Parte | Implementação atual |
| --- | --- |
| Escrita | DOM do editor → serialização → registro em memória → cache local; gravação local após 450 ms sem nova edição |
| Documento na equipe | Tabela `docs`; atualizações de conteúdo pela RPC `heartspace_save_doc_content`; uma segunda requisição atualiza o título |
| Conflito | Comparação de `updated_at`, rascunho preservado e botões para cópia/versão remota |
| Livro/prancheta | `libraryFolders` no cache; metadados e planejamento replicados em `content.organization.collection` dos documentos |
| Recursos compartilhados | `project_narrative_registry`: personagens, variáveis, glossário e formato global da Cena |
| Imagens | IndexedDB no dispositivo; imagens comuns compartilhadas em Storage privado; mídias de Cena embutidas no conteúdo narrativo |
| Leitura/exportação | Runner e apresentadores compartilhados; HTML/ZIP independentes da conta/backend depois da exportação |
| Desktop | Adapter recebe sessão/contexto do Core, separa cache por conta/projeto e comunica alterações pendentes |

O projeto já tem uma base útil de RPC com comparação de versão, RLS por capacidade, armazenamento privado e snapshots de exportação. Os pontos abaixo são lacunas entre essas partes.

## Resumo dos achados

P1 = tratar antes do QA geral, por envolver perda/sobrescrita, sessão ou integridade de dados. P2 = fluxo incompleto ou falha funcional que também deve receber uma decisão antes do envio.

| ID | Prioridade | Problema |
| --- | --- | --- |
| QA-01 | P1 | Polling troca a versão do registro sem trocar o texto que está em foco |
| QA-02 | P1 | Conteúdo e título são gravados em duas operações; a segunda não compara versão |
| QA-03 | P1 | Estado de edição ignora a permissão de somente leitura |
| QA-04 | P1 | Fechar/recarregar antes de 450 ms pode perder o último trecho |
| QA-05 | P1 | Atualizar/reabrir pode descartar registro narrativo salvo apenas localmente |
| QA-06 | P1 | Registro narrativo compartilhado não tem proteção contra gravações concorrentes |
| QA-07 | P1 | Logout e modo local mantêm o contexto anterior; cache web não separa contas |
| QA-08 | P1 | HTML remoto entra no DOM sem sanitização por allowlist |
| QA-09 | P1 | INSERT direto de revisões permite preencher campos de aprovação |
| QA-10 | P2 | Quatro ações visíveis estão desligadas ou incompletas |
| QA-11 | P2 | Livro vazio e seu planejamento não têm persistência remota independente |
| QA-12 | P2 | Resolver conflito criando cópia duplica IDs narrativos |
| QA-13 | P1 | Refresh descarta rascunho remoto se a linha não vier mais do servidor |
| QA-14 | P2 | Suite de exportação ainda assume a estrutura antiga do HTML |

## Achados e correções propostas

### QA-01 — versão remota e texto visível podem divergir

**Evidência:** [montagem de `next`](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8156), [decisão de não atualizar o DOM em foco](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8178), [captura posterior do DOM](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3707).

Quando um documento não está sujo, o polling substitui o registro por `remoteToRecord(row)`, com corpo e `remoteUpdatedAt` novos. Se o editor estiver em foco, mantém o DOM anterior. Basta alguém deixar o cursor no texto, outra pessoa salvar e o primeiro usuário voltar a digitar: o DOM antigo pode ser salvo utilizando a versão nova como base, sem o conflito esperado. O mesmo desalinhamento afeta um `flushSave()` ao navegar.

**Correção:** manter corpo visível e versão-base como um par. Adiar a adoção remota enquanto não for possível aplicar os dois, ou marcar atualização remota pendente e resolver antes de gravar. Não avançar a versão-base de um DOM antigo.

### QA-02 — gravação não é atômica para título e conteúdo

**Evidência:** [RPC seguida de PATCH](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8285), [PATCH sem condição de versão](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8296), [RPC SQL atual](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/migrations/20260925000200_docs_revisions_and_conflicts.sql:62).

A RPC grava `content` e cria revisão, mas não atualiza `docs.title`. O cliente faz um PATCH separado e aceita o `updated_at` retornado. Uma edição de outra pessoa entre essas duas chamadas pode receber um título antigo; dependendo da versão retornada, o cliente também passa a usar uma base que não corresponde ao seu corpo. Falhar na segunda chamada deixa uma gravação parcial. Há ainda atribuição de `record.title = captured.title` depois do await, que pode regredir o registro local enquanto o usuário já renomeou o documento.

**Correção:** gravar título, conteúdo, versão e revisão na mesma RPC/transação. Aplicar o resultado localmente apenas à revisão capturada e reenfileirar mudanças mais recentes sem substituí-las.

### QA-03 — somente leitura não é uma condição única

**Evidência:** [estado de edição por modo visual](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3193), [permissão aplicada separadamente](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8093), [carregar corpo reaplica edição](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3428), [metadados sem guarda](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3989).

`applyDocumentEditingState()` considera apenas `documentViewMode === 'writing'`. Ao abrir um capítulo ou mudar de modo pode reabilitar conteúdo mesmo sem `docs_edit`. Elementos filhos com `contenteditable=true` também não são neutralizados pelo bloqueio aplicado apenas ao contêiner. O formulário de metadados permite alterar estado local sem conferir capacidade.

**Impacto:** um leitor pode editar um rascunho que o backend depois não aceitará. Isso não comprova bypass do RLS, mas quebra a experiência de permissão e o estado de salvamento.

**Correção:** uma função única para capacidade efetiva de edição, usada por página, filhos, metadados, importação, desfazer/refazer e ações de mutação, inclusive após carregamento e mudança de permissão.

### QA-04 — falta de fechamento seguro da gravação local

**Evidência:** [debounce de 450 ms](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3703), [handler de pagehide](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8585).

O corpo atualizado só é copiado para o registro/cache quando o timer roda. O único handler de `pagehide` do editor destrói o adapter desktop; não descarrega o rascunho. Não há handler do editor para `beforeunload`. Fechar/recarregar logo após escrever pode descartar os últimos caracteres. O estado pendente do Core não resolve esse intervalo no navegador comum.

**Correção:** descarregar serialização local pendente ao ocultar/sair, com escrita local síncrona onde possível; manter estado pendente e aviso de saída coerentes. A operação de saída não deve depender de concluir uma requisição de rede.

### QA-05 — mudanças locais do registro narrativo podem ser substituídas

**Evidência:** [leitura do cache e substituição por remoto](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:5591), [Atualizar chama esse carregamento](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8483).

Personagens, variáveis e glossário têm cache local, mas não uma revisão suja equivalente à de documentos. Alterações feitas offline, ou cujo salvamento remoto falhou, são substituídas integralmente pela linha remota ao reabrir/atualizar. Só o formato da Cena tem `narrativeGameSettingsDirty` para preservar uma alteração local. Após isso, o cache é regravado com o remoto.

**Correção:** registrar pendências/revisão-base de todo o registro, preservar a cópia local e oferecer reconciliação. Atualizar não pode apagar um salvamento local pendente.

### QA-06 — duas pessoas podem sobrescrever recursos compartilhados

**Evidência:** [payload completo e upsert](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:5570), [tabela e políticas](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/migrations/20261111000100_docs_narrative_registry.sql:4).

O cliente envia personagens, variáveis, glossário e configuração de Cena em um único upsert por `project_id`. O `updated_at` é escrito pelo cliente, sem comparação com uma versão lida. Duas sessões que começam na mesma base e editam recursos diferentes podem substituir as alterações uma da outra.

**Correção:** RPC de gravação com revisão esperada, autoria e relógio do servidor; conflito explícito ou merge por recurso/ID. Serializar saves de uma aba não protege contra outra aba ou pessoa.

### QA-07 — encerrar a sessão não encerra o contexto do editor web

**Evidência:** [logout](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8578), [modo local](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8477), [chave web por projeto](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8222).

Logout remove tokens e mostra o login, mas mantém projeto, capacidades, documentos, editor e timers de gravação. “Continuar no protótipo local” apenas esconde o login: o conteúdo da sessão anterior reaparece, ainda no cache do projeto anterior. A chave web também não inclui a conta, ao contrário do desktop.

**Correção:** descarregar rascunhos da conta anterior, cancelar operações/timers e limpar contexto/DOM/capacidades ao sair. Entrar no modo local deve abrir o armazenamento local próprio. Separar cache e filas por conta + projeto; não apagar rascunhos recuperáveis durante a transição.

### QA-08 — fronteira de HTML autoral não está sanitizada

**Evidência:** [conteúdo remoto aceito como body](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8108), [inserção por innerHTML](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3435).

O HTML vindo do backend é inserido diretamente no editor. A normalização narrativa não remove atributos executáveis, URLs perigosas ou elementos fora do formato do documento. Não foi encontrada sanitização por allowlist nesse caminho. A CSP desktop restringe execução, mas não é sanitização; os cabeçalhos efetivos da versão web não foram inspecionados.

**Impacto:** conteúdo armazenado por um colaborador cruza para o DOM de outro. O comportamento de execução depende das proteções do ambiente; esta revisão não executou payloads.

**Correção:** sanitizar na entrada e persistência com uma allowlist compatível com os blocos do Docs, estilos permitidos, atributos `data-*` necessários e URLs de mídia/referência. Manter CSP como proteção adicional.

### QA-09 — campos de aprovação podem entrar no INSERT de revisão

**Evidência:** [colunas de aprovação](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/migrations/20260925000200_docs_revisions_and_conflicts.sql:18), [política e grant de insert](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/migrations/20260925000200_docs_revisions_and_conflicts.sql:32), [consumo da aprovação na publicação](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/functions/heartspace-studios/index.ts:955).

A definição versionada concede INSERT na tabela inteira a `authenticated`. O `with check` exige `docs_edit`, mas não exige aprovação nula nem restringe autoria. Assim, o SQL permite que uma revisão seja inserida já com `approved_at`/`approved_by`, fora da RPC que exige `manage_workspace`.

Isso não concede sozinho a capacidade de publicar: a Function ainda verifica `manage_publications`. Porém, invalida a garantia de que uma revisão marcada como aprovada passou pela autoridade de aprovação.

**Correção:** retirar INSERT direto de clientes e criar revisões somente nas RPCs autorizadas, ou restringir explicitamente colunas e valores permitidos. Conferir grants/policies reais antes de considerar esse fluxo liberado.

### QA-10 — ações visíveis sem implementação

**Evidência:** [botões da navegação](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:1650), [ação Publicar](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:1646), [Revisão em breve](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8546).

| Ação | Estado encontrado |
| --- | --- |
| Abrir projeto | Botão visível; nenhuma referência no JavaScript de aplicação aos IDs do controle |
| Salvar projeto | Mesma situação; autosave existe, mas este botão não o aciona |
| Revisão | Clique apenas mostra “Revisão — em breve” |
| Publicar no HeartSpace, na web | Botão sem handler; o menu fecha por seu handler genérico |

No desktop, Publicar e Exportar .md estão desabilitados explicitamente com mensagem de etapa futura; isso é uma restrição declarada, não prova de botão quebrado. Exportar a história HTML/ZIP é um fluxo diferente.

**Correção:** implementar as semânticas desejadas de Abrir/Salvar projeto ou retirar esses controles do recorte enviado. Sinalizar recursos futuros de forma consistente. Não ligar esses botões a operações de outro escopo só para que reajam ao clique.

### QA-11 — biblioteca vazia não tem onde sincronizar seu planejamento

**Evidência:** [criação de biblioteca](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:7902), [planejamento replicado nos documentos](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:2192), [sincronização exige um documento](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3682).

Criar um livro sem capítulos e preencher o planejamento só grava `libraryFolders` localmente. Não há documento para receber a cópia em `organization.collection`, e o agendamento retorna sem enviar. Outra instalação não consegue recuperar esse livro/planejamento. A mensagem informa salvamento local, mas o modelo atual não consegue completar a promessa de planejamento compartilhado independente de capítulos.

**Correção:** persistir livros/pranchetas e seus planejamentos como entidade própria do projeto, com permissão, versão e exclusão próprias; migrar as cópias existentes sem perder planos preservados.

### QA-12 — cópia de conflito herda IDs narrativos da versão original

**Evidência:** [copiar rascunho](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8548), [carregar remoto preservando cópia](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8563), [registro detecta IDs duplicados](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:5670).

As duas estratégias de conflito usam `makeRecord({...conflicted, id:novoId})`, mantendo IDs de sequência, atribuições dos blocos e destinos. A versão remota e a cópia passam a coexistir como documentos ativos com as mesmas sequências. O próprio registro acusa duplicidade e pode impedir o teste/exportação do caminho.

**Correção:** tratar a cópia como fork: gerar IDs próprios e remapear os vínculos internos e os momentos de cena de forma consistente, ou manter o backup fora do registro narrativo ativo até o autor decidir incorporá-lo.

### QA-13 — refresh elimina rascunhos de linhas remotas ausentes

**Evidência:** [reconstrução de documents](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8157), [preservação apenas de registros sem remoteId](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8168).

A preservação de `old.dirty` só ocorre ao percorrer as linhas retornadas. Se outra sessão excluir definitivamente um documento, ou ele deixar de ser retornado por acesso/filtro, seu registro remoto sujo não entra em `next` nem em `cachedLocal`. O cache seguinte é persistido sem o rascunho.

**Correção:** reconciliar também os registros locais sem correspondente remoto. Preservar rascunhos pendentes como cópias recuperáveis e distinguir exclusão, perda de acesso e resultado parcial antes de descartar qualquer estado local.

### QA-14 — suite de exportação está desatualizada

**Evidência:** [asserção de dois scripts](/home/dev_ao/HeartKey/Projects/Heartspace/docs/tests/narrative-html.test.cjs:82), [harness lê scripts por índice](/home/dev_ao/HeartKey/Projects/Heartspace/docs/tests/player-dom.cjs:65), [HTML agora tem bootstrap, JSON e player](/home/dev_ao/HeartKey/Projects/Heartspace/docs/narrative-html.js:516).

As mudanças recentes adicionaram o bootstrap de compatibilidade. O teste ainda exige dois scripts, interpreta o primeiro como JSON e executa o segundo como player. O HTML atual tem três scripts, e o primeiro é JavaScript. O harness também modela a interface antiga. Essa incompatibilidade é identificável no código, sem executar a suite; resultados antigos não validam as fatias atuais.

**Correção:** atualizar a localização dos scripts por tipo/ID, o harness e as expectativas para o menu/perfis/orientação atuais. Planejar a execução após essa atualização; não foi executada nesta revisão.

## Itens adicionais a conferir na correção

Estes pontos foram vistos no código, mas dependem de configuração ou de reproduzir o contexto completo para fixar seu impacto:

- **RPC de aprovação:** usa `project_id` tanto como variável quanto como coluna em `select project_id into project_id`. Qualificar a coluna e renomear a variável para evitar ambiguidade de PL/pgSQL. Ver [SQL](/home/dev_ao/HeartKey/Projects/Heartspace/website/supabase/migrations/20260925000200_docs_revisions_and_conflicts.sql:85).
- **Troca rápida de projeto:** `loadCloudProject()` não tem um identificador de geração de carregamento. Respostas fora de ordem podem fazer o carregamento anterior reassumir o contexto. O refresh de documentos tem algumas guardas de projeto, mas o carregamento completo não. Ver [carregamento](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8210).
- **Primeira criação remota:** POST de documento não envia um ID estável ou chave de idempotência. Se o servidor criar a linha e a resposta se perder, a tentativa seguinte ainda vê `record.remoteId` vazio e pode criar outra linha. Ver [POST](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:8262).
- **Pendências no desktop:** o estado comunicado ao Core conta documentos sujos e saves desses documentos; não inclui o salvamento do registro narrativo/formato. Ver [estado informado](/home/dev_ao/HeartKey/Projects/Heartspace/docs/index.html:3674). A correção de QA-05/06 precisa integrar essa fila.

## Ordem de correção sugerida

1. **Persistência e concorrência:** QA-01, QA-02, QA-04, QA-05, QA-06 e QA-13. Definir a versão-base única, as filas e a recuperação de rascunhos antes de mexer nos sintomas visuais.
2. **Sessão, permissões e integridade:** QA-03, QA-07, QA-08 e QA-09. Consolidar capacidade efetiva, isolamento de conta e fronteiras de conteúdo/gravação.
3. **Bibliotecas e recuperação:** QA-11 e QA-12. Dar ao planejamento uma persistência própria e impedir IDs duplicados nas cópias.
4. **Recorte de produto e evidência:** QA-10 e QA-14. Resolver controles desligados e atualizar a suite para refletir o produto atual.
5. **Conferência do ambiente publicado:** versões de RPCs, migrations do registro narrativo (`characters`, `variables`, `glossary`, `scene_settings`), grants/RLS, bucket `docs-assets`, cabeçalhos da entrada web e desktop. Aplicação no Supabase não foi verificada neste relatório.

Depois dessas correções, a passagem ao QA precisa de evidência em navegador, duas sessões concorrentes, perda/retorno de conexão, mudança de permissão/conta e saída com gravação pendente. A validação específica do Kindle de 11ª geração continua sendo uma pendência separada.
