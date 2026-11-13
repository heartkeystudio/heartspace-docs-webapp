# HeartSpace Docs — direção do sistema narrativo

## Princípio

O documento é a fonte narrativa. Texto, diálogos, escolhas e ações formam um modelo semântico portátil. Escrita, leitura, mapa, sequência, simulação e código são projeções desse mesmo modelo; nenhuma delas mantém uma cópia independente do conteúdo.

## Distribuição nesta etapa

A divulgação pública do Docs prioriza o modo local, com edição, narrativa, tradução e exportação utilizáveis sem conta. O online fica em beta fechado para a equipe e pessoas liberadas pelo responsável do produto. Medir consumo e comportamento da sincronização nesse grupo antes de definir franquias públicas, monetização e capacidade de nuvem. As hipóteses de cotas não autorizam bloqueios comerciais no modo local. Detalhes em [FREE_PLAN_DESIGN.md](FREE_PLAN_DESIGN.md).

## Regra de leitura e paginação

1. A projeção de leitura é a referência para quebra de linhas, altura do conteúdo e paginação.
2. Controles de produção, identificadores, expressões, destinos, condições, avisos e alças de arraste não participam do fluxo de layout da leitura.
3. Elementos exclusivos de produção devem viver em uma camada sobreposta, em uma margem editorial, no inspetor contextual ou nas áreas de História e Cena.
4. Ocultar controles com `display: none` apenas no modo de leitura não resolve a paginação: eles também não podem ter sido considerados ao calcular as folhas durante a escrita.
5. Cada bloco semântico deve expor duas partes:
   - `reading projection`: conteúdo que aparece ao leitor e ocupa espaço;
   - `authoring decoration`: controles e metadados que não ocupam espaço na projeção final.
6. Ações sem conteúdo de leitura, como pausa, sinal e alteração de variável, usam marcadores de posição zero no texto e são editadas pelo inspetor ou pela sequência narrativa.
7. O documento poderá escolher uma apresentação narrativa:
   - `prosa`: diálogo integrado ao livro ou lore;
   - `roteiro`: personagem, rubrica e fala visíveis;
   A simulação de jogo é configurada em **Cena**, separadamente do formato de leitura.

## Organização da área de trabalho

A antiga Central de produção foi distribuída por tarefa, usando as mesmas projeções e registros:

- **Escrever** mantém o documento. Clicar na etiqueta de um bloco abre o inspetor contextual com personagem, expressão, sequência e demais propriedades; identificadores ficam recolhidos. Digitar texto comum não abre o inspetor.
- **História** ocupa a área principal com **Sequência** e **Mapa**. Seleção da sequência permanece compacta; nome, ID e exclusão ficam em **Propriedades**, e inserções ficam em **Adicionar bloco**.
- **Tradução** ocupa a área principal com original e tradução lado a lado. Em áreas menores, cada par fica empilhado. Filtros, progresso, importação, exportação e visão do projeto continuam disponíveis.
- **Cena** dá prioridade à amostra visual, com os ajustes ao lado. Em áreas menores, **Ajustes da cena** revela os controles abaixo da amostra.
- **Biblioteca do projeto**, acessível pelo botão na extremidade direita, reúne **Personagens**, **Variáveis** e **Glossário** em um painel de apoio à direita, mantendo o documento visível. O botão compacto fica imediatamente antes da barra de rolagem, encostado à sua borda interna e sem reservar uma faixa externa e alterna a abertura por clique, com estado ativo e indicação acessível. Em janelas menores, o painel abre sobre a borda direita e pode ser fechado pelo mesmo botão ou pelo cabeçalho.
- **Pendências** é um indicador discreto. Sua lista permite abrir a sequência, mapa ou ferramenta relacionada para revisão. **Testar sequência** e **Exportar** aparecem na barra superior de História e Cena.

**Dividir área** é uma escolha explícita em História, Tradução e Cena. O divisor é ajustável; abaixo de 1100 px, usa-se uma área por vez, mantendo a preferência de divisão para quando a janela voltar a comportá-la. A divisão e a largura são independentes por tarefa e ficam guardadas como preferências locais; a última aba escolhida de História e Biblioteca também é lembrada. A divisão efetiva é sempre um booleano: Escrever e Pendências não reservam uma coluna de produção; Biblioteca reserva apenas seu painel de apoio enquanto estiver visível. A grade dividida exige também que o painel esteja visível; ocultar o painel sincroniza o retorno à escrita. Na escrita, o inspetor pode ser fechado independentemente.

