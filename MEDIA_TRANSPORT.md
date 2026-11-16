# Transporte de mídias — integração, fatia 5B

Implementação: `media-transport.js`, barreiras de persistência e transporte em
`index.html`, envio de livros em `book-sync.js`, recurso desktop em
`desktop/loader.js`. Migração:
`website/supabase/migrations/20261116000300_docs_media_transport.sql`.

## Fonte completa, transporte com referências

O editor e o formato `.hdocs` continuam contendo os bytes completos de Cena,
retratos e demais recursos incorporados. Prévia, jogo HTML e pacote ZIP recebem
as mesmas mídias materiais que já recebiam. Não passam a depender de autenticação,
URLs assinadas ou do servidor durante a execução/exportação.

No envio de documentos, recursos narrativos e livros, a cópia de transporte troca
os objetos de mídia incorporada por referências verificáveis. Imagens inline do
HTML são transportadas por `data-docs-media`; na leitura, voltam a imagens completas
antes de passar pelo sanitizador/normalizador do editor. Não há referência remota
incompleta entrando silenciosamente nos normalizadores de Cena.

A referência tem esta forma:

```json
{
  "schema_version": 1,
  "bucket": "docs-media",
  "project_id": "UUID do projeto",
  "sha256": "64 caracteres hexadecimais",
  "path": "UUID/SHA256.png",
  "mime": "image/png",
  "bytes": 12345
}
```

Objetos de mídia mantêm nome, MIME e eventual `project_ref`, substituindo `data`
por `storage_ref` **somente no transporte**. O manifesto `_docs_media` v1 contém
as referências da fonte enviada, inclusive as imagens em HTML. Ele é removido
na materialização local. Fontes e arquivos portáveis continuam com esquema 1;
o envelope de trabalho continua v3.

`project_ref` permanece a identidade/revisão fixada do recurso de origem. Esta
etapa não muda fontes editáveis do Canvas, diretórios canônicos dos projetos nem
catálogos de outros apps. A cópia no storage é o snapshot de runtime consumido
pelo Docs. Reutilizar um provider compartilhado do Hub/Core continua sendo um
adaptador posterior; não se inventou acesso ao filesystem/Drive da ponte v1.

## Arquivos, identidade e permissões

- Bucket privado `docs-media`, com caminho por projeto/hash e extensão canônica.
- Arquivos idênticos no mesmo projeto reutilizam o caminho; nomes de personagens,
  cenas e arquivos não geram outra cópia binária.
- `docs_media_objects` registra projeto, hash, caminho, MIME, tamanho e autoria.
  Somente a RPC de registro pode inserir; leitura exige `docs_view`.
- Upload exige `docs_edit`. A nova política não permite alterar/apagar os objetos
  do bucket pelo cliente. O envio usa `x-upsert: false`, sem sobrescrever arquivos
  de revisões anteriores.
- SQL confere existência e metadados do objeto antes de registrar/aceitar refs.
  **O hash dos bytes é calculado e conferido pelo cliente**; SQL não lê o binário
  do storage para provar o hash. Um objeto existente com bytes incorretos gera erro,
  em vez de substituir a mídia local ou sobrescrever o objeto remoto.
- Limites do runtime já existente: imagem até 4 MiB; áudio até 8 MiB. MIME/assinatura,
  tamanho e SHA-256 são conferidos; imagens passam também pela validação de decode
  e dimensões. SVG, GIF e vídeo não são formatos deste adaptador. Imagens comuns
  já otimizadas e armazenadas em `docs-assets` seguem pelo contrato existente.

Os limites são de segurança/formato, não uma definição de planos comerciais.
Políticas já existentes no ambiente remoto ainda precisam ser auditadas junto da
migração; esta tarefa não inspecionou o banco real.

## Ordem de envio e retomada

1. Capturar a fonte e proteger a operação autoral local, como na fatia 4.
2. Extrair as mídias dos objetos/HTML da fonte congelada, sem alterar o editor.
3. Enviar cada arquivo privado e registrar seus metadados. Em uma repetição com
   objeto já existente, baixar/conferir os bytes antes de aceitar a reutilização.
4. Guardar `attempt.transportVersion: 1` e `attempt.wireContent` na fila durável.
5. Somente então enviar o pedido final por versão esperada e UUID da operação.

