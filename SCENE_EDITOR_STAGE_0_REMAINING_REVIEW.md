# Etapa 0 — caracterização residual e preparação restante

> Atualização S0-P05 — 25/11/2026: correção local concluída no alcance validado.
> Ver [resultado e limites finais](SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md).
> 101/101 casos Node, 11/11 de compatibilidade, 24/24 de recuperação,
> 26/26 de editor e fechamento/reabertura aprovados. Diagnósticos anteriores
> abaixo permanecem como histórico; a restrição do fallback agora vale desde
> a carga inicial. Decisões funcionais e limites ambientais continuam pendentes.


Data: 25/11/2026. Escopo: investigação, testes e planejamento. Nenhuma nova
correção de comportamento, contrato ou formato foi aplicada nesta parcela.
A especificação funcional v1.0 permanece preservada, assim como a exclusão de
arte por IA. As alterações anteriores de S0-P01–P04 foram mantidas.

## Evidências e alcance

Foram usados documentos sintéticos descartáveis e uma cópia instrumentada do
editor, gerada por `tests/prepare-stage0.cjs`. A instrumentação observa fonte,
pilhas e eventos e fornece botões para posicionar a seleção; os comandos de
teclado de escrita e desfazer foram enviados pelo navegador. Os eventos
`insertText`, `formatBold` e `historyUndo` observados tinham `isTrusted=true`.
O seletor de importação dessa cópia usa o fallback de arquivo; isso não valida
cancelamento de um diálogo nativo do sistema operacional.

Os resultados abaixo foram lidos do relatório DOM da página de ensaio. Não são
logs de usuários nem aceite multiplataforma. O campo auxiliar `prevented` do
observador não é usado como prova de cancelamento: sua coleta em microtask pode
anteceder o término da propagação do evento. Corpo e pilhas constituem a evidência
principal. Os registros resumidos estão em
`tests/evidence/stage0-remaining-observations-2026-11-25.json`.

## Histórico nativo: alcance real

Há três situações diferentes: operações capturadas pelo histórico próprio do
corpo; edição de campos com histórico nativo local; operações de produto sem
transação semântica de desfazer. Não é correto afirmar que todo o editor perdeu
o desfazer após S0-P04.

| Superfície/operação | Cobertura atual identificada | Evidência e consequência |
|---|---|---|
| Digitação no corpo de Escrever | `book-pagination.installEditing`, beforeinput/input e histórico próprio | Digitar ` Escrito`, desfazer duas entradas e refazer duas entradas preservou o texto esperado com fallback bloqueado. |
| Narração e textos editáveis dentro de `#editor` | Mesma captura do corpo, sujeita aos handlers específicos | Cobertura estrutural; não equivale a teste nativo de todos os campos narrativos. |
| Negrito pelo botão da barra | Transação própria explícita | Uma entrada; Ctrl+Z restaurou o parágrafo simples. |
| Negrito por Ctrl+B | `applyInlineCommand` chama execCommand sem transação explícita | `input formatBold` sem beforeinput; nenhuma entrada própria; após troca de contexto, Ctrl+Z deixou o negrito intacto. |
| Ctrl+I, Ctrl+U e tachado pelo atalho | Mesmo caminho sem transação explícita | Risco identificado no código; resultados individuais ainda não medidos com entrada nativa. |
| Listas por Ctrl+Shift+7/8, comandos de slash sem wrapper, checklist e inserção de link | Caminhos de execCommand/DOM sem cobertura uniforme de begin/commit | Dependem do comportamento de eventos do navegador ou do fallback; inventário estático, não certificação de cada comando. Há comandos específicos com wrapper, portanto não se generaliza a todo slash. |
| Título e subtítulo | Fora do snapshot do corpo; histórico nativo do campo | Digitação e Ctrl+Z no próprio campo removeram o último caractere digitado. A pilha do corpo não mudou. Não há garantia de unidade por palavra. |
| Campos de formulários e inspetores, incluindo propriedades de composição/animação | Histórico de texto do controle, quando fornecido pelo navegador; sem histórico semântico geral de Cena | Desfazer a entrada de um campo não garante desfazer a operação aplicada ao projeto. Lacuna já inventariada para a etapa A. |

A limitação compromete operações frequentes de escrita, especialmente formatação
por atalhos, mas não suprimiu o desfazer da digitação comum no corpo no cenário
medido. A mesma aparência visual pode ter coberturas diferentes conforme o comando.