Os menus de Propriedades, Adicionar bloco e Configurar tradução usam uma camada fora dos painéis, com posição limitada à janela, fechamento por clique fora ou Escape e navegação por Tab. Criar uma sequência abre suas propriedades para renomear. O inspetor mostra um trecho de contexto, acompanha os metadados do documento e permite aplicar um campo com Enter, voltando à escrita; pausas e sinais retornam a uma linha de texto comum.

A rolagem das ferramentas é lembrada por documento e visualização. Voltar a uma área já ativa não reconstrói seus campos. Uma nova interação cancela restaurações de foco/rolagem que ainda estavam agendadas.

A troca de área não reconstrói o editor: guarda seleção, foco e rolagem por documento. Voltar a **Escrever** restaura esse contexto. Saltos explícitos de sequência ou tradução levam ao trecho solicitado. A paginação não mede o editor enquanto ele está oculto. O controlador fica em `production-workspaces.js`, também carregado pelo aplicativo desktop.

O menu `/` mantém coleções para exploração sem busca. Ao digitar, busca ações finais em todas as coleções, com normalização de acentos, termos compostos, sinônimos e prioridade para o nome exato; ações de legenda e tabela só aparecem no contexto apropriado. Enter/Tab aplica o resultado; Backspace edita a busca. Atalhos de formatação no editor: Ctrl/Cmd+B, I e U; Ctrl/Cmd+Shift+X para tachado, Shift+7/8 para listas e Shift+K para link. Ctrl/Cmd+K continua abrindo a busca de documentos.

Novas imagens passam por `image-optimizer.js` antes de persistir localmente ou enviar à nuvem, incluindo fundos, retratos e imagens importadas por data URI. Os perfis limitam dimensões e bytes e reencodificam em WebP (PNG como alternativa compatível) sem carregar metadados do original. Animações não são achatadas silenciosamente: essa inserção pede uma imagem estática. Arquivos existentes não são migrados automaticamente. Detalhes e proposta de cotas em [FREE_PLAN_DESIGN.md](FREE_PLAN_DESIGN.md).

Conferência de sintaxe concluída. Aceite visual e de interação em navegadores reais permanece pendente.

## Pontos adotados de outras ferramentas

### Ink

- Escrita linear continua sendo o caminho mais rápido.
- Destinos estáveis e fragmentos reutilizáveis equivalem a knots e stitches.
- Metadados de linha, como personagem, expressão, áudio e animação, permanecem separados do texto visível.
- Uma visualização de código pode existir para usuários avançados, sem ser o formato obrigatório de autoria.
- Funções externas inspiram sinais tipados enviados à engine.

Não adotar: exigir que toda pessoa escreva a sintaxe textual de Ink para usar o sistema.

Referências: <https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md> e <https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md>.

### Yarn Spinner

- Separação entre linhas, opções, comandos e variáveis.
- Runner neutro entrega eventos a apresentadores e adaptadores da engine.
- Conteúdo localizável possui identificadores estáveis.
- Comandos não reconhecidos podem ser encaminhados ao jogo, preservando extensibilidade.
- Nós, grupos e storylets podem organizar conversas grandes.

Não adotar: acoplar o formato principal ao runtime de uma engine específica.

Referências: <https://yarnspinner.dev/docs/> e <https://docs.yarnspinner.dev/components/dialogue-runner>.

### Twine

- Mapa visual de eventos e ligações.
- Criar um destino ainda inexistente gera um evento provisório, claramente marcado.
- Links quebrados, eventos vazios e referências aparecem visualmente.
- Busca rápida por nome ou conteúdo.
- “Testar daqui” inicia a simulação em qualquer evento.

Não adotar: transformar o mapa no editor principal de texto.

Referências: <https://twinery.org/reference/en/editing-stories/navigating.html>, <https://twinery.org/reference/en/editing-stories/linking-passages.html> e <https://twinery.org/reference/en/publishing/testing.html>.

### articy:draft

- Registros de personagens, locais, itens e variáveis no nível do projeto.
- Templates e propriedades personalizadas.
- Estado de produção, revisão, localização e voz.
- Perfis de exportação separados do conteúdo autoral.
- Integrações com engines como adaptadores substituíveis.

