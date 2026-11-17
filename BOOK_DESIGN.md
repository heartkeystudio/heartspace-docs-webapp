# Apresentação editorial — fatia 5

## Modelos do livro

Em **Configurações da página → Estilos e abertura**, ative os estilos e escolha
um **Modelo editorial**. Além dos três modelos anteriores, estão disponíveis:

- **Fantasia ilustrada:** Palatino, título em versaletes, florão, separadores de
  losango e legendas em itálico.
- **Contos:** texto de 18 px, abertura com pontos, separadores com asteriscos e
  ilustrações a 85% da área de texto.
- **Ensaio:** título sem serifa à esquerda, numeração romana de capítulos,
  separadores de traço e molduras suaves.
- **Livro ilustrado:** leitura arejada, abertura com losango e imagens largas.

O modelo aplica fontes, espaços e decoração ao livro inteiro. Os controles
continuam editáveis; mudar um ajuste torna a combinação personalizada. O idioma,
o nome da numeração e a composição existente (papel, margens, cabeçalhos,
contadores e índices) são preservados ao trocar o modelo. O conteúdo e a função
editorial dos documentos continuam sendo a fonte autoral existente.

### Ornamentos

O grupo **Ornamentos, separadores e ilustrações** oferece pontos, losango,
florão ou nenhum ornamento, com tamanho e espaço próprios. A decoração aparece
entre a numeração e o título nas aberturas de partes, prólogos, capítulos e
epílogos. Ela não aparece nos índices gerados ou nas páginas iniciais de capa,
rosto, créditos, dedicatória e prefácio.

O ornamento participa da medição da abertura. É uma projeção com
`aria-hidden="true"`, sem caracteres acrescentados ao título ou ao corpo salvo.
A escrita limpa o oculta na folha do editor; a composição editorial usa a
apresentação completa.

## Separadores de cena

Posicione o cursor no texto e use **/ → Separador de cena** ou
**Ações → Separador de cena…**. Há traço, pontos, asteriscos, losango e espaço em
branco. **Seguir o livro** acompanha a opção compartilhada do modelo; também é
possível escolher um desenho específico para aquele separador.

Clique no separador ou use Enter/Espaço com ele em foco para editar ou remover.
A inserção divide o parágrafo no cursor e mantém o trecho seguinte após o
separador. A edição participa do histórico existente e respeita as permissões
do documento. O separador indica uma mudança de cena, sem forçar uma nova folha. A paginação
procura mantê-lo junto do início do próximo trecho. A opção existente de suprimir
o recuo após títulos/separadores também vale no início dessa cena, inclusive
quando o parágrafo acaba em outra folha.

A fonte é um `div[data-book-separator]` com papel acessível de separador e rótulo
“Mudança de cena”. O desenho é gerado por CSS e não vira texto, palavra contada
ou entrada de tradução. Divisores `hr` antigos mantêm sua apresentação anterior.

## Ilustrações e legendas

Clique duas vezes em uma imagem do documento, selecione uma imagem e use
**Ações → Compor ilustração…**, ou abra **/ → Opções desta imagem → Composição
desta ilustração…** enquanto edita a legenda.

O diálogo permite:

- seguir o livro, manter a imagem junto ao texto ou usar uma **folha exclusiva**;
- largura de 20 a 100% da área de texto, ou largura compartilhada;
- alinhamento à esquerda, centro ou direita, ou padrão do livro;
- moldura fina, suave, nenhuma, ou padrão do livro;
- posição e alinhamento da legenda, texto da legenda e descrição da imagem.

No estilo compartilhado há também tamanho e distância das legendas, normal ou
itálico, e espaço em torno das ilustrações. A apresentação editorial usa a imagem
inteira, com ajuste proporcional dentro da área disponível. **Estilos livres**
permite continuar usando banner e cantos arredondados. Escolher um dos comandos
antigos de estilo de imagem ativa essa apresentação livre para a imagem.

A folha exclusiva reúne imagem e legenda, ajusta a altura à área útil e centra o
conjunto verticalmente. O texto anterior e o seguinte permanecem em outras folhas.
A abertura da seção pode ocupar sua própria folha antes da ilustração. A folha
reservada participa da contagem editorial e da lista de ilustrações da fatia 4.
O parágrafo vazio de continuação permanece disponível na escrita; sozinho ao fim
de uma ilustração exclusiva, não cria uma folha vazia na leitura/composição.
Quebras explícitas de página continuam valendo.

A legenda existente mantém sua formatação quando seu texto não muda no diálogo.
Editar seu texto por esse diálogo substitui a legenda por texto simples; os
controles do editor continuam disponíveis para formatá-la depois. Uma legenda
muito extensa, que exceda sozinha a área útil, mantém o limite de rolagem interna
previsto para blocos indivisíveis. Esta fatia não compõe imagens flutuantes com
texto contornando-as, páginas sangradas ou ilustrações divididas entre duas folhas.

## Fonte e integração

- `book-design.js`: decoração, controles de separador/ilustração e preparação de
  medidas derivadas; `book-typography.js`: modelos e estilos compartilhados;
  `book-pagination.js`: folhas de ilustração e medição com legendas/notas.
- `bookStyle.design` é opcional, com `schema_version:1`. Livros existentes sem
  esse campo mantêm sua apresentação até receberem ajustes ou um novo modelo.
- Campos compartilhados: `openingOrnament`, `ornamentSize`, `ornamentSpace`,
  `separator`, `separatorSpace`, `illustrations`, `illustrationWidth`,
  `illustrationAlign`, `illustrationFrame`, `illustrationSpace`, `captionSize`,
  `captionSpace`, `captionFont`. Normalização e validação autoral conferem tipos,
  enumerações e limites.
- A ilustração salva sua intenção no `figure[data-docs-image]` existente:
  `data-book-illustration="inherit|inline|page|original"`, largura opcional em
  `data-illustration-width`, alinhamento em `data-illustration-align` e moldura
  em `data-illustration-frame`. Descrição, legenda e seus alinhamentos usam os
  campos existentes. Recursos locais/compartilhados não são duplicados.
- A fonte `.hdocs`, cache, recuperação, cópias, modelos e nuvem usam os mesmos
  contratos de corpo HTML e `bookStyle`. O transporte compartilhado do livro
  preserva `design` junto dos estilos. **Nenhuma migração SQL adicional.**
- Markdown preserva os estilos em `book_style`. Separadores usam metadados
  `heartspace-scene-break` e uma quebra `***` legível em outros leitores; os
  ajustes por imagem usam `heartspace-illustration` antes do bloco de imagem
  existente. A importação restaura a intenção e aceita `***` como separador.
- Ornamentos, marcadores de folhas e variáveis de medidas das figuras são estado
  visual. A canonicalização remove as projeções antes de serializar a fonte.
- A prévia traduzida conserva ornamentos e posições das imagens; a legenda e a
  descrição continuam no mesmo elemento. O texto da legenda participa da
  tradução existente; a descrição alternativa permanece a original.
- O carregador desktop inclui o novo módulo e sua política CSP acompanha o
  código principal. Distribua os arquivos web e desktop juntos.

## Conferências e limites

Foram feitas conferências de sintaxe e revisão estática da integração. Não foram
adicionados nem executados testes. A paginação visual, os controles, a importação
e a sincronização real ainda precisam de validação em ambiente de uso.

A fatia 6 acrescenta prévia final e exportação editorial PDF/EPUB; consulte
`BOOK_EXPORT.md` para uso e limites de cada saída.
