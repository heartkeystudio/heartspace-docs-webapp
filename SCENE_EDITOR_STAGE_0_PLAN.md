# Planejamento técnico da etapa 0 do editor de Cena

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


**Data:** 25/11/2026  
**Responsável:** Heartspace Docs — Especialista  
**Estado:** planejamento de referência; primeira parcela de testes e compatibilidade autorizada e executada, com correções locais S0-P01/S0-P02 posteriormente autorizadas e revalidadas. Demais implementações e etapas A–E não autorizadas. Ver [resultados](SCENE_EDITOR_STAGE_0_RESULTS.md).  
**Referência do código consultado:** HEAD `959b9b13cb13162aa1963b2fc7bffb97fb17ba61`, com estado de trabalho conferido separadamente. O hash não representa build publicado nem aceite funcional.

A etapa 0 deverá estabelecer uma referência confiável do comportamento existente,
uma matriz de compatibilidade e decisões técnicas suficientes para iniciar a
fundação da experiência. Sua saída será um conjunto verificável de evidências,
regras propostas e tarefas delimitadas. A reorganização do editor e a introdução
de novas capacidades pertencem às etapas seguintes.

## Direção preservada e autorização

A [especificação funcional v1.0](SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md) é a transcrição
do registro original apresentado pelo fundador. Seu estado e suas questões em
aberto foram mantidos como registro histórico; as deliberações posteriores ficam
neste planejamento, sem reescrever a direção criativa.

O fundador aprovou os seguintes refinamentos após avaliar os pareceres do Docs
e do Master:

- Inclusão da etapa 0 de preparação e compatibilidade.
- Desfazer/refazer na fundação da experiência.
- Distinção entre herança autoral e estado narrativo em execução.
- Intenção explícita de herdar ou sobrescrever propriedades.
- Separação funcional de placeholders visuais e de mecânicas.
- Registro mínimo de necessidades artísticas durante a blocagem.
- Substituição assistida, com prévia e revisão das regiões interativas.
- Autonomia do Docs, evitando dependências transversais prematuras.
- Acessibilidade e preservação de dados em todas as etapas.

Esses refinamentos estão aprovados como direção. As alternativas de representação
e implementação abaixo permanecem propostas. Na elaboração deste plano, a
autorização cobria pesquisa, planejamento e registro documental. Posteriormente,
o fundador autorizou a primeira parcela de recuperação dos testes, correção de
infraestrutura, casos mínimos e validação local; os resultados estão no relatório
vinculado acima. Em autorização posterior específica, o fundador aprovou as
correções locais S0-P01/S0-P02, agora aplicadas e revalidadas. Outras correções
de comportamento, schemas, contratos, banco, deploy e publicação continuam
fora dessa autorização.
A geração de arte por IA está explicitamente excluída de todo o planejamento.

## Referência existente e limites da evidência

| Área | Implementação ou referência local | Consequência para a etapa 0 |
| --- | --- | --- |
| Composição | `scene-composer.js`; integração em `index.html` | Caracterizar gestos, seleção, importação e guardas de contexto existentes |
| Herança | `sceneState`, `sceneCues`, `sceneDiff`, `resolveScene` em `narrative-media.js` | Preservar composição inicial, patches e resolução linear por bloco |
| Animação | `sceneAnimations` e `sceneMotion` no mesmo módulo | Preservar trilhas e poses; medir equivalência entre prévia e exportação |
| Narrativa | `narrative-runtime.js` | Condições/efeitos usam o registro existente; escolhas fazem transição de sequência |
| Identidade externa | `project-assets.js` e `PROJECT_ASSETS.md` | Referências fixadas e atualização explícita; arquivo comum não ganha identidade de catálogo |
| Fonte | `authoring-project.js` e `AUTHORING_FORMAT.md` | Fonte autoral v1 e IDs semânticos devem ser preservados |
| Arquivo portátil | `project-files.js` e `LOCAL_PROJECT_FILES.md` | Materializar mídias antes da normalização; reabrir sem depender da pasta original |
| Recuperação e concorrência | `project-storage.js`, `local-projects.js`, `SYNC_REVISIONS.md` | Histórico de edição não substitui recuperação, revisão ou recibo de sincronização |
| Transporte e publicação | `MEDIA_TRANSPORT.md`, `PUBLICATION_TRANSPORT.md` | Transporte e snapshot publicado não substituem a fonte completa |
| Desktop | `desktop/README.md` e fixture local | Simulação de ponte não comprova integração real com Core |