Uma falha entre upload e registro/finalização pode deixar um arquivo órfão,
mas não confirma um documento incompleto. A fonte local permite retomar o envio.
Uma falha depois da confirmação repete **o mesmo pedido de transporte**, sem
recalcular seu conteúdo ou reaproveitar o UUID com outro payload.

Novas RPCs externas:

| RPC | Uso |
| --- | --- |
| `heartspace_register_docs_media_v1` | Registrar arquivo existente e metadados |
| `heartspace_save_doc_v3` | Validar refs e usar a gravação condicional de documento |
| `heartspace_save_narrative_registry_v3` | Validar refs dos recursos compartilhados |
| `heartspace_save_book_v2` | Validar refs da fonte de livro |
| `heartspace_resume_docs_sync_v1` | Recuperar confirmação antiga pelo hash exato |

Os contratos antigos de escrita passam a ser internos. Uma operação criada antes
do adaptador pode ter sido aceita com mídia inline. A RPC de retomada confere o
hash do pedido antigo contra o recibo e retorna a confirmação, sem criar outra
revisão. Se não foi aceita, o cliente prepara/protege o novo transporte. Não há
fallback para salvar base64 pelo endpoint antigo quando falta uma migração.
Cliente e servidor precisam ser atualizados juntos, sem clientes antigos ainda
gravando durante a troca. Uma corrida com cliente antigo gera divergência de
operação, não autorização para substituir seu conteúdo silenciosamente.

## Leitura, cache e recuperação

A materialização ocorre antes de consumir documentos, respostas de conflito,
registro narrativo e históricos de documento/livro. Referências de outro projeto,
versão desconhecida, MIME/tamanho incompatível ou hash diferente interrompem essa
leitura; a fonte previamente carregada permanece disponível. A fila não confirma
ou substitui a fonte por uma cena sem a mídia.

Há cache IndexedDB `heartspace-docs-media-v1`, separado por conta/projeto/hash,
com blobs verificados. Falha do cache não relaxa a checagem dos bytes. A barreira
obrigatória para confirmar um envio continua sendo o armazenamento da fonte/fila;
fontes já materializadas contêm sua própria cópia offline. Exportar uma recuperação
usa esses bytes, não requer buscar a origem Canvas ou autenticar no jogo exportado.

Leituras binárias têm tamanho limitado durante o streaming e são interrompidas
quando a conta/projeto muda. Nem cache nem referências contêm tokens, URLs
arbitrárias ou caminhos absolutos. Downloads repetidos na mesma materialização
reutilizam o resultado por hash, sem baixar de novo cada ocorrência da imagem.

## Limites e pendências

- Não foi feita reescrita em massa de linhas/revisões antigas. Elas continuam
  legíveis com mídia inline; gravações normais novas usam o adaptador. A operação
  interna de remover um livro pode revisar uma fonte legada ainda inline ao mover
  seu capítulo, preservando seu conteúdo; ela não recodifica binários no SQL.
- Arquivos órfãos/antigos não são apagados automaticamente: revisões, recibos e
  recuperações precisam continuar resolvendo suas referências. Retenção/GC exige
  um processo explícito com análise dos vínculos.
- Uma mídia inválida pode impedir a atualização do lote de documentos que a contém;
  a cópia anterior é preservada, sem incorporar parcialmente conteúdo sem mídia.
- Remoção/corrupção de objetos por administração externa precisa de reparação;
  o cliente não troca automaticamente o hash ou os bytes de uma revisão aceita.
- A fatia 5C acrescenta a projeção distribuível e autorizada de páginas de leitura,
  com imagens copiadas separadamente; ver `PUBLICATION_TRANSPORT.md`. Referências
  privadas de edição continuam fora do formato público.
- Hub/Core/provider compartilhado seguem para a próxima integração. Nenhuma
  credencial de provedor foi transferida para o Docs.

## Aplicação e conferência

Nenhuma migração foi aplicada por esta tarefa. A nova migration vem após as duas
anteriores da revisão arquitetural. Ordem e dependências estão sendo mantidas em
`MIGRATION_ROLLOUT.md` para entrega final solicitada pelo usuário.

Conferência realizada: sintaxe JavaScript, leitura estática do fluxo/SQL, diff e
CSP desktop. Não foram adicionados nem executados testes, SQL, deploy ou acessos
autenticados no servidor. Uploads, permissões, falhas de conexão, retomada de
operações antigas, cache, exportações e concorrência aguardam validação funcional/QA.
