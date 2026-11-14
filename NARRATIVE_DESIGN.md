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


## Ambientação por sequência — segunda fatia

- Configurações da página → Ambientação passa a oferecer Aplicar a: Capítulo (padrão) ou uma sequência narrativa existente. Selecionar um escopo é uma preferência de consulta e não muda os dados.
- Sequências usam o padrão do capítulo até que o autor escolha Personalizar esta sequência. A personalização oferece os mesmos controles de cor, textura, nome, largura e intensidade; desativar Mostrar faixa personaliza aquele trecho sem decoração. Voltar a Usar padrão do capítulo guarda a configuração própria, permitindo reativá-la depois.
- Uma sequência começa no primeiro bloco narrativo visível que lhe pertence e continua até o primeiro bloco de outra sequência, incluindo prosa intermediária. O trecho anterior à primeira sequência usa o padrão do capítulo. Se uma sequência reaparecer depois de outra, sua configuração é reaplicada. Sequências sem blocos guardam sua configuração até serem utilizadas no texto.
- A faixa é composta de segmentos medidos a partir dos blocos reais após a paginação, acompanhando continuidade entre folhas e intervalos da paginação pela máscara existente. Regiões adjacentes com o mesmo ambiente são unidas para evitar reiniciar a textura e repetir o nome desnecessariamente. Blocos ocultos no caminho de leitura não criam mudanças de ambiente.
- As configurações ficam em `ambience.sequences`, como `{sequenceId, inherit, style}` dentro de `content.appearance.ambience`; o estilo é normalizado com o mesmo formato básico do capítulo. Dados anteriores recebem uma lista vazia, mantendo o resultado visual anterior. Renomear o ID de uma sequência atualiza suas referências de ambientação; excluí-la remove a configuração e os blocos passam a usar o ambiente da sequência de destino.
- Edição do texto, mudança de atribuição dos blocos, paginação, zoom, rolagem e redimensionamento recalculam os segmentos. O mapa de planejamento, o fluxo narrativo jogável e os pacotes exportados continuam usando seus dados existentes; a ambientação permanece uma decoração do editor/visualização de leitura.
- O carregamento das texturas é compartilhado entre segmentos que usam o mesmo arquivo, com descarte das URLs que deixam de ser necessárias. Cor de fundo é usada quando uma textura não está disponível. Importações em andamento são invalidadas ao mudar capítulo, sessão ou escopo de sequência e respeitam a permissão de edição.
- Associação da ambientação às fichas de lugares do planejamento permanece para uma próxima fatia.

Conferência desta fatia: leitura das integrações de sequências, paginação e persistência; sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem conferência visual no navegador.


## Conclusão das integrações de planejamento e ambientação

Esta etapa implementa os três pontos funcionais que continuavam separados: ambientes das fichas de lugares, personagens compartilhados com diálogos e organização manual do mapa. As seções históricas acima descrevem o estado de cada fatia na época; as limitações substituídas abaixo deixam de representar pendências de implementação.

### Lugares e ambientes reutilizáveis

- Cada ficha de lugar oferece Ambiente deste lugar, com cor, textura importada, rótulo, largura, intensidade e escala. Usa o perfil de textura e o armazenamento de assets existentes; a importação respeita permissões e a coleção ainda selecionada.
- Configurações da página → Ambientação oferece Ambiente de um lugar para o padrão do capítulo ou para uma sequência personalizada. A seleção inclui lugares com ambiente configurado da biblioteca do capítulo. A fonte Personalizado conserva a configuração própria anterior, sem vínculo.
- Vínculos guardam coleção, ficha, título e snapshot do estilo. Enquanto o lugar existe, o ambiente acompanha suas alterações; essas alterações também atualizam os snapshots dos capítulos da coleção pelo fluxo de persistência existente. Um lugar removido ou pertencente à biblioteca anterior conserva a última aparência conhecida e uma indicação para revisar a origem, sem aplicar uma ficha homônima de outra biblioteca. Restaurar a ficha recupera o vínculo pelo ID.
- Ao usar um lugar, os campos de aparência são apresentados a partir da ficha. Para voltar a editar a configuração independente, o autor escolhe Personalizado. Herança da sequência e configurações próprias continuam preservadas.
- Prévia de textura e faixa carregam os assets de forma assíncrona. Editores desmontados descartam suas URLs temporárias e invalidam importações pendentes.

### Fichas e personagens dos diálogos

- Fichas de personagem têm um seletor para o personagem do registro narrativo do projeto. O vínculo usa o ID estável e mantém um nome de referência se o personagem for removido. As notas e o título da ficha continuam autorais e não são substituídos pelo nome da fala.
- Registrar personagem com este nome reutiliza um registro existente pelo nome ou cria um novo ID pelo mecanismo do registro. O registro é salvo no cache e usa a sincronização já disponível no beta quando pronta.
- Abrir personagem navega até o registro no painel direito. O registro mostra atalhos de volta às fichas vinculadas nas bibliotecas. Excluir um registro sem falas deixa as fichas e suas notas preservadas, permitindo vincular outro personagem.

### Mapa com organização manual e conexões

