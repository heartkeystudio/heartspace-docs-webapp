# Entrada no Docs a partir do Dashboard

O site abre o Docs em outra aba com `source=dashboard`, `project_id` e
`dashboard_origin`. O último campo informa apenas a origem da página que abriu
os documentos; não carrega credenciais e não amplia a lista de confiança.

O Docs escolhe a origem informada (ou o referrer, para links anteriores) somente
se ela constar em `dashboardUrl`/`dashboardOrigins` da configuração pública.
A lista inclui os hosts oficiais com e sem `www`. A resposta ainda precisa vir
da janela que abriu o Docs e de uma dessas origens. Nunca se usa `postMessage`
com destino `*`.

O pedido tem um identificador para correlacionar respostas. Dashboards anteriores
sem esse campo continuam sujeitos às verificações de janela/origem. A sessão
transferida contém apenas acesso/expiração; a renovação continua no Dashboard.
Pedidos repetidos compartilham a mesma renovação em andamento no site.

A troca tenta novamente uma vez por segundo, com prazo de oito segundos. Falta
de resposta, sessão indisponível, janela fechada ou armazenamento bloqueado não
mantêm a legenda de conexão na tela: o Docs mostra a falha e mantém o acesso por
e-mail/local disponível. Quando a janela de origem existe, há uma ação de tentar
novamente. Respostas de um contexto anterior não alteram o projeto atual.
Um retorno explícito de login por e-mail não é substituído pela sessão do opener.

## Correção de 16/11/2026

O caminho anterior usava uma única origem fixa (normalmente o host `www`) e,
quando a espera terminava sem sessão, deixava a mensagem “Conectando à sessão do
Dashboard…” no formulário. A mensagem parada não comprovava uma espera ativa.
A correção também captura falhas da inicialização e serializa tentativas da
mesma janela para evitar conexões concorrentes.

Atualizar juntos o `docs/index.html`, `docs/config.js`, os scripts do Dashboard
(`account.js`, `reader.js` e suas versões em `account/index.html`) e a CSP da
entrada desktop, regenerada a partir do editor. Não há SQL/migração para esta
correção. Não foi executado deploy nem foi verificada a configuração dos hosts
publicados. Conferência realizada no código: sintaxe e diff; comportamento no
navegador e cabeçalhos efetivos ainda precisam de validação.
