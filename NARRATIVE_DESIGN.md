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