- O mapa oferece organização por etapas e Organização livre. No modo livre, cartões podem ser movidos pela alça, por mouse/toque ou por setas do teclado; Shift amplia o passo. As posições são guardadas na coleção e não alteram a ordem dos marcos ou dos capítulos.
- O conector de um cartão pode ser arrastado até outro ou ativado por clique/teclado seguido da escolha do destino. A relação criada é a mesma preparação usada no formulário: origem prepara destino. Autorrelacionamentos e duplicatas não são adicionados. O painel oferece remoção explícita de conexões.
- Há prévia do traço, indicação do destino, rolagem junto às bordas, cancelamento com Escape e limpeza de gestos ao desmontar o mapa. Relações e campos continuam consultáveis sem permissão de edição, com movimentação e mutações bloqueadas.
- Reorganizar cartões recupera as posições iniciais por etapa. Trocar os modos conserva as coordenadas; Desfazer organização recupera alterações de disposição durante a sessão. As coordenadas usam valores finitos limitados, evitando dados inválidos de layout.
- O plano normalizado passa à versão 5 com `mapLayout` (`mode`, `positions`) e, nas fichas, `characterLink` ou `ambience`. Planos antigos recebem organização automática, posições vazias e vínculos opcionais vazios. O grafo continua derivado dos mesmos marcos e `dependsOn`; não há uma segunda cópia do conteúdo narrativo.

### Estado desta conclusão

As três integrações funcionais foram implementadas. Sintaxe JavaScript e diff foram conferidos, e a CSP desktop foi atualizada. Não foram executados testes funcionais nem aceite visual no navegador. A revisão de design e a validação de interação continuam pendentes, assim como as limitações já registradas da infraestrutura de coleções no beta online.


## Revisão visual — cabeçalho de História e ramos da biblioteca

- História usa as abas internas como primeira linha, sem repetir o título da tarefa e o botão Escrever que já existem no cabeçalho principal. Os elementos de identificação permanecem no DOM para os vínculos acessíveis e o controlador compartilhado; as demais tarefas conservam seus controles próprios.
- As abas precedem os controles de sequência também na ordem do documento. Seleção, Nova sequência, Propriedades e Adicionar bloco ficam abaixo delas; Planejamento usa diretamente a área restante, sem reservar uma linha vazia para controles ocultos.
- As linhas da biblioteca são desenhadas por ramo, terminando na altura do último item com um segmento horizontal. Isso vale para livros, capítulos, folhas e grupos de folhas; os intervalos de folhas têm uma ramificação própria.

Conferência: leitura da estrutura, sintaxe JavaScript e atualização da CSP desktop. Conferência visual no navegador permanece pendente; não foram executados testes funcionais.


## Encaixe adaptativo da folha

- O zoom separa a porcentagem escolhida pelo autor da porcentagem temporária necessária para caber na área de escrita. Com Encaixar ativo, abrir painéis, dividir a área ou estreitar a janela reduz a folha considerando sua largura real e as margens externas; recuperar espaço restaura o zoom escolhido, sem ampliá-lo além dessa preferência.
- O controle mostra a porcentagem efetiva com indicação de ajuste automático. A preferência original não é sobrescrita pelo encaixe. Alterar o zoom pelos botões ou seletor desativa o ajuste automático e mantém a escolha manual, inclusive se isso exigir rolagem horizontal. Encaixar permite reativar ou desativar esse comportamento explicitamente; a preferência é local e persiste entre sessões.
- Redimensionamentos são agrupados com uma pequena espera para não repaginar a cada quadro da animação dos painéis. Áreas ocultas não são medidas. O modo Prancheta usa o zoom escolhido; o Livro no celular usa o mesmo controlador, sem uma segunda escala automática concorrente.
- A posição vertical é ajustada proporcionalmente ao zoom; o fluxo de paginação existente continua responsável pela âncora do cursor. O espaço da barra de rolagem é reservado para evitar oscilações de largura durante o ajuste.

Conferência desta alteração: leitura do controlador de zoom e paginação, sintaxe JavaScript e atualização da CSP desktop. Conferência visual no navegador permanece pendente; não foram executados testes funcionais.


## Documento em prévia na Tradução

- Entrar na área Tradução coloca o documento em leitura, impedindo editar o original. Se há idioma ativo, abre automaticamente a prévia desse idioma, com o fallback existente para linhas ainda não traduzidas; sem idioma, mantém o original em leitura.
- O seletor de modo do original permanece bloqueado durante a Tradução, inclusive ao fechar a prévia do idioma. Trocar de documento nessa área prepara novamente sua prévia. Ao sair da tarefa, fecha o clone de tradução e restaura o modo de escrita/leitura anterior.
- A preferência de divisão da área permanece independente. Os campos de tradução continuam editáveis conforme as permissões existentes.

Conferência de sintaxe e CSP desktop; interação visual no navegador pendente. Não foram executados testes funcionais.


## Cabeçalho compacto do planejamento

- O cabeçalho identifica somente Livro/Prancheta e o nome da coleção selecionada. A explicação permanente foi substituída por um botão ? com rótulo acessível; clicar revela a ajuda e Escape a recolhe. A ajuda não depende de hover e fica recolhida inicialmente.
- O seletor expansível usa apenas Guia narrativo; o modelo escolhido continua indicado no seletor interno.

Conferência de sintaxe e CSP desktop; conferência visual no navegador pendente.


## Inserção de blocos pela sequência

