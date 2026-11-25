# Testes locais de Cena e compatibilidade

A primeira parcela da etapa 0 usa apenas documentos sintéticos e módulos locais.
Não depende de conta, backend, projeto real ou pacote instalado. Geração de arte
por IA não integra os testes; a imagem é um quadrado de teste criado por canvas.

## Execução em Node

Requer Node com `node:test`, `structuredClone`, `atob` e `btoa` (verificado com
Node v22.23.1). Na raiz de `docs/`:

```sh
node tests/run-stage0.cjs
node tests/run-stage0.cjs --strict-known
```

Os dois problemas conhecidos S0-P01/S0-P02 foram corrigidos com autorização
específica e seus casos agora são regressões normais. Referência aprovada: 60 casos. Com os 15 casos de herança da segunda parcela,
o modo estrito atual executa **75 casos, 75 aprovados, zero falhas e zero TODO**. O agregador mantém
suporte a TODO para diagnóstico futuro; saída zero com TODO não seria aceite
integral. Um TODO que passe inesperadamente exige revisão e faz o runner falhar.
Consulte [o relatório](../SCENE_EDITOR_STAGE_0_RESULTS.md).
Os logs e totais ficam em `.stage0-output/node*.tap` e `node*.json`, ignorados pelo Git.

Os arquivos também podem ser executados diretamente para diagnóstico:

```sh
node tests/narrative-html.test.cjs
node tests/narrative-media.test.cjs
node tests/stage0-compatibility.test.cjs
```

O agregador evita depender de um relatório que mostre somente o resultado do
arquivo filho: ele imprime e soma cada caso. O suporte a criação de subprocessos
pode depender das permissões do ambiente. Falha `EPERM` ao iniciar um processo
não é falha do Docs; não aceitar uma execução sem casos como sucesso.

## Navegador real

Prepare as cópias descartáveis e sirva a raiz somente em loopback:

```sh
node tests/prepare-stage0.cjs
python3 -m http.server 8769 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8769/tests/stage0-browser.html` em um perfil/origem local
de teste, sem login. Escolha uma porta nova caso essa origem já contenha trabalho
local relevante. Clique **Executar casos locais** e aguarde a conclusão. Os casos
S0-P01 e S0-P02 devem passar após as correções autorizadas.
Recarregue e clique **Conferir recuperação após recarregar** para testar B09.
O botão de recuperação exige que uma execução anterior tenha preparado a cópia.

O runner usa DOM, decodificação e IndexedDB reais, com conexão de rede bloqueada
por CSP. Escreve somente chaves sintéticas `heartspace-docs-local:stage0-compatibility-only`
e `...-other` na origem de teste. A referência `canvas` na mídia é sintética:
não comprova catálogo ou integração com o Canvas. Não há limpeza destrutiva de
bancos ou pastas do usuário.

## Percurso no editor

Abra `http://127.0.0.1:8769/tests/.stage0-output/editor.html`. Essa é uma cópia
gerada do `index.html`, carregando os módulos originais. O suporte de teste:

- Simula ausência dos seletores nativos de arquivos para exercitar o caminho de
  input/download padrão, que o produto já oferece.
- Bloqueia conexões externas e observa cópias dos bytes de downloads em links
  persistentes, para contornar limitações da automação com URLs revogadas.
- Não modifica `index.html`, os formatos ou as regras do produto.

O percurso não certifica `showOpenFilePicker`, `showSaveFilePicker`, integração
Core real nem gravação direta em arquivo por handle.

1. Abrir `fixtures/stage0-current.hdocs` pelo botão **Abrir projeto**.
2. Entrar em **Cena**, selecionar o momento **A porta se move.** e a camada Porta.
3. Conferir X=40, rotação=10, escala=100 e timeline de 0,70 s.
4. Alterar X para 45, sair do campo, salvar projeto e guardar o arquivo baixado.
5. Reabrir esse arquivo; conferir X=45 e a trilha preservada.
6. Abrir **Testar sequência**, avançar dois blocos e comparar escolhas disponíveis.
   A opção Trancada deve estar desabilitada. Acionar Abrir deve levar ao final.
7. Voltar à autoria, exportar HTML e ZIP por **Ações → Exportar**. A referência
   órfã deve gerar aviso; não executar a limpeza.
