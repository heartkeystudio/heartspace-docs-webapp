# Etapa 0 — recuperação, interrupções e herança autoral

Parcela posterior: [Herança autoral e transações](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md)
consolida os comandos do editor, o inventário e as propostas. S0-P04 foi identificada,
sem correção. Os resultados abaixo permanecem registro da parcela anterior.

## Atualização — S0-P03 corrigida com autorização específica

Em 25/11/2026, após autorização do fundador, a correção foi aplicada somente em
`local-projects.js`. O nome solicitado fica na cópia portátil durante a preparação.
A área de autoria recebe esse nome depois de `stream.close()` bem-sucedido ou do
acionamento do link de download. O contexto ainda precisa corresponder à operação.
Nenhum snapshot antigo é reinstalado na área atual.

O sucesso mantém mensagens distintas: **Arquivo do projeto salvo** na gravação
direta e **Download do projeto iniciado** no caminho alternativo. Download não
constitui confirmação de gravação em disco. Falhas continuam exibidas em status;
cancelamento do seletor não gera erro nem renomeação.

Depois da renomeação confirmada, o flush grava o estado atual no cache local.
A assinatura da cópia salva impede que a própria renomeação crie uma falsa edição
pendente; o contador de edições e a comparação com o estado atual preservam as
alterações posteriores ao snapshot. Não se restaura conteúdo, livros ou registros
anteriores para tentar desfazer uma falha.

| Verificação após a correção | Resultado real |
| --- | --- |
| Node estrito, incluindo os 60 originais e 15 de herança | 75/75 pass; zero fail, TODO ou skip |
| Regressão de navegador anterior | 11/11 pass, incluindo recuperação após recarga |
| Recuperação e salvamento no navegador | 24/24 pass: R01–R15 mais nove cenários S |
| Editor completo em cópia de teste | Salvar como por download, mensagem de início, nome persistido após recarga e cancelamento do diálogo conferidos |
| Arquivo `.hdocs` baixado pelo editor | Nome novo; formato/versões, IDs, título, atributos narrativos, escolhas, efeitos, condições, camadas, animação e checksums preservados |
| Sintaxe e `git diff --check` | Sem erro |

R14 passou de caracterização do defeito a regressão que exige o nome original
após erro de preparação. Os novos casos verificam:

- S01: nome antigo até close confirmar; cópia com nome novo; sucesso sem pendência falsa.
- S02-create/write/close: falhas nas três fases mantêm nome original e edições recentes, exibindo o erro.
- S03: cancelamento injetado mantém fonte, nome, vínculo ao arquivo anterior e alterações pendentes.
- S04: edições durante preparação, escrita e fechamento sobrevivem ao sucesso e continuam pendentes.
- S05: troca de contexto durante close não renomeia outra área.
- S06: download usa cópia portátil real, com nome solicitado, antes da renomeação; a leitura dessa cópia não contém edições posteriores que permanecem na autoria.
- S07: falha ao disparar o download mantém o nome e informa erro.

As fronteiras de seletor/stream e os callbacks do controlador continuam controlados
nos testes de falha/concorrência; não foram gravados arquivos reais para simular
falhas do sistema. S06 utiliza build/read reais de `.hdocs` e observa o Blob entregue
à criação da URL, sem relaxar a CSP. Uma primeira tentativa de leitura via fetch
foi bloqueada pela CSP da página de teste e corrigida na infraestrutura, sem mudança
de produto. O gesto de cancelar o seletor nativo continua sem certificação; o
tratamento de AbortError foi testado por injeção. O editor completo exercitou o
caminho existente de input/download, com ausência da API nativa simulada.

Evidências novas: [Node](tests/evidence/stage0-s0p03-node-2026-11-25.json),
[navegador anterior](tests/evidence/stage0-s0p03-browser-2026-11-25.json),
[recuperação e S0-P03](tests/evidence/stage0-s0p03-recovery-2026-11-25.json),
[editor e arquivo](tests/evidence/stage0-s0p03-editor-2026-11-25.json).
Origem exclusiva `http://127.0.0.1:8775`; Node v22.23.1, Chrome integrado 155/Linux.
Logs e arquivo baixado de teste em `tests/.stage0-output/`, ignorado pelo Git.

Nesta correção foram alterados `local-projects.js`, `tests/stage0-recovery.js`,
`tests/stage0-recovery.html` e `tests/prepare-stage0.cjs` (cache da cópia de editor),
além dos registros e evidências. As demais alterações locais preexistentes foram
preservadas. Nenhum contrato, formato, migração, integração, projeto de produção
ou etapa A–E foi alterado. A especificação v1.0 e os três `.hdocs` congelados mantêm
os mesmos hashes. A geração de arte por IA continua excluída.