Os registros de `MIGRATION_ROLLOUT.md` e `QA_READINESS_REVIEW.md` são datados e
não demonstram SQL aplicado, publicação ou aceite remoto. A etapa 0 não deve
tratar todos os achados antigos como atuais, nem considerar correções posteriores
validadas apenas por estarem documentadas.

Na avaliação precedente desta conversa, a execução dos dois arquivos de teste
existentes totalizou 38 casos: 11 passaram e 27 falharam. Esse resultado é uma
referência anterior, não uma nova execução deste planejamento.

| Falha observada | Classificação inicial | Investigação planejada |
| --- | --- | --- |
| Harness usa scripts por posição e tenta executar JSON | Incompatibilidade identificada entre teste e HTML atual | Localizar dados por ID/tipo, preservar a ordem real de bootstrap e player |
| Asserção espera dois scripts; exportação tem três | Expectativa estrutural desatualizada | Verificar carregamento, segurança e execução, evitando contagem como substituto de comportamento |
| Importação de imagem não encontra otimizador no teste | Dependência ausente na montagem | Delimitar teste de assinatura e integração real de otimização/decodificação |
| Controles ausentes no teste de incorporação | Montagem incompleta em relação ao editor atual | Conferir todos os elementos usados pelo fluxo e os comportamentos esperados |
| Rejeição esperada de mídia não acontece no ZIP | Divergência ainda sem causa encerrada | Determinar se há descarte durante normalização, erro de validação ou expectativa antiga |

Falhas do harness não provam falha equivalente no navegador. Também não autorizam
marcar o produto como correto. As suítes atuais não oferecem cobertura suficiente
das novas fatias de Cena, herança e manipulação.

## Frentes de trabalho e entregas previstas

| Ordem | Frente | Entrega de encerramento |
| --- | --- | --- |
| 0.1 | Referência e rastreabilidade | Inventário de fluxos, ambiente, corpus de documentos e mapa requisito → caso → evidência |
| 0.2 | Confiabilidade dos testes | Diagnóstico por falha e proposta delimitada de atualização da infraestrutura e cobertura |
| 0.3 | Compatibilidade | Matriz de formatos e resultados de ida e volta, com diferenças explicadas |
| 0.4 | Herança e reversibilidade | Tabela de resolução, exemplos de intenção autoral e especificação das transações de edição |
| 0.5 | Recursos e espaço | Modelo conceitual de identidades, substituição e alternativas para grupos |
| 0.6 | Consolidação e encaminhamento | Riscos classificados, decisões do Docs, pauta do Master e recorte da primeira implementação |

0.1 precede a escolha das correções. 0.2 deve tornar confiável a leitura dos
resultados automatizados antes de usá-los para certificar 0.3. A análise de 0.4
e 0.5 pode avançar por exemplos de dados existentes, sem modificar o produto.
As correções e a criação de testes executáveis necessárias para executar este
plano exigem autorização posterior; não estão realizadas por este registro.

## Confiabilidade dos testes

### Separação das evidências

Planejar quatro camadas, com limites explícitos:

1. **Testes de regras sem interface:** normalização, resolução de momentos,
   diferenças, condições/efeitos, identidades e montagem do pacote. Sem rede.
2. **Integração simulada do player:** dados, bootstrap, execução, foco, timers,
   histórico e preferências em ambiente controlado. Não comprova layout real.
3. **Navegador real:** editor local, importação, `.hdocs`, IndexedDB, gestos,
   teclado, áudio, animação, parallax e HTML/ZIP. Sem dados publicados.
