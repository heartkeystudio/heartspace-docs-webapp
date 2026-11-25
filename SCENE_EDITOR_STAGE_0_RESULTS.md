# Resultados da primeira parcela da etapa 0 do editor de Cena

> Estado atual — 25/11/2026: **etapa 0 formalmente encerrada por determinação
> do fundador**, após regularização editorial e confirmação do aceite ambiental
> de seletor nativo, IME e tecnologias assistivas. Ver o
> [registro de encerramento](SCENE_EDITOR_STAGE_0_CLOSURE.md).
> As pendências de validação continuam documentadas, sem certificação ou dispensa
> de acessibilidade. Está autorizado somente o
> [planejamento técnico de A](SCENE_EDITOR_STAGE_A_TECHNICAL_PLAN.md), sem execução
> de A–E. Condições de encerramento mencionadas abaixo são o registro anterior.


> Consolidação funcional — 25/11/2026: o fundador aprovou 30 decisões no
> [complemento funcional v1.0](SCENE_EDITOR_FUNCTIONAL_COMPLEMENT_V1.md).
> A [avaliação técnica consolidada](SCENE_EDITOR_STAGE_0_CONSOLIDATED_ASSESSMENT.md)
> passa a ser a referência atual de decisões, critérios e recomendação de encerramento.
> Pendências funcionais descritas abaixo são históricas e devem ser lidas à luz
> desse complemento. O encerramento é recomendado com condições explícitas;
> não foi declarado aprovado, e A–E continuam sem autorização de execução.


> Atualização S0-P05 — 25/11/2026: correção local concluída no alcance validado.
> Ver [resultado e limites finais](SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md).
> 101/101 casos Node, 11/11 de compatibilidade, 24/24 de recuperação,
> 26/26 de editor e fechamento/reabertura aprovados. Diagnósticos anteriores
> abaixo permanecem como histórico; a restrição do fallback agora vale desde
> a carga inicial. Decisões funcionais e limites ambientais continuam pendentes.


## Caracterização residual e preparação restante — 25/11/2026

Ver [avaliação detalhada](SCENE_EDITOR_STAGE_0_REMAINING_REVIEW.md). Nesta parcela:
**97/97 testes automatizados** (93 preservados + C19–C22); teclado real caracterizou
S0-P05. Baterias anteriores de navegador preservadas como referência, sem nova
execução integral. Nenhum código do produto alterado nesta parcela. A etapa 0
permanece aberta para decisão sobre S0-P05 e decisões funcionais pendentes.

## Registro das parcelas anteriores

**Data:** 25/11/2026  
**Responsável:** Heartspace Docs — Especialista  
**Escopo:** testes, infraestrutura de teste e compatibilidade local.  
**Resultado atual:** diagnóstico concluído e correções locais S0-P01/S0-P02 aplicadas após autorização específica do fundador. A etapa 0 completa e as etapas A–E não estão concluídas nem autorizadas por esta entrega.

Após as correções, a execução estrita passou em **60 de 60 casos**, sem TODO,
skip ou falha. A bateria de navegador passou em **11 de 11 casos**. Os resultados
anteriores permanecem abaixo como registro histórico do diagnóstico.

Foram usados somente documentos sintéticos e uma origem local sem login.
Dois módulos do produto foram corrigidos, sem alterar contratos, formatos
persistidos ou migrações. A [especificação v1.0](SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md)
permanece intacta. A geração de arte por IA continua excluída.

## Atualização atual — S0-P04 corrigida

Isolamento do histórico próprio por contexto aplicado com autorização específica;
fallback nativo bloqueado após fronteiras de autoria, sem criar novo histórico.
Resultados: **93/93 Node**, **11/11 compatibilidade**, **24/24 recuperação/salvamento**,
**23/23 matriz do editor** e fechamento/reabertura aprovados. A limitação do fallback
e os detalhes estão no [registro atualizado](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md).
Contratos, formatos e originais foram preservados. A etapa 0 continua aberta;
a referência a S0-P04 pendente nos registros seguintes é histórica.

## Parcela anterior — herança e transações investigadas