**Estado de encerramento:** S0-P03 atendida no escopo validado. A etapa 0 permanece
aberta: intenção de herança/H07, transações de desfazer, comandos completos de edição,
identidade/substituição, geometria e acessibilidade mantêm as pendências da tabela
histórica abaixo. A ressalva de S0-P03 naquela tabela foi resolvida por esta atualização.

**Próxima parcela recomendada:** consolidar a semântica de herdar/sobrescrever e as
unidades de transação/desfazer, demonstrando os comandos de edição, restauração,
duplicação, remoção e reordenação no editor com documentos descartáveis. Entregar
regras propostas e cenários de aceite antes de implementar H07 ou novos comportamentos.
Se a proposta atingir formato ou consumidor compartilhado, preparar o encaminhamento
ao Master. Não iniciar A–E automaticamente.

## Registro histórico da investigação anterior à correção

Data: 25/11/2026. Heartspace Docs — Especialista.
Autorização: segunda parcela de investigação, testes e infraestrutura, sem novos
comportamentos do produto. Referência: HEAD `959b9b13cb13162aa1963b2fc7bffb97fb17ba61`
mais as correções locais S0-P01/S0-P02 aprovadas na parcela anterior. Nenhum módulo
do produto foi alterado nesta parcela; as alterações desses dois módulos já
existiam na área de trabalho. Nenhum contrato, formato ou projeto real foi alterado.
A especificação v1.0, os três `.hdocs` congelados e a exclusão de arte por IA foram preservados.

## Resultado e evidências

| Execução | Resultado | Natureza da evidência |
| --- | --- | --- |
| Regressão Node anterior | 60/60 pass | Mesmos casos, sem remoção ou flexibilização nesta parcela |
| Herança H01–H15 | 15/15 pass | APIs reais em VM; casos de caracterização, inclusive limitações |
| Total Node estrito | 75/75 pass, zero TODO/skip/fail; saída 0 | `node tests/run-stage0.cjs --strict-known` |
| Regressão de navegador anterior | 11/11 pass | B01–B09, S0-P01/S0-P02; IndexedDB e mídia reais |
| Recuperação/interrupção R01–R15 | 15/15 pass | Navegador e DOM reais; fronteiras indicadas abaixo substituídas por dublês |
| Seletor nativo real | Inconclusivo | APIs presentes; pedido permaneceu pendente; Escape pela automação não confirmou cancelamento |

Um teste de caracterização passar significa que o comportamento foi reproduzido,
não que a limitação foi aprovada. H07 registra perda da intenção de sobrescrever
valor igual. R14 registra alteração do nome após falha em Salvar como (S0-P03).

Evidências: [Node](tests/evidence/stage0-parcel2-node-2026-11-25.json),
[regressão de navegador](tests/evidence/stage0-parcel2-browser-2026-11-25.json),
[recuperação](tests/evidence/stage0-parcel2-recovery-2026-11-25.json) e
[hashes](tests/evidence/stage0-parcel2-hashes-2026-11-25.json).
Node v22.23.1; Chrome integrado 155, Linux; origem exclusiva desta rodada
`http://127.0.0.1:8773`. O servidor foi usado somente em loopback, sem login.
O agregador exigiu permissão para subprocessos; a recusa EPERM do sandbox foi
tratada como limitação da execução, não como falha do Docs. A execução autorizada
com subprocessos concluiu os 75 casos.

## Recuperação e interrupções

`project-storage.js` grava por chave, em ordem de chamada. A confirmação ocorre
no término da transação. `current` guarda a última cópia; `previous` preserva uma
cópia de outra sessão, sem criar uma revisão por edição. Uma instância nova do
módulo em iframe exercita outra sessão de escrita no mesmo IndexedDB real.
Isso não certifica concorrência de dois processos ou sincronização remota.

| Caso | Operação e resultado observado |
| --- | --- |
| R01 | Três escritas simultâneas da mesma instância terminam na ordem de chamada |
| R02 | Nova sessão mantém a última cópia da sessão anterior; edições seguintes não a substituem |
| R03 | Abort de transação real, injetado antes do commit, rejeita a gravação e preserva a cópia confirmada; escrita seguinte funciona |
| R04 | Destruir iframe depois da confirmação e abrir outro preserva a cópia |
| R05–R06 | `AbortError` injetado nos seletores de abertura/gravação não instala, renomeia nem prepara arquivo |
| R07 | Leitura atrasada após mudança de contexto não instala o projeto antigo |
| R08 | Permissão de escrita recusada não altera a fonte nem declara backup |
| R09 | Falha durante write chama abort, não close, e não declara backup salvo |
| R10 | Contexto muda durante write: abort antes de close |
| R11 | Edição posterior ao snapshot permanece pendente após close bem-sucedido |
| R12 | Fechar o diálogo de novo projeto preserva a fonte |
| R13 | Fechar recuperação não instala; selecionar cópia válida instala uma vez e mantém o registro original |
| R14 | Falha na preparação de Salvar como mantém o nome alterado: S0-P03 |
| R15 | Fonte recuperada inválida é recusada antes da instalação |