O histórico próprio permanece disponível para novas operações cobertas no
contexto atual. Pilhas anteriores não são restauradas ao voltar a um projeto.
O fallback nativo do corpo fica bloqueado após a primeira fronteira de documento
ou contexto observada, inclusive ao retornar ao contexto inicial. Selecionar o
mesmo texto, trocar foco ou produzir nova digitação não remove essa barreira.

Recarregar a página iniciou uma nova sessão com `nativeAllowed=true` e pilhas
próprias vazias. Isso reabilitou o mecanismo, **sem garantir uma unidade segura**:
no ensaio sobre o texto salvo `<p>Texto base.</p>`, selecionar o parágrafo e aplicar
Ctrl+B produziu `<p><b>Texto base.</b></p>` sem entrada própria. Ctrl+Z resultou em
`<p></p>`; Ctrl+Shift+Z manteve esse corpo vazio. A causa precisa da unidade interna
do navegador não foi isolada. Esse resultado impede recomendar recarga como
solução de recuperação ou afirmar que refazer recuperará o conteúdo. A observação
é local, em uma carga; não foi atribuída causalmente à correção S0-P04.

### S0-P05 — comandos sem transação e fallback imprevisível

Falha real reproduzida: formatação comum por atalho pode ficar sem desfazer; a
reabilitação do fallback na nova página também não forneceu restauração segura
no ensaio. Nenhuma correção foi aplicada.

Existe uma alternativa local plausível: envolver os comandos atualmente sem
cobertura em transações do histórico existente, preservando o isolamento de
S0-P04. Antes de chamá-la segura, é necessário validar duplicação de entradas
quando houver beforeinput, seleção e foco, comando sem alteração, composição IME,
listas/links, edição concorrente e undo/redo após reabertura. Evitar reabilitar o
fallback bloqueado ou tentar transportar a pilha privada do navegador.

Recomendação: autorizar uma parcela local de diagnóstico/correção de S0-P05,
primeiro para os comandos de formatação e os caminhos equivalentes inventariados,
com reprodução do caso de parágrafo esvaziado e preservação do texto salvo.
Isso pode usar o histórico atual e não exige o novo sistema de histórico. Um
histórico completo de título, metadados, Cena e animação continua na etapa A.
Caso a investigação exija mudar unidades globais, persistência ou contratos,
interromper essa parte e apresentar proposta específica.

Validação desta parcela: **97/97 testes automatizados**, sem falhas, TODO ou skip,
incluindo os 93 anteriores e C19–C22. As baterias anteriores de 11 casos de
navegador, 24 de recuperação, 23 de comandos e fechamento/reabertura foram
preservadas como referência; não foram repetidas integralmente nesta parcela.
Hashes dos módulos protegidos, especificação e fixtures conferidos nas evidências.

## Identidade e substituição de recursos

O modelo distingue a identidade da instância visual (`element.id`), identidade
narrativa (`choice_block_id`/`choice_option_id`), bytes da mídia e proveniência
opcional `project_ref`. Uma referência de artefato combina projeto, app de origem,
artefato/tipo e revisão/hash; caminho ou hash iguais não tornam duas instâncias
a mesma entidade. A deduplicação de bytes no pacote não é um catálogo autoral.

A troca local de imagem em `scene-composer.js` altera o asset da instância após
validar contexto editável e existência do alvo. O normalizador preserva os campos
suportados de identidade, pose, âncora, vínculos e parallax quando só o asset muda
(C19). Isso não comprova uma substituição assistida completa: proporção, foco,
contain/cover/original e recorte podem mudar a silhueta percebida sem mudar a caixa.
A região clicável é outra instância e não se reajusta implicitamente (C22).

Retratos de personagens podem ser resolvidos por um registro compartilhado de
personagens; trocar o retrato pode afetar várias instâncias. Já imagens embutidas
não possuem uma identidade lógica global que autorize substituir todas as
ocorrências. Igualdade de bytes não deve decidir essa abrangência (C20).

O adaptador de recursos de projeto existente usa seleção explícita de pasta e
snapshots fixados, detecta atualização por identidade e revisão e permite manter
os bytes anteriores até ação explícita. A documentação não comprova integração
ativa entre apps. Não foram acessadas fontes privadas de Canvas ou outros apps.