Sem alteração de produto: **85/85 Node** (75 preservados + 10 de histórico),
**11/11 compatibilidade**, **24/24 recuperação/salvamento** e **17 caracterizações
no editor completo**. Identificada S0-P04: histórico próprio pode atravessar áreas
locais com IDs/corpos coincidentes; nenhuma correção aplicada. O resultado verde
da caracterização inclui essa reprodução e não aprova o defeito.
O [relatório de semântica e histórico](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md)
contém inventário, decisões funcionais, pauta transversal e critérios restantes.
A etapa 0 continua aberta; os registros seguintes permanecem históricos.

## Atualização — S0-P03 corrigida

Correção local autorizada aplicada em `local-projects.js`: renomeação somente após
close confirmado ou acionamento do download, preservando o estado atual e edições
posteriores. Revalidação: **75/75 Node**, **11/11 regressões de navegador** e
**24/24 recuperação/salvamento**, além de percurso no editor completo e inspeção
do arquivo baixado. [Registro e próxima parcela](SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md).
Os diagnósticos e números seguintes são históricos. A etapa 0 permanece aberta.

## Segunda parcela — recuperação e herança

Investigação posterior concluída sem novas alterações do produto: **75/75 Node**
(60 regressões e 15 casos de herança), **11/11 regressões de navegador** e **15/15
casos de recuperação/interrupção**. Os casos de caracterização incluem a limitação
de intenção de herança e S0-P03 (nome alterado após falha em Salvar como), sem
aprovar esses comportamentos. Seletor nativo real permanece inconclusivo.
A [matriz e avaliação dos critérios de encerramento](SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md)
registram o alcance; a etapa 0 completa permanece aberta. Os números a seguir
preservam o registro histórico da parcela anterior.

## Correções autorizadas e revalidação — 25/11/2026

- **S0-P02:** `scene-composer.js` passa a solicitar o perfil existente `background`
  ao importar ou trocar imagens. Não foi criado outro perfil de otimização.
- **S0-P01:** `narrative-package.js` verifica mídias declaradas na cópia de exportação
  antes da normalização da apresentação. Fundo, áudio, imagens de elementos e
  alterações de momentos inválidos interrompem o ZIP com identificação do contexto,
  preservando a fonte. Ausência e `null` continuam válidos. A correção se aplica
  à entrada recebida pelo empacotador; não certifica todas as outras fronteiras.
- Regressões verificam seis posições de mídia inválida, referência inválida,
  ausência intencional e preservação da fonte. Os dois casos conhecidos deixaram
  de ser TODO. A preparação de teste evita reutilizar módulos antigos em cache.

| Verificação após as correções | Resultado real |
| --- | --- |
| `node tests/run-stage0.cjs --strict-known` | 60 testes; 60 pass; 0 fail, skip ou TODO; saída 0 |
| Navegador real | B01–B09 e S0-P01/S0-P02: 11 pass; 0 fail |
| Trocar imagem no editor | PNG aceito e otimizado para WebP; ID `door`, pose X=40, rotação=10, âncora e animação de 0,70 s preservados |
| Incluir imagem no editor | Uma camada nova no momento, total de seis elementos visíveis; cinco IDs originais preservados |
| Recusar SVG na troca | Erro visível; imagem anterior, pose, trilha e quantidade de camadas preservadas |
| Salvar e reabrir `.hdocs` | Arquivo baixado reaberto pela interface; pose, trilha e seis camadas conferidas; IDs e atributos narrativos comparados; checksums de todas as mídias conferidos |
| ZIP pela interface após troca/inclusão | Exportação concluída; CRC íntegro; HTML e duas imagens PNG/WebP presentes |

O HTML autoral salvo contém decorações normais do editor; a comparação de
preservação usa identidade e atributos narrativos, sem exigir igualdade textual
integral. O ZIP desta revalidação foi inspecionado como arquivo; o percurso jogável
do ZIP/HTML descrito no diagnóstico abaixo é evidência da execução anterior.

Evidências novas: [Node estrito](tests/evidence/stage0-fixes-node-2026-11-25.json)
e [navegador](tests/evidence/stage0-fixes-browser-2026-11-25.json). As cópias salvas,
exports e logs detalhados estão em `tests/.stage0-output/`, ignorado pelo Git.
O corpus congelado e as evidências anteriores foram preservados.

