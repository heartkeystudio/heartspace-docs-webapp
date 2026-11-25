# Avaliação técnica consolidada do complemento funcional do editor de Cena

> Estado atual — 25/11/2026: **etapa 0 formalmente encerrada por determinação
> do fundador**, após regularização editorial e confirmação do aceite ambiental
> de seletor nativo, IME e tecnologias assistivas. Ver o
> [registro de encerramento](SCENE_EDITOR_STAGE_0_CLOSURE.md).
> As pendências de validação continuam documentadas, sem certificação ou dispensa
> de acessibilidade. Está autorizado somente o
> [planejamento técnico de A](SCENE_EDITOR_STAGE_A_TECHNICAL_PLAN.md), sem execução
> de A–E. Condições de encerramento mencionadas abaixo são o registro anterior.


**Responsável:** Heartspace Docs — Especialista  
**Data:** 25/11/2026  
**Estado:** avaliação para decisão de encerramento da etapa 0; nenhuma autorização de implementação inferida.

As 30 decisões são tecnicamente compatíveis com a direção do Docs. Não foi
identificada incompatibilidade que exija abandonar a proposta ou transformar o
produto em uma engine genérica. Elas exigem capacidades que o editor atual ainda
não oferece e escolhas de representação que precisam anteceder a implementação.

**Recomendação:** encerrar a etapa 0 como preparação, condicionado ao aceite
explícito dos riscos ambientais e limites listados neste parecer. A preparação da etapa A pode ser delimitada em
planejamento próprio, sem autorizar sua execução. Os comportamentos futuros não
precisam estar implementados para encerrar a etapa 0.

## Registros e rastreabilidade

O [complemento funcional v1.0](SCENE_EDITOR_FUNCTIONAL_COMPLEMENT_V1.md) foi salvo
separadamente, preservando seu texto. A [especificação original](SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md)
não recebeu alterações. O recebimento integral, incluindo o encaminhamento, está
em `tests/evidence/stage0-functional-complement-received-2026-11-25.txt`, com hashes
e limites da extração em `tests/evidence/stage0-functional-complement-provenance-2026-11-25.json`.

A seção 8 foi completada pelo fundador em mensagem posterior, com 15 critérios
fundamentais de aceite. O texto complementar recebido está preservado em
`tests/evidence/stage0-functional-complement-section8-completed-2026-11-25.txt`.
A interrupção do primeiro recebimento permanece apenas no arquivo histórico;
**a pendência editorial está resolvida**. As 30 decisões e os 15 critérios
constituem a referência funcional consolidada. Os critérios técnicos deste parecer
detalham sua validação futura, sem representar resultados já obtidos.

Referências consolidadas, sem nova rodada de investigação:

- [Resultados S0-P05](SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md) e sua evidência final:
  101/101 casos Node, 11/11 de compatibilidade, 24/24 de recuperação, 26/26 no editor
  e uma verificação de fechamento/reabertura. São resultados da execução anterior,
  não testes executados novamente nesta entrega documental.
- [Herança e histórico](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md): inventário,
  comportamento de patches, operações de momento e limites do histórico existente.
- [Recursos, espaço e acessibilidade](SCENE_EDITOR_STAGE_0_REMAINING_REVIEW.md):
  modelo plano, referências fixadas, revisão geométrica e limites ambientais.
- [Plano da etapa 0](SCENE_EDITOR_STAGE_0_PLAN.md): objetivos e fronteiras da preparação.

As correções S0-P01–P05 foram aprovadas no alcance validado. Essa aprovação não
converte os testes atuais em aceite dos novos requisitos nem apaga os diagnósticos
históricos. A exclusão de arte por IA continua integral.

## Herança e histórico