Não adotar: expor toda a complexidade de banco narrativo durante a escrita comum.

Referência: <https://www.articy.com/en/articydraft/feature-list/>.

### StoryFlow Editor

- Variáveis tipadas, enums, arrays, mapas e referências a assets.
- Subfluxos reutilizáveis.
- Simulador e depurador com variáveis, pilha e nó ativo.
- Sincronização de desenvolvimento com Godot, Unity e Unreal.
- Arquivos textuais e portáteis por baixo da interface visual.

Não adotar nesta fase: editor completo de interface do jogo ou centenas de tipos de nó.

Referências: <https://storyflow-editor.com/docs/> e <https://storyflow-editor.com/>.

### Chat Mapper

- Árvore simplificada com fluxo principal, conectores e grupos.
- Simulador que acompanha variáveis e permite retornar a estados anteriores.
- Condições e ações associadas aos nós.
- Notas, estados de revisão e navegação direta até o trecho comentado.
- Validação de IDs duplicados, destinos quebrados, nós inalcançáveis, variáveis ausentes e personagens indefinidos.

Não adotar: Lua como única linguagem de condição ou ação.

Referências: <https://docs.chatmapper.com/> e <https://www.chatmapper.com/features/>.

## Modelo conceitual

- `Project narrative registry`: personagens, locais, itens, variáveis, eventos, comandos e assets.
- `Event`: ponto chamável pelo jogo, com ID estável e uma sequência de nós.
- `Node`: diálogo, narração, escolha, pausa, sinal, condição, alteração de variável, salto ou subfluxo.
- `Choice option`: texto, destino, condição opcional e efeitos opcionais.
- `Reading profile`: define como cada nó aparece na leitura final.
- `Export profile`: transforma o modelo portátil em JSON genérico, Godot, Unity, Unreal ou outro formato.

## Variações condicionais de leitura

Decisão registrada para uma fatia futura:

1. Escolha narrativa e variação de conteúdo são conceitos distintos:
   - uma escolha narrativa conduz a outro evento ou trecho do fluxo;
   - uma variação substitui conteúdo no mesmo ponto do documento conforme uma escolha, condição ou variável.
2. Durante a escrita, o autor pode acessar e editar todas as versões. Na leitura, apenas a versão ativa participa da projeção do documento.
3. Cada grupo de variações terá ID estável, versão padrão, condições opcionais, conteúdo próprio e um ponto comum de continuação.
4. A seleção feita durante a leitura pertence à sessão do leitor ou ao simulador. Ela não altera o conteúdo original nem é sincronizada como edição colaborativa.
5. A estabilidade visual usará um comportamento híbrido:
   - variações pequenas reservam a altura da maior versão no tamanho, zoom e perfil atuais;
   - variações grandes recalculam a paginação e preservam o trecho ativo na mesma posição visual da tela;
   - no modo Livro, uma versão extensa pode continuar na folha seguinte;
   - no modo Prancheta, o trecho expande normalmente.
6. Não reservar permanentemente a altura de todas as ramificações extensas ou aninhadas, pois isso produziria espaços vazios e crescimento imprevisível do documento.
7. Primeiro recorte futuro: bloco **Variação de trecho**, criado por `/ Narrativa`, com versões em abas na escrita, somente a versão ativa na leitura e troca em tempo real.

## Ordem de implementação

