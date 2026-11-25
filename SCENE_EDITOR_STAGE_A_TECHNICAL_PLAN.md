# Planejamento técnico da etapa A do editor de Cena

> Atualização de execução — 25/11/2026: A1 foi aprovada pelo fundador.
> A2 foi autorizada e implementada no alcance registrado em
> [Resultados de A2](SCENE_EDITOR_STAGE_A2_RESULTS.md), para avaliação.
> A3–A6 e B–E continuam sem autorização de execução. O planejamento original
> abaixo permanece como referência histórica anterior às autorizações específicas.


**Data:** 25/11/2026  
**Responsável:** Heartspace Docs — Especialista  
**Estado:** proposta técnica para revisão; somente planejamento autorizado.  
**Entrada:** [etapa 0 encerrada](SCENE_EDITOR_STAGE_0_CLOSURE.md), especificação
funcional v1.0, complemento funcional v1.0 e avaliação consolidada.

A etapa A deve estabelecer uma fundação reversível e acessível para escrever e
compor no mesmo documento: cronologia de autoria, organização do ambiente,
seleção múltipla, camadas e grupos. A recomendação é começar pelo isolamento do
histórico por documento e pelas transações textuais existentes, antes de ampliar
a cobertura para Cena e operações estruturais.

Este plano não altera código ou contratos e não declara escolhida uma nova
representação persistida. Nomes de componentes e interfaces abaixo são propostas
internas; não são contratos aprovados do ecossistema.

## Resultado esperado e limites

Ao final de A, ações significativas de Escrever e Cena deverão compartilhar uma
cronologia por documento, respeitando foco e edição ativa. Selecionar, navegar,
zoom e cancelar não deverão produzir alterações autorais. Seleção múltipla e
agrupamento serão distintos; grupos preservarão identidades, relações espaciais,
estados individuais e vínculos narrativos.

A estrutura da interface seguirá as seis regiões aprovadas, com palco prioritário,
painel esquerdo contextual e inspetor por seleção/escopo. Painéis recolhíveis e
redimensionáveis deverão preservar o contexto e ter operação por teclado. O
painel inferior poderá acomodar os recursos de momentos já existentes; não se
antecipa a timeline nova de C para completar o layout.

B mantém placeholders, necessidades artísticas e substituição assistida; C mantém
a experiência completa de herança e animação; D mantém exploração e interações
novas; E mantém consolidação. Os fundamentos de A precisam analisar essas
operações, sem implementá-las antecipadamente. Mídias e animações existentes
precisam ser preservadas mesmo quando não recebam controles novos.

## Modelo técnico proposto

### Sessão por contexto e documento

Um coordenador local deve manter a sessão de cada documento aberto, identificada
pelo contexto de autoria vigente e pelo ID do documento. ID ou conteúdo coincidente
não torna dois projetos a mesma sessão. Conta, área de armazenamento e época de
instalação/reabertura devem continuar delimitando identidade, como em S0-P04.

Trocar de documento aberto preserva suas pilhas independentes; voltar retoma a
pilha daquele documento, sem saltar para outro ao desfazer. Trocar Escrever/Cena,
momento ou visualização não encerra a sessão. Salvar não apaga as pilhas. Fechar
explicitamente um documento ou substituir o projeto instalado pode encerrar sua
sessão; abrir novamente o mesmo arquivo inicia outra. A interface deve distinguir
navegação de fechamento, sem inferir fechamento apenas porque o documento perdeu
foco. Histórico não será persistido em `.hdocs` ou cache de recuperação.

O limite atual de 60 entradas pode ser mantido na primeira parcela, documentado
como limite de retenção, não como duração da sessão. Antes da cobertura de mídias,
definir orçamento de memória e descarte determinístico de entradas antigas, sem
reiniciar toda a pilha ao navegar nem duplicar bytes grandes em cada ação.

### Transação e concorrência

Cada ação deverá carregar contexto, documento, descrição, conjunto de dados tocados,
pré-condições, estado/inversão antes e depois e contexto de seleção necessário.
Comandos compostos confirmam uma vez; cancelamento e no-op confirmam zero. Uma
mudança só de intenção pode ser real mesmo com aparência idêntica.

Texto pode reutilizar inicialmente o snapshot canônico existente. Cena deverá
registrar os dados autorais efetivamente alterados, incluindo patches/ordem/trilhas
quando pertinentes; não restaurar um projeto inteiro para desfazer uma coordenada.
O coordenador não substitui o resolvedor nem transforma o estado de execução do
player em autoria. Preview de gesto deve ser separado do estado confirmado.

