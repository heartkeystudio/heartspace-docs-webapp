# HeartSpace Docs — direção do sistema narrativo

## Princípio

O documento é a fonte narrativa. Texto, diálogos, escolhas e ações formam um modelo semântico portátil. Escrita, leitura, mapa, sequência, simulação e código são projeções desse mesmo modelo; nenhuma delas mantém uma cópia independente do conteúdo.

## Regra de leitura e paginação

1. A projeção de leitura é a referência para quebra de linhas, altura do conteúdo e paginação.
2. Controles de produção, identificadores, expressões, destinos, condições, avisos e alças de arraste não participam do fluxo de layout da leitura.
3. Elementos exclusivos de produção devem viver em uma camada sobreposta, em uma margem editorial, em um inspetor flutuante ou na tela Narrativa.
4. Ocultar controles com `display: none` apenas no modo de leitura não resolve a paginação: eles também não podem ter sido considerados ao calcular as folhas durante a escrita.
5. Cada bloco semântico deve expor duas partes:
   - `reading projection`: conteúdo que aparece ao leitor e ocupa espaço;
   - `authoring decoration`: controles e metadados que não ocupam espaço na projeção final.
6. Ações sem conteúdo de leitura, como pausa, sinal e alteração de variável, usam marcadores de posição zero no texto e são editadas pelo inspetor ou pela sequência narrativa.
7. O documento poderá escolher uma apresentação narrativa:
   - `prosa`: diálogo integrado ao livro ou lore;
   - `roteiro`: personagem, rubrica e fala visíveis;
   - `jogo`: personagem, expressão e opções no formato de interface de diálogo.

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
9. Exportar a história como visual novel HTML antes da integração com engine. **Primeira fatia implementada:** arquivo HTML independente, sequência inicial selecionável, caminhos conectados entre documentos, idiomas com fallback explícito para o original, personagens, modelos e cores de apresentação por sequência, animação, teclado/clique/toque, escolhas, condições, efeitos, variações, pausas, conclusão e reinício. Prévia do Docs e exportação usam o mesmo motor em `narrative-runtime.js`. A exportação valida somente o grafo incluído, bloqueia destinos ausentes/ambíguos e regras inválidas e exclui documentos desconectados, credenciais e metadados de conta. Sinais de integração são ignorados com aviso. A próxima fatia adiciona progresso persistente, histórico de falas e preferências; depois entram fundos, retratos, transições e pacote de assets. Detalhes em [HTML_STORY_EXPORT.md](HTML_STORY_EXPORT.md).
10. Criar o primeiro adaptador de engine para Godot, mantendo o JSON genérico como contrato central. Esta integração fica por último nesta sequência.