4. **Integrações:** fixture desktop e, separadamente, Core/backend reais quando
   houver ambiente e autorização adequados. Dispositivo físico é outra evidência.

A entrada inicial continua sendo `node --test tests/narrative-media.test.cjs
tests/narrative-html.test.cjs`, em uma única linha. Execuções diretas dos arquivos
podem ser usadas para obter diagnóstico detalhado. Registrar versão do Node,
revisão, comando, resultado por caso e limitações do ambiente.

A infraestrutura futura deve executar o caminho de abertura real do HTML.
Injetar um estado de bootstrap sempre bem-sucedido invalidaria a cobertura de
compatibilidade. Simulações de APIs devem declarar o que substituem; otimização,
decodificação e comportamento geométrico precisam de conferência no navegador.

Cada falha deverá receber uma classificação: produto, teste desatualizado,
limitação do ambiente ou causa em investigação. Registrar esperado, observado,
reprodução mínima, impacto e encaminhamento. Uma diferença sem causa conhecida
não deve ser resolvida apenas alterando a expectativa do teste.

### Cobertura prioritária

- Resolução de momentos, patches parciais, reset e referências órfãs.
- Preservação de mídia e IDs no ciclo fonte → arquivo → fonte.
- Mesma escolha narrativa acionada pela lista e pelo elemento visual, com os
  mesmos efeitos e impedimentos.
- Cancelamento de gesto/importação e troca de documento/projeto ou permissão
  durante operação assíncrona.
- Retomada e navegação sem duplicação de efeitos; redução de movimento sem
  impedir a história.
- Ausência de mutação da fonte durante prévia, animação, parallax ou exportação.

O aceite futuro exige testes significativos dos comportamentos afetados e uma
verificação real no navegador. Uma suíte verde obtida por suprimir casos não
constitui aceite. Pendências de hardware ou remoto podem permanecer delimitadas
sem bloquear trabalho local que não dependa delas.

## Compatibilidade e preservação de documentos

### Corpus proposto

Selecionar cópias de exemplos existentes e, quando autorizado a executar, criar
casos sintéticos mínimos. Arquivos pessoais não devem ser sobrescritos ou usados
como fixtures versionadas. Uma história real da HeartKey pode complementar o
corpus, mediante seleção de uma cópia de trabalho apropriada.

| Caso | Conteúdo necessário | Resultado a observar |
| --- | --- | --- |
| C01 | Documento anterior à composição, sem elementos/cues | Mesma leitura e valores padrão compatíveis |
| C02 | Composição estática com todos os tipos atuais | IDs, ordem, geometria, aparência e vínculos preservados |
| C03 | Momentos parciais, reset, remoção e reordenação de bloco | Resolução determinística e referências órfãs recuperáveis |
| C04 | Animações, personagem e parallax | Poses, trilhas e interações equivalentes na prévia/teste/exportação |
| C05 | Mídia incorporada, `project_ref` de arquivo e de artefato | Bytes fixados, origem e revisão preservados sem pasta externa |
| C06 | Livro, avulso, tradução, arquivo e lixeira | Contexto documental e referências fora da Cena preservados |
| C07 | Mídia ausente/corrompida, vínculo inválido ou versão desconhecida | Diagnóstico explícito; área aberta e original preservados |
| C08 | Recuperação local, cópia e outro projeto/conta | Sem mistura de identidade, alterações ou contexto de acesso |
| C09 | Formato global e entrada legada de viewport | Não escolher outra proporção ao trocar de sequência |

Percorrer: fonte autoral → estado de trabalho → `.hdocs` → reabertura → nova
gravação; e fonte → HTML/ZIP → apresentação/retomada. Transporte com referências
deve ser avaliado separadamente da fonte materializada, respeitando sua barreira
de leitura. Não publicar dados para testar essa passagem.

Comparar o conteúdo semanticamente, distinguindo IDs autorais de chaves de cache
que podem mudar. Conferir hashes dos bytes fixados, valores explícitos, vínculos,
traduções, grupos documentais e resultados visuais. JSON com outra ordem ou novas
chaves locais não basta para apontar perda; descarte de intenção autoral é perda,
mesmo que o resultado visual imediato coincida.

