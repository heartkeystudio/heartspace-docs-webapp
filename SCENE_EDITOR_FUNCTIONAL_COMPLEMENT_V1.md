# Heartspace Docs
## Complemento Funcional à Especificação do Editor de Cena v1.0

**Estúdio:** HeartKey Studios  
**Ecossistema:** Heartspace  
**Produto:** Docs  
**Origem:** Heartspace Creative Lab  
**Aprovação funcional:** Fundador  
**Versão do complemento:** 1.0  
**Referência:** SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md  
**Etapa:** 0 — Preparação e Compatibilidade  
**Estado:** Direção funcional aprovada, aguardando consolidação técnica.

---

## 1. Objetivo

Consolidar as decisões funcionais amadurecidas durante a etapa 0 da evolução do Editor de Cena, estabelecendo comportamentos fundamentais para:

- Herança autoral e histórico.
- Identidade e substituição de recursos.
- Organização espacial e grupos.

Este complemento integra a direção funcional da Especificação v1.0, sem substituir ou invalidar seu conteúdo.

As decisões aqui registradas representam comportamentos esperados do produto, não definições de arquitetura, contratos, formatos persistidos ou implementação.

## 2. Contexto

Durante a etapa 0, o especialista do Docs realizou investigações relacionadas à compatibilidade, recuperação, persistência, histórico, herança autoral, identidade de recursos, organização espacial e acessibilidade.

As falhas identificadas entre S0-P01 e S0-P05 foram corrigidas no escopo validado.

O Creative Lab e o fundador amadureceram e aprovaram 30 decisões funcionais complementares, destinadas a orientar as etapas posteriores.

## 3. Princípios fundamentais

A evolução deverá preservar:

- A narrativa como fundamento da experiência.
- A liberdade e a segurança da autoria.
- A manipulação direta e previsível dos elementos.
- A preservação das intenções criativas.
- A reversibilidade das operações significativas.
- A autonomia do Docs.
- A acessibilidade e a consistência da experiência.
- A produção artística humana e a utilização de recursos devidamente licenciados.

A geração de arte por IA permanece expressamente excluída.

---

## 4. Herança autoral e histórico

### HA-01 — Sobrescrita explícita

Uma personalização explícita deverá permanecer local mesmo quando seu valor coincidir com o valor herdado.

A intenção autoral não deverá ser descartada por equivalência numérica ou visual.

Alterações posteriores na origem da herança não deverão modificar uma propriedade explicitamente personalizada.

### HA-02 — Restauração individual

O usuário deverá poder restaurar individualmente uma propriedade ao comportamento herdado.

A restauração deverá remover somente a sobrescrita selecionada, preservando as demais personalizações.

### HA-03 — Escopos de restauração

Deverão existir escopos funcionalmente distintos para:

- Propriedade individual.
- Elemento.
- Composição do momento.
- Animações do momento.

Restaurar propriedades visuais não deverá eliminar automaticamente animações.

Limpar animações não deverá restaurar automaticamente propriedades visuais.

A interface deverá comunicar claramente o alcance de cada operação.

### HA-04 — Duplicação de momentos

A duplicação deverá preservar as intenções autorais de herança e as personalizações locais do momento original.

Valores herdados não deverão ser convertidos automaticamente em valores fixos apenas em razão da duplicação.

### HA-05 — Remoção e reordenação de momentos

A remoção e a reordenação deverão preservar as intenções autorais dos momentos restantes.

A herança deverá ser recalculada conforme a nova organização.

O editor deverá comunicar consequências relevantes sobre momentos posteriores, sem converter silenciosamente propriedades herdadas em personalizações fixas.

### HA-06 — Unidades de transação

Cada intenção significativa do usuário deverá constituir uma operação reversível.

Exemplos:

- Movimentar, rotacionar ou redimensionar elementos.
- Agrupar ou desagrupar.
- Duplicar ou excluir.
- Substituir recursos.
- Restaurar propriedades.

