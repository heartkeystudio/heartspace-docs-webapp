# Etapa 0 — semântica autoral e transações de edição

> Atualização S0-P05 — 25/11/2026: correção local concluída no alcance validado.
> Ver [resultado e limites finais](SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md).
> 101/101 casos Node, 11/11 de compatibilidade, 24/24 de recuperação,
> 26/26 de editor e fechamento/reabertura aprovados. Diagnósticos anteriores
> abaixo permanecem como histórico; a restrição do fallback agora vale desde
> a carga inicial. Decisões funcionais e limites ambientais continuam pendentes.


## Atualização — S0-P04 corrigida com autorização específica

Em 25/11/2026, o fundador autorizou o isolamento local do histórico existente.
A correção em `index.html` identifica o contexto por chave de área, época,
projeto conectado, conta e identidade autoral. Cada transação própria recebe
essa identidade apenas em memória. Uma mudança de contexto invalida as duas
pilhas; uma transação iniciada no contexto anterior não pode ser confirmada,
agrupada, desfeita ou refeita na área nova. A validação de documentId e corpo
continua existindo. A substituição do corpo do editor sincroniza a fronteira,
inclusive na alternância entre documentos.

A correção não restaura snapshots sobre outra fonte, não cria histórico de Cena,
não persiste as pilhas e não muda `.hdocs`, cache ou contratos. O limite de 60
entradas, as regras textuais de agrupamento e a cobertura de dados anterior foram
mantidos. Novas operações no contexto atual continuam usando undo/redo próprios.

### Fronteira do fallback nativo e limitação funcional

O histórico nativo do navegador não expõe identidade das entradas nem oferece
limpeza portátil. Após trocar projeto/contexto ou documento, o fallback nativo
fica bloqueado no corpo do editor pelo restante da vida dessa página, inclusive
se voltar à área inicial. A proteção cobre botões, Ctrl/Cmd+Z, Shift+Z/Y e o
encaminhamento de `beforeinput` de desfazer/refazer. O histórico próprio continua
operando nas ações que já registrava.

**Limitação explícita:** ações cobertas exclusivamente pelo fallback nativo podem
não ser desfeitas após uma troca de contexto nessa página. Não se tentou suprir
essa lacuna com um novo sistema nem anunciar cobertura unificada de Escrever e
Cena. Uma página nova começa com pilhas próprias vazias e sem entradas nativas da
página fechada. Não há promessa de continuidade do histórico entre reaberturas.

As pilhas próprias não passaram a ser particionadas por documento. A guarda de
ID já existente impede consumir a entrada de outro documento; um documento
intermediário sem novas entradas permite retornar e usar a transação válida.
As limitações de ordenação entre documentos já descritas no inventário continuam.
Mudança de época invalida entradas mesmo se a chave voltar a coincidir, por segurança.

### Resultados executados após a correção

| Verificação | Resultado real |
| --- | --- |
| Node estrito | **93/93 pass**, zero fail/TODO/skip; saída 0 (85 anteriores mais oito casos de isolamento) |
| Compatibilidade no navegador | **11/11 pass**, incluindo B09 após recarga |
| Recuperação/salvamento anteriores | **24/24 pass**, sem editar essa bateria |
| Matriz no editor completo | **23/23 pass**; limitações H07/M14 continuam caracterizadas, sem alteração |
| Fechar a aba e reabrir em outra aba | **CLOSE-REOPEN pass**: mesma fonte/corpo confirmados, undo=0, redo=0 e comandos não alteraram o documento |
| Sintaxe, CSP e diff | Script inline compila; somente hashes da CSP regenerados; diretivas iguais; `git diff --check` sem erro |

M12 passou da reprodução da vulnerabilidade a uma regressão que exige bloquear
undo/redo de outro projeto com ID/corpo coincidentes. M16 testa reabertura do mesmo
arquivo e funcionamento de novas transações. M17 confere as rotas de fallback por
botões, atalhos e beforeinput com eventos sintéticos e observação de execCommand.
M18 testa novo projeto e retorno ao arquivo; M19 recuperação em outra área; M21
troca de documento sem consumir transação alheia e retorno ao histórico válido.
M20 prepara fonte confirmada e ambas as pilhas não vazias para o teste de fechamento.

Os oito novos testes de núcleo cobrem chave diferente, redo estrangeiro, nova
época, commit atrasado, operações no contexto atual, barreira nativa, mudança de
conta simulada e A→B→A. As dez expectativas de histórico anteriores foram mantidas;
somente o ambiente simulado recebeu os campos de contexto que a implementação usa.

A matriz executa o editor completo na cópia descartável e usa o observador de
leitura já existente. Somente cópias sintéticas foram abertas; o original congelado
nunca foi sobrescrito. O teste de fechamento realmente fechou a aba e abriu outra,
comparando o fingerprint do corpo salvo, a identidade e a chave local. Não é teste
de queda de processo/energia, encerramento antes do commit ou restauração de abas
pela função nativa de sessão do navegador.