| Decisão aprovada | Relação com o existente | Dependência e critério de aceite posterior |
|---|---|---|
| HA-01 Sobrescrita explícita | O resolvedor já distingue presença/ausência de chave; reconstruir por diff perde intenção coincidente (H07). | Escrita deve preservar intenção, não apenas a pose. x local=40 continua 40 quando a origem muda para 60; editar y não elimina x local. Foco sem edição não cria sobrescrita. |
| HA-02 Restauração individual | Não há restauração individual completa na interface atual. | Remover somente a intenção da propriedade, recalcular origem/valor e manter demais propriedades e animações. Atribuir o valor herdado não equivale a restaurar herança. |
| HA-03 Escopos de restauração | Comandos atuais de momento podem limpar composição e animação juntos. | Separar propriedade, elemento, composição e animação; apresentar alcance antes da ação. Restaurar visual preserva trilhas; limpar trilhas preserva visual. É evolução funcional autorizada como direção, não correção aplicada. |
| HA-04 Duplicação de momentos | IDs de bloco e cues já relacionam narrativa e composição; duplicação com essa semântica ainda precisa ser construída. | Novo momento tem identidade própria, mantém campos ausentes herdados e copia apenas personalizações/intenção local. Não copiar pose resolvida como substituto. |
| HA-05 Remoção e reordenação | Resolução segue ordem narrativa; cues órfãos e limpeza já foram caracterizados. | Recalcular sem congelar herança. Informar alcance posterior e desfazer fonte, ordem e dados autorais da operação em conjunto. Política de retenção de órfãos precisa constar do desenho. |
| HA-06 Unidades de transação | Snapshots do corpo e transações locais existem; Cena e animação não têm cobertura integrada. | Uma intenção, uma operação; arraste com várias prévias confirma uma vez; cancelar confirma zero; mudar intenção sem mudar aparência pode ser alteração real. |
| HA-07 Cronologia Escrever/Cena | Atualmente o histórico próprio cobre o corpo; campos externos e Cena não compõem uma cronologia completa. | Coordenar ações do documento e edição textual pendente. Undo/redo não pode saltar silenciosamente uma operação posterior nem restaurar snapshot sobre edição independente mais recente. |
| HA-08 Sessão e isolamento | S0-P04/P05 protegem contextos; pilhas atuais são limitadas e não persistidas, com guarda pelo documento do topo. | Disponibilidade por documento aberto, inclusive ao alternar documentos, sem pilhas misturadas. Fechar pode encerrar a sessão; salvar e navegar não devem ser tratados como fechamento. Recuperação continua separada. |

HA-01/02/04/05/06/07/08 resolvem o fundamento das propostas anteriores F01/F02,
F04/F06/F07, sem aprovar automaticamente todos os detalhes de F01–F08. HA-03
estabelece uma direção mais específica que a preservação provisória do alcance
dos comandos globais discutida em F03. Não se deve manter a ambiguidade antiga
como comportamento final. Retenção de cues órfãos (F05) e granularidade de
mídia/ordem/trilhas (F08) continuam escolhas de desenho, subordinadas às decisões
aprovadas; não são novas lacunas de direção criativa.

### Coordenação textual e cronologia

HA-07 é realizável, mas foco e cronologia não podem ser tratados como duas pilhas
independentes capazes de reverter o mesmo estado. O desenho da etapa A deve
explicitar quem possui uma edição ainda em andamento, quando ela é confirmada ou
cancelada e como se apresenta a próxima ação reversível.

Recomendação técnica para planejar: confirmar ou cancelar a edição textual ativa
antes de uma operação que dependa dela; manter a ordem global das ações confirmadas
do documento; nunca procurar uma edição textual antiga pulando uma operação de
Cena posterior. Quando o foco textual estiver ativo e a próxima ação for visual,
a interface precisa tornar o alvo compreensível, sem modificar Cena
inesperadamente. Os percursos e o feedback exatos deverão ser validados antes da
implementação. Não se presume aprovada uma exceção à cronologia compartilhada.

A captura precisa cobrir teclado, barra, menu, paste/cut, composição de texto,
campos narrativos e operações de Cena. A solução de S0-P05 é uma base limitada,
não um motor já pronto para isso. Histórico de sessão em memória não autoriza
alterar `.hdocs`, persistir pilhas ou incluir estado do player no undo autoral.
Alterações remotas e recuperação exigem barreiras explícitas; desfazer local não
é autorização para reverter revisão remota ou publicar uma versão antiga.

## Identidade e substituição