Critérios propostos para a etapa B: prévia lado a lado; alcance explicitado
(instância, recurso compartilhado ou ocorrências selecionadas); preservação de IDs,
vínculos, efeitos, pose e animações; política explícita de proporção e âncora;
regiões destacadas para revisão; cancelamento sem alteração; uma transação
reversível; respeito às personalizações por momento. Herança por diff com valor
coincidente ainda exige a decisão já registrada em H07/F01–F08: trocar um recurso
não pode ser usado para resolver silenciosamente a intenção de sobrescrita.

Placeholders visuais devem representar necessidades artísticas e ter registro
mínimo desde a blocagem; placeholders de mecânica representam entradas/resultados
narrativos. São responsabilidades distintas. Não criar uma dependência externa
para implementar a primeira versão local nem inferir um novo formato aprovado.

## Organização espacial

O modelo atual é uma lista plana e ordenada de até 80 elementos, com IDs únicos.
A ordem é usada na composição; duplicatas de ID são removidas pelo normalizador.
Campos parent/group/children não são persistidos (C21). Portanto um grupo real
não pode ser introduzido apenas pela interface sem decidir representação e
compatibilidade. Não inserir campos experimentais em documentos existentes.

Posição e tamanho usam percentuais do viewport; escala, rotação, âncora e flips
são propriedades do elemento. Região e imagem têm parallax independente. Coerência
espacial exige aplicar a mesma transformação relevante aos dois, não apenas
colocá-los próximos na lista. Agrupamento não deve substituir identidade narrativa.

Alternativas para planejamento:

- Seleção múltipla temporária e comandos em lote preservam a lista atual e são
  úteis na fundação, mas não resolvem hierarquia persistente nem parallax de grupo.
- Grupo lógico persistente, com IDs estáveis dos filhos e política de coordenadas,
  atende melhor à direção criativa. Requer decidir ordem, transformação local/global,
  herança e exclusão/duplicação antes de alterar o formato.
- Um sistema genérico de entidades programáveis aumenta o escopo sem necessidade;
  não é recomendado para o Docs.

Recomenda-se estudar grupos com transformação afim delimitada. Escala não uniforme
com rotações encadeadas pode produzir cisalhamento, não representável apenas por
uma escala escalar e rotação por filho. As opções são limitar essas operações,
persistir matriz ou preservar o grupo sem achatamento. Nenhuma foi implementada
ou aprovada. Não prometer desagrupar preservando a aparência sem esse critério.

Aceite futuro: round-trip visual dentro de tolerância definida; IDs e vínculos
estáveis; ordem determinística; ausência de ciclos; desfazer em uma ação;
duplicação com novos IDs e referências internas remapeadas; remover grupo com
semântica explícita; coordenadas testadas em diferentes viewports/âncoras/flips;
parallax coerente entre arte e regiões; personalizações de momentos preservadas.
O viewport e o estado narrativo de execução não devem reescrever a fonte autoral.

## Referência de acessibilidade

Referência proposta: [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/), incluindo teclado,
ordem e visibilidade do foco, nome/papel/valor, alternativas a arrastar, tamanho de
alvos, contraste e mensagens de estado. O alvo mínimo de 24 CSS px admite exceções
previstas pela norma; não se conclui falha apenas pela dimensão nominal de um
ícone. Esta referência orienta critérios, não constitui certificação de conformidade.

A leitura do código identifica recursos aproveitáveis: nomes acessíveis em campos
e controles, elementos do palco focalizáveis, deslocamento por setas e campos
numéricos como alternativa a manipulação direta. Os controles de transformação
no palco usam tabindex -1; a alternativa precisa ser compreensível no inspetor.

Principais barreiras/riscos a levar à fundação:

- Não há comunicação explícita uniforme de papel e estado selecionado dos elementos
  do palco; nome acessível isolado não prova anúncio compreensível.
- Reordenação, seleção múltipla e futuras operações de grupo precisam de percurso
  completo por teclado, além dos movimentos já existentes.
- A disparidade Ctrl+B/barra e a falta de desfazer semântico de Cena dificultam
  recuperação pelo teclado e também afetam usuários de mouse.
- Controles de transformação variam visualmente com zoom/escala; tamanho efetivo,
  espaçamento, foco e sobreposição devem ser medidos no layout final.
- Foco após reconstruir painéis, mensagens de falha, contraste em todos os temas,
  ampliação e redução de movimento ainda exigem matriz própria.

Não foram executados aceite com leitor de tela, hardware assistivo, IME real,
contraste completo ou todos os perfis de dispositivo. Não se transforma ausência
de ensaio em reprovação normativa. Aceite futuro deve cobrir tarefas completas
por teclado, foco conservado após alterações, erros anunciados, nomes/estados
consistentes e alternativas às informações exclusivamente visuais/sonoras.

