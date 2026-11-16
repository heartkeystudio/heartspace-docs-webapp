# Notas na margem da escrita

O menu **Notas** na barra de edição cria, localiza e mostra/oculta notas do
capítulo. Para ligar uma seta, selecione um trecho do corpo do documento e use
**Nova nota na margem**, ou `Ctrl+Alt+M`. Sem seleção, a nota é livre.

- Arrastar a alça reposiciona a nota na margem esquerda/direita e na altura desejada.
  As setas do teclado também movem a nota; `Alt+Esquerda/Direita` troca de margem.
- Há quatro cores, texto, resolver/reabrir e exclusão com desfazer da última nota.
- O menu lista todas as notas do capítulo para encontrá-las mesmo longe da parte
  visível. Notas resolvidas podem ser mostradas novamente.
- As notas começam recolhidas em pequenos marcadores numerados. Clique para abrir
  e use **Recolher nota** no cartão, ou **Notas → Recolher todas**. Uma nova nota
  abre para digitação. A abertura é uma preferência da sessão, sem alterar a fonte
  compartilhada; ao alternar capítulos, a sessão lembra os cartões abertos.
- **Vincular seleção**, **Soltar seta** e **Ir ao trecho** permitem rever a ligação.
  As setas acompanham a altura do trecho e terminam na borda da folha, sem
  atravessar o manuscrito nem inserir marcações na história.

## Fonte, salvamento e circulação

As notas pertencem ao documento/capítulo, em `record.marginNotes`. Não são os
notebooks da seção Anotações nem comentários de discussão da equipe. Editar exige
permissão de edição do documento; não se infere permissão a partir de comentários.

A fonte `.hdocs` guarda `documents[].editorial.marginNotes`. O transporte remoto
usa `content.authoring_notes = {schema_version:1, notes:[...]}`. Cache, recuperação,
revisões, cópias e sincronização usam os contratos existentes; não há nova tabela
ou migração SQL. Quando o projeto é compartilhado, essas notas fazem parte da
fonte compartilhada, não de um caderno pessoal privado por usuário.

Fontes antigas sem notas continuam válidas. Dados inválidos não são truncados
silenciosamente: o carregamento é interrompido e a recuperação existente é
preservada. Atualizar os clientes de autoria juntos evita que uma versão antiga,
que desconhece o campo, o elimine ao regravar a fonte.

As notas ficam fora do HTML do manuscrito. Não entram na contagem de palavras,
Markdown, narrativa/jogo exportado ou projeção pública. O arquivo autoral `.hdocs`
contém as notas para continuar o trabalho. Leitura, prévia de tradução, modo de
escrita sem indicadores e impressão ocultam a camada. Esta primeira versão está
disponível para a escrita em layout livro.

## Posicionamento e zoom

A nota usa margem, afastamento horizontal e altura em coordenadas da folha.
A altura acompanha o zoom; o cartão conserva tamanho legível. A folha fica
centralizada em margens simétricas. As notas não entram no cálculo do Auto nem
reservam largura, alteram o zoom ou aumentam a área de rolagem do documento.
Os cartões abertos adaptam a largura ao espaço lateral disponível (180–220 px);
o afastamento salvo é limitado visualmente ao que cabe nessa margem.
Com os trilhos narrativos ativos, há um intervalo maior à direita para não cobrir
seus controles. Sem largura para o cartão, resta um marcador de 26 px; clicar
abre um editor flutuante temporário, que pode ser recolhido ou fechado com Escape
ou ao voltar a escrever. Sem espaço nem para o marcador, a nota continua acessível
pelo menu **Notas**. Não há deslocamento da folha para acomodar essas situações.
As setas aparecem apenas para notas abertas, marcadores sob o ponteiro ou com
foco, e permanecem fora da folha. A camada de notas é recortada à área visível do
editor para não criar rolagem adicional. Marcadores próximos são separados
verticalmente na exibição, sem mudar as posições salvas.

Uma nota com ligação usa citação, contexto anterior/posterior, posição original e
um identificador leve do texto para distinguir repetições enquanto ele não muda.
O índice ignora controles autorais e não depende das divisões visuais das folhas.
A seta é redesenhada após edição, paginação, zoom ou redimensionamento.
Se a citação não for encontrada ou não puder ser diferenciada, a nota permanece
com aviso para vincular novamente. Não há reconstrução semântica de trechos
reescritos nem vínculo obrigatório a números físicos de página.

O posicionamento dos cartões abertos é manual; esta versão não reorganiza cartões
que o autor sobrepôs. Outros painéis flutuantes, como a estrutura do documento,
continuam sob controle do usuário e podem disputar espaço lateral.

Limites de formato: 200 notas por documento, 4.000 caracteres por nota, seleção de
até 800 caracteres, contexto de 40 caracteres de cada lado. São limites de
proteção do editor, não de assinatura.

## Implementação e conferência

Módulo: `margin-notes.js`; adaptadores em `index.html` e `authoring-project.js`;
carregamento desktop em `desktop/loader.js` e CSP regenerada. Atualizar o cliente
web e os recursos desktop juntos. Não foi feito deploy ou aplicado SQL.

Nesta tarefa foram conferidas a sintaxe JavaScript e a integração estática dos
caminhos de salvamento/exportação. Não foram adicionados ou executados testes.
Arraste, seleção, setas, zoom, paginação, recuperação e sincronização real ainda
precisam de validação visual/funcional.
