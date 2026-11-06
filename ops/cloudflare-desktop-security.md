# Cabeçalhos da entrada desktop no Cloudflare

O site continua hospedado no GitHub Pages. Como esse host não oferece cabeçalhos
por rota, a entrada desktop depende de duas regras na zona `heartspace.tools`.
As duas devem usar a mesma expressão:

```text
(http.host eq "docs.heartspace.tools" and (http.request.uri.path eq "/desktop" or http.request.uri.path eq "/desktop/" or http.request.uri.path eq "/desktop/index.html"))
```

O registro DNS de `docs.heartspace.tools` precisa estar com proxy Cloudflare
ativado para as regras serem aplicadas.

## 1. Não armazenar a entrada no cache

Em **Rules → Cache Rules**, crie `HeartSpace Docs desktop — no store` com a
expressão acima e defina **Cache eligibility: Bypass cache**. Coloque-a depois de
qualquer regra ampla que habilite cache para HTML.

Essa regra é separada porque alterar `Cache-Control` na resposta acontece depois
da decisão de cache da Cloudflare.

## 2. Fixar os cabeçalhos da resposta

Em **Rules → Transform Rules → Modify Response Header**, crie
`HeartSpace Docs desktop — security headers` com a mesma expressão. Use
**Set static** para substituir todos os valores anteriores:

| Cabeçalho | Valor |
| --- | --- |
| `Cache-Control` | `no-store` |
| `Referrer-Policy` | `no-referrer` |
| `Content-Security-Policy` | conteúdo integral de `desktop-csp.txt` |
| `X-Content-Type-Options` | `nosniff` |

Coloque a regra depois de outras regras de cabeçalho que atinjam o subdomínio,
pois regras posteriores podem substituir valores anteriores.

## Atualizar a CSP quando o editor mudar

O editor ainda contém JavaScript inline. A política permite esse código por um
hash SHA-256 exato e permanece sem `unsafe-inline` para scripts. Depois de alterar
`index.html`, gere novamente o valor antes de publicar:

```bash
python3 scripts/generate_desktop_csp.py
```

Copie o novo conteúdo de `ops/desktop-csp.txt` para a regra de resposta. A
transformação aplicada pelo gerador deve continuar equivalente à realizada por
`desktop/loader.js`; assim o hash corresponde ao script executado na rota.

## Aceite

Depois de publicar o site e as regras, use o diagnóstico do Core:

```bash
./target/release/heartspace-core --check-docs-site
```

O resultado precisa indicar `ready: true`, HTTP 200, `no_store`, `no_referrer`,
`frame_policy`, `script_policy` e `ipc_policy`. Esse diagnóstico não envia
credenciais e não valida o backend ou o CRUD do projeto.
