# Heartspace Docs
## Especificação Funcional — Evolução do Editor de Cena

**Estúdio:** HeartKey Studios  
**Origem:** Heartspace Creative Lab  
**Destinatário principal:** Heartspace Docs — Especialista  
**Destinatário complementar:** Heartspace Master  
**Versão:** 1.0  
**Estado:** Direção criativa aprovada pelo fundador, aguardando avaliação técnica.

---

## 1. Contexto

O editor de Cena do Heartspace Docs deve evoluir para um ambiente de composição visual, apresentação narrativa e prototipação de experiências interativas.

A proposta surgiu da utilização prática do Docs na produção de histórias e jogos da HeartKey Studios, especialmente durante a exploração de um fluxo de desenvolvimento de aventuras point-and-click.

A experiência atual apresenta oportunidades de melhoria na organização dos controles, hierarquia visual, ergonomia, descoberta de funcionalidades e integração entre composição e narrativa.

A evolução deverá aproveitar as capacidades existentes, evitando reconstruções desnecessárias e preservando o trabalho já realizado.

## 2. Objetivo

Permitir que o criador transforme uma história escrita em uma experiência visual e interativa, independentemente da disponibilidade de recursos artísticos definitivos ou de conhecimentos especializados em programação, desenho e animação.

O editor deverá atender desde apresentações narrativas simples até a blocagem jogável de experiências mais complexas.

**Visão de produto: da imaginação à experiência interativa.**

## 3. Princípios de experiência

- A narrativa conduz a experiência.
- O palco é a principal superfície de criação.
- A manipulação direta tem prioridade sobre a configuração manual de valores.
- A complexidade deve ser apresentada progressivamente.
- A ausência de arte não deve impedir a prototipação.
- A experimentação deve ser reversível, acessível e segura.
- O trabalho artístico humano deve ser valorizado.
- As capacidades do Docs devem respeitar sua identidade narrativa e a vocação das demais ferramentas do Heartspace.

## 4. Estrutura e ergonomia

### 4.1. Organização do ambiente

O editor de Cena deverá ser organizado em seis regiões funcionais:

- Barra superior de contexto, apresentação e teste.
- Painel lateral esquerdo contextual.
- Barra de ferramentas de composição.
- Palco central.
- Inspetor contextual à direita.
- Painel inferior de momentos narrativos e animações.

O palco deverá receber prioridade espacial. Os painéis auxiliares deverão poder ser recolhidos e redimensionados.

### 4.2. Painel lateral esquerdo

Um único painel deverá permitir alternar entre três contextos:

- **Documentos:** navegação pela estrutura documental.
- **Camadas:** organização dos elementos da composição.
- **Recursos:** acesso aos recursos disponíveis para criação.

A alternância deverá preservar o contexto de trabalho sempre que possível.

### 4.3. Inspetor contextual

O inspetor deverá apresentar propriedades relevantes ao elemento selecionado.

A organização poderá utilizar as categorias Objeto, Interação e Animação, exibindo apenas aquelas aplicáveis à seleção atual.

Na ausência de uma seleção, o inspetor deverá apresentar configurações pertinentes à cena ou ao momento ativo.

### 4.4. Níveis de edição

A experiência deverá distinguir quatro escopos:

| Escopo | Responsabilidade |
|---|---|
| Experiência | Configurações gerais de apresentação. |
| Cena | Composição e características do ambiente. |
| Momento | Alterações associadas à progressão narrativa. |
| Elemento | Aparência e comportamento individual. |

O usuário deverá compreender qual escopo está modificando e quais consequências sua alteração poderá produzir.

## 5. Composição visual

### 5.1. Manipulação direta

O palco deverá permitir:

- Seleção individual e múltipla.
- Movimentação.
- Redimensionamento e escala.
- Rotação e ajuste de âncora.
- Edição direta de textos.
- Duplicação.
- Agrupamento e desagrupamento.
- Bloqueio de elementos.
- Ajustes precisos pelo inspetor.

Redimensionamento e escala deverão ser diferenciados quando produzirem consequências distintas.

### 5.2. Alinhamento e precisão

Disponibilizar guias inteligentes para alinhamento, centralização e espaçamento entre elementos.

A grade deverá ser opcional. O encaixe deverá poder ser desativado temporariamente.

### 5.3. Camadas e grupos

Permitir organização hierárquica, renomeação, reordenação, visibilidade, bloqueio e duplicação.

Os grupos deverão preservar as relações espaciais entre seus elementos durante transformações.