8. Abrir o HTML e o ZIP extraído, comparar pose=45 e alcançar o mesmo final.
9. Para S0-P02, usar **Trocar imagem** e **+ Imagem** com PNG válido: conferir
   sucesso, preservação do ID/pose/trilha na troca e uma única nova camada na inclusão.
   Recusar um SVG na troca deve manter o recurso anterior; salvar e reabrir para conferir.
   O cancelamento nativo requer conferência manual: a automação não aceita seleção vazia.

`stage0-editor-saved.hdocs` é o resultado sintético real salvo no percurso acima,
retido para regressão. A fixture legada representa ausência dos campos opcionais
atuais; não é um documento real nem prova de abertura em versões históricas.
Os três arquivos `.hdocs` devem permanecer congelados como entradas de teste.

## Limites do simulador

`player-dom.cjs` implementa somente o subconjunto DOM usado nos testes: estrutura
básica da página, seletores simples, captura/propagação de eventos, foco, visibilidade,
armazenamento e relógio controlado. Os scripts executam na ordem real, incluindo
bootstrap. Erro de inicialização não pode ser tratado como sucesso do teste.

Não modela layout, CSS completo, decodificação de imagem, áudio real, tela cheia,
parallax físico ou Web Animations. Frames de layout ficam separados dos timers
narrativos. Os testes de leitura de imagem usam um dublê explícito na fronteira
do otimizador; B07 verifica o otimizador real no navegador. O simulador não
substitui a conferência real do editor e do player.

## Recuperação e herança — segunda parcela

O runner Node inclui `stage0-inheritance.test.cjs` (H01–H15), mantendo os 60 casos
anteriores. H07 caracteriza a perda de intenção de valor igual pelo diff; passar
esse caso não aprova o comportamento como regra futura.

Com o servidor local acima (ou outra porta exclusiva), abra
`tests/stage0-recovery.html` e clique **Executar recuperação e interrupções**.
A referência inicial teve R01–R15 aprovados. Após a correção autorizada de S0-P03,
a bateria atual tem 24 casos aprovados (R01–R15 e nove cenários S). O relatório diferencia armazenamento
real (R01–R04) de controlador/DOM reais com fronteiras substituídas (R05–R15).
R14 agora exige preservar o nome após falha de preparação. S01–S07 (S02 tem três
fases) verificam close confirmado, falhas, cancelamento, edições concorrentes,
contexto e download. H07 continua uma caracterização de limitação; testes aprovados
não significam que todas as pendências da etapa 0 estejam resolvidas.

Essa página usa exclusivamente `heartspace-docs-local:stage0-recovery-only`.
R02/R04 abrem iframes de `stage0-storage-context.html` para instâncias independentes
do módulo de armazenamento; não equivalem a dois processos ou queda de energia.
A injeção de abort restaura `IDBDatabase.prototype.transaction` em finally.
Os seletores e streams falsos só existem nessa página, sem gravar arquivos reais.
O callback de instalação é controlado; não certifica o editor completo.

**Investigar seletor nativo sem ler arquivo** chama a API original, se existir.
Cancelar manualmente deve produzir `AbortError`; a automação desta rodada deixou
o pedido pendente e não conseguiu certificá-lo. Recarregar/fechar a página abandona
o teste. Nenhum arquivo escolhido por esse botão é lido ou instalado.

Consulte a [matriz, diagnósticos e critérios de encerramento](../SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md).

## Herança e histórico no editor completo — terceira parcela

O runner agora inclui `stage0-history.test.cjs`: dez casos extraem as funções
existentes de histórico do `index.html` e verificam o núcleo em VM, sem simular
que texto e Cena já compartilham transações. Total atual: **85/85 Node**, mantendo
os 75 anteriores. As âncoras de extração falham explicitamente se o código mudar.

Execute `node tests/prepare-stage0.cjs` e abra
`tests/.stage0-output/editor-matrix.html` no servidor de loopback. Clique
**Executar matriz no editor de teste**. A página deve ter 17 caracterizações
reproduzidas; M12 comprova S0-P04, e passar esse caso não significa isolamento
correto. O arquivo `stage0-editor-matrix-results.json` registra as observações.
As baterias anteriores continuam em suas páginas, com 11 e 24 casos respectivamente.

A cópia nova contém um observador de leitura que devolve JSON clonado de fonte,
corpo, contexto, pilhas e runtime. Os comandos usam os handlers DOM do editor;
`index.html` e módulos do produto não recebem hook. Cada caso abre cópia nova do
corpus congelado; M12 cria outra cópia em memória com mesmo ID de documento e outro
projeto. Use origem exclusiva de teste: várias cópias sintéticas ficam na recuperação.

