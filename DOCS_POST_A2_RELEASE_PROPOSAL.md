# Consolidação da versão interna do Docs após A2

**Data:** 25/11/2026. **Destinatário:** fundador e equipe HeartKey Studios.
**Estado:** proposta para autorização; sem commit, tag, push ou publicação executados.

O fundador aprovou A1 e A2 no alcance validado e estabeleceu este estado como
encerramento do ciclo de estabilização. A3 não será iniciada. A recomendação é
consolidar uma versão funcional interna com os limites abaixo, sem nova rodada
abrangente de investigação.

## Avaliação da entrega

| Questão | Parecer |
|---|---|
| É possível consolidar e distribuir uma versão funcional? | Sim, para uso interno no alcance aprovado, após consolidar o código e verificar o pacote final. |
| Há bloqueador funcional conhecido? | Nenhum bloqueador aberto de Etapa 0/A1/A2 foi identificado nas evidências aprovadas. Isso não certifica fluxos remotos ou ambientes não ensaiados. |
| Há impedimentos operacionais atuais? | O estado aprovado ainda não tem commit/pacote recuperável completo. A consulta ao remoto falhou por configuração SSH. A publicação hospedada e os cabeçalhos efetivos ainda precisam ser conferidos na entrega. |
| É necessário implementar A3? | Não. A3 e demais melhorias ficam fora desta entrega. |
| É necessário corrigir novas funcionalidades? | Nenhuma correção adicional é indicada pelas evidências atuais. |

A base é o [resultado de A2](SCENE_EDITOR_STAGE_A2_RESULTS.md) e sua
[evidência final](tests/evidence/stage-a2-results-2026-11-25.json): 119/119 testes
automatizados, 11/11 de compatibilidade, 24/24 de recuperação e 41/41 cenários no
editor, fechamento/reabertura e teclado real. Nesta avaliação documental, os hashes
atuais dos arquivos enumerados na evidência final e dos arquivos protegidos
conferiram. Não foram repetidas as baterias nem realizada auditoria abrangente.

## Estado do Git e recuperação

- Repositório independente: `/home/dev_ao/HeartKey/Projects/Heartspace/docs`.
- Branch: `master`.
- HEAD: `959b9b13cb13162aa1963b2fc7bffb97fb17ba61`, mensagem `export options`,
  de 17/11/2026 às 00:15:07, horário -03:00.
- Antes deste registro: 10 arquivos rastreados modificados, 68 arquivos não
  rastreados e nenhuma alteração preparada no índice. A lista exata está no anexo.
  Este registro acrescenta um arquivo não rastreado; os totais não representam commits.
- Não há commits dedicados à Etapa 0, A1 ou A2 no histórico local consultado.
  As implementações e evidências correspondentes estão no diretório de trabalho.
- Não há tags locais nem stashes. O reflog consultado aponta commits anteriores,
  sem um snapshot Git do trabalho pós-A2.
- `origin` aponta para `git@github.com:heartkeystudio/heartspace-docs-webapp.git`.
  `origin/master` e `origin/HEAD` locais apontam para o mesmo HEAD: divergência
  armazenada de 0 commits à frente e 0 atrás.
- A consulta viva `git ls-remote --heads --tags origin` falhou antes de obter as
  referências: `Bad owner or permissions on /etc/ssh/ssh_config.d/20-systemd-ssh-proxy.conf`.
  Não se conclui que o remoto esteja atualizado ou sem tags. Não foi tentado
  contornar a configuração nem modificar SSH/credenciais.
- Dentro deste repositório, não foram identificadas alterações de outros produtos.
  Isso não declara limpos os repositórios vizinhos, que não foram inspecionados.
  `AGENTS.md` é instrução local fornecida pelo usuário e deve ser preservado;
  sua inclusão no commit de produto deve ser deliberada, não automática.

**Pontos de recuperação efetivos:** HEAD e os commits anteriores recuperam somente
a base anterior à estabilização. Os relatórios, hashes e fixtures preservam provas
e casos sintéticos; não substituem um backup integral dos fontes atuais. O
histórico de autoria em memória e a recuperação de documentos não são backups do
código. Nenhum ponto Git que recupere integralmente o estado pós-A2 está identificado.

## Versão proposta e conteúdo

Proponho **`0.1.0-internal.1`**, primeira versão interna identificada neste
repositório. Não há manifest de aplicativo, tags locais ou convenção SemVer de
release identificada nas fontes consultadas. A numeração é uma proposta para
aprovação, não uma versão anterior inferida. Os números de schema, cache, protocolo
e especificação existentes não são números de release e permanecem inalterados.
A identificação definitiva deve acompanhar o commit consolidado e o pacote.

Notas de lançamento propostas:

