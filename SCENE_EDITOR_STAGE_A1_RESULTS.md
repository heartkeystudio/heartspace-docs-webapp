# Resultados de A1 — histórico textual por documento

**Data:** 25/11/2026  
**Estado:** implementação concluída no alcance validado, para avaliação do fundador.  
**Autorização:** somente A1; A2–A6 e B–E permanecem sem autorização de execução.

## Resultado implementado

O histórico textual existente agora mantém pilhas independentes por documento
na sessão de autoria. Alternar A/B/A conserva undo e redo de cada documento;
criar uma nova ação em B não elimina o redo de A. Salvar e alternar Escrever/Cena
não encerram essas pilhas. Não foi ampliada a cobertura de histórico para Cena,
animação, título/subtítulo ou demais campos externos ao corpo.

O coordenador foi mantido local às funções existentes de `index.html`, sem nova
dependência ou módulo transversal. Reutiliza snapshots e unidades textuais de
S0-P05; cada documento conserva o limite existente de 60 entradas. Há uma única
pilha ativa por documento, sem dois motores concorrentes.

O contexto continua incluindo chave de armazenamento, época de abertura/instalação,
projeto, conta e identidade autoral. Ao mudar de contexto, todas as sessões desse
conjunto são descartadas. Além disso, cada sessão tem uma geração e cada passagem
pelo documento tem uma identificação de visita. Um commit atrasado não pode ser
aplicado após A/B/A nem após fechar/restaurar o mesmo documento. Coalescência de
digitação também não atravessa navegação entre documentos.

Arquivar, enviar à lixeira ou remover um documento encerra sua sessão de histórico.
Restaurar o conteúdo inicia pilhas vazias. Fechar a aba, recarregar ou reabrir o
projeto também não recupera pilhas antigas. Não foi criado um novo controle de
fechamento de documento; foram respeitados os caminhos existentes de ciclo de vida.
Histórico permanece exclusivamente em memória e não é recuperação de trabalho.

## Alterações pendentes, foco e proteções

`book-pagination.js` retorna uma função local de finalização da edição em andamento.
Antes de navegar, a edição pendente é confirmada no documento de origem.
Salvar durante uma composição ativa preserva a captura até sua confirmação;
um flush incidental não deve encerrá-la. Ao restaurar da lixeira, o documento
que será deixado também é confirmado e salvo antes da troca.
Ao substituir o DOM, o resíduo de captura anterior é descartado, evitando que
compositionend atrasado confirme uma operação no destino. O corpo continua sendo
preservado pelo fluxo existente de gravação. Um ensaio de composição sintética
valida essa fronteira, mas não certifica IME real.

As proteções S0-P04/P05 permanecem: sem fallback nativo opaco no corpo, comandos
de formatação com uma única transação e validação de contexto/documento/corpo antes
de undo/redo. Se o texto divergir do estado esperado, a operação é recusada com
mensagem clara, mantendo conteúdo atual e pilhas. Não se procura outra entrada
para ignorar o conflito. Essa mensagem não constitui certificado de anúncio por
tecnologia assistiva.

O foco textual mantém a regra de S0-P05: botões de histórico não consomem o corpo
quando um campo externo está ativo; teclado nesse campo permanece com seu
comportamento anterior. A coordenação de todos os campos e Cena pertence a A2.

## Validações executadas

Corpus sintético, cópias descartáveis, origem local sem login. Chromium 155/Linux
no navegador integrado. Nenhum projeto real foi aberto para validar a mudança.

| Bateria | Resultado |
|---|---|
| Node em modo estrito | **109/109**, sem falhas, TODO ou skip |
| Compatibilidade de navegador com recarga B09 | **11/11** |
| Recuperação/interrupções, incluindo S0-P03 | **24/24** |
| Matriz do editor: 26 anteriores e seis A1 | **32/32** |
| Fechar aba e reabrir após preparação de undo/redo | **1/1**, conteúdo salvo preservado e pilhas vazias |
| Sintaxe e revisão de espaços do diff | Aprovadas |

Os oito casos Node A101–A108 cobrem pilhas separadas com corpos iguais, redo
independente, commit atrasado após navegação, encerramento/restauração de sessão,
ida/volta de contexto e coalescência que não atravessa documentos. Os dois últimos exercitam a função
real de finalização: flush incidental preserva a composição; substituição do DOM
descarta a captura antiga e torna o evento final atrasado inofensivo.

