# HeartSpace · Uma ideia ganha mundo

Apresentação interativa em português, preparada com o mesmo formato narrativo e o mesmo player exportado pelo Docs. O percurso guiado tem oito sequências e leva aproximadamente três minutos, conforme o ritmo de leitura; os caminhos de exploração podem ser revisitados.

## Apresentar ou compartilhar

- **heartspace.html:** apresentação completa em um único arquivo. Abra no navegador; use Começar.
- **heartspace.zip:** pacote com index.html e mídias separadas. Extraia antes de abrir ou publique a pasta completa.
- **F:** tela cheia. **H:** alternar a interface. Menu oferece histórico, leitura, som, orientação e informações do navegador.
- **Menu → Opções de leitura e som:** perfil e-ink, tamanho de texto e orientação de leitura. A validação em Kindle físico continua pendente, com Kindle de 11ª geração informado como alvo.

O percurso guiado passa por ideia → planejamento → Canvas → composição → escolhas → compartilhamento → futuro → créditos. Em “Escolha seu caminho”, os botões da cena levam a Docs, Canvas e composição; a lista textual permite os mesmos destinos, incluindo continuar para compartilhamento. Os créditos oferecem encerramento, exploração e retorno ao começo.

## Criar uma cópia editável no Docs

1. Recarregue o Docs e abra **Novo documento** pelo botão **+** da Caixa de entrada.
2. Escolha **Apresentação HeartSpace · exemplo editável** e clique **Criar apresentação**.
3. O Docs cria um novo livro com **Uma ideia ganha mundo · roteiro** e **Produção e créditos**, além do planejamento compartilhado do livro.
4. Na Cena, selecione **A ideia** e use **Testar sequência**. Em História → Mapa, veja os caminhos. Edite os textos, escolhas, elementos, momentos e animações pelos controles existentes.
5. O exemplo foi composto para **16:9**. A cópia respeita o formato atual do projeto. Alterar **Tela do jogo** afeta todas as sequências desse projeto; para uma apresentação isolada, use um projeto dedicado em 16:9.
6. Use **Exportar** a partir de **A ideia** para gerar sua versão com todos os caminhos.

Cada criação usa novos IDs de livro, documento e sequência. Não substitui conteúdo existente e não altera o formato global do projeto. Requer permissão de edição e espaço no armazenamento local. Em projetos conectados, os dois documentos seguem o fluxo normal de sincronização. As artes só são carregadas quando o exemplo é solicitado.

## Origem dos materiais

| Parte | Origem |
| --- | --- |
| Roteiro e planejamento | Conteúdo original, modelado com sequências, escolhas e planejamento do Docs |
| Composição, animações e parallax | Elementos e momentos da Cena, usando o módulo nativo compartilhado |
| Três camadas PNG | Documentos Draw e exportador PNG do HeartSpace Canvas |
| Projeto de arte | `canvas/heartspace-art.hcs` e a pasta `canvas/heartspace-art_assets` |
| Formas vetoriais de origem | `canvas/backdrop.svg`, `paper-world.svg` e `constellation.svg` |
| HTML e ZIP | Exportadores oficiais `narrative-html.js` e `narrative-package.js` |
| Som | Sem trilha ou efeitos. Beats é mencionado como direção futura |

A arte foi construída por um script de produção usando as classes reais de documento, camada, salvamento e exportação do Canvas. Não foi desenhada manualmente pela UI nesta sessão. O projeto `.hcs` mantém cada imagem como um Canvas com camada raster editável; os SVGs e o gerador preservam as formas originais. As formas vetoriais não são anunciadas como objetos vetoriais editáveis dentro do arquivo raster.

`heartspace.story.json` contém os dados da exportação; `planning.json` é a fonte de referência do planejamento. A cópia nativa no editor é criada pelo template. Esses JSONs não anunciam um importador genérico que o Docs ainda não tem.

## Reconstruir os materiais

Na raiz do repositório Docs, com Godot disponível:

```bash
godot --headless --path ../canvas/godot-project \
  --script "$PWD/examples/heartspace/canvas/build-art.gd" \
  -- "$PWD/examples/heartspace"
node scripts/build_heartspace_presentation.cjs
```

O primeiro comando utiliza o projeto Canvas existente para salvar a fonte e exportar os PNGs. O segundo recompõe o módulo de assets do template, JSON, HTML e ZIP usando os exportadores atuais do Docs. Para alterar a narrativa ou as composições do exemplo distribuído, edite `heartspace-showcase.js` e execute o segundo comando.

Não há dependências novas, hospedagem, envio a terceiros ou uma segunda engine. Os artefatos foram gerados e a sintaxe foi conferida. A navegação visual/funcional no browser e a execução no Kindle não foram validadas nesta sessão; o acesso automatizado à página local permanece bloqueado.