- Histórico textual por documento durante a sessão, preservado ao alternar documentos.
- Cronologia coordenada entre comandos existentes de Escrever e Cena, incluindo
  texto de título/subtítulo, transformações, duplicação/remoção/ordem de elementos
  e controles de animação validados em A2.
- Confirmação única de edições contínuas cobertas, cancelamento sem entrada e
  preservação de alterações não relacionadas; conflitos são recusados com mensagem.
- Isolamento do histórico entre projetos/documentos e proteção contra histórico
  obsoleto, preservando S0-P04/S0-P05.
- Correções S0-P01/S0-P02 de validação de mídia na exportação e importação de
  elementos pelo perfil suportado; S0-P03 adia renomeação de Salvar como até a
  gravação confirmada ou início válido do download.
- Compatibilidade e recuperação validadas com cópias sintéticas; contratos,
  formatos persistidos e documentos autorais preservados, sem migração.

Não se anuncia o editor de Cena futuro como concluído. A especificação v1.0 e o
complemento continuam direção funcional; A3–A6/B–E e geração de arte por IA não
fazem parte desta versão.

## Limitações e pendências futuras

- Histórico somente em memória, até 60 entradas por documento. Fechar/reabrir
  inicia nova sessão; salvar não apaga as pilhas. Recuperação de trabalho não salvo
  continua separada e não restaura histórico.
- Com foco textual, o atalho não ignora uma operação posterior de outra superfície;
  o comando explícito de autoria permite percorrer a cronologia completa.
- A limitação H07 da herança existente permanece: uma sobrescrita coincidente pode
  perder sua intenção durante a reconstrução por diferença de valores. É risco
  autoral conhecido, não corrigido por A2; deve constar nas notas para a equipe,
  evitando prometer herança explícita completa. Sua presença já foi caracterizada;
  não abre novo ciclo de estabilização desta entrega. Nova evidência de perda ou
  corrupção fora do comportamento conhecido exige triagem imediata.
- Listas sem identidade estável são aplicadas atomicamente; conflitos não têm
  mesclagem automática. Repetição de tecla mantida não tem agrupamento próprio.
- Controles de composição/trilha conectados às rotas não foram todos ensaiados
  individualmente, sobretudo importações assíncronas. Arraste usou captura sintética;
  demais transformações foram verificadas por valores numéricos, sem certificação
  de todos os gestos físicos.
- Seletor nativo, IME e tecnologias assistivas permanecem pendentes de validação,
  com aceite ambiental do fundador. Esse aceite não certifica capacidades nem
  renuncia aos requisitos de acessibilidade.
- A fixture desktop não certifica o Core real. A evidência local também não
  certifica sincronização/CRUD remoto, Dashboard ou infraestrutura publicada.
  Esses limites não impedem o uso local interno; se o canal escolhido depender
  deles, uma conferência dirigida desse canal será requisito de entrega.

**Ainda fora do histórico coordenado validado:** alinhamento e formatação rica de
título/subtítulo, configurações globais de viewport, cadastros compartilhados de
recursos/personagens/variáveis, cobertura integral dos inspetores narrativos e
operações remotas. Zoom, seleção, navegação e reprodução são estado de utilização,
não ações autorais de Cena. Não apresentar undo/redo como cobertura universal.

## Estratégia de consolidação proposta

Após autorização específica:

1. Conferir a lista de arquivos e preservar uma cópia integral privada do estado
   atual, incluindo fontes não rastreados. Não usar restauração, limpeza ou stash
   como substituto dessa preservação.
2. Criar a branch `codex/docs-internal-0.1.0-1` a partir do HEAD, mantendo as
   alterações atuais. Selecionar explicitamente fontes, módulos, loader/CSP,
   testes, fixtures, evidências e documentação desta estabilização; não usar
   inclusão indiscriminada de arquivos locais ou dados de produção.
3. Criar um commit de consolidação pós-A2. Como as parcelas compartilham arquivos
   e não tiveram commits intermediários, não fabricar retrospectivamente commits
   independentes de S0/A1/A2 sem bases completas. Os relatórios preservam sua
   rastreabilidade e aprovações.
4. Depois da verificação final, criar a tag anotada `v0.1.0-internal.1` sobre esse
   commit. Guardar cópia privada do repositório ou bundle Git, além do pacote e seu
   manifesto SHA-256. A tag e o commit serão o ponto de recuperação recomendado.
5. Antes de push, restabelecer a consulta normal ao remoto, verificar divergência,
   destino e configuração de publicação. Se surgirem mudanças remotas, preservar
   ambos os estados e avaliar a conciliação; não forçar push.

A configuração ativa do GitHub Pages não foi consultada. Push em `master` pode
acionar publicação dependendo dessa configuração; não tratá-lo como operação sem
consequência. A autorização deve distinguir consolidação local, envio da branch
e publicação. O HEAD atual serve como base histórica de código, não como rollback
comprovado do site atualmente servido nem do estado pós-A2.