Antes de novas propriedades/tipos, documentar abertura nos dois sentidos:
documento antigo no editor futuro e documento futuro em editor antigo. Os
normalizadores atuais possuem listas de campos/tipos aceitos. Acrescentar campos
opcionais não garante preservação por versões antigas. Avaliar capacidade de
leitura, bloqueio de edição incompatível, aviso ou versionamento, sem escolher
agora uma alteração de schema. Não permitir downgrade silencioso com perda.

### Regras de preservação

- Manter o original e preparar a abertura em área isolada antes de confirmar.
- Não converter em massa arquivos, caches, filas ou revisões existentes.
- Não limpar referências órfãs automaticamente como parte da evolução.
- Manter mídias necessárias ao offline; não introduzir URL autenticada no player.
- Preservar revisões, recibos, conflitos e versões-base. Desfazer uma edição gera
  nova alteração local; não apaga revisão remota nem reverte confirmação de envio.
- Distinguir progresso do jogador, preferências locais e fonte autoral.

## Herança autoral e estado narrativo

### Modelo conceitual proposto

A herança autoral resolve a composição de um ponto do documento a partir da base
e dos momentos anteriores daquela sequência. Deve produzir o mesmo resultado
para a mesma fonte e posição. O estado de execução contém progresso e variáveis
do jogador; não deve gravar sobre a autoria durante testes.

Conservar inicialmente Cena como composição da sequência. Não criar herança
implícita entre sequências ou entre caminhos percorridos. Respostas visuais a
variáveis, na etapa D, terão regras explícitas, precedência e retomada próprias.
Definir essas fronteiras agora não exige implementar a exploração persistente.

Para cada propriedade, investigar a distinção entre:

| Intenção | Comportamento proposto |
| --- | --- |
| Herdar | Acompanhar o valor autoral anterior aplicável |
| Sobrescrever | Preservar o valor local explícito, mesmo igual ao anterior |
| Restaurar herança | Remover apenas a sobrescrita escolhida |
| Restaurar início | Manter significado próprio de reset da composição no momento |

Exemplo decisivo: base com `x=20`; momento B fixa explicitamente `x=20`; depois
a base muda para `x=30`. B deve continuar em 20 se houve sobrescrita, e acompanhar
30 se herdava. O `sceneDiff` atual calcula diferenças de valor e pode eliminar a
distinção. A presença explícita de uma propriedade no patch é uma alternativa a
avaliar antes de introduzir outro mapa de metadados; todos os caminhos de edição
teriam de preservá-la. Não se escolhe aqui um formato persistido.

Para documentos atuais, propor que a presença de campo no patch represente a
sobrescrita já registrada, sem inventar intenções antigas ausentes. Defaults da
normalização não devem virar automaticamente sobrescritas. A origem exibida deve
apontar base/momento/reset e a identidade estável do bloco.

### Casos que precisam de resultado esperado

- Alterar propriedade anterior preservando outras propriedades locais posteriores.
- Fixar valor igual ao herdado, editar outra propriedade e salvar/reabrir.
- Restaurar uma propriedade sem remover animações e outras alterações do momento.
- Reset seguido de patch; remoção/ocultação e posterior restauração do elemento.
- Inserir, mover, remover e restaurar blocos com alterações e animações.
- Duplicar elemento/momento sem colisão de IDs ou mudança acidental de vínculos.
- Voltar/reiniciar/retomar com composição determinística e sem repetir efeitos.
- Exibir estado narrativo de teste sem modificar a composição autoral.

### Transações e desfazer

Especificar uma transação por gesto ou comando concluído: arraste, ajuste numérico,
agrupamento, duplicação, substituição e restauração de herança. Ponteiro em
movimento não deve gerar centenas de entradas. Cancelar não confirma transação.
Uma operação assíncrona deve conferir contexto e permissão ao concluir.