Evidências: [Node](tests/evidence/stage0-s0p04-node-2026-11-25.json),
[resumo observado no navegador](tests/evidence/stage0-s0p04-browser-summary-2026-11-25.json)
e [hashes](tests/evidence/stage0-s0p04-hashes-2026-11-25.json).
O resumo de navegador foi registrado a partir dos relatórios DOM e dos nomes dos
casos executados, sem substituir as evidências históricas baixadas anteriormente.
Ambiente: Node v22.23.1, Chrome integrado 155/Linux, origem exclusiva
`http://127.0.0.1:8779`, somente loopback e sem login.

Dois cliques da automação expiraram durante recarga; a página foi inspecionada e
as ações pendentes foram retomadas com sucesso. Não se classificou isso como falha
do produto. Ponteiros/cancelamentos de stream mantêm as fronteiras simuladas já
registradas. Contas/desktop remoto/Core real, seletor nativo, todos os sistemas
operacionais e todos os caminhos de clipboard/IME não foram certificados.

Arquivos alterados nesta correção: `index.html`, `ops/desktop-csp.txt` (hashes gerados,
sem mudança de política), `tests/stage0-history.test.cjs`,
`tests/stage0-editor-matrix.js` e registros/evidências. Nenhum deploy ou cabeçalho
remoto foi aplicado. Os módulos das correções S0-P01/S0-P02/S0-P03, as três fixtures
congeladas e a especificação v1.0 foram conferidos contra os hashes anteriores e
permanecem intactos. A exclusão de arte por IA e os limites das etapas A–E continuam.

**Estado atual:** S0-P04 resolvida no escopo validado. A etapa 0 permanece aberta
para decisões F01–F08, identidade/substituição, organização espacial e validações
complementares de acessibilidade/entrada nativa. A coordenação futura de histórico
não foi implementada. Recomenda-se retomar essas decisões e a investigação espacial,
sem ampliar automaticamente o escopo desta correção.

## Registro histórico anterior à correção de S0-P04

**Data:** 25/11/2026. **Responsável:** Heartspace Docs — Especialista.
**Estado:** investigação, planejamento e validação concluídos nesta parcela;
propostas funcionais pendentes de aprovação. Nenhum novo sistema ou correção de
produto foi implementado. A etapa 0 completa permanece aberta.

Referência: HEAD `959b9b13cb13162aa1963b2fc7bffb97fb17ba61` mais correções locais
S0-P01/S0-P02/S0-P03 já aprovadas. Esses arquivos foram preservados nesta parcela.
Não houve alteração em `index.html`, contratos, formatos, migrações, backend,
publicação ou produtos vizinhos. Somente corpus sintético foi usado. A
[especificação v1.0](SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md), os três `.hdocs` congelados
e a exclusão de geração de arte por IA foram preservados.

## Resultado da validação

| Bateria | Resultado real | Alcance |
| --- | --- | --- |
| Node anterior | 75/75 aprovados | Inclui os 60 originais e os 15 de herança, sem flexibilização nesta parcela |
| Histórico T01–T10, novos | 10/10 aprovados | Funções existentes extraídas de `index.html`, executadas em VM com DOM/serialização substituídos |
| Total Node estrito | 85/85, zero fail, skip ou TODO; saída 0 | `node tests/run-stage0.cjs --strict-known` |
| Navegador de compatibilidade | 11/11 aprovados | B01–B09 e S0-P01/S0-P02 preservados |
| Navegador de recuperação/salvamento | 24/24 aprovados | Bateria de S0-P03 preservada sem edição |
| Editor completo, matriz M | 17/17 caracterizações reproduzidas | Inclui limitações conhecidas e reprodução de S0-P04; não representa ausência de defeitos |
| Interação adicional pela automação de interface | Confirmada | X=52 em detail aparece em choose; Herdar anterior em detail retorna X=20 e remove animação |

Ambiente: Node v22.23.1, Chrome integrado 155/Linux, origem exclusiva desta rodada
`http://127.0.0.1:8777`, somente loopback e sem conta. Evidências novas:
[Node](tests/evidence/stage0-history-node-2026-11-25.json),
[compatibilidade](tests/evidence/stage0-history-browser-2026-11-25.json),
[recuperação](tests/evidence/stage0-history-recovery-2026-11-25.json),
[editor](tests/evidence/stage0-history-editor-2026-11-25.json) e
[hashes](tests/evidence/stage0-history-hashes-2026-11-25.json).
As evidências anteriores permanecem intactas.