Uma manipulação contínua deverá constituir uma única operação ao ser confirmada.

Operações canceladas, navegação, seleção, zoom e ações sem alteração efetiva não deverão criar entradas indevidas no histórico de autoria.

### HA-07 — Histórico compartilhado entre Escrever e Cena

Escrever e Cena deverão compartilhar uma cronologia de autoria dentro do mesmo documento.

O comportamento de desfazer e refazer deverá respeitar o foco textual e o contexto da edição ativa.

O usuário não deverá sofrer alterações inesperadas na composição ao tentar desfazer uma edição textual em andamento.

A coordenação técnica entre os mecanismos de histórico deverá ser avaliada pelo especialista.

### HA-08 — Duração e isolamento do histórico

O histórico deverá permanecer disponível durante a sessão de autoria do documento, respeitando o isolamento entre projetos e documentos.

Alternar entre Escrever e Cena, momentos, visualizações e documentos não deverá misturar contextos de autoria.

O fechamento do documento poderá encerrar seu histórico de sessão.

Não existe exigência inicial de persistência do histórico entre sessões.

A recuperação de trabalho não salvo permanece uma responsabilidade distinta.

---

## 5. Identidade e substituição de recursos

### IR-01 — Identidades independentes

A experiência deverá distinguir conceitualmente:

- **Recurso:** conteúdo visual ou sonoro utilizado.
- **Necessidade artística:** intenção criativa que demanda uma representação.
- **Elemento:** ocorrência específica em uma composição.
- **Personalização autoral:** alteração particular de um elemento ou momento.

Esses conceitos não deverão ser confundidos durante operações de substituição, atualização ou organização.

A representação interna dessas identidades permanece sob avaliação técnica.

### IR-02 — Substituição não destrutiva

A substituição de uma representação provisória ou definitiva deverá preservar, sempre que aplicável:

- Identidade do elemento.
- Vínculos narrativos.
- Condições e efeitos associados.
- Transformações.
- Personalizações.
- Animações.
- Intenções de herança.

A evolução da arte não deverá exigir a reconstrução da composição narrativa.

### IR-03 — Escopos de substituição

Deverão existir dois escopos principais:

- Substituir somente a ocorrência selecionada.
- Substituir ocorrências intencionalmente vinculadas.

A substituição compartilhada não deverá ser determinada exclusivamente por nomes de arquivos ou semelhança visual.

O usuário deverá conhecer o alcance da operação antes de confirmá-la.

### IR-04 — Preservação de personalizações locais

Substituições compartilhadas deverão respeitar personalizações locais.

Uma representação explicitamente personalizada não deverá ser sobrescrita silenciosamente por uma atualização coletiva.

### IR-05 — Ajuste assistido de proporção

Quando a nova representação possuir proporções diferentes, o editor deverá oferecer uma prévia e alternativas de ajuste.

O comportamento inicial deverá priorizar **Conter**, preservando a proporção da arte dentro da área existente.

Alternativas poderão permitir preenchimento com recorte ou redimensionamento consciente do elemento.

A substituição não deverá provocar deformações inesperadas.

### IR-06 — Revisão de regiões interativas

O editor deverá sinalizar possíveis incompatibilidades espaciais entre a nova representação e regiões interativas existentes.

Regiões interativas não deverão ser redimensionadas ou reposicionadas silenciosamente.

O criador deverá poder revisar e ajustar essas relações.

### IR-07 — Atualizações explícitas

Alterações realizadas nos arquivos artísticos originais não deverão modificar silenciosamente as composições existentes.

O usuário deverá decidir quando incorporar uma nova representação ou atualização.

O comportamento deverá preservar a previsibilidade das cópias locais e referências existentes.

Não é exigido um sistema completo de versionamento artístico nesta evolução.

### IR-08 — Substituição reversível

Cada substituição confirmada deverá constituir uma única operação significativa de histórico.