1. Corrigir a separação entre projeção de leitura e decoração de produção. **Implementado:** metadados e ações não participam mais da medição das folhas; documentos antigos são normalizados ao abrir.
2. Adicionar alternância Escrita / Leitura e perfis Prosa / Roteiro / Jogo. **Implementado:** o modo de leitura bloqueia edição e oculta controles; o perfil é salvo por documento e compartilhado com a equipe.
3. Criar mapa de eventos com destinos quebrados e “Testar daqui”. **Implementado:** o mapa é derivado dos documentos, materializa destinos ausentes como eventos provisórios, aponta IDs duplicados, permite criar o destino e executar a sequência a partir de qualquer evento.
4. Adicionar registro de personagens no projeto e IDs de localização por linha. **Implementado:** personagens possuem ID canônico e nome exibido em um registro compartilhado; diálogos referenciam `character_id`, falas e narrações recebem `localization_id` estável e ambos seguem no JSON exportado.
5. Adicionar variáveis tipadas, condições e efeitos às escolhas. **Implementado:** o registro do projeto aceita valores booleanos, numéricos e textuais; cada opção pode ter uma condição e um efeito configurados visualmente, exportados no JSON e executados pelo teste narrativo.
6. Criar simulador com histórico, inspeção de variáveis e validação. **Implementado:** o teste registra cada avanço e escolha, permite retornar a estados anteriores, mostra os valores atuais e valida IDs, destinos, localizações, personagens, variáveis, tipos e eventos não alcançáveis.
7. Revisar estética e estrutura da autoria narrativa.
8. Implementar variações condicionais de leitura conforme a decisão acima. **Implementado:** o bloco Variação de trecho possui versões com IDs estáveis, abas de autoria, localização por versão, simulação, validação e exportação. Em **Configurar versão**, o autor renomeia o trecho, define a versão padrão e configura uma condição por variável (booleano, número ou texto). A primeira condição atendida, na ordem das abas, vence; quando nenhuma atende, usa-se a versão padrão. Versões sem condição permanecem acessíveis para edição manual. A aba selecionada para escrita é independente da resolução da leitura e do simulador. A leitura usa os valores iniciais e efeitos do caminho canônico; a simulação usa o estado atual, inclusive ao voltar no histórico. O JSON inclui `default_version_id` e `versions[].condition`; IDs de localização permanecem estáveis. A remoção da versão padrão transfere essa função a uma versão vizinha. A validação verifica variáveis ausentes, comparações incompatíveis e tipos de valor; o registro de variáveis contabiliza essas referências antes de permitir exclusão.
9. Exportar a história como visual novel HTML antes da integração com engine. **Três fatias implementadas:** arquivo HTML independente, sequência inicial selecionável, caminhos conectados entre documentos, idiomas com fallback explícito para o original, personagens, modelos e cores de apresentação por sequência, animação, teclado/clique/toque, escolhas, condições, efeitos, variações, pausas, conclusão e reinício. Prévia do Docs e exportação usam o mesmo motor em `narrative-runtime.js`. A exportação valida somente o grafo incluído, bloqueia destinos ausentes/ambíguos e regras inválidas e exclui documentos desconectados, credenciais e metadados de conta. Sinais de integração são ignorados com aviso. O player salva progresso e histórico, oferece preferências de leitura persistentes, confirma reinícios e lida com armazenamento indisponível. A incorporação possui código pronto no diálogo de exportação, modo compacto e layout adaptado a telas pequenas. A cena visual inclui fundos e ambiente por sequência, retratos por personagem, posições e transições; a mesma camada é usada na amostra, no simulador e no HTML. Há exportação em HTML único com mídia embutida ou ZIP com imagens e áudio deduplicados em uma pasta de assets. As três fatias HTML estão implementadas; conferência visual em navegadores reais continua como aceite, e Godot permanece a próxima integração. Detalhes em [HTML_STORY_EXPORT.md](HTML_STORY_EXPORT.md).
10. Criar o primeiro adaptador de engine para Godot, mantendo o JSON genérico como contrato central. Esta integração fica por último nesta sequência.


## Ajustes de espaço de trabalho e modo Zen

- Escrever, História, Tradução e Cena ficam no cabeçalho, sem faixa intermediária. Em telas pequenas, a navegação permanece acessível por rolagem horizontal.
- Ações reúne Pendências, Dividir área / Uma área e as ações contextuais de teste e exportação.
- O modo Zen usa as mesmas regras de colunas da divisão e da biblioteca; não define colunas por estilo inline. A preferência de Zen do desktop é preservada ao voltar de uma janela estreita.
- Alterar Zen notifica o controlador para reposicionar a alça da biblioteca e recalcular as decorações do documento. A alça usa a borda interna do editor quando ele está visível; em uma ferramenta de tela inteira, usa a borda externa do painel, sem se prender às listas de tradução.
- A folha de livro inclui espaço simétrico para as etiquetas externas no seu tamanho rolável, respeitando o zoom e permitindo rolagem horizontal quando não couber. A seleção de documentos usa cinza discreto.
- Conferência visual das combinações de Zen, divisão, biblioteca e zoom permanece pendente em navegadores reais.


