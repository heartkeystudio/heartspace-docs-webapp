# B4.1 — Consulta e Ficha Artística

Entrega funcional sobre a fundação local v7 de B4.0. Este registro descreve somente B4.1; associação e operações de ocorrências continuam reservadas a B4.2.

## Capacidades entregues

- Consulta contextual e consulta abrangente no painel Recursos, com pesquisa por nome, categoria, descrição e origem, filtro de ocorrência e apresentação das ocorrências conhecidas.
- Necessidades sem ocorrência são registros válidos e podem ser criadas no projeto.
- Registros legados v5/v6 são editados localmente na sequência de origem sem promoção obrigatória; identidades não são unificadas.
- Em v7, a ficha é compartilhada no projeto. A interface informa o escopo antes da edição.
- A primeira criação de uma necessidade compartilhada em formato anterior exige confirmação de compatibilidade e sincronização antes da promoção.
- Consultar e filtrar não alteram a fonte. Cancelar a confirmação mantém o schema anterior.
- Edições de ficha entram no histórico de sessão. O schema v7 continua monotônico ao desfazer a operação que o promoveu.
- A gravação protegida compara a fonte lida com a revisão-base e rejeita gravação concorrente desatualizada, mantendo o rascunho rejeitado para cópia.
- A criação e a edição permanecem locais; o bloqueio de envio remoto v2–v7 continua ativo.

## Validação registrada

- 83/83 testes automatizados pertinentes: compatibilidade 38/38, histórico 30/30 e herança 15/15.
- 8/8 cenários direcionados B4.1 previamente executados, além de dois cenários de navegador adicionais executados separadamente nesta consolidação.
- B4.1-09: falha forçada na primeira escrita v7. A fonte permaneceu em schema 5, o registro local e o histórico não receberam a promoção/operação, o snapshot IndexedDB anterior foi preservado e o erro foi informado sem mensagem de sucesso.
- B4.1-10: edição de uma ficha v7 associada a uma ocorrência manteve a identidade, as propriedades visuais da instância, os metadados narrativos e o histórico em uma única entrada.
- O cenário B4.1-03 demonstra undo/redo da criação com schema v7 mantido após o undo.
- Sintaxe JavaScript e `git diff --check` aprovados.

As verificações foram feitas com documentos sintéticos e automação de navegador. A falha de gravação foi induzida abortando uma transação IndexedDB; não representa medição de quota real. Não houve validação com projeto real, certificação de acessibilidade nem avaliação visual independente do Creative Lab.

Durante o cenário de falha, a rotina de finalização da edição pendente normalizou a representação HTML de autoria na fonte em memória antes da tentativa de gravação. A fonte durável anterior foi preservada, assim como o schema e os dados de necessidade. O conteúdo normalizado não foi comparado elemento a elemento; a observação fica registrada como limite do teste e não foi tratada como corrupção ou como aprovação de equivalência byte a byte.

## Compatibilidade e limites

- Sem evolução incidental na consulta, pesquisa, filtro ou edição de necessidade legada.
- A promoção v7 permanece explícita, não automática e sem downgrade.
- Não há merge automático de conflitos entre janelas.
- O histórico segue limitado à sessão.
- OI-27 e sincronização remota v2–v7 permanecem independentes e bloqueadas.
- B4.2, B4.3, B4.4, B5 e B6 não fazem parte desta entrega.
- Nenhum contrato transversal, serviço ou sincronização remota foi alterado.
- Geração de arte por inteligência artificial permanece excluída.