Desfazer deverá restaurar a representação anterior e os estados autorais afetados pela operação.

### IR-09 — Registro de necessidades artísticas

A etapa B deverá introduzir a identificação mínima necessária para representar e acompanhar necessidades artísticas durante a blocagem.

A evolução para um catálogo consolidado permanece prevista para a etapa E.

O catálogo deverá ser derivado das necessidades e ocorrências autorais, evitando duplicação desnecessária de informações.

O Docs não deverá se transformar em um sistema completo de gerenciamento de produção artística.

### IR-10 — Autonomia do Docs

A blocagem, identificação de necessidades artísticas e substituição de representações deverão funcionar sem exigir que Canvas, Beats ou Travels estejam instalados ou em execução.

Integrações futuras poderão ampliar a conveniência, mas não deverão constituir dependências obrigatórias para esse fluxo.

---

## 6. Organização espacial e grupos

### OE-01 — Seleção múltipla independente

O usuário deverá poder selecionar vários elementos e executar operações coletivas sem modificar a hierarquia da composição.

A seleção múltipla deverá ser distinta do agrupamento persistente.

### OE-02 — Grupos persistentes

O painel de Camadas deverá permitir grupos:

- Nomeados.
- Recolhíveis.
- Selecionáveis.
- Reorganizáveis.
- Aninhados.

Os grupos deverão facilitar a organização de composições complexas sem introduzir uma estrutura de entidades programáveis.

### OE-03 — Identidade individual

Elementos agrupados deverão preservar suas identidades, propriedades, vínculos narrativos e capacidade de edição individual.

Não deverá ser necessário desagrupar elementos para realizar ajustes particulares.

### OE-04 — Transformações coletivas

As transformações coletivas deverão preservar as relações espaciais entre os elementos.

A evolução inicial deverá priorizar:

- Movimento.
- Rotação em relação a uma referência coletiva.
- Escala proporcional.

Alinhamento e distribuição deverão considerar os limites pertinentes à seleção.

Transformações não proporcionais de grupos não constituem requisito inicial.

### OE-05 — Agrupamento não destrutivo

Agrupar elementos não deverá alterar sua aparência resultante.

Desagrupar elementos deverá preservar a composição visual existente, incluindo os resultados de transformações coletivas anteriormente realizadas.

A operação deverá preservar os vínculos narrativos e as relações espaciais pertinentes.

### OE-06 — Visibilidade e bloqueio

Alterações coletivas de visibilidade e bloqueio deverão preservar as configurações individuais dos elementos internos.

Reexibir um grupo não deverá tornar visíveis elementos individualmente ocultos.

Desbloquear um grupo não deverá eliminar bloqueios individuais.

O bloqueio constitui uma proteção de autoria e não uma condição narrativa de execução.

### OE-07 — Separação narrativa

Grupos deverão organizar elementos e relações espaciais.

Não deverão introduzir sistemas próprios de condições, efeitos, scripts ou máquinas de estados.

O comportamento narrativo deverá permanecer sob responsabilidade dos mecanismos narrativos existentes.

### OE-08 — Herança espacial

Transformações coletivas e personalizações individuais deverão coexistir com a herança autoral.

A hierarquia de grupos deverá constituir inicialmente uma característica estrutural da composição.

Propriedades espaciais e visuais poderão variar entre momentos, respeitando as intenções de herança aprovadas.

Hierarquias independentes por momento não constituem requisito inicial.

### OE-09 — Coerência de parallax

Agrupar elementos não deverá alterar automaticamente suas configurações de parallax.

Imagens e regiões interativas relacionadas deverão manter coerência espacial durante a movimentação da perspectiva.

O editor deverá sinalizar incompatibilidades relevantes e permitir sua revisão.

### OE-10 — Duplicação e remoção seguras

A duplicação de grupos deverá criar novas ocorrências, preservando a organização interna e reutilizando referências pertinentes.

