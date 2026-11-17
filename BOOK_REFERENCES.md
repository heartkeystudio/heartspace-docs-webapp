# Referências editoriais — fatia 4

## Sumário e lista de ilustrações

Em **Configurações da página → Composição do livro → Índices e notas**, ative
**Gerar sumário** e/ou **Gerar lista das imagens com legenda**. Veja o resultado
em **Ações → Prévia do livro**. Use **Atualizar** após mudar o conteúdo.

Os índices são opcionais. Entram depois do primeiro conjunto de páginas iniciais,
antes da primeira seção do corpo; se só houver páginas iniciais, entram ao final.
Não criam documentos na biblioteca e não mudam a ordem dos documentos existentes.
Participam da contagem das páginas iniciais e da determinação das aberturas pares
ou ímpares do corpo do livro.

- Sumário: prefácios, partes, prólogos, capítulos, epílogos e apêndices incluídos.
  Usa o título da seção e sua numeração de capítulo, quando habilitada.
- Lista de ilustrações: figuras com imagem e legenda preenchida, na ordem de
  leitura das seções incluídas. Descrição alternativa não substitui legenda.
  Escolhas e variações seguem o mesmo caminho canônico da composição.
- Cada entrada leva à folha correspondente. Os localizadores usam a numeração
  editorial, inclusive romanos; uma seção sem número mostra um travessão, mas
  continua acessível pelo link e por sua página física na lista de navegação.
- As páginas dos índices são paginadas antes do corpo. A coluna do localizador
  tem largura fixa: preencher os números após compor o livro não altera as quebras.
- Os índices são projeções somente de leitura; **Abrir seção** fica indisponível
  quando um índice gerado está selecionado.

Esta versão lista seções/documentos, sem níveis de subtítulos internos. Decorações,
notas de margem, pranchetas, documentos arquivados, na lixeira ou excluídos da
composição não entram nos índices.

## Notas de rodapé

Posicione o cursor em um trecho de texto comum do livro e use:

- **Ações → Nota de rodapé…**;
- **/ → Nota de rodapé**;
- **Ctrl + Alt + F**.

Se houver seleção, a referência entra depois do trecho selecionado, preservando-o.
O diálogo permite escrever, editar ou remover a nota. Clique na referência
sobrescrita ou no número no rodapé para reabrir. Em modo leitura, o mesmo diálogo
permite consultar a nota, sem salvar alterações. As referências também aceitam
Enter/Espaço pelo teclado.

O rodapé reserva espaço real na folha, separado do texto por um traço. O parágrafo
é repartido ou deslocado para respeitar essa área. Notas extensas continuam em
folhas seguintes, identificadas como continuação; o texto integral permanece na
fonte, sem recortes. As folhas de continuação também contam na composição e nos
índices. Quando muitas notas competem pela mesma folha, parte delas pode começar
na folha seguinte. A prioridade é manter o conteúdo acessível sem sobreposição.

O editor numera as referências do documento atual. Na composição do livro,
**Numeração das notas de rodapé** escolhe a contagem contínua entre as seções
incluídas (padrão), ou reinício em cada seção. O clique na referência da composição
leva ao rodapé; o clique no número do rodapé retorna à referência.

Nesta fatia as notas são texto simples, até 12.000 caracteres no diálogo. Inserção
em código, diagramas, imagens ou blocos narrativos interativos não é oferecida.
As notas de margem continuam destinadas a revisão e planejamento e não viram
notas publicadas do livro.

## Fonte e transporte

- `book-references.js` cuida da referência semântica, do diálogo, dos rodapés e
  das continuações. `book-pagination.js` consulta a reserva durante a medição.
- Fonte: `<sup data-book-footnote="ID" data-footnote-text="texto">n</sup>`.
  O ID acompanha o trecho; a numeração é recalculada. Cópias dentro do documento
  recebem IDs próprios. O texto é um atributo de dados, nunca HTML executável.
- Rodapés usam `data-book-generated="footnotes"` e são eliminados pela
  canonicalização antes de salvar, copiar a fonte lógica ou recompor páginas.
  Eles não criam uma segunda cópia autoral nem parágrafos vazios persistentes.
- `.hdocs`, cache, recuperação, modelos e nuvem preservam a nota pelo corpo HTML
  já existente. Não foi criado um novo depósito de notas ou mídias.
- Markdown exporta referências `[^ID]` e definições de texto simples ao final.
  A importação reconhece essas definições e continuações indentadas; não trata
  conteúdo das notas como HTML. O importador continua sendo um subconjunto de
  Markdown, sem formatação rica de notas ou interpretação completa de Markdown.
- A tradução oferece o texto da nota como entrada própria. O parágrafo usa
  `{{footnote:ID}}` para preservar a posição da referência na prévia. Se o marcador
  for omitido, a referência é mantida ao final e a tradução indica o problema.
- Preferências opcionais em `bookStyle.edition`: `contents:false`,
  `illustrations:false`, `footnoteNumbering:'book'|'section'`. Normalização e
  validação autoral aceitam os novos campos sem alterar a versão do contrato.

**Nenhuma migração SQL adicional.** Distribua os módulos web e o carregador
desktop juntos; o arquivo CSP acompanha a alteração do código principal.

## Conferências e próximos passos

Foram feitas revisão estática da integração e conferências de sintaxe, sem
adicionar ou executar testes. A paginação visual, a interação, a impressão e a
sincronização real ainda precisam de validação. A exportação editorial PDF/EPUB
e a prévia final de impressão da fatia 6 estão descritas em `BOOK_EXPORT.md`.
