# Projeto gráfico do livro — fatias 1 e 2

## Uso

No capítulo, abra **Configurações da página → Estilos e abertura**.

- **Usar estilos compartilhados** ativa o projeto gráfico do livro que contém o
  capítulo. Desmarcar preserva os ajustes para reativá-los depois. Em documentos
  avulsos, o estilo pertence ao próprio documento.
- Modelos: **Romance clássico**, **Leitura arejada** e **Contemporâneo**.
- **Corpo do texto**: família de fonte, tamanho, entrelinha e alinhamento.
- **Parágrafos**: espaço entre blocos, recuo da primeira linha, exceções após
  títulos/separadores, idioma e hifenização do navegador.
- **Abertura do capítulo**: fonte, tamanho, alinhamento, versaletes, espaços acima
  da abertura, entre número/título e antes do texto, apresentação da numeração.
- **Este capítulo**: ativar a abertura, editar o título, escolher numeração
  automática, manual ou ausente e substituir o alinhamento do título.

O título é o mesmo campo autoral usado no documento e na árvore. O número é uma
projeção independente: nunca é inserido no corpo nem concatenado ao título salvo.
A árvore mostra o número antes do nome quando a abertura está ativa.
A numeração automática segue a ordem atual dos documentos no livro, excluindo
anotações, documentos de prancheta, arquivados, excluídos e os marcados **Sem
número**. Documentos antigos contam na ordem, mesmo com a abertura desativada.
Números manuais são substituições individuais e não reiniciam a contagem dos
seguintes. Avulsos usam o número escolhido enquanto não pertencem a um livro.
A apresentação romana usa algarismos arábicos acima de 3.999.

Novos livros começam com Romance clássico; novos capítulos em livros começam
com abertura e numeração automática, inseridos após os capítulos existentes. Livros e documentos anteriores sem os novos
campos preservam sua apresentação até que o usuário ative as opções. Títulos
que já estavam escritos no corpo permanecem como conteúdo; esta fatia não os
transforma ou remove automaticamente.

O campo anterior **Distância até o texto**, quando preenchido, substitui a
medida compartilhada somente naquele documento. Limpar o campo/restaurar o padrão
volta a seguir o estilo do livro. O alinhamento pela barra de edição cria uma
substituição no título atual; **Seguir estilo do livro** remove a substituição.
Formatação explícita no HTML, como cores e alinhamentos de parágrafos, tem
precedência sobre o estilo herdado.

Os ajustes são aplicados ao editor e à leitura e acompanham a prévia traduzida.
A folha continua centralizada e o zoom mantém o contrato existente. O cabeçalho
participa da medição da primeira folha, sem criar páginas físicas como entidades.
As famílias de fonte usam alternativas locais; a aparência exata depende das
fontes disponíveis. Hifenização depende do suporte e dos dicionários do navegador.

## Fonte e transporte

- Módulo: `book-typography.js`, sem rede ou armazenamento próprio.
- Livro no editor e no transporte de livros: `bookStyle` opcional/nulo ou objeto
  com `schema_version:1`.
- `.hdocs`: `books[].bookStyle` e, para a apresentação local de um documento
  avulso, `documents[].typography.bookStyle`.
- Abertura: `record.chapterHeading` / `documents[].typography.chapterHeading`.
  Formato: `{schema_version:1, enabled:boolean, numbering:'auto'|'custom'|'none',
  number:1..9999, alignment:null|'left'|'center'|'right'|'justify'}`.
- Documento remoto: `content.appearance.book_style` e
  `content.page.chapter_heading`. O livro real é a autoridade do estilo
  compartilhado; um documento não substitui seu projeto gráfico ao sincronizar.
- Cache, recuperação, revisão, cópias e modelos mantêm os campos. Markdown guarda
  `book_style` e `chapter_heading` em seus metadados; importar um capítulo para
  um livro existente preserva a autoridade do estilo desse livro.

Campos opcionais mantêm o esquema autoral v1. Valores e versões desconhecidas
são rejeitados para preservar a fonte. As medidas têm intervalos limitados e as
fontes vêm de uma lista fixa. Os novos campos usam os contratos JSON existentes:
**esta fatia não acrescenta migração SQL**. É preciso atualizar os recursos web e
os recursos carregados pelo desktop juntos.

O livro sincroniza pelos recibos, controle de versão e proteção de conflitos de
`book-sync.js`. Durante edição dos estilos, a área é tratada como conteúdo em
edição para evitar substituição silenciosa por uma versão remota. Mudanças do
capítulo usam o salvamento existente do documento e respeitam a permissão de
edição, o contexto ativo e os estados de arquivo/lixeira.

## Paginação por linhas — fatia 2

O módulo `book-pagination.js` mede as linhas renderizadas de parágrafos comuns
e permite continuar o mesmo parágrafo na folha seguinte. A quebra tenta manter
ao menos duas linhas em cada lado, evita recuo e espaço de início na continuação
e mantém títulos de seção junto do texto seguinte. Quebras explícitas de página
continuam tendo precedência.

As medidas seguem o papel, as margens, a abertura do capítulo, a fonte e o zoom
atuais, incluindo a prévia traduzida. A primeira folha também reserva a margem
inferior. Se o espaço disponível não permite cumprir as duas linhas, o bloco
é levado à próxima folha; em situações extremas, a regra é relaxada para permitir
que o texto avance.

Negrito, itálico, links e outros elementos de formatação simples acompanham a
divisão. A fonte salva continua contendo um único parágrafo, com sua identidade
de tradução. Os atributos `data-book-fragment`, `data-book-continuation`,
`data-book-fragment-end` e `data-book-inline`, assim como as medidas temporárias,
pertencem somente à projeção visual. Salvamento, cópia, Markdown e `.hdocs`
reúnem os fragmentos antes de produzir o conteúdo autoral. Não há nova migração
nem mudança de esquema.

A edição reúne os fragmentos antes de alterar o texto e recalcula as folhas
depois. A seleção é preservada durante o rearranjo; a composição de texto por
teclados IME adia a paginação. Edições nativas usam o histórico do conteúdo
autoral, com posição de seleção para desfazer/refazer, em vez de depender das
operações de rearranjo das folhas. Os vínculos das notas continuam ligados ao
texto existente.

**Limites desta fatia:** listas, tabelas, diagramas, citações, chamadas e blocos
narrativos interativos permanecem indivisíveis. Parágrafos que contêm elementos
interativos ou formatação complexa também permanecem inteiros. Imagens maiores
que a folha recebem um limite visual de altura; outros blocos indivisíveis que
não cabem recebem rolagem interna, sem alterar a fonte. Isso não substitui a
futura composição editorial de tabelas ou a exportação PDF/EPUB.

## Fatias

1. **Concluída no código:** estilos do livro e abertura de capítulos.
2. **Concluída no código:** paginação de parágrafos por linhas, proteção contra
   linhas isoladas e títulos acompanhados de texto, com os limites acima.
3. Composição do livro completo, funções editoriais, margens espelhadas,
   numeração de páginas, cabeçalhos e páginas duplas.
4. Sumário, lista de ilustrações e notas de rodapé.
5. Modelos editoriais, ornamentos, separadores e ilustrações.
6. Prévia final e exportação editorial PDF/EPUB.

Nestas fatias foram feitas conferências estáticas de integração e sintaxe. Não
foram adicionados ou executados testes. A interação, paginação visual e
sincronização em ambiente real ainda precisam de validação.