Drag/drop usa eventos sintéticos; os três testes de ponteiro substituem somente
set/has/releasePointerCapture da superfície, restaurados em finally. Não certificam
hardware ou clipboard/IME nativos. Os testes não implementam herança, transações
ou proteção contra S0-P04. Consulte [inventário, decisões e critérios](../SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md).

## Regressão S0-P04 — isolamento do histórico atual

Estado atual: **93/93 Node**, **11/11 compatibilidade**, **24/24 recuperação** e
**23/23 matriz do editor**, mais um teste de fechamento/reabertura. Os totais
anteriores acima são registros históricos. T11–T18 acrescentam contexto/época,
commit atrasado, redo e barreira nativa; T01–T10 foram preservados.

Após preparar e servir a cópia, execute a matriz normalmente. M12 agora exige
bloquear o undo/redo estrangeiro (não reproduzir a vulnerabilidade). M16–M21
cobrem reabertura, rotas nativas, novo projeto, recuperação e troca de documento.
M20, executado por último, prepara ambas as pilhas e guarda somente metadados de
verificação em `localStorage['stage0-history-close-test']`, na origem de teste.

Depois de concluir a matriz, feche realmente a aba. Abra novamente a mesma URL
`tests/.stage0-output/editor-matrix.html` na mesma origem e clique **Conferir
histórico após fechar e reabrir**. O resultado esperado é CLOSE-REOPEN pass,
bodyPreserved=true, history=0, redo=0. Não rode a matriz outra vez antes dessa
verificação, pois ela abre cópias novas e substitui a pré-condição.

O fallback nativo permanece bloqueado no corpo do editor depois de uma troca de
contexto/documento nessa página. Ações cobertas só pelo nativo podem não ter undo;
a correção não amplia a cobertura atual. Veja o [registro e limites](../SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md).

## Caracterização residual (25/11/2026)

A bateria estrita tem 97 casos; C19–C22 caracterizam identidade, proveniência,
lista plana e independência de regiões. Não implementam novos comportamentos.
A preparação também produz `editor-native.html`. Use somente fixtures descartáveis,
posicione a seleção pelos botões e acione teclado real; Registrar etapa mostra
corpo, pilhas e eventos. Recarregar limpa os registros. O campo `prevented` não
prova cancelamento final; analisar corpo e pilhas. Resultados e limites estão no
relatório de preparação restante e na evidência resumida correspondente.

## Regressão S0-P05

A execução estrita tem 101 casos. T19–T22 verificam transações síncronas aninhadas,
no-op e mudança de contexto; T16 exige fallback nativo bloqueado desde a carga.
A matriz no editor tem 26 casos: os 23 anteriores e P05-01–03. A seleção antes
de acionar a barra aguarda um turno para receber selectionchange, como no percurso
real. Scripts gerados de teste recebem cache busting. A verificação adicional de
fechamento/reabertura continua sendo executada em nova aba após M20.
Resultados, entradas reais de teclado e limites estão em
`SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md` e na evidência S0-P05 correspondente.

## Regressão A1

A bateria estrita tem 109 casos, incluindo A101–A108 de histórico por documento
e finalização real da captura de edição. T03 agora inspeciona a pilha de B vazia,
enquanto a pilha de A permanece na sessão de A; M21 conserva a mesma proteção com
a expectativa equivalente. Os resultados anteriores continuam nas evidências.
A matriz do editor tem 32 casos (26 anteriores + A1-01–06), além da verificação
em nova aba após M20. A preparação invalida também o cache de book-pagination.js.
O painel de teclado real permite carregar dois documentos sintéticos iguais e
registra documento/contexto junto ao corpo e às contagens de undo/redo.
Ver SCENE_EDITOR_STAGE_A1_RESULTS.md e stage-a1-results-2026-11-25.json.


## Regressão A2

A bateria estrita executa 119 casos (109 anteriores + J01–J10 do módulo privado
de patches). A matriz passa a 41 cenários, incluindo A2-01–09 e fechamento real
em aba nova. A cópia anterior da matriz A1 está preservada em evidence.
Expectativas de ausência de histórico em Cena foram atualizadas para A2.
O teste aguarda o subtítulo importado antes de editar e restabelece a seleção
após o refluxo antes do botão de formatação, com selectionchange explícito.
Resultados e limites: SCENE_EDITOR_STAGE_A2_RESULTS.md e evidência A2.