Na matriz do editor:

- A1-01: formatação, navegação, undo/redo independente, salvamento local e troca
  Escrever/Cena sem eliminação da pilha textual.
- A1-02: texto pendente de composição sintética confirmado antes de navegar;
  evento final atrasado não modifica o destino e o texto original pode ser desfeito/refeito.
- A1-03: arquivar/restaurar preserva conteúdo, mas não ressuscita undo/redo antigos.
- A1-04: salvar uma cópia portátil mantém as pilhas e a chave da sessão; o arquivo
  contém o corpo esperado e não contém o coordenador privado de histórico.
- A1-05: enviar à lixeira/restaurar também encerra a sessão antiga.

- A1-06: salvamento automático durante composição sintética mantém uma única
  transação até a confirmação; undo/redo recupera o texto completo.

T03 e M21 tiveram apenas a expectativa de inspeção da pilha atualizada: antes, a
pilha global de A continuava visível enquanto B estava ativo; agora B possui sua
própria pilha vazia. Os testes ainda verificam que B não desfaz A e que retornar
a A mantém seu histórico. As evidências anteriores foram preservadas como registro.

### Teclado real

Em dois documentos iniciados com o mesmo corpo, digitei ` autor A`/` autor B` e
apliquei negrito/itálico por atalho. Cada documento obteve quatro entradas. Depois
de alternar, desfazer retirou somente sua formatação e refazer a restaurou. Esgotar
os quatro undos de A e executar mais um preservou o texto-base; B manteve todo seu
texto formatado e suas quatro entradas. Não houve duplicação de conteúdo observada.

No título de B, digitar ` Q` e clicar Desfazer conservou texto e foco; Ctrl+Z no
campo retirou o caractere, sem consumir as quatro entradas do corpo. Esses eventos
foram enviados pelo teclado do navegador, distintos dos eventos sintéticos da matriz.
Os resultados resumidos foram lidos no DOM de teste; não são logs de usuários reais.

## Arquivos e integridade

Produto: `index.html` (sessões, guardas, ciclo de vida e finalização de edição),
`book-pagination.js` (finalização local de captura pendente) e `ops/desktop-csp.txt`
(hashes inline regenerados; demais diretivas preservadas).

Validação: `tests/stage0-history.test.cjs`, `tests/stage0-editor-matrix.js`,
`tests/stage0-native-input.js`, `tests/prepare-stage0.cjs` e `tests/README.md`.
Documentação: este relatório e referência de estado no plano de A.
Evidência: `tests/evidence/stage-a1-results-2026-11-25.json`.

Especificação v1.0, complemento funcional, fixtures congeladas e módulos anteriores
de gravação/mídia/compositor foram conferidos por hash. Não houve alteração de
contratos, formatos persistidos, migração, backend, dependência transversal ou deploy.
A geração de arte por IA permanece excluída.

## Limitações e próximo encaminhamento

As limitações ambientais aceitas no encerramento da etapa 0 continuam documentadas:
seletor nativo, IME e tecnologias assistivas permanecem pendentes de validação em
ambiente apropriado. Composição sintética não resolve esse aceite real. Também
não se certificam outros hosts, crash, concorrência real entre janelas, autorização
entre contas ou infraestrutura remota por meio destes ensaios locais.

O histórico cobre as operações textuais anteriormente capturadas, limitado a
60 entradas por documento e à vida da sessão. Não é histórico universal nem fonte
de recuperação; título/subtítulo e Cena não ganharam integração. A retenção em
múltiplos documentos aumenta o uso potencial de memória; orçamento global e
referências de mídia continuam tema para a ampliação de cobertura, sem novo
limite global que descarte sessões silenciosamente nesta parcela. H07 e os demais
comportamentos futuros de herança não foram alterados.

Recomendo submeter A1 ao aceite do fundador e preparar a autorização delimitada
de A2: adaptar as operações existentes de Cena por famílias, com dados tocados,
pré-condições e regra de foco explícitos. Não basta inserir snapshots do projeto
inteiro nessa pilha. Antes de incluir composição, tratar no desenho a preservação
de intenção e a divergência entre corpo textual, patches e animações. Essa próxima
parcela exige autorização específica; nenhuma parte de A2 foi iniciada aqui.