Deverá ser possível organizar conjuntamente uma representação visual e suas regiões interativas, mantendo sua coerência espacial, inclusive em situações de parallax.

Grupos não deverão exigir um sistema genérico de entidades programáveis.

### 5.4. Regiões interativas

Permitir a criação direta de regiões no palco nos formatos:

- Retangular, como opção padrão.
- Elíptico.
- Poligonal.

As regiões deverão possuir identificação, propriedades visuais de autoria e vínculos narrativos.

Não fazem parte deste escopo colisões físicas ou edição vetorial avançada.

## 6. Blocagem visual e produção artística

### 6.1. Criação sem recursos externos

O usuário deverá conseguir iniciar uma composição sem importar qualquer imagem.

O editor deverá disponibilizar recursos nativos, utilizáveis offline:

- Formas geométricas.
- Linhas, setas e painéis.
- Objetos genéricos.
- Silhuetas e representações provisórias de personagens.
- Elementos básicos para representação de ambientes.

Esses recursos deverão priorizar clareza, simplicidade e reconhecimento visual.

### 6.2. Placeholders visuais

Permitir a criação de recursos provisórios identificáveis, contendo:

- Nome.
- Categoria.
- Descrição artística.
- Representação visual provisória.
- Cor de identificação.
- Identificação visual opcional.
- Associação futura com um recurso definitivo.

Os placeholders deverão representar intenções criativas e necessidades de produção.

### 6.3. Substituição não destrutiva

A substituição de um recurso provisório por arte definitiva deverá preservar, sempre que aplicável:

- Identidade do elemento.
- Transformações.
- Vínculos narrativos.
- Regiões interativas.
- Condições e efeitos.
- Animações.
- Relações de herança.

Diferenças de proporção deverão permitir ajustes conscientes, evitando deformações ou desalinhamentos silenciosos.

Deverá ser avaliada a possibilidade de substituir um recurso compartilhado em múltiplas cenas, respeitando modificações locais.

### 6.4. Esboço livre e anotações

Disponibilizar instrumentos elementares de esboço, incluindo lápis, borracha, cor e espessura.

Permitir anotações visuais de autoria que não sejam exibidas durante a apresentação ao jogador.

O desenho e a pintura especializados permanecem no domínio do Canvas.

### 6.5. Catálogo de necessidades artísticas

Permitir identificar os recursos provisórios utilizados na história, suas descrições, categorias, contextos de utilização e estado de produção.

O catálogo deverá facilitar a comunicação entre escritores e artistas, sem exigir manutenção manual redundante.

### 6.6. Diretriz artística obrigatória

A geração de arte por inteligência artificial está explicitamente excluída do planejamento.

Os recursos nativos deverão ser produzidos por artistas humanos ou obtidos de fontes devidamente licenciadas, respeitando a posição criativa da HeartKey Studios.

## 7. Momentos narrativos e herança

### 7.1. Progressão narrativa

A organização principal da composição deverá acompanhar os acontecimentos da história, e não uma duração temporal fixa.

Cada momento deverá representar um contexto narrativo e suas características de apresentação.

### 7.2. Painel de momentos

Disponibilizar uma representação visual dos momentos narrativos, permitindo navegação, identificação e visualização de suas composições.

O painel deverá funcionar como um storyboard narrativo.

### 7.3. Herança por propriedade

A evolução deverá considerar a herança individual de propriedades, evitando duplicar configurações completas quando apenas uma característica for modificada.

O usuário deverá conseguir:

- Identificar propriedades herdadas.
- Identificar modificações locais.
- Restaurar valores herdados.
- Compreender a origem de uma propriedade.
- Alterar composições anteriores sem destruir personalizações posteriores.

As regras exatas de resolução da herança deverão ser avaliadas pelo especialista.

## 8. Animação narrativa

### 8.1. Timeline temporal contextual

Disponibilizar uma timeline expansível associada ao momento narrativo selecionado.

A progressão temporal das animações deverá permanecer distinta da progressão da história.

### 8.2. Complexidade progressiva

Oferecer animações prontas para operações recorrentes, como aparecer, desaparecer, deslizar, aproximar, pulsar e tremer.

Permitir personalização posterior através de controles de duração, atraso, interpolação, repetição, transformações e keyframes.

As animações prontas e personalizadas deverão integrar uma experiência coerente, evitando sistemas redundantes.

### 8.3. Comportamentos temporais

As animações deverão poder ocorrer:

- Ao entrar em um momento.
- Durante a permanência.
- Em resposta a uma interação.
- Ao sair do momento.
- Bloqueando temporariamente o avanço, quando necessário.
- Sem impedir a progressão narrativa.