- Adicionar bloco em História insere um bloco vazio do tipo escolhido ao final da sequência ativa e mantém a aba Sequência aberta. A ação usa a sequência selecionada, sem converter texto nem depender do cursor da folha oculta.
- A inserção respeita os contêineres de paginação e blocos narrativos inline, registra a mutação no histórico e solicita o salvamento. A nova linha recebe foco e é trazida para a área visível da lista; sua abertura para edição continua disponível pelo clique existente.
- O menu compartilhado interrompe a propagação do clique para evitar despacho duplicado quando está dentro do painel. O fluxo de inserção durante a escrita permanece com seu comportamento de cursor.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Interação no navegador pendente; não foram executados testes funcionais.


## Mapa navegável de sequências — primeira fatia

- História → Mapa reúne as sequências dos capítulos visíveis do livro/prancheta selecionado. Sem coleção, mostra o documento atual. Cada cartão identifica sequência, capítulo, prévia e quantidade de saídas; capítulos arquivados não integram o conjunto principal.
- As setas vêm dos destinos existentes nas opções de escolha. Selecionar um cartão destaca entradas, saídas e vizinhos; clicar numa seta abre sua opção no painel de destinos. Retornos, ciclos e várias opções para um mesmo destino são representados. A ordem dos cartões não cria continuações implícitas.
- Destinos ausentes aparecem como referências tracejadas. IDs duplicados geram referências ambíguas, sem escolher arbitrariamente uma sequência. Destinos de outros livros e de capítulos arquivados aparecem como referências externas; suas saídas são exploradas no livro de origem.
- O canvas permite arrastar o fundo, mover cartões pelo título ou por setas do teclado (Shift amplia o passo), ajustar zoom pelos controles ou Ctrl/Meta + roda e enquadrar o conjunto ou a seleção. Escape, cancelamento do ponteiro e perda de foco cancelam o gesto em andamento. A interface usa cinzas neutros e indica a seleção sem glow.
- Posições, câmera e seleção são preferências locais por projeto/coleção, mantidas entre reaberturas neste navegador/dispositivo; não são sincronizadas nem exportadas nesta fatia. Essas preferências pessoais também podem ser manipuladas ao consultar um projeto sem permissão de edição.
- O painel permite escolher e salvar o destino de cada opção existente, inclusive de capítulos que não estão abertos na folha. A alteração é feita no HTML narrativo de origem, preservando texto, condições, efeitos e IDs. O capítulo ativo usa o histórico de mutações existente; capítulos fechados seguem a persistência e sincronização de revisão existentes. Não há uma cópia independente de caminhos no mapa.
- A edição de destinos respeita permissão, bloqueio desktop, conflitos e validade/ambiguidade dos IDs. Conteúdo alterado desde a leitura do mapa é rejeitado em vez de atualizar uma opção diferente. Abrir sequência mantém História e seleciona a sequência no capítulo de origem; Testar daqui usa o player existente.
- A entrada desktop carrega `sequence-map.js` pelo mesmo mecanismo dos demais módulos. A CSP é regenerada após a integração.

A simulação visual de percursos é descrita na quarta fatia abaixo. O mapa de marcos do planejamento permanece independente.

Conferência desta fatia: leitura da integração, sintaxe JavaScript e diff. Não foram executados testes funcionais nem aceite visual no navegador.


## Organização do mapa pelo fluxo narrativo

- A disposição inicial segue as conexões, de cima para baixo. Alternativas de uma bifurcação ficam na mesma faixa horizontal; reencontros são colocados após seus predecessores. A ordem das escolhas orienta a distribuição inicial dos ramos, com passagens de ordenação para reduzir cruzamentos.
- Ciclos são agrupados antes de atribuir os níveis, evitando profundidade infinita. As sequências do ciclo continuam individuais, distribuídas em níveis sucessivos. Retornos e ligações que saltam níveis usam trajetos laterais; ligações comuns saem da base da origem e entram no topo do destino.
- Componentes sem ligação ficam em conjuntos separados. O posicionamento considera todos os capítulos do escopo, sem criar uma coluna obrigatória por capítulo e sem alterar os destinos ou a ordem do texto.
- Cartões movidos manualmente permanecem em suas posições nas próximas aberturas; os automáticos evitam sobreposição com eles. A preferência local ganha `layoutVersion:2` e `manualKeys`. Na migração, posições que coincidem com a antiga grade padrão são recalculadas; desvios dessa grade são tratados como ajustes manuais.
- Organizar fluxo reaplica a disposição automática a todos os cartões e enquadra o conjunto. Desfazer organização recupera a disposição, os ajustes manuais e a câmera anteriores durante a visualização atual. Os movimentos manuais continuam disponíveis após organizar.

Conferência de sintaxe JavaScript e diff; sem execução de testes funcionais ou aceite visual no navegador. O ordenamento é uma heurística de legibilidade, sem garantia de eliminar todos os cruzamentos em grafos complexos.


## Criação e conexão pelo mapa — segunda fatia

