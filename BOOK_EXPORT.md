# Prévia final e exportação editorial — fatia 6

## Uso

Em **Ações → Prévia do livro**, a composição abre com papel branco e tinta
escura. A opção **Exportação → Papel branco na prévia** permite alternar a
aparência da conferência, preservando a composição e as fontes. Abra
**Exportação** para informar o título da edição e o autor opcional e escolher
a saída. Esses dois campos pertencem à sessão de exportação; não renomeiam
o livro, não alteram documentos e não são sincronizados.

A prévia é um retrato do conteúdo original no momento da composição. Use
**Atualizar** para incorporar alterações posteriores. As saídas usam as seções
incluídas, na ordem da biblioteca, com o caminho de leitura canônico. Notas de
margem, painéis da interface, ambientação decorativa, ramos alternativos e a
prévia de tradução não fazem parte desta edição.

## PDF / impressão

**PDF / Imprimir** abre a impressão nativa do navegador. Escolha **Salvar como
PDF**, escala **100%**, margens **nenhuma** e desligue os cabeçalhos/rodapés do
navegador. Não é um download direto produzido por um servidor. O navegador e o
destino de impressão precisam aceitar o tamanho de papel solicitado; confira
a prévia da janela de impressão antes de salvar.

A projeção usa as folhas já compostas, incluindo aberturas, margens espelhadas,
cabeçalhos, fólios, páginas de alinhamento em branco, índices com seus
localizadores físicos e notas de rodapé com continuação. Cada folha recebe
uma quebra de impressão. Não se mede nem se pagina novamente o manuscrito.
O tamanho solicitado corresponde às dimensões em pixels CSS da composição
(96 px por polegada), inclusive sua orientação.

Uma cópia temporária fora do diálogo modal é usada apenas durante a impressão.
A interface é ocultada exclusivamente em `@media print`. IDs dos diagramas são
isolados para não apontarem aos SVGs do editor; índices e notas recebem links
internos. Fechar/cancelar a impressão restaura a interface e o título da janela.
**Voltar à prévia** permite recuperar a interface em ambientes que não emitam
o evento de encerramento da impressão. Não se informa que um PDF foi salvo,
pois o navegador não fornece essa confirmação.

A impressão é bloqueada se houver imagens indisponíveis, diagramas sem prévia
ou blocos com rolagem interna/excedendo os limites da folha. Ajuste ou divida
esses blocos, reduza as margens ou escolha papel maior e atualize a composição.
Isso evita exportar silenciosamente apenas a área visível de um bloco grande.

## EPUB 3

**Baixar EPUB** gera um arquivo autocontido, sem serviço de conversão. O texto
permanece selecionável e ajustável pelo leitor. A exportação parte da projeção
canônica **antes** da paginação, preservando o conteúdo completo dos blocos.
Não copia fragmentos, rodapés divididos ou recortes das folhas.

- O pacote contém `mimetype` como primeira entrada sem compressão nem campos
  extras, `META-INF/container.xml`, manifesto OPF, navegação XHTML, folhas de
  estilo, seções XHTML e os recursos incorporados.
- Título, idioma, identificador único e data da edição são incluídos; autor só
  é incluído quando informado.
- Cada seção incluída entra na ordem de leitura. O sumário de navegação sempre
  existe. Quando sumário/lista de ilustrações estão ligados na composição,
  a navegação também entra no corpo da leitura após as páginas iniciais.
  A lista de ilustrações aponta para cada imagem com legenda.
- Aberturas, número de capítulo, subtítulo, ornamentos, separadores, ênfases,
  listas, tabelas, ilustrações, legendas e notas são projetados para XHTML.
  Notas mantêm seu texto integral em elementos semânticos `footnote`, com
  referências `noteref` e links de retorno, no fim da seção.
- As imagens vêm dos recursos já resolvidos na composição. Referências locais
  ou compartilhadas repetidas reutilizam a mesma entrada do pacote. PNG, JPEG
  e GIF são incorporados; outros formatos de imagem são convertidos para PNG
  no navegador, com limite de 32 milhões de pixels para a conversão.
- Diagramas Mermaid são recursos SVG com estilo incorporado e descrição.
  Scripts, eventos, recursos externos e animações não são exportados. Diagramas
  que dependam de imagens externas precisam ser substituídos por ilustrações
  incorporadas. O suporte a SVG/HTML dentro de SVG varia entre leitores,
  especialmente em conversões para Kindle, e precisa de conferência no destino.
- Links entre documentos incluídos são remapeados para as seções do EPUB.
  Referências a documentos excluídos ficam como texto sem destino. Links web
  explícitos continuam links; não são dependências para ler o livro offline.
- O pacote aceita até 1000 arquivos e 100 MB. Uma falha na conversão de mídia,
  imagem ausente, diagrama incompleto ou XHTML inválido impede o download e
  apresenta uma mensagem. Não se entrega uma edição incompleta silenciosamente.

As páginas em branco de alinhamento, números físicos, margens espelhadas e
cabeçalhos repetidos são recursos da saída de impressão. Não são reproduzidos
como páginas fixas no EPUB. Fonte, hifenização, quebras de ilustrações e tamanho
final de tabelas dependem também das preferências e capacidades do leitor.
O EPUB não é o jogo interativo exportado pela aba Cena e não promete converter
interações em livro-jogo.

## Integração e limites

`book-export.js` monta os controles e gera as saídas. `book-composition.js`
entrega uma projeção descartável das fontes preparadas, das folhas e das
imagens resolvidas. Iniciar outra composição invalida a exportação anterior;
trocar de contexto ou fechar a prévia invalida operações pendentes. URLs de
recursos permanecem sob o ciclo de vida da composição e a URL do download é
liberada após o disparo. O manuscrito e os registros de imagens não são
reescritos. Não há migração de dados ou SQL nesta fatia.

O carregador desktop inclui o módulo para manter a prévia disponível, mas a
ponte desktop atual não oferece a exportação de arquivos/impressão. Nesse
ambiente, os botões apresentam a indisponibilidade com orientação para abrir
o projeto no navegador. Distribua o módulo, o `index.html`, o carregador desktop
e a CSP gerada em conjunto.

Foram feitas revisão estática e conferências de sintaxe; não foram adicionados
nem executados testes. A paginação impressa, o cancelamento nos diferentes
navegadores, a leitura do EPUB, sua conformidade por EPUBCheck e a conversão
em aparelho Kindle ainda precisam de validação real antes de divulgação como
compatibilidade confirmada.

Referências: [EPUB 3.3 — W3C](https://www.w3.org/TR/epub-33/),
[impressão — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing),
[`window.print` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/print).