Antes de aplicar undo/redo, verificar contexto e valores/revisões dos dados tocados.
Divergência bloqueia a aplicação com mensagem clara, conservando fonte e pilhas;
não procurar uma entrada anterior para ignorar o conflito. Nova ação confirmada
invalida redo do mesmo documento. Navegação e ações canceladas não o invalidam.
Importações assíncronas futuras só confirmam se contexto, alvo e revisão forem
válidos; não entram automaticamente no wrapper síncrono de S0-P05.

Não incluir revisão remota, publicação ou instalação de projeto como ações comuns
de undo. Quando uma mudança externa atingir dados cobertos, definir uma barreira
local explícita antes de prosseguir; rebase automático e colaboração ficam fora
da primeira parcela. Não modificar backend para suportar o histórico local.

### Foco e confirmação

A edição textual ativa deve ter um único responsável, com confirmação/cancelamento
definidos para Enter, blur, Escape, composição IME e mudança de contexto. Não
interceptar atalhos de transformação em inputs, textareas ou contenteditable.

A cronologia compartilhada não permite saltar uma ação visual posterior para
atingir um texto anterior. O desenho deverá tornar explícita a próxima operação
reversível quando o foco estiver em texto e a entrada seguinte for visual; validar
esse percurso antes de anunciar HA-07 completo. Na primeira parcela, preservar a
regra conservadora de S0-P05 para campos externos ao corpo, sem novo fallback nativo.
A cobertura de título/subtítulo e campos de inspetor deve entrar por adaptadores
explícitos na parcela de coordenação, não por capturar eventos globais indiscriminadamente.

### Espaço, grupos e compatibilidade

Recomenda-se uma árvore estrutural única por composição, com identidade estável dos
filhos e propriedades variáveis por momento. Árvore não é entidade narrativa;
não recebe scripts, condições ou variáveis próprias. Seleção coletiva permanece
estado transitório de interface, sem criar parentesco persistente.

Movimento, rotação e escala proporcional devem operar em espaço comum com unidades
consistentes; percentuais de eixos não podem ser tratados como pixels isotrópicos.
Coordenadas locais/globais, âncoras, flips, viewport e parallax precisam de uma
convenção documentada. Visibilidade efetiva combina ancestrais e estado individual;
bloqueio é proteção de autoria, separado do runtime.

A lista atual não persiste grupos. Antes de implementar sua gravação, produzir
proposta de representação e compatibilidade, identificando normalizadores,
leitores, arquivos portáteis, cache e exports afetados. A árvore poderá exigir
evolução de formato: **essa mudança não está autorizada por este plano nem deve
ser embutida na primeira parcela**. Não usar campos desconhecidos que versões
anteriores descartem silenciosamente. Nenhuma migração heurística de documentos.

Agrupar/desagrupar/reparentear deve preservar resultado e intenção em todos os
momentos afetados, incluindo trilhas existentes. É insuficiente manter a aparência
só no momento ativo ou congelar toda pose resolvida. Parallax dos filhos permanece
inalterado por agrupar; incompatibilidades são comunicadas, sem ajuste automático.

## Parcelas incrementais propostas

Cada parcela termina com evidência e revisão; a seguinte não começa por autorização
implícita da anterior. A numeração é técnica e não altera a sequência A–E aprovada.

| Parcela | Entrega delimitada | Dependência e aceite de saída |
|---|---|---|
| A1 — Sessões de histórico e texto | Coordenador local por documento; adaptar operações textuais já cobertas; preservar guards e fallback bloqueado. Sem novas operações de Cena ou formato. | Regressões S0 preservadas; A/B/A retoma histórico correto; projetos coincidentes isolados; confirmação, cancelamento e limites previsíveis. |
| A2 — Coordenação com Cena | Adaptadores de composição e animação existentes, por famílias; campos textuais externos ao corpo e foco; uma cronologia por documento. | A1; inventário de dados tocados e semântica de cada comando. Testes de texto→Cena→texto, undo/redo e cancelamento. Não anunciar cobertura antes de fechar o inventário. |
| A3 — Organização do ambiente | Seis regiões, painel esquerdo contextual, inspetor de escopo, recolhimento/redimensionamento e prioridade do palco. | Roteamento de foco definido. Contexto preservado ao alternar painel/momento; teclado e foco visível. Pode ser desenhada em paralelo, mas aplicada em parcela própria. |
| A4 — Seleção e manipulação coletiva | Seleção múltipla sem hierarquia; movimento, rotação, escala proporcional, alinhamento/distribuição conforme limites pertinentes. | A2; convenção espacial aprovada. Um gesto/undo, cancelamento zero; alternativas por teclado; não exigir arte definitiva. |
| A5 — Camadas e grupos persistentes | Árvore nomeada/aninhada, edição individual, agrupamento/desagrupamento, ordem e duplicação/remoção seguras. | A2/A4 e aprovação específica da representação/compatibilidade. Preservar todos os momentos, IDs e vínculos; nenhum contrato alterado unilateralmente. |
| A6 — Bloqueio, visibilidade e aceite da fundação | Máscaras hierárquicas sem apagar flags locais, revisão dos fluxos e acessibilidade, compatibilidade e desempenho. | A5 para hierarquia; proteção e acessibilidade entram em cada parcela, não ficam suspensas até A6. Cobertura completa dos critérios de A e pendências explicitadas. |