## Empacotamento e distribuição interna

O Docs é uma aplicação web estática. Não foi identificado empacotador de aplicativo
ou pipeline de release local. Os exportadores HTML/ZIP de histórias geram produtos
autorais e não devem ser confundidos com o pacote do editor.

O primeiro artefato pode ser um ZIP de conteúdo estático derivado de uma lista
explícita de arquivos do commit aprovado: editor, módulos locais (incluindo
`authoring-history-patch.js`), configuração pública existente, assets, vendor com
licenças e entrada desktop quando aplicável. Manter a estrutura de caminhos.
Excluir `.git`, testes/fixtures, relatórios de gestão, saídas temporárias, instruções
locais e qualquer documento real. Incluir notas de lançamento, versão, SHA do
commit e manifesto de hashes. O arquivo gerado deve ser imutável após o aceite.

**Canal inicial recomendado:** distribuição privada do pacote para a equipe,
servido por HTTP em origem local estável, ou em um destino interno já autorizado.
Não recomendar abertura por `file://`. As evidências não certificam funcionamento
integral offline; dependências externas existentes não serão substituídas nesta
consolidação. Evitar abrir o mesmo projeto simultaneamente em duas versões durante
a troca. Usar cópias de documentos na conferência do pacote final.

A origem faz parte do isolamento do armazenamento web: trocar host/porta pode
parecer perder documentos locais sem que tenham sido apagados. Manter a origem
operacional ou transportar cópias `.hdocs` explicitamente; não copiar bases de
armazenamento nem migrar documentos silenciosamente. Conservar a versão anterior
e as cópias autorais necessárias para retorno seguro.

**Se for escolhido o site/entrada desktop:** seguir
[desktop/README.md](desktop/README.md) e
[procedimento de cabeçalhos](ops/cloudflare-desktop-security.md).
Publicar os arquivos estáticos e atualizar a regra CSP com o valor correspondente
ao mesmo editor/loader. Confirmar no destino HTTP 200, ausência de erros de carga,
Cache-Control no-store, Referrer-Policy no-referrer e política de scripts/frames/IPC.
O diagnóstico existente do Core deve retornar `ready: true` para essa rota;
isso não certifica o backend. Essas ações operacionais precisam de autorização
de publicação e acesso ao canal, sem mudança de contrato ou enfraquecimento de CSP.

## Verificação mínima do pacote final

Não repetir uma auditoria do produto. No artefato extraído e servido:

1. Conferir versão/commit/manifesto e presença dos recursos, especialmente o novo
   módulo do histórico; abrir o editor sem erros de carga/CSP.
2. Abrir cópia de fixture compatível, editar texto e Cena alternadamente e executar
   duas operações consecutivas de undo/redo; alternar documento e conferir isolamento.
3. Salvar `.hdocs`, reabrir e conferir conteúdo/composição; fechar/reabrir a aplicação
   e verificar documento preservado e histórico de sessão vazio.
4. Conferir uma prévia narrativa e exportação HTML/ZIP da cópia, sem alterar a fonte.
5. Se usar desktop hospedado, fazer o diagnóstico de cabeçalhos e uma abertura pelo
   host real no alcance da entrega. Se usar fluxo remoto de equipe, conferir abertura
   e salvamento de um projeto descartável nesse fluxo, sem expandir a auditoria.

Se o empacotamento exigir alterar fontes além de metadados de release, apresentar
o diagnóstico antes. Falha de entrega deve ser distinguida de nova oportunidade
de melhoria; repetir apenas os testes afetados por eventual correção autorizada.

## Esforço restante e autorização

Estimativa técnica, sem nova implementação e com acesso operacional disponível:

| Atividade | Esforço ativo estimado |
|---|---|
| Revisão da lista, preservação integral, commit e ponto de recuperação | 45–90 minutos |
| Montagem do pacote estático, notas e manifesto | 30–60 minutos |
| Conferência dirigida do pacote final e registro | 45–90 minutos |
| Distribuição privada e identificação da versão entregue | 15–30 minutos |
| Site/desktop hospedado, se escolhido | Mais 30–90 minutos para publicação/CSP e conferência dirigida |

Total do pacote interno local: **cerca de 2h15–4h30 de trabalho ativo**; com site
hospedado: **cerca de 2h45–6h**, mais espera externa. A correção do ambiente SSH,
permissões de publicação, tempo de pipeline e eventual divergência remota não são
estimáveis com a evidência disponível. Não há esforço de A3 embutido nesses números.

Solicita-se autorização para a versão proposta, consolidação local e geração do
pacote. Push/tag/publicação e seu destino devem estar explicitamente abrangidos
pela próxima autorização para serem executados. Até lá, este registro é a proposta;
nenhuma dessas operações foi realizada.

