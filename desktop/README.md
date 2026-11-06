# Entrada desktop do HeartSpace Docs

Rota contratada:

`/desktop/?desktop=1&desktop_protocol_version=1`

`index.html` mantém a URL da rota e carrega o editor principal; o editor e o modo
web continuam compartilhando a mesma implementação. `adapter.js` é o único ponto
que conhece `window.heartspaceDesktop`. Ele registra os eventos antes de pedir a
sessão, mantém o access token somente em memória e separa caches por conta e
projeto.

Sem a ponte v1, com parâmetros diferentes ou dentro de um frame, a página mostra
“Abra pelo HeartSpace” e não inicia o login web.

## Fixture local

Para validar a integração antes de conectar o Core, sirva a raiz do repositório e
abra:

`http://127.0.0.1:<porta>/desktop/fixture/?desktop=1&desktop_protocol_version=1`

A fixture só é habilitada em `localhost`, `127.0.0.1` ou `::1`. Ela simula o
projeto, a API e a ponte desktop inteiramente no navegador, sem enviar o token ou
os documentos ao Supabase. O painel “Fixture desktop” permite renovar a sessão,
alternar para somente leitura, restaurar a edição e revogar o acesso. O estado exibido
no painel vem de `setDocumentState`, portanto também verifica a comunicação de
alterações pendentes com o shell.

## Publicação

O HTML da rota deve ser entregue com `Cache-Control: no-store`,
`Referrer-Policy: no-referrer` e a CSP definida no contrato Core/apps web v1.
GitHub Pages não configura esses cabeçalhos pelo repositório; aplique-os na camada
Cloudflare antes do teste integrado com o Core real. A CSP deve permitir somente
scripts próprios ou seus hashes, as APIs HTTPS/WSS necessárias e o transporte IPC
`ipc: http://ipc.localhost`, negando frames, objetos e `base-uri`.

A expressão das regras, a política gerada e o procedimento de aceite ficam em
[`ops/cloudflare-desktop-security.md`](../ops/cloudflare-desktop-security.md).