Rigging, deformações complexas e animação especializada permanecem no domínio do Canvas.

## 9. Integração narrativa e interatividade

### 9.1. Integração entre Escrever e Cena

Permitir criar, consultar e modificar vínculos narrativos diretamente na composição.

Uma escolha criada em Cena deverá corresponder à mesma entidade narrativa utilizada em Escrever, evitando duplicação de informações e divergências.

A representação visual deverá respeitar as condições e efeitos associados à narrativa.

### 9.2. Exploração persistente

Permitir que um ambiente permaneça ativo enquanto o jogador realiza diferentes interações.

A exploração não deverá exigir a reconstrução da composição para cada pequena ação narrativa.

### 9.3. Comportamentos de interação

Distinguir três comportamentos fundamentais:

| Comportamento | Resultado |
|---|---|
| Interação local | Executa uma ação narrativa e retorna à exploração. |
| Inspeção temporária | Apresenta um detalhe e permite retornar ao contexto anterior. |
| Transição narrativa | Encerra o contexto atual e prossegue para outro. |

A representação desses comportamentos nos contratos narrativos existentes deverá ser investigada.

### 9.4. Estados narrativos

Permitir que a composição e a disponibilidade de interações respondam aos estados, condições e efeitos da história.

Evitar a criação de um sistema paralelo de variáveis exclusivo do editor de Cena.

## 10. Prototipação de enigmas

### 10.1. Placeholders de mecânicas

Permitir representar enigmas e mecânicas ainda não implementados como entidades narrativas identificáveis.

Essas entidades deverão conter:

- Nome e descrição.
- Condições de entrada.
- Resultados possíveis.
- Consequências narrativas.
- Informações relevantes para sua futura produção.

### 10.2. Simulação

Durante os testes, o criador deverá conseguir selecionar manualmente o resultado de um enigma provisório e experimentar suas consequências.

O objetivo é validar a narrativa sem exigir a implementação definitiva da mecânica.

### 10.3. Limites

O Docs deverá permitir a prototipação de experiências complexas sem assumir a responsabilidade por todos os seus sistemas de gameplay.

No fluxo de produção de point-and-click da HeartKey Studios, mecânicas especializadas, inventários avançados, física e demais comportamentos complexos poderão ser produzidos posteriormente no Godot.

Experiências narrativas mais simples poderão permanecer integralmente no Docs, conforme suas capacidades.

## 11. Apresentação e teste

### 11.1. Contextos de utilização

Distinguir edição, teste e apresentação, preservando o contexto de autoria ao alternar entre eles.

### 11.2. Teste imersivo

Permitir experimentar a narrativa como jogador, sem controles de autoria ou informações internas.

### 11.3. Teste de autoria

Disponibilizar uma camada opcional de ferramentas de investigação, permitindo consultar:

- Estados narrativos.
- Condições e efeitos.
- Regiões interativas.
- Caminhos narrativos.
- Resultados simulados.
- Motivos de indisponibilidade de interações.

### 11.4. Perfis de apresentação

Distinguir:

- Formato e orientação.
- Perfil de dispositivo.
- Preferências de acessibilidade.
- Tema do ambiente de autoria.

Perfis como E-ink deverão modificar a apresentação simulada sem obrigatoriamente modificar a aparência das ferramentas de edição.

## 12. Polimento e acessibilidade

### 12.1. Identidade visual

Preservar a identidade do Heartspace Docs, aprimorando hierarquia, espaçamento, legibilidade e consistência.

Utilizar ícones para operações reconhecíveis, acompanhados de descrições acessíveis.

Ações específicas ou potencialmente ambíguas deverão preservar identificações textuais adequadas.

As cores deverão possuir significado consistente, sem constituir o único meio de comunicação de estados.

### 12.2. Acessibilidade do criador

Considerar navegação por teclado, indicadores de foco, contraste, escala de interface, tooltips e alternativas à manipulação por mouse.

Os atalhos de composição não deverão interferir na edição textual.

### 12.3. Acessibilidade do jogador

Considerar velocidade de leitura, tamanho de textos, redução de movimento, contraste, identificação de interações, ordem de foco e alternativas para informações sonoras.

### 12.4. Segurança criativa

Priorizar:

- Desfazer e refazer.
- Cancelamento de operações.
- Preservação do contexto.
- Identificação de recursos ausentes.
- Identificação de vínculos inválidos.
- Indicação de consequências sobre momentos posteriores.
- Restauração de propriedades herdadas.