## Padronização visual e adaptação dos controles

- Abas de tarefa seguem o padrão do Canvas: ícone e rótulo, divisórias discretas e contorno da aba ativa. Os SVGs fornecidos de biblioteca, livro e folha são recursos locais em `assets/docs` e também aparecem na navegação e na alça da biblioteca.
- No Zen desktop, abrir a navegação reserva sua largura na área de escrita. A barra de ferramentas e o zoom acompanham o movimento; a divisão mantém pelo menos 320 px de área útil após descontar a navegação.
- Listas agrupa marcadores, numeração e tarefas. Callouts agrupa código, citação e os estilos de destaque de produção. Esses menus usam a camada externa de popovers, preservam a seleção e fecham após a ação. Configurações da página usa posição fixa para não ser recortada pela rolagem da barra.
- Painéis de produção e inspeção têm entrada suave; menus e estrutura também. A preferência de movimento reduzido desativa esses efeitos.
- Subtítulo vazio fica oculto, sem campo obrigatório nem espaço reservado. Pode ser adicionado em Configurações da página e volta a desaparecer quando for apagado e perder o foco.
- Removida a divisória vertical do cabeçalho ao lado da marca.
- Aceite visual permanece pendente; estas alterações não foram exercitadas em navegador nesta etapa.


## Biblioteca independente e hierarquia da navegação

- A biblioteca usa um drawer próprio e mantém a tarefa, a aba e a posição do trabalho atual. Em janelas largas, reserva 360 px; em janelas menores, abre sobre o conteúdo com fechamento próprio. Personagens, variáveis e glossário reutilizam os mesmos controles e registros, sem duplicar o documento.
- No Zen, a área de produção sem divisão também desconta a navegação esquerda. Os limites da divisão consideram o espaço da biblioteca quando ela está acoplada.
- A árvore de bibliotecas tem recuos e linhas de ligação; documentos selecionados usam realce plano. O botão Nova sequência usa o SVG de adição e o padrão de Propriedades; o ícone de salvar tem enquadramento óptico compatível com os outros atalhos.
- Cartões do mapa e a alça da navegação usam bordas neutras, sem brilho azul. Foco de teclado permanece visível.
- Conferência visual em navegador segue pendente.


## Entrada e movimento do drawer

- A tela de entrada ocupa a camada superior com fundo opaco; o editor e os popovers ficam invisíveis e sem interação enquanto ela estiver aberta.
- O drawer direito possui um único movimento de entrada/saída. A reserva da largura do aplicativo não tem transição concorrente; ao fechar, ela é liberada ao término do deslizamento.


## Movimento compartilhado da biblioteca

- O progresso de abertura é um único valor CSS registrado, animado pelo controlador: deslocamento do drawer e reserva do espaço da área de trabalho seguem exatamente esse valor.
- A largura do aplicativo permanece integral. A reserva usa padding abaixo do cabeçalho; o cabeçalho continua fixo de ponta a ponta.
- Reverter a abertura parte do progresso atual, sem reiniciar o movimento. A alça da biblioteca permanece cinza também aberta e sob hover.
- A gravação fornecida foi inspecionada; a alteração ainda requer conferência visual no navegador.


## Planejamento da história — primeira fatia

Implementado em História → Planejamento, por documento:

- Resumos opcionais de Começo, Meio e Fim, sem exigir modelo narrativo.
- Marcos livres com título, descrição e etapa (Começo, Meio, Fim ou livre), reordenação por botões e remoção com desfazer durante a sessão do documento.
- Vínculos de cada marco a várias sequências do mesmo documento e atalho para abri-las. Reordenar o planejamento não move os blocos do texto. Renomear o ID de uma sequência atualiza os vínculos. Sequências removidas aparecem como indisponíveis e podem ser desvinculadas.
- Dados normalizados em `storyPlanning` no registro local e em `content.story_planning` na sincronização e nas versões remotas. O registro é independente da projeção de leitura e do player HTML; o planejamento não participa das falas exportadas.
- Controles respeitam permissões do projeto; a consulta e os atalhos continuam disponíveis sem permissão de edição. A aba funciona com divisão de área e preserva sua posição de rolagem por documento.
- O formulário usa os nomes das sequências e não expõe seus IDs técnicos.