`tests/prepare-stage0.cjs` agora também gera `editor-matrix.html`, separado do
editor de teste anterior. A cópia contém um observador que devolve JSON clonado
da fonte, corpo serializado, contexto, histórico e runtime. O observador não tem
métodos de escrita. `tests/stage0-editor-matrix.js` aciona controles e eventos DOM
do editor completo; cada caso abre uma nova cópia do arquivo congelado pelo
caminho real de importação. A reprodução entre projetos cria outro `.hdocs`
sintético em memória, mantendo deliberadamente o ID do documento. Nenhum desses
instrumentos é carregado pelo `index.html` do produto.

A matriz usa eventos programáticos para campos, cliques, drop e ponteiros.
Nos três cenários de arraste, somente as APIs de captura de ponteiro da superfície
são substituídas; os handlers reais executam com dimensões do DOM real. Isso
certifica a lógica de commit/cancelamento nesses casos, não drivers de mouse,
toque, caneta ou perda física de captura. A interação adicional usou os controles
pela automação de interface, sem chamar funções internas de escrita.

Uma primeira asserção de teste esperava apagar o runtime ao fechar o player.
A implementação existente fecha o diálogo e para a reprodução, mantendo o estado
em memória. A asserção foi corrigida para verificar fechamento e ausência de
alteração autoral; isso foi erro da expectativa do teste, não falha do produto.

## Comportamentos existentes consolidados

| Caso no editor | Observação |
| --- | --- |
| M01 | Alterar propriedade anterior propaga; personalização posterior de outra propriedade é preservada |
| M02 | Um valor explícito igual ao anterior desaparece do patch quando outra propriedade é editada; mudança anterior passa a propagá-lo — H07 confirmado no editor |
| M03 | Herdar anterior exclui o cue inteiro, incluindo animações; não cria entrada no histórico de corpo |
| M04 | Restaurar início substitui o cue por reset, apagando ajustes e animações locais; alterações futuras da base continuam propagando |
| M05 | Limpar referências exclui somente cues de blocos ausentes, sem transação no histórico de corpo |
| M06 | Duração e inclusão/remoção de keyframe gravam animação, sem entrada no histórico de corpo |
| M07 | Duplicar elemento cria outro ID e desloca a pose; remover a cópia mantém o original; nenhuma das ações entra no histórico de corpo |
| M08 | Subir camada grava ordem do momento, sem transação no histórico de corpo |
| M09 | Desfazer em Escrever não reverte uma alteração feita somente em Cena |
| M10 | Remover bloco entra no histórico; undo/redo restaura/remove o mesmo ID; o cue fica preservado como órfão quando o bloco falta |
| M11 | Escolha muda a variável opened no runtime, sem editar cues ou histórico autoral; fechar o teste mantém runtime em memória, fora da fonte |
| M12 | Abrir outro projeto com documento de mesmo ID e corpo compatível permite consumir histórico do projeto anterior — S0-P04 |
| M13 | Reordenar blocos pelo handler existente de drag/drop cria transação de corpo; undo restaura a ordem e os IDs |
| M14 | Limpar cue órfão e depois desfazer a remoção do bloco restaura o texto, mas não o cue excluído |
| M15 (3 casos) | Arraste altera apenas prévia até pointerup; pointercancel/lostpointercapture cancelam sem gravar pose. Nenhum entra no histórico de corpo |

A matriz anterior H01–H15 continua válida como investigação do modelo. M04
esclarece uma diferença importante: um cue reset pode conter patches locais no
formato, mas o botão existente Restaurar início **descarta** os patches anteriores.
A ajuda genérica sobre reset não deve ser usada como garantia de preservação de
ajustes ao clicar nesse botão. Uma alteração desse alcance exige decisão explícita.

Não foi localizado comando dedicado para duplicar um momento com toda sua
composição. Duplicar elemento não equivale a duplicar bloco narrativo. H10/H11
cobrem cenários de novos IDs e cópia explícita de cues no modelo; não certificam
clipboard, duplicação entre sequências ou remapeamento de opções narrativas.
Essas fronteiras permanecem critérios de futuras implementações.

## Proposta de semântica por propriedade — para aprovação

A fonte existente já expressa herança pela ausência de uma chave no patch e
sobrescrita pela presença da chave. O resolvedor respeita um valor local igual
ao anterior. O problema H07 está na reconstrução do patch por diferenças de
valores (`writeSceneComposition` → `sceneDiff`), que apaga a intenção coincidente.
Não se deve inferir toda intenção comparando apenas as duas poses resolvidas.

