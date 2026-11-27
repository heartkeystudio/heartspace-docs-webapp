# Heartspace Docs 0.1.0-internal.10

Entrega interna de B4.1 — Consulta e Ficha Artística.

## Incluído

- Consulta contextual e abrangente de necessidades locais à sequência e compartilhadas no projeto pelo painel Recursos.
- Pesquisa por nome, categoria e descrição, filtros por presença de ocorrências e consulta das ocorrências existentes.
- Criação de necessidades independentes sem ocorrência e edição progressiva de nome, categoria e descrição.
- Edição de registros v5/v6 permanece local; ficha compartilhada v7 é editada no registro do projeto.
- Confirmação prévia para a primeira operação que evolui o formato a v7; cancelamento mantém a fonte sem promoção.
- Histórico de sessão, salvamento local protegido contra revisão concorrente e cópia da edição rejeitada.
- Desfazer de operações autorais não reduz o schema v7.

## Compatibilidade e sincronização

A leitura e consulta não promovem o formato. Documentos v1–v6 permanecem nos seus schemas quando a operação é compatível. Uma necessidade independente no projeto exige confirmação para v7, que deixa de abrir em versões anteriores. A sincronização remota permanece bloqueada para v2–v7 e não foi ampliada nesta entrega. Salvamento local não significa sincronização concluída.

## Verificação

- 83/83 testes automatizados pertinentes já executados: compatibilidade 38/38, histórico 30/30 e herança 15/15.
- 8/8 cenários B4.1 previamente executados; mais dois cenários direcionados de navegador aprovados para falha na primeira gravação v7 e preservação das propriedades locais de ocorrências vinculadas.
- Sintaxe JavaScript e `git diff --check` aprovados.

As validações B4.1 usaram documentos sintéticos e interação automatizada. Não houve validação com projetos reais nem avaliação visual independente do Creative Lab.

## Limitações conhecidas

- Histórico autoral limitado à sessão.
- Sem resolução ou mesclagem automática de conflitos; a edição rejeitada é preservada para cópia pelo autor.
- Sincronização remota indisponível para v2–v7, acompanhada em OI-27.
- Avaliação visual independente do Creative Lab ainda não realizada.
- A falha de persistência induzida manteve schema, fichas locais, histórico e última recuperação durável intactos; durante o fechamento de uma edição pendente, o editor também normaliza a representação HTML de autoria em memória. A alteração não foi gravada no snapshot durable em falha.

Geração de arte por inteligência artificial permanece excluída.

## Utilização e recuperação

Extraia o ZIP preservando caminhos e sirva `index.html` por HTTP local; não abra o arquivo por `file://`. Confira `VERSION.json`, `SHA256SUMS` e `PACKAGE_SHA256SUMS`. O diretório local da entrega inclui o bundle Git, o pacote e `RECUPERACAO.md`. `0.1.0-internal.9` permanece como referência anterior recuperável. Pacotes e bundles não incluem documentos autorais de produção nem dados locais do navegador.