Implementação em `story-planning.js`, carregada também pelo loader desktop. Modelos da jornada do herói, mapa visual do planejamento, preparação/consequências, fichas do mundo e faixas de ambientação permanecem para próximas fatias. A conferência desta etapa é de sintaxe e integração por leitura do código; uso em navegador ainda não conferido.


## Bibliotecas como livros e pranchetas

Esta estrutura substitui o planejamento por documento da primeira fatia.

- `libraryFolders` passa a representar coleções com `layout` (`book` ou `canvas`), `storyPlanning`, `legacyPlans`, `migratedDocuments` e `updatedAt`.
- Cada coleção tem acesso próprio a Planejamento e criação direta de capítulo/seção. Novos documentos criados nesse acesso herdam o modelo da coleção; os documentos existentes conservam suas configurações de página, inclusive ao serem movidos entre coleções.
- O planejamento existe mesmo com a coleção vazia. As sequências disponíveis vêm de todos os capítulos visíveis da coleção; cada vínculo usa o par `documentId`/`sequenceId`, com rótulo `Capítulo → Sequência`. Renomear um evento e receber um ID remoto para um capítulo atualizam as referências.
- Planejamentos anteriores ficam arquivados pelo capítulo de origem. Uma única origem é adotada quando o plano geral ainda está vazio; múltiplas origens permanecem separadas. Seus marcos podem ser copiados para o plano geral sem concatenar os resumos. Documentos soltos preservam seus dados antigos e entram nessa migração ao serem movidos para uma biblioteca.
- Expandir um capítulo de livro abre sua paginação real e apresenta folhas como atalhos derivados; elas não são registros salvos. A árvore atualiza a contagem do capítulo ativo após a paginação. Mais de 40 folhas são agrupadas em intervalos de 20. Pranchetas mostram os títulos internos ou um acesso à área contínua.
- O livro pode ser configurado pelo menu da biblioteca. Excluir uma biblioteca informa que também exclui seu planejamento; capítulos retornam à Caixa de entrada.
- No modo local, coleções e planos são salvos no cache existente. No beta online, o snapshot da coleção acompanha `content.organization.collection` dos capítulos e é reconciliado por `updatedAt`; coleções vazias permanecem no cache até existir um capítulo sincronizado. Isso não cria documentos artificiais para guardar páginas ou planejamento. Uma tabela independente para coleções e conflitos de edição simultânea do planejamento continua necessária antes da abertura pública da nuvem.
- A sincronização após a pausa percorre documentos pendentes em sequência, permitindo gravar mudanças de coleção que afetam vários capítulos.

Conferência realizada nesta etapa: leitura das integrações, sintaxe de JavaScript e atualização da CSP desktop. A migração e a navegação ainda precisam ser exercitadas em navegador real; não foram executados testes funcionais.


## Desenvolvimento dos marcos — segunda fatia do planejamento

- Cada marco passa a guardar `preparation` (o que precisa aparecer antes), `consequences` (o que deve repercutir depois) e `dependsOn`, com IDs estáveis dos marcos de preparação. O planejamento normalizado usa versão 2; campos ausentes nos dados antigos recebem valores vazios.
- A seção Preparação e consequências é expansível, evitando deixar todos os formulários permanentemente expostos. Seu conteúdo só é montado quando aberta.
- O autor pode marcar quais outros marcos preparam aquele acontecimento e navegar até eles. O caminho inverso, “Este marco prepara…”, é derivado dessas mesmas referências, sem duplicar relações persistidas.
- A ordem dos marcos permanece livre. A interface não reordena capítulos nem altera o fluxo jogável; permite vínculos em qualquer etapa da história. Não permite selecionar o próprio marco como preparação de si mesmo.
- Remover um marco conserva as referências dos demais como vínculos a revisar. Desfazer restaura o mesmo ID e recupera essas conexões. Títulos são usados na interface, incluindo o último nome conhecido quando o destino estiver indisponível.
- Os dados seguem o salvamento já existente da coleção. A consulta e os atalhos continuam disponíveis sem permissão de edição. A cópia de planejamentos preservados remapeia também as relações entre seus marcos para os novos IDs.
- Nenhuma informação do planejamento é inserida no texto de leitura ou no player exportado.

Conferência desta fatia: sintaxe JavaScript, diff e CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador. Modelos narrativos, fichas do mundo e mapa visual do planejamento permanecem para próximas fatias.