| Conceito proposto | Regra funcional | Exemplo decisivo / aceite futuro |
| --- | --- | --- |
| Herdar | Ausência de sobrescrita da propriedade no momento; resolver origem anterior ou base | Alterar x anterior muda x herdado posterior |
| Sobrescrever | Confirmar edição local ou comando explícito estabelece intenção local, mesmo se o valor coincidir | x=40 local continua 40 quando o anterior passa a 60 |
| Valor coincidente | Igualdade numérica/visual não determina intenção | Duas poses 40 podem ter origens diferentes; foco ou navegação não criam override |
| Restaurar herança de uma propriedade | Remover sua intenção/chave local; recalcular o valor e a origem | Remover x local preserva y local e animações não relacionadas; futura edição anterior volta a propagar |
| Editar outra propriedade | Preservar intenções locais existentes | Editar y não elimina x local igual ao anterior |
| Sem mudança | Nenhuma entrada se valor e intenção finais forem idênticos aos iniciais | Foco/blur sem edição não altera fonte; mudar só intenção pode ser transação mesmo com pose igual |
| Origem | Expor herdado/local e momento de origem, com texto/acessibilidade | Autor identifica origem sem depender só de cor ou valor exibido |

Confirmar edição, restaurar e cancelar precisam de limites claros no inspetor;
intermediários de digitação não podem definir a transação final sozinhos.
Valores como zero e false não significam ausência. null só significa limpeza
explícita nas propriedades cujo contrato atual admite esse valor; não deve virar
uma regra universal de herança. Esses limites tipados exigem casos de aceite
específicos antes da implementação.

A interpretação de documentos anteriores deve usar a presença que já foi salva:
um override explícito ainda presente é local. Não se pode recuperar automaticamente
uma intenção que já foi descartada por versões anteriores. Não converter valores
coincidentes em novas intenções por migração ou heurística silenciosa.

### Operações de momento e suas consequências propostas

- **Alterar momento anterior:** recalcular sucessores na ordem narrativa; manter
  todas as intenções explícitas posteriores e mostrar onde há impacto. Não congelar
  sucessores em snapshots completos para disfarçar a mudança.
- **Reordenar:** manter IDs e patches vinculados ao bloco; resolver na nova ordem.
  As diferenças visuais posteriores são consequências autorais, não efeitos do
  runtime. Mostrar a prévia e permitir desfazer ordem e dados afetados como uma ação.
- **Duplicar momento, se aprovado futuramente:** novo ID de bloco e cópia independente
  das intenções locais/animações. Propriedades herdadas continuam herdadas no novo
  contexto. Não materializar toda a pose por padrão. Copiar a pose visível seria
  uma operação distinta e explícita. Recursos podem ser referenciados, sem duplicar
  arte; vínculos internos precisam de remapeamento validado, nunca copiar IDs de
  escolhas indiscriminadamente.
- **Remover:** retirar o bloco, preservando dados de cena recuperáveis no histórico;
  não executar limpeza irreversível como efeito colateral. Limpar órfãos é ação
  separada, também reversível. O resolvedor continua ignorando blocos ausentes.
- **Herdar anterior do momento inteiro:** manter, por compatibilidade, o alcance
  atual como comando de limpar todas as alterações, incluindo animações, com nome
  e descrição claros. A restauração individual proposta deve ser independente.
  Uma variante que preserve animações exige escolha funcional própria.
- **Restaurar início:** manter reset relativo à base atual, sem fingir snapshot
  congelado. Recomenda-se explicitar que o comando atual limpa ajustes/animações;
  mudar para preservar esses dados seria outro comportamento a aprovar.

Essas recomendações não introduzem comandos, metadados nem formatos nesta parcela.
A precisão visual depende também de identidade, proporção, âncora e sistema
espacial, ainda pendentes na etapa 0.

### Separação do runtime e da recuperação

Herança autoral resolve composição a partir de fonte, ordem e patches. Runtime
resolve posição narrativa, condições, efeitos e variáveis. Recuperação retorna uma
cópia de autoria confirmada; progresso do jogador é outro estado. Desfazer um gesto
no editor não deve executar/reverter efeitos da história. Reiniciar o teste não
deve limpar overrides nem o histórico de edição. Não persistir estado do player
como configuração da cena. Branches narrativos não criam automaticamente pais de
herança: o modelo atual resolve blocos na sequência, não o percurso visitado.

## Inventário de operações e cobertura atual

O histórico próprio (`index.html`, `narrativeMutationHistory`) guarda snapshots de
`serializeEditorBody()`, documentId e, em certos casos, seleção/descrição de input.
É limitado a 60 entradas; digitação contígua pode ser agrupada pela regra existente
de tempo/seleção e whitespace. Novas transações limpam redo. Undo/redo exigem ID de
documento e correspondência textual com o corpo esperado. Os testes T01–T10
executam essas funções reais: no-op, ida/volta, documento diferente, divergência de
corpo, bifurcação de redo, coalescência, separação, limite e commit em outro documento.

Os botões de Escrever tentam esse histórico e, se ele não aceita, usam o undo/redo
nativo (`document.execCommand`). `book-pagination.js` encaminha beforeinput e IME
para callbacks do histórico; os atalhos próprios ficam no editor textual. Cena
não chama esses callbacks ao gravar composição/animação. Não existe um único
histórico completo de autoria cobrindo os dados separados do corpo.