**Limitação adicional:** a automação não aceita seleção vazia no seletor de arquivo;
o cancelamento nativo não foi certificado. A recusa de arquivo inválido foi
verificada na interface e preservou o recurso anterior. Não houve deploy,
publicação, alteração compartilhada ou acesso a projeto real.

## Diagnóstico original — antes das correções

## Ambiente e resultados reproduzíveis

Código do produto: HEAD `959b9b13cb13162aa1963b2fc7bffb97fb17ba61`, sem alterações
de implementação nesta parcela. Node v22.23.1; navegador integrado Chrome
155.0.0.0, Linux; origem de teste `http://127.0.0.1:8769`.

| Verificação executada | Resultado |
| --- | --- |
| `node tests/run-stage0.cjs` | 57 casos; 55 aprovados; 2 falhas executadas como TODO; saída 0 com aviso de pendência |
| `node tests/run-stage0.cjs --strict-known` | 57 casos; 55 aprovados; 2 falhas; saída 1 esperada |
| `tests/stage0-browser.html` | B01–B09 aprovados; S0-P02 falhou como esperado e permanece visível |
| Percurso real no editor de teste | Abrir, editar X de 40 para 45, salvar, reabrir, prévia e teste interno conferidos |
| HTML e ZIP produzidos pela interface | Pose 45, condições, efeitos, IDs e destino conferidos em dados, simulador e navegador |
| Sintaxe dos suportes e `git diff --check` | Sem erro na conferência executada |

Os casos TODO não foram pulados: suas asserções continuam falhando. O modo
estrito demonstra que o produto ainda não atende a esses dois casos. O modo
normal não é um critério de aprovação para distribuição.

A execução precedentemente registrada era de 11 aprovações em 38 casos. Os dois
arquivos existentes agora contêm 39 casos porque a conferência de CRC/caminho do
ZIP foi separada do problema de mídia inválida; somam 38 aprovações e uma falha
conhecida. O novo arquivo acrescenta 18 casos, com 17 aprovações e a outra falha
conhecida. Assim, o aumento de casos não deve ser confundido com simples mudança
de contagem sobre a mesma suíte.

As instruções estão em [tests/README.md](tests/README.md). Os resultados extraídos
do navegador ficam em [evidência JSON](tests/evidence/stage0-browser-2026-11-25.json).
O [resumo de execução](tests/evidence/stage0-summary-2026-11-25.json) registra
totais e hashes. Logs completos e artefatos grandes ficam em
`tests/.stage0-output/`, ignorados pelo Git e regeneráveis.

## Recuperação da infraestrutura

| Problema do teste | Correção aplicada apenas em testes |
| --- | --- |
| Posição dos scripts pressupunha HTML antigo | Dados encontrados por ID/tipo; scripts executados na ordem real, incluindo bootstrap |
| Erro de inicialização poderia não aparecer como falha direta | Harness exige conclusão da abertura; há caso que injeta erro e verifica a detecção |
| Estrutura fixa do menu e listeners únicos por evento | Estrutura básica lida do HTML; múltiplos listeners, captura e propagação representados |
| Testes acionavam controles escondidos | Helpers recusam controle oculto/desabilitado; testes percorrem o menu atual |
| Timers de layout interferiam nas expectativas narrativas | Frames separados dos timers de leitura/pausa |
| Áudio localizado por índice antigo | Seleção por elemento `audio` |
| Dependências incompletas dos trechos extraídos do editor | Normalizador, configuração de tela, mídia e campos atuais presentes na montagem |
| Importação não montava a fronteira do otimizador | Dublê explícito no teste unitário; integração com otimizador/decoder real em B07 |
| Comparação literal de HTML confundia aspas serializadas com alteração de conteúdo | Comparação normaliza a serialização DOM antes de comparar os dados |
| Busca textual por `project_ref` confundia código do normalizador com dados privados | Verificação examina os dados JSON exportados |

O harness permanece pequeno e deliberadamente incompleto: não representa layout,
CSS completo, decodificação, som real ou Web Animations. Não recebeu dependências
novas. A validação no navegador complementa suas limitações.