- Os cartões com escolhas exibem saídas numeradas, correspondentes às opções listadas no inspetor. Arrastar uma saída mostra a prévia da seta e destaca cartões que podem receber o destino. Soltar num cartão existente atualiza a opção de escolha original; retornos e autorreferências continuam permitidos quando o ID é válido.
- Soltar no fundo abre Nova sequência, com nome e capítulo. Ao confirmar, a sequência é criada no capítulo escolhido e a saída passa a apontar para ela. A posição da soltura é guardada como ajuste manual local. A criação só é concluída se a escolha de origem passar pelas verificações de conteúdo atual; uma rejeição restaura os metadados de sequência anteriores.
- Nova sequência no cabeçalho e dois cliques no fundo permitem criar uma sequência independente. O inspetor também oferece Criar destino. Capítulos disponíveis pertencem ao livro/prancheta do mapa, sem itens arquivados, excluídos ou com conflito. Uma sequência nova é vazia e pode ser desenvolvida abrindo-a na aba Sequência.
- Há uma alternativa por cliques/teclado: ativar a saída ou Conectar no mapa e depois ativar o cartão de destino; clicar no fundo abre a criação vinculada. Cancelar conexão ou Escape encerram a seleção sem alterar os caminhos. Cancelar o formulário não cria a sequência. Gestos também são encerrados em cancelamento do ponteiro, perda de foco e desmontagem da visualização.
- A criação e a edição respeitam permissão, bloqueio desktop, contexto de projeto/livro, IDs únicos e as verificações de atualização da escolha. Condições, efeitos, texto e identificadores da opção permanecem preservados. Não é criada uma ligação implícita entre sequências sem uma saída de escolha existente.
- A atualização do canvas ocorre após salvar o estado de disposição. O novo cartão fica selecionado e visível, mantendo História aberta. A persistência do conteúdo usa os capítulos e o fluxo de revisão existentes; as coordenadas continuam locais.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem aceite visual no navegador. A criação de escolhas pelo mapa é descrita na quinta fatia abaixo.


## Navegação e foco do mapa — terceira fatia

- O minimapa acompanha cartões, conexões, seleção, zoom e área visível do canvas. Clique ou arraste para centralizar a visão em outra região; setas do teclado navegam, Shift amplia o passo e Home enquadra as sequências visíveis. Escape, cancelamento do ponteiro e perda de foco cancelam o gesto e recuperam a câmera inicial. A visão geral pode ser recolhida pelo botão Minimapa.
- Filtros reúne busca por nome da sequência, capítulo ou ID (sem distinção de acentos/maiúsculas), seleção de capítulo e escopos Todas, Entradas e saídas da seleção, Caminhos a partir da seleção e Com pendências. A busca, o capítulo e o escopo se combinam. A contagem separa resultados e referências de contexto.
- As conexões imediatas dos resultados permanecem como contexto, com cartões tracejados e atenuados. Isso conserva entradas, saídas e destinos de outros capítulos sem expandir indefinidamente o filtro. Ligações entre dois cartões que são apenas contexto não são exibidas. O minimapa respeita essa projeção, mantendo as coordenadas do livro.
- Pendências usa os avisos existentes de opções sem destino, destinos ausentes/arquivados ou IDs ambíguos. Uma sequência sem saídas não é presumida como erro. Caminhos a partir da seleção percorre os destinos com controle de ciclos, sem executar condições ou alterar variáveis.
- Os filtros não movem cartões nem alteram dados narrativos. Enquadrar mapa e Home consideram o conjunto visível. Ausência de resultados oferece Limpar filtros; Revelar seleção e Ver destino permitem recuperar uma sequência fora do recorte. Criação que seleciona um novo cartão também o revela.
- Durante a conexão de uma saída, os destinos ficam temporariamente visíveis. Ao concluir/cancelar, o filtro se aplica novamente. A câmera, os filtros e a visibilidade do minimapa ficam em preferências locais por projeto/livro, sem exigir edição do conteúdo nem sincronização.
- O SVG do minimapa reutiliza a geometria das setas do canvas; navegação e rolagem não recalculam o roteamento do grafo. Gestos e observadores são descartados ao desmontar a visualização.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem aceite visual no navegador. A criação de escolhas pelo mapa é descrita na quinta fatia abaixo.


## Simulação visual do percurso — quarta fatia

- Simular seleção no cabeçalho ou Simular daqui no inspetor inicia uma sessão passo a passo dentro do mapa. O player existente continua disponível por Abrir player. A sessão usa `HeartspaceNarrativeRuntime.createRunner`, com uma cópia das sequências e variáveis do projeto e sem editar conteúdo, valores padrão ou caminhos.
- O inspetor mostra diálogo, narração, variação resolvida, pausa, sinal ou opções da escolha atual. Condições são avaliadas pelo mesmo runtime; escolhas com condição não atendida, destino ausente ou ID ambíguo ficam indisponíveis. Efeitos de escolhas só são aplicados quando o runtime aceita a opção. Sinais são exibidos para inspeção, sem executar ações externas. Pausas são avançadas manualmente nesta visualização.
- Sequências visitadas, sequência atual e setas efetivamente escolhidas têm destaque no canvas e no minimapa. A ligação percorrida identifica também o bloco e o índice da opção, distinguindo escolhas paralelas para o mesmo destino. Saídas bloqueadas da escolha atual aparecem atenuadas e tracejadas. Ciclos e autorreferências são preservados no percurso.
- Voltar restaura o snapshot anterior de sequência, bloco e variáveis e remove desse trecho as visitas e escolhas posteriores. Reiniciar limpa histórico/percurso e repõe as variáveis iniciais. Acompanhamento da câmera é opcional e ocorre nas mudanças de sequência; é possível navegar e mover cartões para consultar o mapa durante a sessão.
- Variáveis e Percurso são seções expansíveis do inspetor. A chegada ao fim de uma sequência é indicada sem criar uma continuação implícita. O grafo continua no escopo do livro: sequências externas que ultrapassem suas referências visíveis podem continuar nos controles, acompanhadas de aviso de que estão fora deste mapa.
- Durante a sessão, a projeção mostra o mapa completo e os controles de edição narrativa ficam indisponíveis. Ao encerrar, recupera os filtros, a seleção e a câmera anteriores. A sessão não persiste e é descartada quando a visualização é desmontada; apenas as preferências normais de disposição/câmera são locais.
- A identificação das opções no registro ganhou `nodeId` para relacionar o runtime à seta correspondente, sem alterar a representação de destino nem os formatos de exportação. O runtime compartilhado e o player HTML não foram modificados.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem aceite visual no navegador. A criação de escolhas pelo mapa é descrita na quinta fatia abaixo.