| Família / operação atual | Como grava | Cobertura atual identificada | Transação futura recomendada |
| --- | --- | --- | --- |
| Posição, dimensão, escala, rotação, âncora, opacidade, texto e aparência do elemento | input → change/commit de composição | Sem histórico de corpo; x verificado no editor, demais pela mesma rota no código | Uma confirmação de campo; não um passo por dígito |
| Seleção e navegação de momentos/camadas | Estado de interface | Sem alteração autoral pretendida | Fora do histórico autoral; contexto restaurável ao desfazer uma ação |
| Arrastar/mover/escalar/girar/âncora | Prévia durante pointermove; commit no término | Commit/cancelamento exercitados para mover; outros modos identificados no mesmo fluxo | Um gesto = uma transação; cancelar = zero |
| Setas/Shift nas camadas | Cada tecla chama change | Sem histórico de corpo; leitura estática | Agrupar repetição coerente até pausa/key-up/contexto; não capturar atalhos em texto |
| Criar/duplicar/remover elemento | commit com lista e IDs | Duplicar/remover exercitados sem histórico de corpo | Uma ação com IDs, ordem, patches, vínculos e trilhas afetados; undo/redo preserva identidades |
| Subir/descer camada | Troca de ordem e commit | Subir exercitado; mesma rota para descer | Uma reordenação por comando ou gesto |
| Vínculo de escolha/personagem, preset e parallax | Propriedades por commit | Fora do histórico de corpo, identificado no código | Uma atribuição/preset com todas as propriedades coerentes |
| Importar/trocar imagem ou recurso | Leitura assíncrona, validação de contexto, commit | Fora do histórico de corpo; regressões anteriores cobrem importação/troca | Uma transação só após recurso pronto; cancelamento/erro não cria entrada |
| Cenário/fundo/áudio/modelo/cores/diálogo | Propriedades da composição | Fora do histórico de corpo; rotas estáticas identificadas | Uma edição de configuração no escopo pertinente |
| Formato global do jogo | Configuração de recursos, saveGameViewport | Dado fora do corpo; não certificado por undo neste inventário | Uma transação de experiência, com indicação de alcance |
| Herdar anterior / reset / limpar órfãos | Troca/remoção de cues | Exercitados, sem entrada no histórico de corpo | Uma ação nomeada, incluindo seus efeitos em poses e animações |
| Ativar animação, duração, atraso, interpolação, poses | writeSceneAnimation | Mesma rota sem histórico; duração exercitada | Uma edição de propriedade; preservar todo o contexto da trilha |
| Adicionar/remover keyframe | writeMotion/writeSceneAnimation | Exercitados, sem histórico de corpo | Uma ação por quadro com ID/posição e pose; não remontar trilha inteira por comparação visual |
| Scrub, reproduzir, perfil da prévia, área segura | Estado de apresentação/sessão | Sem entrada autoral pretendida; parte salva como preferência | Fora do histórico da fonte; não desfazer narrativa em execução |
| Escrever: inserção/remoção de blocos e reorder narrativo | begin/end do histórico de corpo | Remoção e reorder exercitados com undo/redo; criação identificada no código | Uma ação de corpo e dados relacionados, quando os houver |
| Texto, IME e clipboard de Escrever | beforeinput/input/composition; fallback nativo | Rotas identificadas; T valida núcleo, não todas as combinações de navegador/IME | Preservar comportamento textual e seleção; limites explícitos para ação composta |
| Salvar como, cache e recuperação | Persistência/instalação próprias | 24 regressões preservadas; não é undo do conteúdo | Fronteira de persistência; salvar não elimina o undo da sessão por si só |

Esse inventário cobre as famílias de Cena identificadas, não certifica toda ação
de livro, tipografia, glossário ou colaboração. Não se deve tratar a existência
de begin/end em outro componente como cobertura de dados fora do corpo: o que o
snapshot contém é determinante.

## Transações, concorrência e alternativas

Recomenda-se um coordenador local de transações autorais, com ações de Escrever e
Cena na mesma ordem significativa **dentro do documento e contexto ativos**. Cada
entrada deve delimitar seu conjunto de dados, as intenções antes/depois e o contexto
necessário para restaurar a seleção. Configurações de experiência e recursos
compartilhados precisam de escopo próprio visível; não entram silenciosamente como
mudanças de um único elemento. A política de troca de documento deve ser aprovada:
recomendação é histórico separado por documento dentro da sessão, sem pular para
outro documento ao pressionar Desfazer. Troca de projeto/conta delimita outra sessão.