Evitar confirmações desnecessárias em operações facilmente reversíveis.

## 13. Priorização funcional proposta

A ordem abaixo representa uma recomendação de amadurecimento, não um cronograma de implementação.

**Etapa A — Fundação da experiência**

Reorganização da interface, painéis contextuais, inspetor, manipulação direta, camadas e ergonomia.

**Etapa B — Blocagem visual**

Recursos nativos, placeholders, esboços, anotações e substituição não destrutiva.

**Etapa C — Apresentação narrativa**

Momentos, herança por propriedade, animações e timeline temporal contextual.

**Etapa D — Experiências interativas**

Integração narrativa, exploração persistente, inspeções, placeholders de enigmas e ferramentas de simulação.

**Etapa E — Consolidação**

Validação prática, catálogo de necessidades artísticas, refinamento visual e consistência.

A acessibilidade deverá ser considerada desde a primeira etapa, e não apenas durante a consolidação.

## 14. Critérios de validação

A evolução deverá ser avaliada através de tarefas reais de criação.

- [ ] Criar uma cena sem importar recursos artísticos.
- [ ] Compor um ambiente utilizando formas e objetos provisórios.
- [ ] Criar e organizar grupos de elementos.
- [ ] Criar regiões interativas diretamente no palco.
- [ ] Criar escolhas narrativas sem abandonar a composição.
- [ ] Substituir recursos provisórios preservando a estrutura narrativa.
- [ ] Alterar e restaurar propriedades herdadas.
- [ ] Criar animações simples e personalizadas.
- [ ] Prototipar um ambiente de exploração persistente.
- [ ] Simular diferentes resultados de um enigma.
- [ ] Identificar condições que impedem uma interação.
- [ ] Alternar entre autoria e teste sem perder o contexto.
- [ ] Executar operações fundamentais utilizando o teclado.
- [ ] Testar diferentes perfis de apresentação e acessibilidade.

Recomenda-se utilizar uma história real em desenvolvimento pela HeartKey Studios como projeto de validação.

## 15. Restrições

- Não transformar o Docs em um editor de arte especializado.
- Não transformar o Docs em uma game engine genérica.
- Não introduzir geração de arte por IA.
- Não duplicar sistemas narrativos desnecessariamente.
- Não exigir recursos artísticos definitivos para iniciar a criação.
- Não comprometer a simplicidade das experiências narrativas básicas.
- Não presumir integrações entre ferramentas que ainda não estejam estabelecidas.
- Preservar documentos, recursos e trabalhos existentes durante a evolução.

## 16. Questões em aberto

O especialista do Docs deverá investigar:

- Quais capacidades propostas já existem e podem ser reaproveitadas.
- Quais problemas são exclusivamente de interface e ergonomia.
- Quais propostas exigem novas capacidades funcionais.
- Como preservar compatibilidade com documentos existentes.
- Como representar exploração persistente e inspeções temporárias.
- Como integrar escolhas criadas em Cena aos contratos narrativos.
- Como resolver herança, modificações locais e ramificações narrativas.
- Como preservar regiões interativas durante substituições de recursos.
- Como representar placeholders visuais e de mecânicas.
- Como estruturar a evolução incremental sem comprometer o editor atual.

## 17. Encaminhamento ao Heartspace Master

Deverão ser avaliadas transversalmente:

- Consistência de interface e atalhos entre ferramentas.
- Possíveis capacidades compartilhadas de composição e manipulação visual.
- Relação entre esboço no Docs e criação artística no Canvas.
- Relação entre animação narrativa e animação especializada.
- Integração futura de recursos provenientes de Canvas, Beats e Travels.
- Identificação, reutilização e substituição de recursos no ecossistema.
- Diretrizes compartilhadas de acessibilidade.

Nenhuma dessas questões constitui uma decisão arquitetural antecipada.

## 18. Resultado esperado

O Heartspace Docs deverá permitir que escritores e equipes criativas desenvolvam, visualizem e experimentem suas histórias antes mesmo da produção definitiva de seus recursos.

O criador deverá conseguir avançar naturalmente entre imaginação, escrita, blocagem, experimentação, produção artística e refinamento.

A ferramenta deverá valorizar a criatividade humana e facilitar a colaboração entre escritores, artistas, designers e desenvolvedores.

**Heartspace Docs — da palavra à experiência interativa.**

---

**Estado final:** especificação funcional consolidada a partir das decisões criativas aprovadas pelo fundador. A viabilidade, a arquitetura e o planejamento de implementação permanecem sujeitos à avaliação dos especialistas.