O histórico de Cena deverá preservar antes/depois, escopo e intenção autoral,
incluindo referências às mídias necessárias. Não duplicar bytes a cada gesto.
Definir retenção, liberação segura e limites antes de qualquer coleta de mídia.
Desfazer deve continuar possível após salvamento local; fechamento/reabertura e
conflito remoto precisam de política explícita, sem prometer histórico durável.

Atalhos devem respeitar edição de texto e foco. Ao trocar projeto/documento, uma
ação não pode atingir outro contexto. Ao perder permissão ou adotar revisão
externa, impedir aplicação de histórico sobre base divergente; preservar rascunho
e encaminhar reconciliação pelos mecanismos existentes. Persistência local não
transforma desfazer em rollback remoto.

## Identidade de recursos e substituição

### Identidades distintas

| Conceito | Papel proposto ou existente |
| --- | --- |
| Elemento | Instância da composição; mantém transformações, animações e vínculos |
| Necessidade artística | Intenção criativa reutilizável do Docs; identidade proposta para a etapa B |
| Mídia fixada | Bytes e integridade da representação consumida |
| `project_ref` | Origem externa fixada; artefato por projeto/app/ID/revisão, ou arquivo por projeto/caminho/hash |
| Placeholder de mecânica | Entidade narrativa de prototipação com entradas/resultados; etapa D |

Hash identifica bytes, não a intenção criativa ou a instância. Nome e caminho não
substituem ID estável de necessidade artística. Uma mídia pode servir a várias
necessidades; uma necessidade pode aparecer em várias instâncias. Não unificar
essas entidades só porque compartilham imagem, nome ou descrição.

O registro mínimo da etapa B deverá considerar nome, categoria, descrição,
representação provisória, cor/identificação, estado de produção e associação
futura. Contextos de uso devem ser derivados das referências e momentos, sem
exigir cadastro manual duplicado. Definir destino de necessidades sem uso e
distinção entre duplicar instância e criar outra necessidade. A localização e o
schema desse registro continuam em avaliação.

Placeholders de mecânicas não entram nesse catálogo como se fossem mídias.
Poderão referenciar necessidades visuais, mas condições, resultados e simulação
permanecem narrativos. Nenhum sistema paralelo de variáveis é proposto.

### Fluxo proposto para substituição assistida

1. Identificar o alvo e o escopo: instância, momento ou usos compartilhados.
2. Preparar a nova mídia sem alterar o projeto; verificar tipo, bytes e origem.
3. Apresentar antes/depois com encaixe, proporção, âncora e regiões interativas.
4. Listar usos afetados, modificações locais e diferenças de enquadramento.
5. Aplicar a escolha como transação reversível, ou cancelar preservando o estado.

A nova arte não deve trocar IDs de elementos, escolhas ou necessidades por
conveniência da importação. Preservar overrides locais por propriedade e exigir
revisão dos alvos afetados; não inferir correspondência anatômica ou geometria
por proporção. Uma região alinhada ao arquivo antigo pode precisar de ajuste
mesmo quando a proporção é idêntica.

Avaliar os casos: arquivo movido, nova revisão do mesmo artefato, outra identidade,
mesmos bytes em dois recursos, proporção diferente, cópia independente, mídia
ausente, atualização cancelada, uso local modificado e várias cenas/momentos.
Atualização permanece explícita e fixada. Recursos offline devem ter procedência
humana/licença; o plano não inclui geração de arte por IA.

## Organização espacial

A lista atual é plana, com coordenadas percentuais da tela lógica, dimensões,
escala, rotação, âncora e parallax por elemento. Grupos deverão preservar essa
composição ao abrir documentos existentes e ao agrupar/desagrupar.

| Alternativa em avaliação | Benefício | Risco ou limite |
| --- | --- | --- |
| Associação de membros com transformações calculadas nos elementos | Aproxima-se da estrutura plana existente | Transformações compostas, animação de grupo e origem ficam mais difíceis |
| Hierarquia com transformação local por grupo | Expressa relações espaciais e movimento conjunto | Exige regras de conversão, renderer, persistência e compatibilidade maiores |