| Situação | Unidade e segurança propostas | Aceite futuro |
| --- | --- | --- |
| Gesto contínuo | Capturar início, atualizar prévia, confirmar uma vez no fim | Dez movimentos intermediários produzem um undo; Escape/cancel/perda de captura não deixa transação |
| Campo numérico/textual | Agrupar digitação até confirmação/blur/contexto; respeitar IME | Digitar 125 não exige três undos; cancelar restaura valor e intenção, sem apagar outra edição |
| Preset/duplicação/remoção | Transação composta de todas as propriedades e IDs pertinentes | Undo/redo restaura exatamente vínculos, ordem e animações, sem gerar outro ID a cada redo |
| Remover bloco e limpar cue depois | Duas ações ordenadas, cada uma completa | Undo da limpeza restaura cue; undo da remoção restaura bloco; não há restauração textual com cena perdida sem explicação |
| Importação assíncrona | Reservar intenção; commit só se contexto, alvo e revisão ainda válidos | Resultado atrasado não sobrescreve nova edição nem cria elemento depois de cancelado/undo |
| Edição concorrente local | Verificar contexto/revisão dos dados tocados | Não restaurar snapshot global antigo sobre dados independentes alterados depois |
| Mudança remota/conflito | Barreira ou rebase explícito, nunca inversão cega | Não desfazer mudanças de outro autor nem enviar publicação por undo |
| Cancelamento/erro | Nenhuma transação parcial confirmada | Fonte e pilhas preservadas; erro comunicado; recursos temporários não significam ação salva |
| Salvar e recarregar | Arquivo/cache preservam fonte; histórico de sessão não precisa ser persistido nesta proposta | Reabrir não infere intenções antigas nem reaproveita transações de outro projeto |
| Runtime e prévias | Estado fora do histórico autoral | Interagir como jogador não suja a fonte; undo não altera variáveis do jogador |

As proteções de chave de Cena e S0-P03 já evitam alguns commits fora do contexto;
não provam ordenação de duas importações concorrentes para o mesmo alvo. Esse caso,
redo durante importação pendente, composição IME e campo editado ao mudar de momento
exigem testes adicionais antes de definir o mecanismo final.

| Alternativa | Benefício | Risco / contraproposta |
| --- | --- | --- |
| Dois históricos independentes por ferramenta | Menor mudança inicial | Ordem ambígua ao alternar Escrever/Cena e ações compostas incompletas; não recomendado como destino final |
| Snapshot integral do projeto a cada input | Implementação conceitualmente simples | Memória, mídias repetidas e sobrescrita de estados concorrentes; não recomendado |
| Históricos locais coordenados, entradas por ação e dados tocados | Ordem compreensível e preservação de intenções | Exige inventário, revisão e adaptação gradual; recomendação, ainda não decisão arquitetural |
| Histórico persistido/compartilhado entre produtos | Continuidade além da sessão | Novo formato, retenção, conflitos e dependências transversais; excluir desta primeira fundação salvo autorização própria |

Uma evolução gradual pode manter as inversas textuais existentes sob coordenação,
enquanto Cena registra patches de autoria, desde que o roteamento de undo não
misture fallback nativo e snapshots sem um dono claro. Não é seguro anunciar um
histórico unificado apenas adicionando uma pilha ao compositor. O limite de 60
entradas é comportamento atual, não orçamento futuro aprovado; capacidade/memória
deverão considerar tamanho real de documentos e referências às mídias.

## Falha real S0-P04 — histórico atravessa contexto de projeto

Reprodução mínima, somente com cópias de teste:

1. Abrir o `.hdocs` congelado e remover detail em Escrever. A transação guarda o
   corpo antes/depois para documentId `stage0-doc`.
2. Construir e abrir outra cópia portátil, com **outro project.id e nova chave de
   área local**, mantendo o mesmo documentId e o corpo após a remoção.
3. Clicar Desfazer. O bloco detail do projeto anterior reaparece no projeto novo.

M12 reproduziu o resultado em rodadas sucessivas, com chaves distintas e
`matchingBody: true` / `foreignUndoRestoredBlock: true` na evidência. O arquivo
original não foi modificado; a nova área de autoria foi alterada pelo comando.

Causa identificada: entradas/guards próprios consideram documentId e corpo,
sem chave/época de projeto; `installLocalProject` troca a área sem invalidar essas
pilhas. IDs preservados entre cópias legítimas e corpos coincidentes tornam o caso
alcançável. Não se trata de acesso entre contas ou vazamento de backend comprovado;
o impacto demonstrado é mistura de conteúdo entre áreas locais na mesma página.

**Correção proposta para autorização específica:** isolar/inutilizar transações
próprias ao trocar o contexto de projeto e impedir que guards permitam consumir
entradas de outra chave/época, mesmo com mesmo ID/corpo. Delimitar a fronteira do
fallback nativo para que a proteção não apenas transfira o problema. Validar undo e
redo, abertura, recuperação, novo projeto, documento diferente e ausência de perda
do histórico no mesmo contexto. Não introduzir o novo sistema de Cena nem alterar
formato para resolver esse isolamento local. Nenhuma correção foi aplicada.