R01–R04 executam armazenamento real. R05–R15 executam `local-projects.js` real
em DOM de iframe, com seletores, stream e módulo de arquivo substituídos na
fronteira, além de callbacks controlados de contexto, snapshot e instalação.
R13/R15 usam registros sintéticos reais, filtrados pela chave exclusiva
`heartspace-docs-local:stage0-recovery-only`. Não são aceite da instalação
completa do editor: sanitização, persistência de imagens, restauração de todos
os painéis e mudança real de conta/projeto precisam de percurso próprio.

A implementação do editor inclui flush ao ocultar/sair e aviso de alterações
pendentes (`index.html`, handlers `visibilitychange`, `pagehide`, `beforeunload`).
Isso foi identificado por leitura, sem equiparar início de operação assíncrona a
commit garantido durante encerramento. Queda do processo, energia, quota, disco,
evicção do navegador e fechamento antes da confirmação continuam sem certificação.

O compositor mantém transformações de arraste em prévia até pointerup e trata
pointercancel/lostpointercapture restaurando a prévia. Essa conclusão é estática
(`scene-composer.js`); não houve injeção real de perda de ponteiro nesta rodada.
Não se presume que uma prévia temporária esteja salva no cache.

## Matriz de herança autoral

Os casos usam um elemento textual `e`, base x=10/y=20, momento a com x=30 e
momento b com y=60. A fixture é construída em memória; os arquivos congelados
não foram modificados. O resolvedor aplica patches pela ordem dos blocos e IDs
estáveis; não representa uma árvore genérica de herança entre cenas.

| Caso | Ação | Comportamento atual | Implicação |
| --- | --- | --- | --- |
| H01 | Mudar x em a para 45 | b/c recebem x=45 e mantêm y=60 | Personalização de outra propriedade é preservada |
| H02 | Mudar texto e x da base | Texto propaga; x local permanece 30 | Herança por propriedade já existe no modelo |
| H03 | Remover somente x do patch b | x volta a 30; y permanece 60 | Operação no modelo; não há aceite de botão de restauração individual |
| H04 | Remover cue inteiro de b | Propriedades e animação próprias desaparecem | Corresponde ao alcance de Herdar anterior; exige comunicação clara |
| H05 | Reset em b; mudar base x=75 | b recebe x=75 e seu y=60 | Reset referencia a base atual, não snapshot histórico |
| H06 | Patch b declara x=30, igual a a; depois a muda | b mantém x=30 | Persistência/resolvedor conseguem expressar intenção explícita |
| H07 | Recalcular diff de b ao editar outra propriedade | x igual é omitido; futura mudança em a propaga | Edição por diferença de valores não preserva toda intenção explícita |
| H08 | Remover bloco b e depois restaurar seu ID | Cue fica inerte e volta a agir com o ID | Excluir bloco não elimina automaticamente seus dados de cena |
| H09 | Inverter a/b com sobrescritas de x | Última sobrescrita na nova ordem vence | Reordenação muda composições posteriores |
| H10 | Novo bloco com novo ID, sem cue copiado | Herda predecessor; não recebe y de b | Copiar texto não implica copiar composição |
| H11 | Copiar explicitamente cue para outro ID | Ajustes da cópia independem de b | Cenário de dados; não certifica comando de duplicação da interface |
| H12 | Remover e, depois patch de transformação | Não ressuscita e; reset o recupera da base | Proteção contra imagem vazia permanece |
| H13 | Patch completo com type depois da remoção | Elemento pode retornar com o mesmo ID | Diferente de patch parcial |
| H14 | Consultar poses e animações | Fonte permanece imutável | Consultar não grava personalizações |
| H15 | Executar escolha, efeito e restaurar runtime | Variável muda; fonte/cues permanecem intactos | Estado narrativo em execução é distinto da herança autoral |

H03/H08–H11 validam transformações das entradas do resolvedor, não toda a cadeia
de comandos de edição, clipboard, undo/redo e salvamento da interface. A matriz
é uma referência verificável do modelo existente; não implementa novos comandos.
O comportamento de IDs duplicados por dados inválidos e de cópia entre sequências
ainda requer cenários próprios. Reset, remoção e reordenação precisam de aviso de
consequências e transações de desfazer na futura fundação, sem decisão de UI aqui.

A herança autoral produz a apresentação com base em fonte, patches e ordem.
O runtime mantém posição e variáveis, avalia condições e executa efeitos. A
restauração do runtime não cria um patch de autoria nem deve ser usada como
restauração de propriedade. A recuperação do cache, por sua vez, recupera a fonte
salva; não se confunde com restaurar progresso do jogador ou herdar um momento.

