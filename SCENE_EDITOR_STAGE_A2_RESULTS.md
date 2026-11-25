# A2 — Coordenação das transações existentes de Cena e foco textual

**Data:** 25/11/2026. **Estado:** implementação local para avaliação do fundador.
Autorização restrita a A2; A3–A6 e B–E não foram implementadas.

## Resultado e regras

Escrever e Cena utilizam a cronologia da sessão de cada documento estabelecida
em A1. As entradas de Cena guardam somente alterações autorais tocadas, com
pré-condições para desfazer/refazer. Uma coordenada não restaura o projeto inteiro.
Alterações concorrentes em outras propriedades são preservadas; conflitos nos
dados tocados recusam a aplicação e comunicam o motivo, sem saltar entradas.

Permanecem o isolamento por projeto/documento, as gerações de sessão, o limite
de 60 entradas por documento e a retenção apenas em memória. Salvar não serializa
o histórico. Abrir/reabrir um projeto encerra o contexto anterior; recuperação de
trabalho não salvo continua independente do histórico.

Uma edição contínua de campo do inspetor confirma uma entrada ao sair do campo,
confirmar ou acionar histórico/salvamento/navegação. Escape cancela o rascunho
quando suas pré-condições permitem. Gestos usam prévia e confirmam uma vez;
cancelamento, perda de captura e operações sem alteração não geram entradas.
O gesto preserva mudanças concorrentes em propriedades distintas e recusa conflito
na propriedade manipulada. Não foi implementado rebase automático.

Com foco textual, o atalho não salta uma operação posterior de outra superfície.
O editor informa a necessidade de usar o comando explícito de autoria. Os botões
de desfazer/refazer existentes, e dois controles mínimos equivalentes em Cena,
percorrem a cronologia integral. Campos não integrados conservam seu foco e não
disparam transformações de Cena. O corpo mantém a proteção S0-P05 e A1.

## Alcance

| Operações/campos | Integração e validação |
|---|---|
| Corpo, formatação e comandos textuais já cobertos em A1 | Mantidos; validados em alternância com Cena e em regressão |
| Texto do título e subtítulo | Integrado como edição de campo; cronologia, undo/redo e foco validados |
| x, y, largura, altura, rotação, escala, âncoras, opacidade e parallax | Validados pelos controles existentes; undo/redo preservam texto não relacionado |
| Arrastar elemento | Confirmação, cancelamento, perda de captura e concorrência validados com eventos sintéticos de ponteiro |
| Duplicar, remover e reordenar elementos | Integrados e validados no editor |
| Duração de animação, adicionar/remover keyframe | Integrados e validados no editor |
| Herdar anterior, restaurar início e limpar referências órfãs | Rotas existentes integradas; comportamento autoral anterior preservado |
| Demais controles que gravam composição/trilha pelas mesmas rotas | Conectados ao coordenador; não equivalem a validação individual de cada opção ou importação assíncrona |

Não foram integrados alinhamento/formatação rica do título e subtítulo,
configurações globais de viewport, cadastros compartilhados de recursos,
personagens/variáveis, todos os inspetores narrativos ou ações remotas. Zoom,
seleção, navegação e reprodução não são operações autorais de Cena.
Repetição automática de tecla mantida pressionada não recebeu agrupamento próprio.
Os modos de transformação por ponteiro além do arraste não foram certificados por
entrada nativa; a cobertura de seus valores é feita pelos controles numéricos.

## Implementação

- `index.html`: coordenação, adaptadores dos campos, rotas de composição/animação,
  foco e controles explícitos de autoria em Cena.
- `authoring-history-patch.js`: módulo privado de comparação e aplicação reversível
  por identidade/propriedade. Listas sem identidade estável permanecem atômicas;
  conflito nelas exige resolver o estado atual, sem mesclagem silenciosa.
- `scene-composer.js`: confirmação de gesto contra a composição atual, preservando
  alterações não relacionadas. A correção S0-P02 permanece.
- `desktop/loader.js`: caminho local do novo módulo; sem mudança no protocolo.
- `ops/desktop-csp.txt`: atualização de hashes dos scripts; diretivas preservadas.
- Testes: dez casos do módulo, ampliação da matriz e manutenção do corpus anterior.

Nenhum contrato compartilhado, formato persistido, migração ou dependência entre
produtos foi introduzido. Não houve publicação, deploy ou uso de projetos reais.
A especificação v1.0, o complemento e a exclusão de geração de arte por IA foram
preservados. A semântica conhecida H07 de coincidência de valores continua sendo
limitação da herança existente; A2 registra as alterações efetivamente realizadas,
sem antecipar a futura representação de intenção autoral.

## Evidências e limites

Os resultados finais estão em `tests/evidence/stage-a2-results-2026-11-25.json`.
A bateria automatizada final executou **119/119** casos. As baterias locais de
compatibilidade e recuperação executaram **11/11** e **24/24** casos.
A matriz final do editor executou **41/41** cenários. O fechamento real da aba e
a reabertura preservaram o corpo e iniciaram undo/redo vazios (CLOSE-REOPEN).
Verificações de sintaxe dos módulos, scripts inline e diferenças sem erros.

A matriz anterior de A1 foi preservada em
`tests/evidence/stage-a1-editor-matrix-before-a2.js`. Expectativas de ausência de
histórico em Cena foram atualizadas explicitamente para o comportamento autorizado
em A2. Comparação de fonte desconsidera apenas a ordem das chaves de objetos;
ordem de elementos e valores permanecem relevantes. A preparação do teste espera
o subtítulo carregado e estabiliza a seleção antes do botão de formatação para
evitar falsos negativos de abertura/refluxo. Não são correções do produto.

Entrada real de teclado foi observada no título e no campo x de Cena: desfazer e
refazer conservaram valor e foco; os controles explícitos de Cena também foram
exercitados. Os testes de ponteiro e composição textual sintéticos não certificam
dispositivo físico, IME ou tecnologias assistivas. A rota desktop foi conferida
somente quanto ao carregamento do novo módulo, sem certificação integral do host.

Continuam documentadas as pendências ambientais aceitas: seletor nativo de arquivos,
IME e tecnologias assistivas. O aceite dessas limitações não certifica capacidades
nem dispensa requisitos de acessibilidade. As evidências anteriores permanecem.

## Próxima parcela recomendada

Após avaliação de A2, recomenda-se A3 — Organização do ambiente — conforme o plano
aprovado: seis regiões, painel esquerdo contextual, inspetor com escopo explícito,
recolhimento/redimensionamento e prioridade do palco. Usar a matriz de A2 como
regressão obrigatória de foco, cronologia e preservação de contexto durante a
reorganização. A3 requer autorização própria; não iniciar novas ferramentas de
composição, semântica de herança ou contratos de recursos nessa parcela.