A ordem A2/A3 pode ser ajustada para permitir revisão de UX antes da adaptação dos
campos, sem abandonar a segurança de transações. Analisar herança e trilhas antes
de A5 é dependência técnica; implementar os novos controles de herança continua C.

## Primeira parcela recomendada para autorização

**A1: isolamento e continuidade do histórico textual por documento em sessão.**
É uma entrega pequena e verificável que remove a dependência da pilha global com
guarda apenas no topo, sem antecipar grupos ou formatos. Deve preservar a cobertura
textual atual e preparar o registro de ações confirmadas para os adaptadores seguintes.
Não deve ser apresentada ao usuário como histórico completo de Cena.

Escopo proposto: identificar ciclo de abertura/alternância/fechamento do documento;
separar as pilhas por contexto e documento; encapsular o coordenador local; adaptar
remember/commit/undo/redo existentes sem mudar a semântica textual aprovada;
conservar seleção e conteúdo pendente e informar conflitos sem sobrescrita.
Não introduzir um segundo histórico concorrente mantendo o primeiro ativo.

Componentes candidatos: funções de histórico e navegação em `index.html`; um
módulo privado local de coordenação, se a extração reduzir acoplamento; callbacks
existentes de `book-pagination.js` apenas quando necessário; hashes em
`ops/desktop-csp.txt`; testes de histórico e matriz do editor. São alvos propostos,
não arquivos já alterados. Recurso compartilhado, backend, formato autoral,
portátil, migração e histórico durável ficam excluídos.

Critérios específicos de A1:

1. Editar A, editar B e voltar a A permite desfazer/refazer A sem consumir B;
   retornar a B conserva suas ações. Repetir com IDs/corpos coincidentes em projetos
   distintos e confirmar isolamento de conta/contexto/época.
2. Salvar, alternar Escrever/Cena e navegar por momentos não esvaziam a pilha textual.
   Fechar/reabrir inicia pilhas vazias preservando conteúdo salvo e recuperação.
3. Digitação, formatação por barra/atalho, sequências de undo/redo e no-op mantêm
   resultados S0-P05; pilha vazia após recarga não consome a instalação do corpo.
4. Texto pendente é confirmado/cancelado segundo regra explícita antes da troca;
   callback atrasado do contexto anterior não grava no destino. Sem perda ou dupla entrada.
5. Divergência do corpo bloqueia aplicação sem sobrescrever alterações independentes;
   contexto original e pilhas permanecem íntegros, com comunicação acessível.
6. Preservar o foco textual externo ao corpo, o limite de retenção declarado e o
   estado de redo por documento. Não capturar zoom, seleção ou navegação como autoria.
7. Baterias relevantes de S0 verdes, novos casos de documento/contexto e teclado
   real registrados; nenhuma alteração de formato ou certificação ambiental presumida.

Uma autorização futura de A1 não autoriza A2–A6. Se a implementação precisar mudar
contratos/formatos ou semântica além desse recorte, apresentar diagnóstico antes
de executar a parte adicional.

## Critérios de aceite da etapa A

| Eixo | Demonstração exigida |
|---|---|
| Histórico — HA-06/07/08 | Cronologia por documento; uma ação por intenção; operações compostas/contínuas/canceladas; foco textual e alternância de ferramentas sem perda, duplicação ou salto de contexto. |
| Seleção — OE-01/03 | Selecionar vários sem agrupar; selecionar filho sem desagrupar; identidade e vínculos permanecem. |
| Espaço — OE-04/05/08/09 | Transformações proporcionais, âncoras/flips e limites em vários aspectos; agrupar/desagrupar preserva aparência e intenção nos momentos; parallax incompatível é sinalizado. |
| Estrutura — OE-02/06/07/10/11 | Árvore sem ciclos; ordem determinística; duplicação remapeia apenas identidades de ocorrência e referências internas pertinentes; exclusão não apaga recursos/escolhas; masks preservam flags locais. |
| UX e acessibilidade | Seis regiões operáveis, escopo claro, nomes/estados acessíveis, foco visível e conservado, teclado alternativo ao mouse, erros anunciados e contraste/escala avaliados. Não comunicar estados apenas por cor. |
| Compatibilidade — critério 14 | Corpus legado/contemporâneo abre, grava e reabre sem perda; renderer, prévia, player e exports suportados produzem resultado coerente; leitura antiga de novo formato tem política aprovada. |
| Autonomia — IR-10/OE-12 | Fluxo local sem Canvas/Beats/Travels em execução; nenhuma dependência transversal prematura ou leitura de fontes privadas. |