## Entrada nativa e limites de ambiente

A entrada real de teclado permitiu distinguir digitação, formatação e desfazer
nativo dos eventos sintéticos dos testes anteriores. Foram medidos corpo,
título/subtítulo e botão da barra. Não foram certificados todos os navegadores,
IME, toque, leitor de tela ou diálogos de seleção de arquivo do SO. O ambiente
atual não fornece observação/controlabilidade suficiente para certificar o
cancelamento desse seletor: os casos de rejeição simulada permanecem testes da
fronteira da API, separados do aceite nativo. Esses limites permanecem explícitos.

## Avaliação de encerramento da etapa 0

| Critério | Situação e implicação |
|---|---|
| Confiabilidade da base automatizada e casos mínimos | Satisfeito no alcance local registrado. Regressões preservadas; quatro novos casos caracterizam recursos/modelo espacial. |
| Abertura, gravação, reabertura, exportação e preservação | Evidências locais anteriores mantidas; S0-P01–P04 aprovados. Não certifica infraestrutura remota ou todos os acidentes de execução. |
| Recuperação, cancelamento e concorrência | Parcial: fronteiras e contextos exercitados nas parcelas anteriores; seletor nativo, crash e concorrência real entre janelas não integralmente certificados. |
| Inventário e diagnóstico do histórico | Satisfeito como investigação; S0-P05 é impedimento real para declarar confiável o desfazer frequente. Correção requer autorização. |
| Semântica de herança | Matriz e alternativas registradas. Intenção explícita, origem e restauração dependem de aprovação funcional; herança autoral separada de estado de execução. Novo comportamento pertence à evolução posterior. |
| Identidade/substituição | Base atual e invariantes caracterizados; prévia, catálogo e substituição compartilhada são capacidades futuras. Política de alcance/override precisa de decisão antes da implementação. |
| Organização espacial | Modelo e riscos caracterizados. Representação de grupo, coordenadas e parallax exigem decisão; novo sistema não é condição de conclusão da investigação. |
| Acessibilidade | Referência e barreiras iniciais registradas; validação assistiva e matriz ampliada pendentes. Requisito permanente desde A, não tarefa adiada integralmente para E. |
| Compatibilidade e preservação | Nenhuma migração/contrato alterado nesta parcela. Qualquer nova representação precisa de leitura dos documentos antigos e escrita sem perda comprovadas antes do rollout. |

Não se recomenda encerrar a etapa 0 como integralmente aprovada enquanto S0-P05
estiver sem decisão e as decisões fundamentais de herança/identidade/grupo não
tiverem responsável e critério aprovados. Limites de ambiente podem ser aceitos
explicitamente com validação nativa complementar programada; não justificam
implementar A–E antecipadamente. Recursos novos, grupos, timeline, placeholders,
substituição assistida e histórico completo pertencem às etapas posteriores.

## Encaminhamento humano ao Master

Não houve comunicação automática a outro chat. Para encaminhamento:

- Objetivo: manter identidade e acessibilidade coerentes sem acoplar o Docs a novos
  serviços. Componentes locais: normalizador de mídia, compositor, authoring e
  adaptador de recursos de projeto.
- Contrato/interface: eventual evolução compartilhada de identidade de artefato,
  atualização de snapshots e representação portátil de grupos. Os contratos atuais
  não foram alterados e não se presume que outros produtos adotem o modelo local.
- Evidência/risco: IDs de instância, proveniência e bytes são distintos; grupo não
  existe no formato atual; atualizações globais podem apagar personalizações;
  fontes artísticas privadas não devem ser consultadas para renderizar snapshots.
- Proposta: fechar decisões locais primeiro; submeter somente a superfície realmente
  compartilhada antes de qualquer mudança. Pedir diretrizes comuns de atalhos,
  foco e acessibilidade sem exigir biblioteca transversal agora.
- Decisão necessária: confirmar responsabilidades e necessidade de contrato comum;
  autorizar separadamente qualquer alteração transversal. S0-P05 pode ser tratado
  localmente pelo especialista mediante autorização do fundador.

Próxima parcela recomendada: diagnóstico/correção local autorizada de S0-P05 e
regressão de comandos de escrita; em paralelo, aprovação das decisões funcionais
pendentes no relatório de herança/histórico. Depois, revisão final dos riscos
residuais e aceite explícito dos limites ambientais para encerrar a preparação.