## Criação de escolhas e opções no mapa — quinta fatia

- Nova escolha no inspetor da sequência abre um formulário com pergunta/contexto opcional e opções. Duas linhas são propostas inicialmente; é possível adicionar/remover linhas antes de salvar, mantendo pelo menos uma opção com texto. Cada destino pode ser escolhido entre sequências existentes com ID único ou deixado para conectar depois.
- O formulário cria um bloco semântico `choice` ao final da sequência selecionada, usando os mesmos construtores da escrita. O posicionamento respeita páginas e contêineres de narrativa inline e não usa o cursor nem muda para Escrever.
- O inspetor agrupa as saídas por bloco de escolha, exibindo sua pergunta e Adicionar opção. Esse formulário acrescenta uma ou mais opções ao bloco escolhido, inclusive quando ele ainda não tem opções. IDs, localização, textos, destinos, condições, efeitos e caminho canônico das opções existentes são preservados; as novas opções recebem identificadores próprios e a normalização canônica existente.
- Os destinos das novas opções passam imediatamente a integrar setas, saídas numeradas, organização automática e a próxima sessão de simulação. As opções sem destino usam os avisos e controles de conexão existentes, inclusive arrastar para criar uma sequência.
- O registro inclui metadados dos blocos de escolha, mesmo vazios, e assinaturas do conteúdo usado pelo formulário. Antes de modificar, valida permissão, bloqueio desktop, contexto de projeto/livro, disponibilidade do capítulo, ID da sequência, destinos e se a sequência/bloco mudou desde a abertura. Conteúdo desatualizado é rejeitado antes de inserir novas opções.
- Capítulos ativos usam o histórico de mutações, salvamento e paginação existentes; capítulos fechados são editados no próprio HTML e seguem persistência/revisão. O salvamento mantém História aberta e coloca foco no grupo da escolha. Filtros que ocultariam a sequência recém-editada são limpos para revelá-la.
- Cancelar ou Escape fecha o formulário sem alterar o documento. As linhas permitem teclado, rótulos próprios e recuperação de foco após remoção. As ações ficam indisponíveis em simulação e para sequências externas, ausentes, ambíguas ou sem permissão de edição. A desmontagem fecha os formulários.

As fatias funcionais listadas para o mapa foram implementadas. A revisão de design e a validação das interações no navegador continuam pendentes. Conferência desta fatia: sintaxe JavaScript, diff e atualização da CSP desktop; não foram executados testes funcionais nem aceite visual.

## Pergunta opcional nas escolhas

- Pergunta/contexto é explicitamente opcional na escrita, inclusive nos blocos existentes. Texto vazio, espaços ou uma quebra de linha sem texto não produzem título na apresentação.
- A leitura do livro oculta o campo vazio, seu rótulo de escolha no perfil de roteiro e o separador anterior à opção canônica. O caminho canônico existente continua sendo usado.
- A prévia de cena apresenta as opções imediatamente quando não há pergunta, sem o cabeçalho genérico Escolha, texto substituto ou espaço reservado ao campo. Perguntas preenchidas mantêm a animação de texto existente.
- O player HTML exportado também omite a pergunta vazia e restaura a área de texto para os próximos blocos. O histórico não inventa perguntas, e a exportação Markdown não cria um título substituto.
- A simulação do mapa omite a pergunta vazia; os resumos de edição identificam esse caso como Somente opções em vez de tratá-lo como uma pergunta pendente.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem revisão visual no navegador.

## Autoencaixe no espaço visível do editor

- O contêiner do livro usa a largura útil de `.editor-area` em pixels, descontando o espaço da barra vertical e o padding. Essa medida é convertida para a escala do documento uma única vez; a largura percentual dentro do contêiner com zoom foi removida.
- A folha é centralizada nesse contêiner, com margens simétricas para ambientação e controles narrativos. A largura mínima de conteúdo permanece apenas para a folha e essas margens quando o zoom manual exige rolagem horizontal.
- Alterações de largura do editor atualizam o contêiner durante a abertura, o fechamento e o redimensionamento dos painéis. O autoencaixe limpa o deslocamento horizontal também quando o percentual efetivo não muda. O zoom escolhido pelo usuário e a opção de encaixe continuam usando as preferências existentes.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais. A inspeção do navegador foi impedida pela política de acesso a URLs `file:`, portanto a revisão visual continua pendente.

## Auto no seletor de zoom

- A opção Auto integra o seletor de percentuais e substitui o botão Encaixar. O percentual efetivo aparece na dica do seletor, mantendo Auto como valor selecionado durante os ajustes.
- Escolher um percentual ou usar os botões de aumentar/diminuir ativa o zoom manual. Esses botões partem da escala efetivamente exibida, inclusive quando Auto está selecionado. As preferências existentes são preservadas.
- Auto permanece disponível para o modelo Livro; na Prancheta a opção fica desabilitada, mantendo os percentuais manuais.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Sem testes funcionais nem revisão visual no navegador.