A tolerância geométrica deve ser fixada no desenho antes do teste de A4/A5:
comparar matrizes e bounds em coordenadas canônicas, além de imagens renderizadas,
com erro máximo declarado. Não inventar uma aprovação de equivalência visual sem
critério numérico e viewport especificados. Nenhum desses aceites foi executado
como funcionalidade nova nesta entrega.

## Validação e limites ambientais

A base aprovada permanece referência: 101 Node, 11 de compatibilidade, 24 de
recuperação, 26 do editor e fechamento/reabertura. Cada parcela deve selecionar
as baterias afetadas, acrescentar casos mínimos e executar o navegador quando
alterar eventos/foco/renderização. Evitar repetir diagnósticos já encerrados sem
mudança que justifique revalidação. Usar cópias sintéticas, nunca projetos reais.

Seletor nativo, IME e tecnologias assistivas foram aceitos pelo fundador como
pendências ambientais para encerrar a preparação. Continuam pendentes; a aprovação
não é certificação nem dispensa acessibilidade. A1/A2 devem prever ensaios reais
com IME/foco quando houver ambiente apto; A3–A6 precisam de percurso com tecnologia
assistiva e ampliação. O seletor nativo volta à validação quando o fluxo de arquivo
for afetado. Se o ambiente continuar insuficiente, comunicar exatamente o que foi
simulado e o que continua sem aceite real da capacidade entregue.

Crash, concorrência real entre janelas, outros dispositivos e serviços remotos
mantêm seus limites de evidência. Novas integrações só entram mediante necessidade
e autorização próprias. Histórico de recuperação não será tratado como pilha undo.

## Riscos e dependências

| Risco concreto | Tratamento no planejamento e condição de avanço |
|---|---|
| Duas capturas do mesmo input/comando | Um dono da transação, adapter testado, eventos aninhados uma entrada; preservar S0-P05. |
| Snapshot amplo apagar alterações independentes | Conjunto de dados tocados e pré-condições; conflito bloqueia inversão; sem rollback integral indiscriminado. |
| Histórico textual competir com foco do inspetor | Fluxos explícitos de confirmação e alvo de undo; não habilitar fallback nativo opaco. |
| Vazamento entre projetos/documentos | Identidade de sessão completa; callback tardio invalidado; fechamento distinto de navegação. |
| Intenção coincidente perdida no diff | Capturar fonte e intenção, não só pose; preservar H07 como risco conhecido até a parcela autorizada tratar a escrita. Não ampliar cobertura visual sem caracterizar esse efeito. |
| Grupos descartados por normalizadores antigos | Aprovar representação e leitores/escritores antes de A5; não emitir formato novo sob versão antiga por conveniência. |
| Reparentear alterar outros momentos/trilhas | Analisar toda composição, não só momento ativo; invariantes geométricos e de herança. |
| Memória crescer com snapshots/mídias | Limites declarados, compartilhamento seguro de referências imutáveis e liberação de sessão fechada; não serializar mídia por input. |
| Parallax e masks duplicados na hierarquia | Convenção única de composição; preservar flags e parâmetros locais; revisão de incompatibilidades. |
| Layout quebrar foco, seleção ou teclado | UI desacoplada da autoria; contexto preservado, testes reais e validação assistiva pendente explícita. |

Questões ao Master: convenções de atalhos/foco/acessibilidade; consumidores reais
de eventual formato novo; identidade compartilhada de recursos e fronteiras com
Core/adapter caso sincronização seja afetada. Proposta: manter coordenador e
geometria locais; só submeter mudanças transversais concretas antes de executá-las.
Não há dependência obrigatória nova identificada para A1, nem mensagem automática
enviada a outro chat. Fontes, transporte, cache e publicação continuam distintos.

## Recomendação de encaminhamento

Recomenda-se revisar este plano e, se aprovado, autorizar **apenas A1** com os sete
critérios específicos acima. O plano de representação de grupos e compatibilidade
pode ser amadurecido em autorização de planejamento separada ou no refinamento
já autorizado, sem gravação experimental ou mudança de contrato. Nenhuma parcela
foi iniciada; código, documentos de produção e formatos permanecem preservados.