H07 continua pendente de decisão funcional. M14 confirma a lacuna de transações
entre corpo e cues; a futura cobertura de Cena deve tratá-la. Não foi corrigida
como efeito colateral, nem foi presumida autorização para novos sistemas.

## Decisões funcionais solicitadas ao fundador

Todas as opções abaixo são propostas para planejamento, sem autorização implícita
de implementação. Não é necessário decidir um formato novo para aprovar a semântica.

| Decisão | Recomendação | Consequência / alternativa |
| --- | --- | --- |
| F01 intenção coincidente | Presença explícita permanece local, mesmo igual ao herdado; confirmar uma edição pode registrar intenção | Editar outra propriedade nunca apaga intenção prévia; inferir só por igualdade mantém H07 |
| F02 restauração individual | Remover apenas a sobrescrita da propriedade, mantendo dados independentes | Não usar atribuição do valor herdado atual como restauração: isso congela o valor |
| F03 alcance dos comandos globais | Preservar e explicar o alcance atual de Herdar anterior e Restaurar início; diferenciar restauração individual futura | Preservar animações nesses comandos seria mudança funcional separada |
| F04 reorder e duplicação | Ordem narrativa determina herança; duplicar futuro copia intenções locais para novo ID, não a pose toda | Uma cópia visual congelada seria outro comando explícito |
| F05 remoção/limpeza | Dados órfãos recuperáveis e limpeza explícita reversível | Não excluir cues automaticamente quando um bloco desaparece |
| F06 unidade/roteamento de undo | Ordem coordenada de ações de Escrever/Cena por documento e contexto; sem atravessar projeto | Históricos independentes exigiriam controles e contexto explícitos e ainda não resolveriam ações compostas |
| F07 duração do histórico | Histórico local de sessão; salvar não apaga pilhas; reabrir projeto não importa histórico anterior | Persistir histórico em `.hdocs`/cache exigiria outro escopo, versionamento e custos |
| F08 fronteiras e granularidade | Usar propriedades reconhecidas pelo modelo; mídia/proveniência como atribuição atômica; ordem e trilhas como estruturas próprias | Não dividir bytes, revisão e referência de arte em overrides independentes, nem tratar toda animação como um escalar |

Para F01, confirmação precisa ser uma ação observável (por exemplo, término de
edição ou comando de sobrescrita), com indicação local/herdado. A seleção de um
campo ou momento, sozinha, não é confirmação. F02 exige que a animação passe a usar
o estado herdado atualizado quando seu destino depender dessa propriedade; não
promete a mesma trajetória visual depois de restaurar a fonte da pose.

Critérios propostos de aceite para as implementações futuras:

1. Guardar x local igual ao herdado; editar y; alterar x anterior; salvar/reabrir e
   exportar: x local e sua intenção sobrevivem. Restaurar x remove a intenção e
   faz a mudança anterior propagar, sem apagar y.
2. Reordenar/duplicar/remover e desfazer/refazer: IDs e vínculos válidos permanecem
   coerentes, sem cues consumidos por outro bloco nem materialização silenciosa.
3. Arraste, digitação, IME, preset e alteração de trilha respeitam as unidades
   aprovadas; cancelamento e no-op não deixam entradas; mudar só a intenção deixa.
4. Alternar Escrever/Cena mantém ordem compreensível de ações no mesmo documento;
   projeto diferente não pode consumir transação anterior mesmo com IDs/corpos iguais.
5. Uma ação composta desfaz todos os dados que alterou; não apaga edições
   independentes posteriores, nem desfaz efeitos do runtime ou mudanças remotas.
6. Arquivos antigos abrem sem migração heurística; os já explícitos permanecem
   explícitos. Cache, `.hdocs`, resolvedor, HTML e ZIP mantêm comportamento coerente
   após ciclos de gravação, sem prometer recuperar intenções historicamente perdidas.
7. Teclado, foco, leitor de tela e redução de movimento não mudam a semântica; undo
   em campos textuais não é roubado por atalhos de composição sem regra de foco clara.

Esses itens são futuros critérios, **não** resultados de teste executado. A
regressão verde atual descreve o produto existente, inclusive limitações.

## Questões transversais para encaminhamento ao Master

Nenhum contrato compartilhado precisou ser alterado ou nova dependência introduzida.
O Docs pode amadurecer a coordenação local sem aguardar um framework de outros
produtos. A pauta abaixo está preparada para encaminhamento humano; nenhuma
mensagem foi enviada a outro chat.