## Diagnóstico que requer autorização: S0-P03

**Reprodução mínima:** abrir Salvar como, escolher outro nome, aceitar o destino;
provocar falha na preparação do arquivo. R14 faz isso com o controlador real e
um erro injetado em `HeartspaceDocsProjectFiles.build`. O nome da fonte em memória
muda, mesmo sem arquivo novo e sem indicação de backup concluído.

**Causa:** `local-projects.js`, `writeFile`, chama `options.rename(projectName)`
antes de aguardar `files.build`, `stream.write` e `stream.close`. O catch informa
o erro, mas não desfaz a renomeação. Não foi observada perda de conteúdo ou escrita
em arquivo real nesse teste; persistência posterior do nome pelo editor completo
não foi certificada. A falha é de preservação do nome apresentado após operação malsucedida; o ID
estável do projeto não muda. Seu alcance é local, sem alteração de contrato compartilhado.

**Proposta para autorização específica:** adiar a renomeação da área até `stream.close` bem-sucedido na gravação direta
ou até o disparo bem-sucedido do download no caminho alternativo, usando o nome
solicitado somente na cópia destinada ao arquivo enquanto a gravação está em andamento. Preservar alterações concorrentes
e a sinalização de arquivo desatualizado; não restaurar um snapshot inteiro.
Testar preparação, write e close falhos, cancelamento, sucesso e edição simultânea.
Para download, a política proposta confirma somente o início da transferência,
sem afirmar gravação em disco. Nenhuma correção foi aplicada; essa proposta depende
da autorização específica do fundador.

H07 já era conhecido como C07 da parcela anterior. É uma limitação do mecanismo
de diff, não um novo formato aprovado. Antes de corrigi-la, decidir a semântica de
intenção: um simples diff não distingue valor coincidente, herança e sobrescrita.
Recomenda-se preservar intenção existente ao editar outra propriedade; o desenho
de restauração individual e eventuais metadados deve ser aprovado separadamente.
Se afetar formato ou consumidores compartilhados, encaminhar ao Master antes de
qualquer alteração. Não há comunicação automática com outro chat.

## Critérios de encerramento da etapa 0

Avaliação dos critérios do planejamento, limitada às evidências locais:

| Critério | Situação | Evidência ou pendência |
| --- | --- | --- |
| Referência e corpus protegidos | Satisfeito | Código/ambiente identificados; hashes da especificação e três originais intactos |
| Classificação e infraestrutura de testes | Satisfeito | 60 anteriores preservados, 15 H novos, baterias separadas e fronteiras explícitas |
| Casos relevantes sem falhas inexplicadas de integridade/perda | Parcial | Sem falha inexplicada no corpus; S0-P03 e H07 diagnosticados ainda precisam decisão e validação de correção |
| Compatibilidade, reabertura e HTML/ZIP | Satisfeito no corpus | Referência anterior e 11 casos de navegador repetidos; não é cobertura de todo documento existente |
| Separar navegador, simulação, remoto e hardware | Satisfeito | Categorias e limites registrados; remoto/hardware não exercitados |
| Regras de herança e intenção demonstradas | Parcial | Matriz executada; intenção explícita e comandos completos da interface ainda não resolvidos |
| Transações e desfazer definidos | Pendente | Delimitar unidade autoral, cancelamento, undo/redo e interrupções de arraste |
| Identidade/substituição e revisão geométrica | Pendente | Preservação de IDs validada no corpus; revisão assistida de alvos/proporções não definida |
| Alternativa espacial escolhida com evidência | Pendente | Grupos, âncoras, regiões e parallax exigem comparação específica |
| Acessibilidade e preservação em cada parcela | Parcial | Preservação testada; foco, leitura assistiva e cancelamento nativo ainda sem aceite completo |
| Questões transversais registradas com responsável | Parcial | Pauta do plano para Master mantida; decisões não presumidas |
| Primeira parcela de implementação delimitada | Pendente | Não propor início automático de A; depende das decisões restantes da etapa 0 |

A etapa 0 inteira **não está encerrada**. Esta parcela entrega a investigação e
as evidências acima, com limitações explícitas. Nenhum novo comportamento de
herança, composição ou recuperação foi implementado.

**Próximas atividades:** obter autorização específica para S0-P03; decidir a
intenção de herança e demonstrar os comandos de edição com arquivos descartáveis;
fechar unidades de transação/desfazer; depois aprofundar identidade e organização
espacial. O cancelamento nativo requer uma sessão com seletor controlável ou
verificação humana. Queda antes do commit e encerramento abrupto exigem ambiente
de falhas dedicado. A–E, integrações, migrações e novas funcionalidades permanecem
fora desta autorização.
