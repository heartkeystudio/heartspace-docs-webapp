# Heartspace Docs — Resultados da parcela A4

**Escopo:** seleção e manipulação coletiva temporária no Editor de Cena
**Base de recuperação:** `0.1.0-internal.2` — commit `27325ed41fcc4f0ef257b8d5183a058264c56986`
**Estado:** implementação A4 concluída para revisão; sem commit, tag ou push.

## Resultado

O palco e o painel de Camadas agora mantêm seleção múltipla temporária. O usuário
pode adicionar ou retirar elementos com Ctrl/Cmd ou Shift, selecionar por área no
palco, mover a seleção, girá-la em torno de seu centro e aplicar escala uniforme.
Uma moldura coletiva fornece alças de rotação e escala, além de comandos acessíveis
de movimento, rotação em passos de 15° e escala em passos de 10%. A barra coletiva
fica dentro da moldura para continuar visível perto da borda superior do palco.

O inspetor informa o escopo coletivo e deixa claro que os campos individuais
voltam a aparecer ao selecionar um elemento. A identidade dos elementos e as
propriedades que não participam da transformação são preservadas. Movimentos,
rotação e escala confirmados produzem uma única entrada no histórico compartilhado
de A2. Gestos cancelados e transformações sem alteração não geram entradas.

A4 não grava grupos, novas relações hierárquicas ou metadados de seleção. Não
alterou o formato persistido, contratos, semântica de herança, vínculos narrativos,
animações, substituição de recursos ou mecanismos de bloqueio. A configuração e
os dados de parallax permanecem intactos; durante a prévia, os comandos coletivos
ficam suspensos para evitar transformar a composição a partir da posição simulada.
A exclusão de geração de arte por IA permanece inalterada.

## Arquivos

- `scene-composer.js` — seleção, moldura, comandos coletivos e transformações.
- `scene-workspace.js` — contexto coletivo no inspetor.
- `tests/stage0-editor-matrix.js` — nove regressões A4 na matriz do editor.
- `tests/README.md` — instruções e cobertura atualizadas.
- `tests/evidence/stage-a4-multi-selection-2026-11-25.jpg` — seleção mista no palco e inspetor.
- `tests/evidence/stage-a4-collective-rotation-2026-11-25.jpg` — rotação aplicada à seleção.

As capturas foram obtidas no editor completo de teste, com a fixture sintética
`tests/fixtures/stage0-current.hdocs`. Nenhum projeto autoral foi aberto ou alterado.

## Validação

- Regressões automatizadas estritas: **119/119 aprovadas**, zero falhas, zero TODO.
- Matriz completa do editor: **55/55 aprovadas** antes da última salvaguarda de
  parallax, preservando as 47 anteriores e adicionando A4-01–08. Com o novo caso
  A4-09, a cobertura acumulada é de 56 cenários únicos: os 55 anteriores mais
  o caso de prévia de parallax abaixo.
- Após os ajustes finais de visibilidade em parallax e posição da barra: **10/10
  aprovadas** na execução filtrada dos nove casos A4 e do caso M20 de preparação
  para fechamento.
- Verificações de sintaxe JavaScript e `git diff --check`: aprovadas.
- A4-08 salvou a fonte de autoria no formato portátil e a reabriu a partir de uma
  cópia; identidades, composição, vínculos e texto permaneceram, sem transportar
  o histórico de sessão para a reabertura.

Os testes de navegador usam fixture descartável e eventos de ponteiro sintéticos.
Não certificam hardware de entrada, toque, IME ou tecnologias assistivas. As
limitações ambientais aceitas anteriormente permanecem documentadas.

## Alcance validado e limites

Foi validada seleção aditiva e por alternância no palco e em Camadas, seleção por
retângulo que considera elementos que intersectam a área, visualização coletiva,
movimento de elementos de tipos diferentes, rotação, escala uniforme, undo/redo,
cancelamento, no-op, foco textual, vínculo de escolhas, parallax e salvar/reabrir.
A prévia de parallax mantém a seleção, mas suspende as transformações coletivas
até sair desse contexto. A geometria continua usando as propriedades e limites
existentes de cada elemento.

Uma seleção mista não apresenta edição coletiva dos demais campos do inspetor;
esses campos permanecem disponíveis para um único elemento. A área de seleção
considera interseção visual, sem exigir que a caixa contenha o elemento inteiro.
Não foram incluídos agrupamento persistente, bloqueio, seleção por lasso, atalhos
globais adicionais, herança explícita ou novas operações além das transformações
autorizadas.

Os testes de regressão também preservaram o histórico de autoria de A1/A2, o
isolamento de contexto e o comportamento da organização de A3. Não houve alteração
de contratos nem dependências transversais; nenhuma questão exige encaminhamento
ao Heartspace Master nesta parcela.

## Proposta para consolidação

Consolidar a entrega como **`0.1.0-internal.3`**, mantendo `0.1.0-internal.2`
como referência imutável de recuperação. A proposta inclui A4, as nove regressões,
este registro e a atualização do README. O ponto de consolidação pode ser um único
commit identificável, seguido de tag anotada e pacote local com manifesto, usando
o mesmo procedimento da versão anterior. Commit, tag, pacote e distribuição ainda
aguardam autorização específica; não foram executados nesta parcela.

Não iniciar A5 ou parcelas posteriores sem autorização.