| Decisão aprovada | Relação com o existente | Dependência e critério de aceite posterior |
|---|---|---|
| IR-01 Identidades independentes | Instância visual, vínculo narrativo e proveniência já são distintos; necessidade artística ainda não é entidade completa. | Documentar recurso, necessidade, ocorrência e personalização; bytes iguais ou nomes iguais não fundem identidades. |
| IR-02 Não destrutiva | Trocar somente asset preserva campos suportados; não existe fluxo assistido completo. | Preservar IDs, vínculos, condições/efeitos narrativos, pose, trilhas e intenção; comparar fonte e resultado após undo/redo e gravação/reabertura. |
| IR-03 Dois escopos | Há troca de ocorrência e referências fixadas; não há vínculo lógico geral para substituição coletiva. | Prévia enumera somente ocorrências vinculadas intencionalmente. Nunca selecionar alcance por nome/hash/semelhança como única regra. |
| IR-04 Personalização local | Patches podem expressar localidade, com o risco de intenção perdida já identificado. | Atualização coletiva mantém representações locais explícitas; apresentar preservadas, afetadas e conflitos. |
| IR-05 Proporção assistida | Contain/cover/original e caixa já existem. | Nova representação tem prévia com Conter como comportamento inicial; oferecer recorte ou redimensionamento consciente, sem deformar. Preservar dados anteriores para desfazer. |
| IR-06 Regiões interativas | Região e imagem são elementos independentes; troca de mídia não as ajusta. | Sinalizar incompatibilidade possível, apresentar vínculos espaciais conhecidos e permitir revisão; nenhum ajuste silencioso. |
| IR-07 Atualizações explícitas | Snapshots fixados e atualização voluntária do adaptador de recursos são reaproveitáveis. | Arquivo externo alterado não muda a cena até ação explícita. Cancelar mantém cópia, proveniência e estado pendente anteriores. |
| IR-08 Substituição reversível | Histórico atual do corpo não cobre a operação completa de mídia/composição. | Uma transação restaura representação, referência/revisão e personalizações afetadas, sem apagar edições independentes posteriores. |
| IR-09 Registro mínimo em B | Não há catálogo derivado completo. | Registrar intenção durante blocagem e derivar utilização das ocorrências; renomear/remover ocorrência não cria divergência manual. Catálogo consolidado em E. |
| IR-10 Autonomia | Composição e mídias locais já podem funcionar sem outros apps. | Corpus offline completo de blocagem/substituição; nenhum processo externo obrigatório nem leitura de fontes privadas de outros produtos. |

IR-05 não exige trocar silenciosamente o fit de cenas existentes ao abri-las. O
padrão Conter se aplica ao fluxo futuro de substituição; diferenças em relação ao
fit atual devem aparecer na prévia. Mudanças de proporção podem alterar a silhueta
dentro da caixa, mesmo preservando a transformação. Preservar a caixa não garante
que a região clicável ainda corresponda ao desenho.

IR-06 depende de saber quais regiões se relacionam com qual representação. Hoje
vínculo com uma escolha não é prova de associação espacial com uma imagem. Uma
heurística pode sugerir revisão, mas não decidir relação nem reajustar a fonte.
O desenho deve prever relação explícita ou seleção assistida local. Não prometer
detecção perfeita de diferenças semânticas da arte.

Para IR-03/04, a prioridade entre substituição compartilhada e representação local
deve ser definida antes da implementação; recurso compartilhado não equivale à
pose compartilhada. Atualizar conteúdo mantendo overrides de posição, cor ou
animação é diferente de substituir um asset explicitamente local. Registro de
necessidade artística também não é substituto da identidade do elemento.

## Organização espacial

