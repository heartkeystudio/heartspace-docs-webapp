# Etapa 0 — correção local S0-P05

Data: 25/11/2026. Autorização: diagnóstico complementar e correção local usando
as transações existentes. Não foi implementado novo sistema de histórico.

## Resultado

S0-P05 foi corrigido no alcance local validado: formatação por atalhos e pela
barra usa snapshots do histórico existente, com isolamento de contexto mantido.
A pilha nativa opaca do corpo não é usada como fallback, inclusive na primeira
carga. O conteúdo salvo deixou de ser consumido por desfazer com pilha vazia nos
ensaios. Nenhum contrato, formato persistido ou migração foi alterado.

## Diagnóstico e solução

`applyInlineCommand` e os atalhos de lista executavam comandos do navegador sem
abrir transação explícita. No Chromium observado, execCommand de formatação podia
gerar input sem beforeinput; assim a captura genérica não possuía o estado anterior.
O botão da barra já possuía captura explícita, produzindo comportamento diferente.

A nova função local `runNarrativeCommand` usa exclusivamente remember/commit já
existentes. Comandos síncronos aninhados compartilham uma única unidade; commits
de eventos síncronos internos são suprimidos até o commit externo. Sem alteração
no corpo, nenhuma entrada é criada e o ramo de refazer permanece disponível.
As verificações existentes de contexto, documento e corpo esperado continuam
impedindo a aplicação de snapshots sobre estado divergente.

Foram envolvidos: comandos da barra, tarefas/callouts da barra, formatação inline
por teclado, listas por atalho, inserção de link e comandos de formatação do menu
slash (bloco, alinhamento, listas, tarefas, callout, inline e link). A captura do
slash começa antes da retirada do texto do comando, evitando duas unidades para
um único gesto. Operações assíncronas de mídia não foram envolvidas nesse wrapper.
O helper é síncrono e não deve ser reutilizado em tarefas que aguardem Promises.

O fallback nativo inicial também não tinha uma base confiável: a instalação do
corpo salvo é programática, e a pilha privada do navegador não possui identidade
de projeto nem snapshots inspecionáveis. O ensaio anterior que esvaziava um
parágrafo justificou bloquear esse fallback desde o início. Não foi necessário
identificar ou manipular a unidade privada interna do navegador para impedir
esse caminho. O histórico próprio continua disponível para as ações capturadas.

Os botões Desfazer/Refazer preservam o foco por mousedown. Quando um campo textual
fora do corpo está ativo, não deslocam o foco nem consomem o histórico do corpo;
**não executam desfazer nesse campo**. O teclado no próprio campo mantém seu
comportamento nativo anterior. Isso evita introduzir outro acesso à pilha opaca e
não promete um histórico integrado de título, subtítulo, formulários e Cena.
A integração desses históricos permanece uma decisão posterior.

## Validação executada

Somente documentos sintéticos, cópias descartáveis e origem local sem login.
Navegador observado: Chromium 155, Linux, pelo navegador integrado. O servidor
local foi usado somente para servir o corpus de testes.

| Bateria | Resultado |
|---|---|
| Node, execução estrita | **101/101**, sem falhas, TODO ou skip |
| Compatibilidade no navegador, incluindo recarga B09 | **11/11** |
| Recuperação/interrupções e regressões de S0-P03 | **24/24** |
| Editor completo: 23 casos anteriores + P05-01–03 | **26/26** |
| Fechar aba e abrir nova aba no mesmo contexto salvo | **1/1**, corpo preservado e pilhas vazias |
| Sintaxe dos scripts inline e scripts de testes modificados | Aprovada |

T19–T22 acrescentam casos de transação aninhada/evento, no-op preservando redo e
mudança de contexto durante comando. T16 foi atualizado intencionalmente: o
fallback do corpo agora é bloqueado desde a carga inicial. As demais regressões
foram preservadas. P05-01 compara a mesma formatação por interface e atalho e os
limites de undo/redo; P05-02 exercita reabertura sem consumo de histórico anterior;
P05-03 exercita lista por atalho como uma unidade reversível.

Os casos do editor usam handlers reais e alguns eventos sintéticos. Um primeiro
ensaio de P05-01 acionava a barra no mesmo turno da seleção programática, antes
de selectionchange atualizar a seleção memorizada. O teclado real e o botão real
não reproduziram a divergência. O teste passou a aguardar o próximo turno antes
de acionar a barra; não houve alteração de produto para contornar esse teste.
A preparação agora também invalida o cache do script de teste gerado, evitando
executar uma matriz antiga após sua edição.

### Entrada real de teclado

Foram observados eventos confiáveis do navegador, além da matriz sintética:

