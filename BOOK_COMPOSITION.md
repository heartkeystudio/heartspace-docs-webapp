# Composição do livro — fatias 3 a 5

## Uso

Abra **Configurações da página → Composição do livro** em uma seção do livro.
O comando **Ações → Prévia do livro** abre a mesma prévia e também pode ser usado
em modo leitura. Documentos avulsos compõem apenas suas próprias páginas.

A prévia reúne o conteúdo original das seções, na ordem atual da biblioteca.
Não reorganiza as seções pela função editorial. Anotações, pranchetas,
arquivados, itens da lixeira e seções desmarcadas não entram na composição.
Mude a ordem pela árvore da biblioteca e use **Atualizar** na prévia.

### Função desta seção

- Capa, folha de rosto, créditos, dedicatória, epígrafe e prefácio são páginas
  iniciais, com contagem separada do corpo do livro.
- Parte, prólogo, capítulo, epílogo e apêndice pertencem ao corpo.
- **Incluir na composição** permite retirar uma seção da prévia sem excluí-la.
- **Mostrar título e abertura** controla o cabeçalho autoral nesta composição.
- **Começar em** permite a próxima página, a página da direita (ímpar física)
  ou a página da esquerda (par física). Quando necessário, a composição insere
  uma página em branco. Isso não cria um novo documento nem texto autoral.
- **Números desta seção** segue a função editorial, escolhe arábicos/romanos ou
  oculta o número. Ocultar o número não retira a página da contagem.

Fontes anteriores sem função explícita continuam sendo capítulos, com início
na página da direita. A classificação muda apenas a apresentação editorial;
o documento mantém o mesmo ID, conteúdo, agrupador e tipo autoral. A numeração
automática dos capítulos passa a contar somente as seções da função capítulo.
Marcar um capítulo como excluído da composição não altera sua identidade nem
sua posição na numeração autoral dos capítulos.

### Papel e margens

O livro compartilha tamanho do papel (A5, A4 ou Carta), orientação e quatro
margens. Nas páginas da direita, a margem interna fica à esquerda; nas páginas
da esquerda, fica à direita. Desativar o espelhamento mantém a primeira medida
à esquerda e a segunda à direita.

Esses ajustes pertencem à composição do livro inteiro. A folha de escrita de
cada documento continua usando seus controles de papel existentes. O texto é
repaginado com o papel da composição, os estilos compartilhados e a abertura de
cada seção. Uma abertura maior que a área útil produz uma mensagem para ajustar
os espaços ou o papel, em vez de recortar silenciosamente o título.

### Números e cabeçalhos

Há dois contadores: páginas iniciais e corpo. Ambos têm primeiro número
configurável. As páginas iniciais usam romanos por padrão; o corpo usa arábicos.
Os contadores seguem as funções editoriais, inclusive se as seções estiverem
intercaladas na biblioteca. Valores romanos acima de 3.999 aparecem em arábicos.

A numeração pode ficar no canto externo ou no centro. Capa, folha de rosto e
créditos ocultam os números quando seguem a função editorial. A opção de ocultar
nas aberturas remove cabeçalhos e números da primeira página que mostra título.
Páginas em branco de alinhamento nunca mostram cabeçalho nem número, mas contam
no grupo da seção anterior (ou no grupo da primeira seção, quando não há anterior).

Cabeçalhos: nenhum; livro à esquerda e seção à direita; título da seção em ambos
os lados; ou textos personalizados para esquerda e direita. Textos longos são
abreviados visualmente no espaço disponível, sem alterar os valores salvos.

### Navegação e zoom

- Página única ou páginas duplas. A primeira página física aparece à direita;
  o espaço vazio à esquerda não conta como página.
- **Auto** encaixa a largura da página ou do par de páginas na área da prévia.
  Escolher uma porcentagem mantém essa escolha ao redimensionar a janela.
- A lista de seções informa os intervalos de páginas físicas e leva à seção.
- **Abrir seção** retorna ao documento escolhido. A prévia é somente leitura.
- A composição é um retrato do conteúdo no momento da abertura/atualização.
  Ações de editar continuam respeitando as permissões existentes.

## Fonte, sincronização e recursos

- `book-composition.js` monta a projeção e usa `book-pagination.js` para medir e
  dividir os parágrafos. `book-typography.js` fornece a mesma apresentação de
  estilos e aberturas usada pelo editor.
- Ajustes compartilhados: `bookStyle.edition`, objeto opcional com
  `schema_version:1`. Um livro sem estilos de texto pode guardar sua composição
  sem ativar o modelo tipográfico. Trocar o modelo tipográfico preserva `edition`.
- Função da seção: `record.bookSection`, opcional/nulo ou
  `{schema_version:1,role,start,numbering,include,showHeading}`.
- `.hdocs`: `books[].bookStyle.edition`, ou
  `documents[].typography.bookStyle.edition` para avulsos, e
  `documents[].editorial.bookSection` para a função da seção.
- Documento remoto: `content.appearance.book_style.edition` e
  `content.editorial.book_section`. Livros usam o transporte compartilhado de
  `bookStyle` já existente.
- Markdown: `book_style` e `book_section`. Cache, modelos e cópias preservam
  os metadados. A validação rejeita versões ou valores incompatíveis.
- Páginas, contadores resolvidos, posições de cabeçalhos, quebras calculadas e
  imagens preparadas para a prévia não viram uma segunda fonte autoral.
- Imagens são resolvidas pelos mesmos identificadores locais/compartilhados;
  URLs temporárias são liberadas ao fechar ou atualizar. Uma imagem indisponível
  aparece como marcador e é informada no resumo da composição.
- A prévia usa o caminho canônico de leitura das escolhas/variações narrativas
  e prepara os diagramas existentes. Não aplica traduções nem publica conteúdo.

Os campos são opcionais no esquema autoral v1 e usam os contratos JSON
existentes. **Esta fatia não acrescenta migração SQL.** Atualize os arquivos web
e o carregador/recursos desktop em conjunto, inclusive `ops/desktop-csp.txt`.

## Limites e conferências

A composição é uma prévia editorial do livro inteiro. A fatia 4 acrescenta
sumário, lista de ilustrações e notas de rodapé, descritos em `BOOK_REFERENCES.md`.
A fatia 5 acrescenta modelos, ornamentos, separadores de cena e ilustrações em
folha exclusiva, descritos em `BOOK_DESIGN.md`. Exportação PDF/EPUB e prévia de
impressão final ficam na fatia 6. Decorações de ambientação e notas de margem
não são incorporadas a esta prévia editorial. Tabelas e blocos complexos mantêm os limites da fatia 2:
permanecem indivisíveis, com rolagem interna se excederem a área útil.

Foram feitas conferências estáticas de integração e sintaxe. Não foram
adicionados ou executados testes. Paginação visual, interação e sincronização
em ambiente real ainda precisam de validação.