## Diagramas na folha e escrita limpa

- O contêiner e a prévia Mermaid usam fundo transparente e não têm borda externa. O SVG também recebe fundo transparente, inclusive em prévias já salvas. As formas, conexões e cores internas do diagrama permanecem parte do desenho; a fonte continua com seu fundo de edição.
- Escrita limpa é um botão independente ao lado do modo Zen, com rótulo acessível, estado pressionado e preferência local persistida. Oculta na folha as decorações de autoria, marcadores, trilhos de sequência, controles contextuais, linhas de pausa, indicação de quebra de página e faixa de ambientação. Também oculta a contagem de palavras e o acesso flutuante da biblioteca na área de escrita.
- O texto continua editável, todas as opções e ramificações continuam disponíveis na escrita, e os nomes de personagens no perfil Roteiro são preservados. A opção não ativa o modo de leitura nem escolhe um caminho canônico. A checagem ortográfica, os controles de edição e os avisos de salvamento/permissão permanecem disponíveis.
- Ativar fecha propriedades de trechos abertas e atualiza o layout/paginação. Desativar mostra novamente os indicadores. As alterações são de apresentação e preferência local; não apagam metadados nem configurações de ambientação.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Sem testes funcionais nem revisão visual no navegador, cujo acesso à página local file: está bloqueado pela política do navegador.

## Tradução em área dividida

- Ir localiza e destaca a linha na prévia traduzida visível (ou no original quando a prévia está desativada), mantendo a área Tradução. Pode abrir a divisão em telas com espaço suficiente. Em telas estreitas, destaca o original da própria linha no painel, sem trocar para Escrever. Não coloca o cursor de edição no documento original.
- Quando a linha está em outro ramo ou versão, o destaque pode revelar a opção/versão apenas na cópia de prévia. Não altera o caminho canônico, as opções ou os dados do documento.
- O autoencaixe verifica a folha realmente visível no contêiner. O original oculto durante a prévia de idioma não bloqueia mais o cálculo. Abrir/fechar a prévia e mudar o layout da divisão também agendam o ajuste; percentuais manuais continuam respeitados.
- O cabeçalho redundante Tradução/Escrever foi removido da apresentação. A barra principal reúne idioma, Prévia/Sair da prévia e Opções; a busca ocupa uma linha própria. Conteúdo, situação, Projeto, Glossário, idiomas e CSV ficam no menu Opções existente, que usa a camada de popovers fora da área de rolagem.
- A faixa de informação da prévia permite quebra de linha, evitando que suas informações ampliem a largura necessária do editor.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Sem testes funcionais nem revisão visual no navegador; o acesso à URL local file: está bloqueado pela política do navegador.

## Persistência dos campos de tradução e prévia em tempo real

- Corrigida a substituição de `record.localization` a cada leitura: a memória de tradução e a prévia podiam recriar esse objeto depois de a lista capturar suas referências. Os campos então gravavam em uma cópia desconectada do registro, fazendo o texto desaparecer na renderização seguinte e não chegar ao salvamento/prévia.
- Os estados já normalizados são identificados por um WeakSet local à sessão. O acesso retorna o mesmo estado editável; dados recém-carregados são normalizados uma vez. `normalizeLocalizationData` continua produzindo cópias independentes quando chamado por `makeRecord`, preservando o isolamento entre documentos e cópias de conflito.
- Cada evento de edição resolve o documento atual e o dicionário do idioma antes de escrever, em vez de gravar no dicionário capturado pela renderização. A situação da linha e o progresso também consultam o estado atual. Eventos de campos pertencentes a outro documento ou a um idioma removido são ignorados.
- A atualização de prévia agendada a cada entrada e o fluxo existente de salvamento passam a ler a mesma tradução recém-editada. Limpar um campo remove a tradução desse registro e mantém o comportamento de usar o original.

Conferência de sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais nem revisão visual no navegador; o acesso à página local file: permanece bloqueado pela política do navegador.

## Superfície de tradução e fidelidade da prévia

- O painel de tradução usa uma única margem interna. Foram removidos fundo, borda e arredondamento do contêiner interno; as linhas usam separadores horizontais em vez de cartões dentro de outro cartão. Os campos editáveis preservam seus limites e a lista continua com rolagem própria.
- A cópia da folha deixa de remover a ambientação. O renderizador da faixa mede e desenha na folha visível, incluindo a prévia de idioma, respeitando texturas, rótulos e configurações por sequência. A cache do desenho distingue cada faixa/cópia recém-criada e a escrita limpa continua ocultando a faixa nas duas visualizações.
- IDs internos dos SVGs são isolados por cópia em vez de apagados. Referências locais de estilo, filtros, marcadores, href e descrições acessíveis acompanham os novos IDs, preservando a aparência dos diagramas sem duplicar IDs com o original oculto.
- O banner da prévia não é inserido acima da folha na área Tradução, onde idioma, estado da prévia e progresso já aparecem nos controles. Isso mantém o alinhamento vertical com a leitura original.
- A área do editor reserva espaço de scrollbar somente quando necessário. O botão da biblioteca usa a borda do contêiner e desconta a largura da barra vertical apenas se houver rolagem vertical. Mudanças de tamanho do contêiner da folha também atualizam sua posição.