## Guias narrativos — terceira fatia do planejamento

- O painel Planejamento oferece um seletor expansível de guias opcionais: Livre, Começo, Meio e Fim (3 marcos), Três atos (9 marcos) e uma adaptação da Jornada do herói (12 marcos).
- A escolha apresenta uma prévia das etapas e perguntas antes de confirmar. Aplicar acrescenta sugestões ao fim do plano da coleção, preservando resumos, marcos e vínculos existentes. Escolher Livre mantém o conteúdo e libera a organização própria.
- Todos os marcos sugeridos podem ser renomeados, reordenados, desenvolvidos ou removidos. A pergunta-guia aparece como orientação separada do texto do autor e pode ser editada em Preparação e consequências, inclusive em marcos livres.
- O formato normalizado passa à versão 3, com `guide` no plano e `guidance`/`templateKey` nos marcos. Dados antigos recebem guia Livre e campos vazios. A persistência continua na coleção, incluindo seus snapshots locais e de sincronização do beta.
- Reaplicar um guia acrescenta somente suas etapas ausentes, identificadas por `templateKey`; não duplica sugestões ainda presentes, mesmo que tenham sido renomeadas. Guias diferentes podem coexistir no mesmo plano.
- Desfazer inclusão está disponível durante a sessão da coleção para a última inclusão de sugestões. Remove apenas os marcos gerados que continuam sem alterações e conserva os já editados. Os demais vínculos seguem a revisão de referências indisponíveis existente.
- Os guias não impõem regras à história, não criam capítulos ou sequências e não alteram o conteúdo exportado.

Conferência desta fatia: leitura do código, sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador. Fichas do mundo e mapa visual do planejamento permanecem para próximas fatias.


## Fichas do mundo — quarta fatia do planejamento

- Em História → Planejamento, cada livro ou prancheta tem uma seção expansível Fichas do mundo, compartilhada entre seus capítulos. As fichas são agrupadas em Personagens, Lugares e Regras do mundo; os formulários só são montados ao abrir uma ficha.
- Todos os campos são opcionais. Além de nome/título e visão geral, personagens têm papel, motivação, conflito e transformação; lugares têm ambiente, características e tensões; regras têm funcionamento, limites e consequências.
- Estas fichas guardam notas do autor no planejamento. Fichas de personagem não cadastram automaticamente personagens no registro de diálogos do projeto.
- Cada marco pode vincular várias fichas em Referências do mundo. Ver ficha abre a referência e navega até ela; a ficha mostra os marcos relacionados e oferece o caminho de volta. A consulta e a navegação permanecem disponíveis sem permissão de edição.
- Os vínculos usam IDs estáveis e conservam o último título conhecido. Renomear uma ficha atualiza os rótulos das referências. Removê-la mantém os vínculos sinalizados como removidos/indisponíveis, permitindo revisão ou desvinculação. Desfazer restaura a última ficha removida durante a sessão da coleção com seu ID e relações.
- O formato normalizado passa à versão 4: `worldEntries` no plano, com `id`, `type`, `title`, `summary`, `details`; `worldLinks` em cada marco, com `entryId` e `title`. Dados antigos recebem listas vazias. IDs duplicados são desambiguados; vínculos repetidos e campos de tipos inválidos são normalizados.
- As fichas seguem a persistência e os snapshots da coleção existentes. Planos que têm somente fichas também contam como preenchidos na migração e exclusão da coleção. A consulta de planejamentos preservados inclui as fichas; copiar marcos e fichas remapeia suas referências e evita cópias repetidas.
- Os dados são anotações de planejamento e não entram na projeção de leitura nem no player exportado. A estrutura de sincronização do beta mantém as limitações já registradas para coleções.

Conferência desta fatia: leitura das integrações, sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador. O mapa visual do planejamento e as faixas de ambientação permanecem para próximas fatias.


## Mapa do planejamento — quinta fatia