Vínculos narrativos existentes deverão ser preservados, sem criação automática de novas escolhas.

O criador deverá poder identificar e revisar interações duplicadas.

A exclusão de grupos ou elementos não deverá excluir automaticamente recursos artísticos originais ou escolhas narrativas associadas.

### OE-11 — Operações reversíveis

Agrupamentos, desagrupamentos, duplicações, exclusões e transformações coletivas deverão constituir operações significativas de histórico.

Desfazer e refazer deverão preservar a integridade da composição, das relações espaciais e dos vínculos associados.

### OE-12 — Autonomia e consistência

O Docs deverá possuir autonomia para executar suas operações de organização espacial.

Convenções compartilhadas de seleção, manipulação, atalhos, hierarquia e acessibilidade poderão ser avaliadas pelo Heartspace Master.

Não deverão ser introduzidas dependências ou abstrações compartilhadas prematuramente.

---

## 7. Distribuição pelas etapas de evolução

A sequência original de evolução permanece preservada.

### Etapa 0 — Preparação e Compatibilidade

- Consolidação das decisões funcionais.
- Avaliação de compatibilidade e dependências.
- Registro de critérios de aceite.
- Identificação dos riscos técnicos e ambientais.
- Avaliação das questões transversais.

### Etapa A — Fundação do Editor

Priorizar:

- Organização da interface.
- Histórico e transações de autoria.
- Seleção múltipla.
- Hierarquia de camadas.
- Grupos e transformações coletivas.
- Bloqueio e visibilidade.
- Fundamentos de manipulação e acessibilidade.

### Etapa B — Blocagem

Priorizar:

- Representações provisórias.
- Identificação mínima de necessidades artísticas.
- Regiões interativas.
- Substituição não destrutiva.
- Ajuste de proporção.
- Preservação de referências e personalizações.

### Etapa C — Apresentação Narrativa

Priorizar:

- Organização dos momentos.
- Herança autoral explícita.
- Restauração de propriedades.
- Animações e transformações ao longo dos momentos.
- Coerência entre propriedades individuais e coletivas.

### Etapa D — Experiência Interativa

Priorizar:

- Integração narrativa das interações.
- Exploração persistente.
- Inspeções temporárias.
- Placeholders de puzzles.
- Validação das regiões interativas.
- Teste imersivo e teste de autoria.

### Etapa E — Consolidação

Priorizar:

- Catálogo de necessidades artísticas.
- Refinamento dos fluxos de trabalho.
- Desempenho.
- Compatibilidade ampliada.
- Consolidação da acessibilidade.
- Recuperação, exportação e validação de produção.

A acessibilidade, a segurança da autoria e a compatibilidade deverão ser consideradas continuamente, não apenas na etapa E.

A distribuição apresentada constitui orientação funcional. O especialista deverá avaliar dependências e eventuais ajustes de sequência.

## 8. Critérios fundamentais de aceite

A evolução deverá demonstrar que:

1. Personalizações explícitas não são descartadas por coincidência de valores.
2. Restaurações respeitam o escopo escolhido.
3. Duplicação, remoção e reordenação preservam as intenções autorais.
4. Operações significativas podem ser desfeitas e refeitas sem corrupção de conteúdo.
5. O histórico permanece isolado entre contextos de autoria.
6. A substituição de representações preserva a composição narrativa.
7. Atualizações compartilhadas respeitam personalizações locais.
8. Diferenças de proporção e incompatibilidades interativas são comunicadas.
9. Agrupar e desagrupar não altera inesperadamente a aparência.
10. Transformações coletivas preservam relações espaciais.
11. Visibilidade e bloqueio coletivos não eliminam configurações individuais.
12. Grupos não duplicam os mecanismos narrativos.
13. A organização espacial permanece coerente com momentos, animações e parallax.
14. Documentos existentes continuam compatíveis dentro dos critérios de evolução aprovados.
15. Os fluxos fundamentais permanecem acessíveis e autônomos.