| Decisão aprovada | Relação com o existente | Dependência e critério de aceite posterior |
|---|---|---|
| OE-01 Seleção múltipla | Seleção atual é predominantemente individual. | Ação coletiva não altera parentesco, ordem ou IDs apenas por selecionar. |
| OE-02 Grupos persistentes aninhados | Modelo atual é lista plana; normalizador descarta parent/group/children desconhecidos. | Representação local explícita com nomes, árvore sem ciclos, ordem determinística, recolhimento e seleção acessível. Não gravar campos experimentais no formato vigente. |
| OE-03 Identidade individual | IDs individuais e vínculos já existem. | Entrar no grupo/selecionar filho sem desagrupar; edição particular mantém irmãos e narrativa. |
| OE-04 Transformações coletivas | Elementos já têm posição, escala, rotação e âncora. | Movimento, rotação e escala proporcional com referência coletiva definida; medir limites em espaço comum, respeitando aspecto do viewport e flips. Escala não proporcional de grupo fica fora da primeira evolução. |
| OE-05 Agrupar/desagrupar | Não há hierarquia persistente atual. | Aparência equivalente antes/depois em tolerância definida, incluindo transformações anteriores, âncoras, filhos aninhados e momentos afetados; IDs/vínculos permanecem. |
| OE-06 Visibilidade e bloqueio | Visibilidade individual existe; bloqueio e máscara hierárquica precisam de desenho. | Estado efetivo combina ancestral e local sem sobrescrever o local. Reexibir/desbloquear pai não altera flags individuais. Bloqueio não muda condições narrativas. |
| OE-07 Separação narrativa | Escolhas e variáveis já pertencem ao sistema narrativo. | Grupo não introduz scripts, condições, efeitos ou máquina de estados própria; exportação mantém a narrativa existente. |
| OE-08 Herança espacial | Patches são por momento, sem árvore de grupos. | Estrutura única da composição; propriedades variam por momento. Reparentear preserva resultado e intenção nos momentos afetados, sem criar hierarquias por momento. |
| OE-09 Parallax | Deslocamentos são individuais e independentes. | Agrupar mantém parâmetros. Arte/região coerentes são validadas sob movimento de perspectiva; incompatibilidade anterior é informada, não corrigida silenciosamente. |
| OE-10 Duplicação/remoção | Duplicação simples já existe; grupos e remapeamento interno não. | Novos IDs de ocorrências, referências internas coerentes e recursos reutilizados. Mesmas escolhas continuam sendo as mesmas entidades; interações duplicadas são revisáveis. Excluir composição não exclui arte ou escolhas. |
| OE-11 Reversibilidade | Não há histórico semântico integrado dessas operações. | Uma operação para grupo/transformação composta; cancelamento não altera fonte; undo/redo restaura árvore, ordem, propriedades e relações. |
| OE-12 Autonomia/consistência | Não há dependência obrigatória de editor externo. | Operações locais/offline; convenções compartilhadas podem ser alinhadas sem motor transversal obrigatório. |

OE-04 reduz um risco importante: movimento, rotação e escala proporcional formam
uma base viável sem exigir cisalhamento arbitrário. Isso não elimina a necessidade
de uma convenção geométrica. Percentuais de x/y e largura/altura atuais têm bases
diferentes conforme o aspecto do viewport; transformações devem passar por um
espaço comum, com conversão consistente para persistência e renderização. Não
aplicar rotação euclidiana diretamente a percentuais de eixos com unidades distintas.

OE-05 e OE-08 tornam agrupamento uma operação estrutural da composição, com
consequências em mais de um momento. Reparentear só a pose ativa pode alterar
momentos anteriores/posteriores. O plano deverá decidir coordenadas locais/globais,
origem das propriedades e tratamento das trilhas; preservar apenas a imagem do
momento selecionado não satisfaz o aceite. Aparência igual também não basta se a
operação congelar valores herdados.

OE-09 não significa que agrupar elementos com parallax já incompatível os tornará
coerentes automaticamente. Manter parâmetros e sinalizar a incompatibilidade é
compatível com a decisão. Se o desenho exigir parallax no pai, será preciso definir
como compõe com o dos filhos sem aplicar o deslocamento duas vezes. Não existe
aprovação antecipada de uma nova propriedade persistida para isso.

## Dependências e sequência de preparação

A distribuição A–E permanece coerente. São recomendados os seguintes ajustes de
preparação, sem deslocar a entrega funcional nem autorizar código:

1. **Antes do desenho detalhado de A:** especificar cronologia por documento, dono
   da edição textual, confirmação/cancelamento, limites de memória e política de
   alterações externas. Não assumir que snapshots completos do corpo servem para
   restaurar recursos e composição sem risco de sobrescrita concorrente.
2. **Na preparação de grupos em A:** definir modelo espacial, estrutura da cena,
   identidade e operações atômicas; antecipar a análise de herança e animação
   necessária para não bloquear C. A interface de herança completa permanece em C.
3. **Antes de B:** usar os fundamentos de transação de A e decidir a precedência
   de recurso vinculado e personalização local. Analisar intenção de herança já
   aqui, pois IR-02/04/08 não podem depender de uma semântica indefinida até C.
4. **Antes de qualquer escrita nova:** plano separado de compatibilidade que
   distinga fonte, cache, arquivo portátil, transporte e publicação. O normalizador
   atual não preservará grupos por simples adição de campos. Escritores/leitores
   antigos não podem descartar estrutura silenciosamente ao regravar.