## Compatibilidade e consistência observadas

O corpus tem uma fonte sintética sem cues, uma composição completa e o arquivo
efetivamente salvo pelo editor após edição. Nenhum deles veio de um projeto real.
A fonte sem campos opcionais representa um caso legado mínimo; não certifica
todas as versões históricas do Docs ou arquivos de produção.

| Área | Evidência delimitada |
| --- | --- |
| Fonte antiga mínima | Duas gravações/reaberturas pelo adaptador portátil sem mudança semântica |
| Composição atual | Cinco tipos de elemento, IDs, ordem, transformações, patches, reset, referência órfã e animação preservados |
| Mídia e identidade | Bytes deduplicados, checksum, `project_ref` fixado e reabertura sem pasta original |
| Rejeição de entradas inválidas | Corrupção, mídia ausente, versão desconhecida e referência sem cópia recusadas pela API de arquivos |
| Cache e recuperação | Projeção autoral/cache, dados de revisão do caso sintético, IndexedDB real e leitura após recarregar |
| Organização documental | Livro, livro vazio, nota avulsa, tradução e estados de arquivo/lixeira no adaptador em Node |
| Momento e herança | Resultado determinístico, patch parcial, reset e vínculo por ID de bloco; origem preservada no arquivo |
| Execução | Escolha visual e textual usam as condições/efeitos do mesmo runner e chegam ao mesmo destino |
| Distribuição | HTML sem procedência privada nos dados; ZIP com `index.html`, `assets/image-001.png` e `LEIA-ME.txt` |

No percurso da interface, a camada Porta estava em X=40 no momento `detail`.
Após alterar para 45, salvar e reabrir, a prévia, o teste interno e os dois
exports mostraram `left: 45%`, rotação de 10 graus, escala 1 e a mesma âncora.
A trilha de 600 ms com atraso de 100 ms permaneceu no arquivo. A revisão da
exportação avisou sobre o bloco removido sem limpar sua referência.

No teste interno e no HTML, o botão visual Abrir levou a `ending`. No ZIP
extraído, a opção textual levou ao mesmo final. A opção Trancada permaneceu
desabilitada antes do efeito sobre `opened`. As conferências em Node compararam
também os snapshots, efeitos e retomada sem reaplicação da escolha.

O teste de intenção de herança registra o comportamento atual: um valor explícito
igual ao herdado é conservado na normalização do patch, mas pode desaparecer ao
recalcular `sceneDiff`. Isso continua sendo uma questão de desenho da próxima
parcela, já identificada no planejamento; não foi introduzida uma nova semântica.

## Falhas reais identificadas no diagnóstico original

### S0 P01 Exportação ZIP descarta fundo inválido sem acusar a perda

**Reprodução:** fornecer a `buildPackage` uma apresentação com
`background: {src: 'https://example.com/x.png', mime: 'image/png'}`. O caso não faz
requisição à URL. Espera-se diagnóstico explícito de mídia não empacotável; o
pacote é produzido com o fundo convertido em `null`.

**Causa identificada:** [narrative-package.js](narrative-package.js) normaliza a
apresentação antes de passar os recursos ao empacotador. O normalizador recusa a
mídia, e `add(null)` não consegue distinguir ausência intencional de dado inválido.
O teste anterior já esperava rejeição, mas a falha estava misturada às falhas da
infraestrutura.

**Impacto:** exportação incompleta sem erro nesse tipo de entrada. Não demonstra
perda do arquivo autoral, execução de URL remota ou falha em mídias válidas.

**Correção proposta para autorização:** validar a mídia declarada antes que a
normalização apague a evidência de entrada inválida, com erro compreensível e
fonte intacta. Delimitar os campos equivalentes da apresentação, incluindo patches,
e manter o caso estrito de regressão. Não ampliar formatos aceitos nem migrar dados.

### S0 P02 Importação de camada pede perfil inexistente do otimizador

**Reprodução real:** no editor, Cena → + Imagem → escolher o PNG válido extraído
do próprio ZIP sintético. A interface mostra **Perfil de imagem inválido.** e não
adiciona a camada. O mesmo erro foi reproduzido com a API de mídia no navegador.