Não fixar a representação apenas por facilidade de serialização. Comparar as
alternativas pelos mesmos cenários e registrar decisão antes de codificar grupos.
A preferência conceitual é que arte e suas regiões possam compartilhar uma
transformação espacial, sem sistema genérico de entidades programáveis.

Definir pai único, prevenção de ciclos, profundidade suportada, ordem de camadas,
identidade, bloqueio e visibilidade efetivos. Distinguir seleção múltipla temporária
de grupo persistente. Avaliar como membresia e ordem mudam por momento, evitando
uma regra paralela de herança. Não definir limites numéricos sem medição.

Casos obrigatórios de decisão:

- Agrupar sem salto visual; desagrupar preservando a posição no palco.
- Mover, girar, mudar âncora, escalar e redimensionar texto/imagem distintamente.
- Transformar grupo com elementos rotacionados; decidir como tratar deformações
  que não cabem nos campos atuais, sem aproximação silenciosa.
- Duplicar árvore com novos IDs e vínculos narrativos preservados intencionalmente.
- Arte e região acompanharem o mesmo parallax; definir composição ou restrição
  de deslocamentos entre pai e filho para evitar movimento duplicado.
- Animação de grupo e de membro, herança por momento, remoção e restauração.
- Converter clique/arraste entre tela física, tela lógica e espaço do grupo.
- Mesma geometria e área acionável na prévia, teste e HTML/ZIP, inclusive orientação.
- Operar por teclado, identificar grupos por texto e preservar ordem de foco.

Os limites existentes de 80 elementos, 1.000 cues por sequência e 32 keyframes por
trilha são referências a medir, não metas a ampliar agora. Registrar custo de
resolução, renderização, salvamento, exportação e memória com cenas pequenas e
próximas dos limites. Grupos não devem esconder ultrapassagens ou truncamentos.

## Encaminhamento ao Heartspace Master

Esta pauta fica pronta para encaminhamento humano. Não foi enviada a outro chat
e não presume conhecimento do teor do parecer do Master além dos refinamentos
explicitamente aprovados pelo fundador.

| Questão | Componentes e interface | Evidência e risco | Proposta e decisão solicitada |
| --- | --- | --- | --- |
| Identidade artística e origem externa | Docs, catálogos dos produtores e `project_ref` | Identidade de intenção difere de artefato e bytes | Manter registro local do Docs; alinhar antes de qualquer novo contrato de recurso compartilhado |
| Grupos e convenções de manipulação | Docs e ferramentas visuais; atalhos e interação | Geometria e acessibilidade precisam ser coerentes | Alinhar convenções; não exigir biblioteca comum nem alterar outros produtos |
| Entrega de arte e animação | Docs/Canvas e demais produtores; formatos de mídia | O adaptador atual não interpreta fontes privadas nem todos os runtimes | Confirmar fronteiras; novos adaptadores só com escopo e autorização próprios |
| Formatos e persistência compartilhada | Fonte, sincronização, Website e consumidores identificados | Novos tipos podem ser descartados; SQL versionado não comprova disponibilidade | Avaliar capacidade/versionamento antes de qualquer mudança compartilhada; backend exige autorização própria |
| Acessibilidade transversal | Comandos, foco, redução de movimento e perfis | Convenções divergentes e bloqueios de animação prejudicam acesso | Alinhar diretrizes e critérios, mantendo validação local do Docs |

Exploração persistente e inspeções continuam no planejamento da etapa D. Se sua
especificação futura afetar contratos consumidos fora do Docs ou persistência
compartilhada, encaminhar um resumo próprio com estado salvo, retorno e efeitos.
Não criar essa dependência para encerrar a etapa 0.

Uma questão transversal pode permanecer aberta se houver alternativa local
compatível e delimitada. Não bloquear todo o editor por integração futura;
também não aplicar unilateralmente a parte compartilhada.

## Critérios de encerramento e próxima autorização

O planejamento está registrado; a etapa 0 completa ainda não está concluída.
Seu aceite futuro deverá exigir:

- [ ] Referência de código/ambiente e corpus identificados, com originais protegidos.
- [ ] Falhas dos testes classificadas e infraestrutura corrigida com autorização.
- [ ] Casos relevantes executados sem falhas inexplicadas de integridade ou perda.
- [ ] Matriz de compatibilidade preenchida, incluindo reabertura e HTML/ZIP.
- [ ] Resultados de navegador separados de simulação, remoto e hardware.
- [ ] Regras propostas de herança e intenção demonstradas pelos exemplos decisivos.
- [ ] Transações e comportamento de desfazer definidos para a primeira parcela.
- [ ] Identidades e substituição delimitadas, com revisão geométrica dos alvos.
- [ ] Alternativa espacial escolhida com evidências e tratamento de incompatibilidade.
- [ ] Acessibilidade e preservação de dados presentes nos critérios de cada parcela.
- [ ] Questões transversais registradas com responsável e decisão pendente.
- [ ] Primeira parcela de implementação apresentada com arquivos, testes, riscos
      e exclusões explícitos para autorização do fundador.

Perda silenciosa, alteração de IDs/vínculos, sobrescrita de originais ou mistura
de contextos bloqueiam a parcela afetada. Pendências de ambiente devem indicar o
que impedem certificar, sem serem convertidas em aprovação implícita.

A primeira autorização futura recomendada é restrita à recuperação da
confiabilidade dos testes existentes e à criação dos casos mínimos de
compatibilidade. Correções de produto encontradas nessa execução devem ser
apresentadas com diagnóstico e escopo; não autorizam automaticamente a etapa A,
novos schemas ou alterações transversais.

## Registro histórico da entrega de planejamento

Foram criados apenas este planejamento e a transcrição da especificação original.
Documentos técnicos anteriores foram preservados. Houve leitura estática seletiva
do código e conferência documental; não houve nova execução de testes funcionais,
implementação, edição de contratos, migração, acesso a serviços autenticados,
publicação ou certificação de ambiente. O resultado 11/38 citado acima pertence
à avaliação precedente.

Atualização de execução: a primeira parcela e as duas correções locais autorizadas
estão registradas no [relatório de resultados](SCENE_EDITOR_STAGE_0_RESULTS.md).
O registro acima descreve somente a entrega original do planejamento.

Segunda parcela autorizada: recuperação, interrupções e matriz de herança foram
investigadas sem novas alterações do produto. A avaliação atual de cada critério
de encerramento está em [Recuperação e herança](SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md#critérios-de-encerramento-da-etapa-0).
Os checkboxes anteriores preservam o planejamento original; não constituem o
estado consolidado de aceite. A etapa 0 segue aberta, com S0-P03 e semântica de
intenção pendentes de decisão. A referência de regressão foi mantida integralmente.

Atualização S0-P03: correção local especificamente autorizada, aplicada e validada
(75 Node, 11 regressões de navegador e 24 recuperação/salvamento aprovados).
A pendência S0-P03 citada acima está resolvida no escopo do
[registro atualizado](SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md).
A próxima recomendação é fechar intenção de herança e transações/desfazer antes
de qualquer implementação adicional; as demais pendências da etapa 0 continuam.

Parcela de herança e transações concluída como investigação/planejamento: inventário,
semântica proposta, decisões F01–F08, S0-P04 e avaliação atual dos critérios estão em
[Herança autoral e transações](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md).
Regressões: 85 Node, 11 compatibilidade, 24 recuperação e 17 caracterizações no editor.
O diagnóstico S0-P04 requer autorização específica; nenhum novo sistema foi aplicado.

Atualização S0-P04: correção local de isolamento especificamente autorizada e
concluída (93 Node, 11 compatibilidade, 24 recuperação/salvamento, 23 matriz e
fechamento/reabertura aprovados). A pendência S0-P04 acima foi resolvida no escopo
do [registro atualizado](SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md); há limitação
explícita de fallback nativo depois da troca de contexto. Não há novo sistema de
histórico nem alteração de contrato/formato. Demais critérios da etapa 0 seguem abertos.