5. **Desde A:** critérios de teclado, foco, cancelamento, erro anunciado e
   preservação de dados. Esforço de validação deve acompanhar as ações que entram,
   sem adiar segurança e acessibilidade para E.

A preparação técnica de A deve produzir uma proposta revisável com componentes,
operações, fronteiras, fixtures futuras e impactos de compatibilidade antes de
pedir autorização de execução. Não é necessário implementar um catálogo completo
em A nem tornar Canvas requisito de grupos, mídia ou histórico.

## Questões para o Heartspace Master

Este quadro é um encaminhamento para uso humano. Não houve envio a outro chat e
não se presume resposta ou aprovação transversal.

| Problema e componentes | Contrato/interface e risco | Proposta e decisão solicitada |
|---|---|---|
| Identidade de recursos: Docs e eventuais produtores | `project_ref`, snapshot local e revisão; confundir recurso/necessidade/ocorrência pode provocar atualização indevida. | Confirmar limites de identidade compartilhada e propriedade dos artefatos. Reutilizar o contrato atual quando suficiente; submeter qualquer extensão separadamente. |
| Compatibilidade: Docs e consumidores efetivos da fonte | Fonte/cache/portátil/transporte/publicação têm papéis distintos; normalizadores antigos descartam campos novos. | Identificar consumidores realmente afetados e política de evolução antes de alterar contrato compartilhado. Não exigir migração agora. |
| História local e sincronização, se conectadas | Core/adapter e backend só entram quando houver dependência concreta; undo local não deve reverter edição remota ou violar revisão. | Aprovar fronteira de responsabilidade e estratégia de barreira/rebase quando necessária. Nenhuma alteração de backend está proposta nesta entrega. |
| Convenções de composição e acessibilidade | Teclado, foco, seleção, árvore e cancelamento podem divergir entre ferramentas. | Alinhar convenções e critérios; preservar autonomia de implementação e evitar biblioteca compartilhada prematura. |
| Animação e arte especializada | Animação narrativa do Docs não é rigging do Canvas; necessidades artísticas não são fonte privada do artista. | Manter fronteiras atuais; eventual adaptador futuro trata somente recursos explicitamente disponibilizados e licenciados. |

Não é necessário obter aprovação do Master para planejar os detalhes internos
locais do Docs. Se uma opção de representação atingir formato ou responsabilidade
compartilhada, essa parte depende do alinhamento e da autorização correspondente
antes da execução. Ausência de resposta transversal não cria licença para alterar
contratos nem impede planejamento local independente.

## Critérios consolidados para as etapas posteriores

Os critérios abaixo complementam as tabelas, sem substituir o aceite do fundador.

- **A — fundação:** cronologia coordenada por documento; alternância A/B/A de
  documentos conserva os históricos de sessão corretos; projetos com IDs e textos
  coincidentes continuam isolados. Validar digitação/formatação/ação visual/undo
  consecutivos com foco textual, IME e campos narrativos. Arraste confirmado gera
  uma transação; cancelado gera zero. Árvore, seleção coletiva, visibilidade,
  bloqueio e operações de grupo funcionam por teclado e mantêm IDs e aparência.
- **B — blocagem:** fluxo offline sem importar arte definitiva; necessidades
  mínimas identificáveis; substituição de ocorrência e de vínculo intencional com
  alcance visível. Prévia Conter, proporção diferente, cancelamento, sobrescrita
  local e undo restauram asset/proveniência/pose; regiões são revisadas sem ajuste
  automático. Gravação/reabertura e exports conservam o resultado suportado.
- **C — apresentação:** teste decisivo de valor explícito igual ao herdado;
  restauração individual e quatro escopos distintos; duplicação/reordenação/remoção
  recalculam herança sem congelá-la. Grupos e trilhas preservam relações em todos os
  momentos afetados. Player não regrava estado de execução como autoria.
- **D — interação:** escolhas de Cena e Escrever são a mesma entidade; condições e
  efeitos usam o sistema narrativo existente. Exploração/inspeção/transição têm
  contratos de navegação definidos. Revisão de regiões e interações duplicadas é
  acessível. Placeholders de mecânica ficam separados dos visuais.