- Ctrl+B criou uma entrada, Ctrl+Z retirou a formatação e um segundo Ctrl+Z
  preservou o texto-base; dois refazeres mantiveram um único resultado formatado.
- Ctrl+I, Ctrl+U e Ctrl+Shift+X criaram uma entrada cada; desfazer restaurou o
  parágrafo original em cada ensaio. O botão de negrito produziu a mesma
  representação `<p><b>Texto base.</b></p>` e uma entrada própria.
- Digitar ` teste` e aplicar negrito produziu três entradas (espaço, palavra e
  formatação). Quatro desfazeres chegaram a `<p>Texto base.</p>` e pararam;
  quatro refazeres restauraram `<p><b>Texto base. teste</b></p>` sem duplicar texto.
- Após confirmação visual de salvamento local e recarga, Ctrl+Z/Ctrl+Shift+Z com
  pilhas vazias conservaram esse texto formatado. Uma nova formatação em itálico
  pôde ser desfeita, inclusive com outro desfazer no limite sem apagar o salvo.
- Lista numerada por Ctrl+Shift+7 criou uma entrada; desfazer restaurou o corpo
  original. Não se alterou a representação de listas produzida pelo editor.
- Na versão final, digitar ` Q` no título e clicar Desfazer manteve o título
  intacto e focalizado; Ctrl+Z no campo retirou `Q` e manteve o foco. O corpo não
  foi usado como alvo da barra. Título/subtítulo não ganharam transações próprias.

A regra final dos campos é conservadora. Um ensaio intermediário roteava o botão
para execCommand no campo e conseguia retirar o caractere; esse roteamento foi
removido antes da versão final por não haver garantia portátil de isolamento da
pilha nativa. Esse resultado intermediário não é apresentado como comportamento
entregue.

## Arquivos e preservação

Produto: `index.html`; `ops/desktop-csp.txt` regenerado por
`scripts/generate_desktop_csp.py` somente para atualizar hashes do script inline.
As demais diretivas da CSP foram preservadas; nenhum deploy foi realizado.

Validação: `tests/stage0-history.test.cjs`, `tests/stage0-editor-matrix.js`,
`tests/prepare-stage0.cjs` e `tests/README.md`. Registro: este relatório, referências
nos relatórios de resultados/preparação e evidências em
`tests/evidence/stage0-s0p05-results-2026-11-25.json`.

Os módulos corrigidos anteriormente de gravação, mídia e compositor não foram
alterados nesta parcela. Hashes da especificação funcional v1.0 e dos documentos
sintéticos congelados foram conferidos. Projetos reais não foram abertos ou
modificados. A exclusão de geração de arte por IA permanece integral.

## Limitações e avaliação final de impedimentos

S0-P05 não permanece como impedimento técnico no alcance validado. Não foi
necessário antecipar o histórico novo nem modificar a arquitetura persistida.
Não se certifica a ausência de falhas em todos os navegadores e métodos de entrada.

Permanecem limites conhecidos do histórico atual: limite de 60 entradas do corpo;
pilhas não persistidas entre recargas/reaberturas; guarda do documento no topo da
pilha do mesmo projeto; ações fora da cobertura não ganham desfazer pelo fallback;
composição/animação/metadados sem histórico semântico integrado. Bloquear o fallback
inicial também retira sua eventual cobertura incidental de ações ainda não
capturadas. Não é anunciado desfazer universal. A expansão para todas as operações,
IME e campos pertence ao planejamento da fundação e exige escopo próprio.

Para encerrar a etapa 0 como preparação, permanecem:

1. Aprovar a semântica proposta de herdar/sobrescrever/restaurar, incluindo intenção
   explícita coincidente (H07/F01–F08). O comportamento atual foi caracterizado;
   sua alteração não foi autorizada nesta parcela.
2. Aprovar os invariantes e o encaminhamento das decisões de identidade/substituição
   e grupos/coordenadas. Implementar essas capacidades não é requisito desta etapa.
3. Dar aceite explícito aos limites ambientais ou executar validação complementar
   em ambiente apto: seletor nativo do SO, IME, tecnologias assistivas, crash e
   concorrência real entre janelas. Testes de API injetada não certificam esses casos.
4. Registrar com o Master apenas decisões efetivamente compartilhadas de recursos,
   contratos e acessibilidade, sem criar dependências transversais antecipadas.

Não foi identificado outro impedimento local novo nos percursos executados.
As limitações acima não equivalem a aceite integral do produto e não autorizam
A–E. Próxima atividade recomendada: revisão de encerramento da preparação com
aprovação das decisões pendentes e definição dos ensaios ambientais restantes.
Não foi enviada mensagem a outro chat; o encaminhamento ao Master permanece humano.