**Causa identificada:** [scene-composer.js](scene-composer.js) solicita
`purpose: 'scene'`. O [otimizador](image-optimizer.js) aceita `document`,
`background`, `portrait` e `texture`. O fundo usa um perfil existente; a falha
atinge o caminho de importação/troca de imagem da camada que usa esse pedido.

**Impacto:** impede iniciar ou substituir essa imagem pela importação comum.
As cópias já incorporadas abriram e exportaram nos casos validados. Isso não
constitui validação de todas as outras formas de seleção de recursos.

**Correção proposta para autorização:** alinhar o pedido do compositor a um perfil
existente apropriado, inicialmente `background`, verificando importação e troca
com imagem válida, cancelamento e preservação do elemento. Não adicionar perfil,
dependência, contrato ou campo persistido novo.

Ambos os casos têm falha executável e modo estrito. Nenhuma correção de produto
foi aplicada. O escopo proposto é local ao Docs; se a investigação da correção
revelar impacto compartilhado, essa parte precisará de alinhamento adicional.

## Limitações e riscos remanescentes

- O seletor nativo de arquivos não foi controlável pela automação. A interface foi
  exercitada em uma cópia gerada do editor com ausência dessa API simulada, usando
  o input/download padrão existente. Gravação por handle não foi certificada.
- Para conferir os exports efetivamente produzidos, o suporte de teste preservou
  cópias dos bytes dos downloads antes da revogação de suas URLs. A captura normal
  pelo navegador automatizado apresentou uma interrupção; isso não foi classificado
  como falha do produto. HTML e ZIP observados foram depois abertos por HTTP local.
- O percurso verifica poses finais, dados de animação e transições narrativas;
  não mede fidelidade de cada quadro, desempenho ou alinhamento geométrico de todos
  os casos de parallax. O corpus é pequeno.
- Os testes de rejeição na API não certificam todos os diálogos de erro e operações
  de instalação da interface. Corrupção durante fechamento e duas janelas concorrentes
  ainda precisam de cenários próprios.
- A separação de chaves sintéticas não certifica autenticação, autorização ou
  isolamento real entre contas. Core, backend, SQL/RLS, publicação e hardware não
  foram exercitados. Nenhum login, deploy ou migração foi realizado.
- Não há aceite completo de acessibilidade. Teclado, foco e modais possuem casos
  simulados; a interface real usou campos, Tab e comandos do fluxo descrito.
- Nenhuma integração com Canvas, Beats ou Travels é inferida da referência
  sintética. Questões transversais do plano continuam pendentes para o Master.

## Arquivos e próximos passos

Alterados: `tests/player-dom.cjs`, `tests/narrative-html.test.cjs` e
`tests/narrative-media.test.cjs`. Acrescentados: casos C01–C17 e S0-P02,
runner/agregador, preparação de páginas descartáveis, suporte de browser/editor,
três arquivos `.hdocs`, instruções de execução e evidências resumidas em `tests/`.
O planejamento recebeu apenas referência a este resultado; a especificação
funcional original não recebeu edição.

**Encaminhamento original, agora atendido:** autorização específica de S0-P01 e
S0-P02, correção local e repetição dos casos estritos e percursos afetados, conforme
o registro de revalidação no início deste relatório. A–E permanecem fora do escopo.

**Próxima atividade recomendada:** na sequência da etapa 0, ampliar os cenários de recuperação/cancelamento e fechar
a tabela de herança autoral: valor explícito igual ao herdado, edição de momento
anterior, restauração individual, reset, remoção e reordenação de blocos. Depois,
comparar as alternativas espaciais e de identidade com esses invariantes. Não é
necessário escolher uma dependência transversal para avançar nessa análise.

A pauta para o Master permanece em
[Planejamento técnico da etapa 0](SCENE_EDITOR_STAGE_0_PLAN.md#encaminhamento-ao-heartspace-master).
Não foi enviada mensagem a outro chat nesta parcela. Contratos compartilhados
não foram modificados, e a existência deste relatório não representa aprovação
de integração ou aceite de ambiente remoto.