Conferência de sintaxe JavaScript dos módulos alterados, diff e atualização da CSP desktop. Sem testes funcionais nem revisão visual no navegador, cujo acesso à URL local file: está bloqueado.

## Estabilidade do Auto quando a barra de rolagem alterna

- A gravação fornecida mostra a prévia alternando continuamente de escala, com barras vertical/horizontal entrando e saindo. O Auto podia reduzir a folha ao surgir a barra vertical, crescer ao recuperar essa largura e provocar novamente a barra.
- Para uma mesma geometria externa do editor, o Auto conserva a menor largura útil observada durante o ajuste. O desaparecimento da barra provocado pelo próprio encaixe não aumenta novamente a escala. A largura do contêiner continua seguindo o espaço real, sem reservar uma barra inexistente, mantendo folha centralizada e botão da biblioteca na borda.
- Alterações reais de largura/altura do editor, documento, área de trabalho, tamanho do papel, margens laterais do contêiner ou preferência de zoom iniciam um novo cálculo. Selecionar Auto novamente também libera o limite anterior. O limite é temporário e não é salvo como preferência de zoom.
- O observador considera a geometria externa e a largura útil, distinguindo redimensionamentos reais da mudança de largura causada apenas pela barra.

A gravação foi inspecionada por quadros para identificar o ciclo. Conferência da alteração: sintaxe JavaScript, diff e atualização da CSP desktop. Não foram executados testes funcionais após a alteração nem revisão no navegador, cujo acesso à página file: está bloqueado.

## Evolução da Cena — fatias acordadas

A composição pertence à sequência e evolui conforme os blocos avançam. A ordem acordada é: (1) proporções/enquadramento; (2) elementos e posicionamento livre; (3) evolução por blocos; (4) animações; (5) regiões e objetos interativos; (6) parallax; (7) acabamento e compartilhamento do player; (8) perfil e-ink; (9) orientação e compatibilidade Kindle validada em aparelho; (10) apresentação real do HeartSpace usando as ferramentas. As fatias 1, 2 e 3 estão aplicadas abaixo; as seguintes continuam pendentes.

### Fatia 1 — tela de apresentação e proporções

- Tela da cena oferece Livre, 16:9 (1280 × 720), 4:3 (1024 × 768), 9:16 (720 × 1280), 1:1 (1080 × 1080) e Personalizado. Dimensões personalizadas são inteiras entre 320 e 4096 por eixo. Valores incompletos/inválidos durante a digitação não são gravados.
- O formato é global ao jogo/projeto, em `project_narrative_registry.scene_settings.viewport` e `story.viewport` nas exportações, com `aspect`, `width` e `height`. O cache local guarda a mesma configuração. O campo antigo `presentation.viewport` é lido apenas para migração: na ausência de configuração geral, adota-se uma única vez o primeiro formato fixo encontrado na ordem dos documentos; na ausência dele, Livre. Trocar de sequência nunca escolhe outro formato.
- `createViewport` compartilha a mesma tela lógica e o cálculo de escala na amostra da aba Cena, no teste narrativo e no HTML exportado. Em formatos fixos, reduz/amplia o conjunto proporcionalmente, centralizado entre margens escuras; fundo, retrato e diálogo usam as dimensões lógicas, sem deformar ou recompor a cena por causa do tamanho da janela/painel. Em Livre, conserva o layout responsivo existente.
- A apresentação fixa compartilha medidas de diálogo e retratos entre amostra, teste e player. Regras de retrato para janelas móveis não mudam a composição fixa. Conteúdo extenso da caixa pode rolar dentro dela, mantendo os limites da tela.
- A área segura marca os 90% centrais (5% de margem de cada lado). É uma guia opcional da amostra e do teste, sem eventos de ponteiro, salva em preferência local e ausente da exportação. Continua ajustável para quem pode visualizar mas não editar o projeto.
- Redimensionamentos e mudanças de sequência atualizam a escala; o observador acompanha também mostrar/ocultar o player, evitando deixar uma tela vazia ao retornar ao menu. O pacote exportado preserva o formato e usa o mesmo módulo portátil, sem dependências externas novas.
- Corrigido também o caminho de gravação dos controles da Cena: a leitura de controles recebia a apresentação diretamente, evitando uma segunda normalização da lista de sequências que desconectava o objeto a ser alterado. Isso permite persistir o formato e os demais ajustes existentes da cena.

Conferência de sintaxe JavaScript dos arquivos alterados, diff e atualização da CSP desktop. Não foram adicionados nem executados testes funcionais. Revisão visual pendente: a política do navegador bloqueia o acesso à página local file:. As fatias 4–10 continuam pendentes.


### Fatia 2 — composição e posicionamento livre