- **E — consolidação:** catálogo derivado sem manutenção redundante; desempenho
  com limites e cenários definidos; corpus legado e novo com abertura, gravação,
  recuperação, exportação e publicação suportadas. Acessibilidade, segurança e
  compatibilidade continuam requisitos de cada parcela anterior.

Cada aceite deve informar tolerâncias geométricas, corpus, navegador/host e se o
resultado é de fixture, API simulada, editor real ou ambiente de produção. Um
export que não suporte a nova estrutura deve ter política explícita; não é
aceitável descartar grupo, intenção ou mídia silenciosamente.

## Encerramento da etapa 0

| Critério da preparação | Situação consolidada |
|---|---|
| Referência criativa preservada | Satisfeito: original intacto, complemento separado e seção 8 completa com 15 critérios. |
| Diagnóstico e ciclo de correções | Concluído e aprovado no alcance S0-P01–P05. Nenhuma correção nova solicitada ou aplicada. |
| Base de regressão e compatibilidade local | Evidências registradas; não é certificação de todos os projetos e ambientes. |
| Decisões funcionais fundamentais | As 30 decisões fecham a direção de herança/histórico, identidade e grupos. Detalhes de representação continuam trabalho de planejamento. |
| Riscos e dependências | Identificados neste parecer; há caminho local viável sem dependências obrigatórias novas. |
| Pauta transversal | Registrada para encaminhamento humano; não há contrato novo aplicado ou decisão do Master presumida. |
| Critérios de aceite posteriores | Delimitados por decisão e etapa; não apresentados como funcionalidades já aprovadas em teste. |
| Limitações ambientais | Documentadas; encerramento condicionado ao aceite explícito ou definição de validação complementar. |
| Autorização da etapa A | Não concedida. Encerramento da preparação não autoriza implementar. |

**Não há impedimento técnico local novo identificado que exija outra implementação
para concluir a preparação.** H07, restauração de escopos, histórico coordenado,
identidades e grupos são diferenças entre o produto atual e os requisitos agora
aprovados. São trabalho futuro, com aceite e compatibilidade definidos; a aprovação
funcional não implica que tenham sido corrigidos ou implementados na etapa 0.

Permanecem riscos concretos para as próximas etapas: perda de intenção por diff,
sobrescrita concorrente por snapshot amplo, leitura/escrita antiga de grupos,
reparentear sem preservar outros momentos, atualização coletiva sobre asset local
e região desalinhada após alteração de arte. Devem ser critérios de bloqueio das
respectivas entregas futuras, não motivo para implementar antecipadamente.

### Limites que exigem aceite explícito

- Cancelamento e permissões pelo seletor nativo do sistema operacional não estão
  certificados; os testes de rejeição/injeção cobrem a fronteira da API.
- IME, leitores de tela, tecnologias assistivas, toque e todos os navegadores/hosts
  não receberam validação completa. Há teclado real em Chromium/Linux e referência
  inicial de acessibilidade; isso não equivale a conformidade integral.
- Crash durante operações e concorrência real entre janelas não estão integralmente
  cobertos; transações e contexto tiveram testes delimitados.
- Backend, autenticação/autorização real entre contas, SQL aplicado, publicação
  remota e integração ativa com outros produtos não foram certificados por fixtures
  locais. Nenhuma implantação foi realizada.
- Histórico atual é parcial, limitado e não persiste entre sessões; a cronologia
  completa de HA-07/08 continua futura. A recuperação de alterações não salvas é
  uma responsabilidade separada.

O aceite desses limites vale para o encerramento **da preparação**, não dispensa
validá-los nas parcelas futuras que dependam deles nem certifica produção.

## Recomendação ao fundador

Recomendo aprovar o encerramento da etapa 0 mediante o aceite dos limites acima. As 30 decisões completas
já permitem avançar com planejamento técnico de A; não há razão para reabrir o
ciclo S0-P01–P05 ou repetir suas baterias nesta entrega documental.

A próxima autorização, se concedida, deve delimitar somente a preparação técnica
da etapa A: modelo de transações e foco, histórico por documento, representação
espacial e grupos, análise de compatibilidade e sequência de parcelas revisáveis.
Uma proposta de formato/contrato deve permanecer proposta até autorização própria.
Não executar A–E, migrar documentos ou introduzir integrações com base neste parecer.