- História → Planejamento oferece as visualizações Formulário e Mapa para o mesmo livro/prancheta. O mapa organiza os marcos nas colunas Começo, Meio e Fim, com uma coluna adicional quando há marcos livres; mantém a ordem relativa dos marcos dentro de cada etapa.
- Os cartões mostram o título, um trecho da descrição (ou pergunta-guia), contagens de preparações/fichas e referências que precisam de revisão. A seleção destaca o marco e suas relações diretas; Todas as conexões amplia a exibição das setas.
- As setas representam as relações `dependsOn` já existentes, sempre da preparação para o acontecimento. A direção pode atravessar etapas em qualquer sentido; o mapa não impõe ordem nem valida uma estrutura narrativa. Relações cíclicas não causam recursão no desenho. Referências removidas são apresentadas no painel de detalhes para revisão, sem criar nós artificiais.
- O painel de detalhes apresenta o texto completo, perguntas-guia, preparação, consequências, marcos de origem/destino e atalhos para fichas e sequências. Selecionar uma relação revela o cartão correspondente no mapa. Editar marco e Editar preparação levam ao campo/seção correspondente no formulário, respeitando as permissões de edição; consultas continuam disponíveis em modo de leitura.
- O mapa tem rolagem própria horizontal/vertical e o painel de detalhes se acomoda abaixo dele em áreas estreitas. Setas são SVG decorativo e as relações também têm navegação textual e por teclado. Linhas e seleção usam tons neutros. A geometria é recalculada com ResizeObserver quando a área muda, incluindo abertura dos painéis laterais e divisão da área de trabalho.
- A seleção, modo de visualização, posição da rolagem e seções expandidas ficam na memória de interface por coleção durante a sessão. Alterar a visualização não modifica o plano. O formato persistido permanece na versão 4; não há uma cópia separada do grafo ou coordenadas salvas.
- Implementação do mapa em `story-planning-map.js`, carregada antes do planejador também no desktop. Organização manual livre de posições e arraste de conexões ficam para uma evolução posterior.

Conferência desta fatia: leitura da integração, sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador. As faixas de ambientação permanecem para próximas fatias.


## Faixa de ambientação — primeira fatia

- Configurações da página → Ambientação do capítulo permite ativar uma faixa decorativa junto à borda esquerda das folhas no modelo Livro. Cada capítulo/documento mantém sua própria configuração, desativada por padrão; não depende de um marco do planejamento.
- Há sugestões de cor/nome para Floresta, Fogo, Industrial, Castelo, Calma, Tensão e Mistério, além de cor e nome personalizados. Largura e intensidade são ajustáveis; a configuração pode ser consultada e a faixa continua visível no modo de leitura e no Zen.
- O fundo pode usar uma textura PNG, JPEG ou WebP importada, repetida nos dois eixos. O tamanho da repetição é ajustável e conserva a proporção da imagem. A importação preserva o desenho do arquivo fornecido; não transforma uma imagem comum em seamless automaticamente.
- A faixa é um elemento decorativo fora do conteúdo editável. A máscara acompanha a altura das folhas e oculta os intervalos da paginação. A largura usa somente o espaço disponível à esquerda, considerando zoom, rolagem, painéis e área dividida; ela encolhe ou se oculta quando não há espaço. No modelo Prancheta, a preferência é preservada e a faixa fica oculta.
- A visualização de tradução remove a faixa do clone; a impressão a oculta. O texto, a paginação e os pacotes narrativos exportados não recebem a decoração. Esta fatia aplica um ambiente por capítulo; variações por cena/trecho e associação às fichas de lugares ficam para uma evolução posterior.
- `ambience` é normalizado no registro do documento; metadados e referências de textura seguem em `content.appearance.ambience` nas versões remotas, carregamento e conflitos. Templates explícitos também conservam a preferência. Documentos antigos recebem valores padrão sem faixa ativa.
- Texturas usam o armazenamento IndexedDB de imagens existente e, no beta online, o mesmo bucket protegido dos anexos. Os metadados guardam referências e nome do arquivo, sem base64 no cache de documentos. Um perfil específico do otimizador limita a textura a 512 px de borda, com alvo de 128 KiB e máximo de 256 KiB. A interface respeita permissões e invalida importações se o capítulo, projeto ou sessão mudar. Se o arquivo estiver indisponível, a cor é mantida como fundo e a interface informa o problema.
- A implementação fica em `document-ambience.js`, carregada também pelo loader desktop. URLs temporárias de textura são liberadas ao trocar de fonte ou fechar a página.

Conferência desta fatia: leitura das integrações de página, persistência e mídia; sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador.