| Problema/objetivo | Componentes e interface potencial | Evidência/risco | Proposta / decisão solicitada |
| --- | --- | --- | --- |
| Intenção e compatibilidade de autoria | Docs, consumidores identificados de fonte/cache/portátil/transporte | Presença de chave atual já expressa intenção, mas diff pode perdê-la; campos novos podem ser descartados por normalizadores | Master confirmar somente os consumidores efetivamente afetados se houver formato novo; manter solução local por presença quando suficiente |
| Atalhos e foco | Docs e padrões de ferramentas do Heartspace | Undo textual, composição e player têm donos diferentes; copiar um padrão sem foco causa interferência | Alinhar convenções de Ctrl/Cmd+Z, Shift+Z/Y e Escape com acessibilidade; não exigir motor compartilhado de histórico |
| Identidade e recursos | Docs, catálogo/origens de arte, futuros produtores | Undo deve restaurar referência/revisão/cópia fixada coerentes, sem atualizar fonte de outro app | Confirmar fronteira entre instância e recurso compartilhado; qualquer protocolo novo separado desta etapa |
| Concorrência e revisão remota | Docs, Core/adapter e backend apenas se forem afetados | Histórico local não é autorização para reverter alterações remotas ou publicar | Definir barreira/rebase antes de conectar undo a sincronização; não tocar backend sem autorização própria |
| Responsabilidade de animação | Docs e Canvas, se futura troca de recursos exigir interface | Trilhas narrativas e undo local não equivalem a rigging ou histórico artístico | Preservar fronteira atual; avaliar adaptador só mediante necessidade concreta |
| Histórico durável/compartilhado | Formatos e retenção entre produtos, somente se solicitado | Custo de dados, acesso e compatibilidade muito maior que pilhas locais | Recomendação de excluir da primeira fundação; eventual decisão transversal separada |

Fonte autoral, arquivo portátil, cache de recuperação, transporte remoto e snapshot
publicado continuam distintos. Uma proposta de histórico em memória não muda seus
contratos nem autoriza acessar arte privada, sincronizar ou publicar. Não foram
presumidas integrações existentes com Canvas, Beats ou Travels.

## Critérios restantes para encerrar a etapa 0

| Critério do plano | Estado após esta parcela |
| --- | --- |
| Referência, ambiente e corpus protegidos | Satisfeito no escopo local; hashes originais preservados |
| Classificar testes e infraestrutura | Satisfeito; regressões mantidas, expectativas incorretas corrigidas só na validação |
| Integridade sem pendências bloqueantes na parcela afetada | Pendente por S0-P04; defeito explicado, mas isolamento ainda não corrigido |
| Matriz de compatibilidade/reabertura/exports | Satisfeito no corpus existente; revalidação preservada, sem extrapolar a todos os projetos |
| Separar real, simulado, remoto e hardware | Satisfeito como registro; nativo/IME/clipboard/hardware e remoto ainda sem certificação completa |
| Herança e intenção demonstradas | Proposta e exemplos entregues; F01–F05/F08 precisam aprovação e mecanismos futuros precisam aceite |
| Transações/desfazer delimitados | Inventário e alternativas entregues; F06/F07 e interoperabilidade com undo nativo precisam aprovação e testes complementares |
| Identidade/substituição e revisão geométrica | Pendente de parcela específica, incluindo regiões interativas e diferenças de proporção |
| Alternativa espacial escolhida com evidências | Pendente: comparar relações de transformação, grupos, âncora e parallax sem impor engine genérica |
| Acessibilidade e preservação em cada parcela | Critérios propostos presentes; falta percurso real de foco/teclado/leitor de tela e cancelamento nativo controlável |
| Pauta transversal com responsável/decisão | Entregue neste relatório e no plano; nenhuma decisão do Master é presumida |
| Primeira implementação delimitada para autorização | Pendente após decisões; esta entrega não autoriza iniciar A–E |

**Próximo encaminhamento recomendado:** autorização local específica para corrigir
S0-P04, sem acoplar a correção à criação do novo histórico. Em paralelo ao
planejamento, obter aprovação de F01–F08 e fechar cenários de texto/clipboard/IME,
concorrência de importação e foco. Depois, dedicar a próxima investigação a
identidade/substituição e organização espacial. Qualquer implementação de intenção
ou coordenação de histórico precisa de autorização própria com arquivos e riscos
delimitados. A etapa 0 inteira permanece aberta.

Arquivos desta parcela: novos `tests/stage0-history.test.cjs`,
`tests/stage0-editor-matrix.js`, este relatório e evidências `stage0-history-*`;
alterados somente os suportes `tests/run-stage0.cjs`, `tests/prepare-stage0.cjs` e
os registros de planejamento/resultados/instruções. As alterações de produto
preexistentes foram preservadas byte a byte, conferidas contra as evidências
anteriores. Não houve commit, deploy, migração ou geração de arte.