- Elementos da cena reúne imagens importadas, personagens da biblioteca e textos, por sequência, em `presentation.elements`. A lista mostra as camadas da frente para o fundo e permite adicionar, selecionar, duplicar, remover, ocultar e reordenar. Limite de 80 elementos por composição; o nome e o conteúdo de texto são tratados como texto, sem HTML executável.
- Cada elemento salva posição e tamanho em porcentagens da tela lógica, escala, rotação, opacidade, espelhamento por eixo e âncora ajustável. Personagens mantêm vínculo com o retrato da biblioteca; imagens passam pelo otimizador/validador existente. Textos oferecem cor, tamanho e alinhamento. Imagens oferecem encaixe inteiro, recorte para preencher, tamanho original e foco por eixo.
- Na amostra, arrastar move; o quadrado no canto altera a escala; o círculo acima gira; o ponto dourado muda a âncora preservando a posição visual da arte. Há campos numéricos para todos os ajustes, atalhos de posição Esquerda/Centro/Direita, seleção pela lista e movimento com setas (Shift amplia o passo). Campos incompletos/inválidos não são gravados. Guias e alças pertencem apenas ao editor.
- Uma manipulação grava ao soltar o ponteiro; cancelamento restaura o estado persistido. Edições/importações confirmam projeto, documento, sequência e permissão antes de gravar. Leituras do estado não mantêm referências de sequência antigas, pois a normalização existente recria esses objetos.
- `createScene` desenha os mesmos elementos na amostra, no teste e no HTML exportado. A exportação ZIP inclui e deduplica as imagens dos elementos; os personagens referenciados só pela composição também entram no registro exportado. Elementos sem imagem/retrato geram aviso na revisão da exportação.
- Mostrar caixa de diálogo pode ser desativado para composições de apresentação. Oculta personagem/texto narrativo e o fundo da caixa, preservando escolhas, avanço, histórico e mensagens de fim/erro. O texto narrativo oculto não cria uma espera de digitação. Um personagem colocado explicitamente na composição substitui o retrato automático enquanto estiver visível; os atalhos antigos continuam disponíveis nas cenas sem personagem explícito.
- O formato global usa um cache pequeno independente dos retratos, com marcação de alterações pendentes. Recarregar o registro não substitui um formato ainda não sincronizado. Escritas do registro são enfileiradas, e respostas de outro projeto são descartadas. A migration `website/supabase/migrations/20261114000100_docs_game_scene_settings.sql` adiciona o campo global; até sua publicação, o formato fica local e a sincronização dos demais registros continua pelo esquema anterior, com aviso.
- A composição da fatia 2 é estática; a evolução por blocos foi adicionada na fatia 3 abaixo. Animações, hotspots e parallax continuam nas próximas etapas. Textos de elementos ainda são conteúdo direto da composição, fora dos campos de tradução dos blocos narrativos.

Conferência de sintaxe JavaScript dos módulos e do script do editor, diff e atualização da CSP desktop. Não foram adicionados nem executados testes funcionais. Revisão visual pendente devido ao bloqueio de acesso à página local file: pela política do navegador. A migration foi preparada, sem aplicação no banco remoto.


### Fatia 3 — evolução da cena por blocos

- Cena oferece Momento da cena: Início da sequência ou qualquer bloco existente, com navegação anterior/próximo e marcação dos blocos que têm alterações. A prévia mostra a composição e o texto/personagem desse ponto. Alterações de cenário, música, caixa de diálogo, textos e elementos passam a valer no bloco selecionado e nos seguintes. O formato da tela continua global ao jogo e não entra nessas alterações.
- A composição inicial permanece em `presentation`; `presentation.cues` guarda alterações por `block_id`: propriedades de apresentação, patches dos elementos, remoções, ordem de camadas e uma opção de restauração. São guardadas apenas as propriedades modificadas, permitindo que mudanças anteriores continuem sendo herdadas. Imagens sem alteração não são copiadas em cada bloco. Até 1000 momentos por sequência, com aviso no editor ao atingir o limite.
- Herdar anterior remove as alterações do bloco selecionado. Restaurar início ignora as alterações anteriores naquele ponto e reaplica a composição inicial; o produtor pode continuar ajustando esse estado. Os próximos blocos herdam o resultado normalmente. Cada nova sequência parte de sua própria composição inicial.
- O vínculo usa o identificador estável do bloco, acompanhando sua reordenação. Alterações cujos blocos foram removidos não são executadas; o editor e a revisão da exportação avisam e oferecem limpeza explícita. Isso permite recuperar o vínculo se o bloco for restaurado. Um ajuste parcial de um elemento apagado da composição inicial não recria uma imagem vazia.
- `resolveScene` é compartilhado pela amostra, teste e player HTML. A composição é calculada desde o início até o bloco atual, sem acumular efeitos de renderização. Voltar etapa no teste, reiniciar e retomar um progresso salvo recompõem o estado correspondente. Pausas e sinais preservam o retrato automático do diálogo anterior na mesma sequência; personagens posicionados explicitamente continuam obedecendo à composição.
- O editor confirma projeto/documento/sequência/momento/permissão ao gravar, inclusive depois de uma importação de mídia. A navegação entre momentos é permitida para quem só pode visualizar. Os dados dos blocos e o estado resolvido ficam em cache durante manipulações da composição, evitando reler todo o documento a cada movimento do ponteiro.
- HTML e ZIP preservam os momentos. O ZIP empacota e deduplica também fundos, imagens e músicas adicionados em blocos posteriores. Personagens referenciados apenas nesses momentos entram no registro exportado. O estado salvo do player conserva posição e variáveis; o estado visual é derivado dessa posição e não precisa de uma segunda cópia no salvamento.
- A fatia usa mudanças imediatas de composição e as transições de mídia já existentes. Animação de propriedades e linha do tempo ficam na fatia 4. Textos de elementos continuam fora da tradução dos blocos narrativos. Não há nova migration: os momentos seguem no conteúdo narrativo dos documentos.

Conferência de sintaxe JavaScript do script do editor e dos módulos alterados, diff e atualização da CSP desktop. Não foram adicionados nem executados testes funcionais. Revisão visual não realizada: o acesso à página local file: permanece bloqueado pela política do navegador.