## Política de entregas incrementais

Adotam-se entregas menores, frequentes e versionadas a partir deste marco.
Problemas fora do escopo são pendências, salvo segurança crítica, risco de perda,
corrupção ou sobrescrita de documentos, regressão relevante ou bloqueador real.
Refatoração, limitações conhecidas e funcionalidades futuras não reabrem ciclos
indefinidos de estabilização. Cada versão identifica o alcance efetivamente entregue,
as evidências pertinentes, limitações, commit/pacote e ponto de recuperação.

## Anexo do estado local antes deste registro

Arquivos rastreados modificados, todos sem staging:

```text
book-pagination.js
desktop/loader.js
index.html
local-projects.js
narrative-package.js
ops/desktop-csp.txt
scene-composer.js
tests/narrative-html.test.cjs
tests/narrative-media.test.cjs
tests/player-dom.cjs
```

Arquivos não rastreados, expandindo diretórios para não omitir evidências:

```text
AGENTS.md
SCENE_EDITOR_FUNCTIONAL_COMPLEMENT_V1.md
SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md
SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md
SCENE_EDITOR_STAGE_0_CLOSURE.md
SCENE_EDITOR_STAGE_0_CONSOLIDATED_ASSESSMENT.md
SCENE_EDITOR_STAGE_0_PLAN.md
SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md
SCENE_EDITOR_STAGE_0_REMAINING_REVIEW.md
SCENE_EDITOR_STAGE_0_RESULTS.md
SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md
SCENE_EDITOR_STAGE_A1_RESULTS.md
SCENE_EDITOR_STAGE_A2_RESULTS.md
SCENE_EDITOR_STAGE_A_TECHNICAL_PLAN.md
authoring-history-patch.js
tests/.gitignore
tests/README.md
tests/authoring-history-patch.test.cjs
tests/evidence/stage-a1-editor-matrix-before-a2.js
tests/evidence/stage-a1-results-2026-11-25.json
tests/evidence/stage-a2-node-2026-11-25.txt
tests/evidence/stage-a2-results-2026-11-25.json
tests/evidence/stage0-browser-2026-11-25.json
tests/evidence/stage0-consolidated-assessment-check-2026-11-25.json
tests/evidence/stage0-fixes-browser-2026-11-25.json
tests/evidence/stage0-fixes-node-2026-11-25.json
tests/evidence/stage0-formal-closure-2026-11-25.json
tests/evidence/stage0-functional-complement-provenance-2026-11-25.json
tests/evidence/stage0-functional-complement-received-2026-11-25.txt
tests/evidence/stage0-functional-complement-section8-completed-2026-11-25.txt
tests/evidence/stage0-history-browser-2026-11-25.json
tests/evidence/stage0-history-editor-2026-11-25.json
tests/evidence/stage0-history-hashes-2026-11-25.json
tests/evidence/stage0-history-node-2026-11-25.json
tests/evidence/stage0-history-recovery-2026-11-25.json
tests/evidence/stage0-parcel2-browser-2026-11-25.json
tests/evidence/stage0-parcel2-hashes-2026-11-25.json
tests/evidence/stage0-parcel2-node-2026-11-25.json
tests/evidence/stage0-parcel2-recovery-2026-11-25.json
tests/evidence/stage0-remaining-observations-2026-11-25.json
tests/evidence/stage0-s0p03-browser-2026-11-25.json
tests/evidence/stage0-s0p03-editor-2026-11-25.json
tests/evidence/stage0-s0p03-hashes-2026-11-25.json
tests/evidence/stage0-s0p03-node-2026-11-25.json
tests/evidence/stage0-s0p03-recovery-2026-11-25.json
tests/evidence/stage0-s0p04-browser-summary-2026-11-25.json
tests/evidence/stage0-s0p04-hashes-2026-11-25.json
tests/evidence/stage0-s0p04-node-2026-11-25.json
tests/evidence/stage0-s0p05-results-2026-11-25.json
tests/evidence/stage0-section8-completion-check-2026-11-25.json
tests/evidence/stage0-summary-2026-11-25.json
tests/fixtures/stage0-current.hdocs
tests/fixtures/stage0-editor-saved.hdocs
tests/fixtures/stage0-legacy.hdocs
tests/fixtures/stage0.js
tests/prepare-stage0.cjs
tests/run-stage0.cjs
tests/stage0-browser.html
tests/stage0-browser.js
tests/stage0-compatibility.test.cjs
tests/stage0-editor-matrix.js
tests/stage0-editor-support.js
tests/stage0-history.test.cjs
tests/stage0-inheritance.test.cjs
tests/stage0-native-input.js
tests/stage0-recovery.html
tests/stage0-recovery.js
tests/stage0-storage-context.html
```
