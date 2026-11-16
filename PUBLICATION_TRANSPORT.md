# Publicação distribuível — integração, fatia 5C

## Fluxo disponível

`Ações → Publicar no HeartSpace` abre a preparação de uma página de leitura no
projeto conectado, no navegador ou na janela desktop autorizada. O modo local
continua completo para autoria e exportação; publicar no HeartSpace exige conta,
projeto sincronizado, Docs habilitado e permissão `manage_publications` ou
`manage_workspace`. O servidor revalida essas condições.

1. Escolher uma das últimas 50 revisões salvas do documento e uma página de destino
   (nova ou existente), título, endereço curto, resumo e visibilidade.
2. Preparar a página no servidor e conferir texto, imagens e omissões.
3. Quem tem `manage_workspace` pode conferir e aprovar uma revisão ainda não
   aprovada. A aprovação usa a RPC protegida da fatia 4; não ocorre automaticamente.
4. Confirmar **Publicar esta revisão**. Alterações locais não são publicadas
   automaticamente; a fonte é a revisão escolhida, não o DOM nem o rascunho atual.
5. O pedido confirmado é protegido em IndexedDB antes do envio. Reabrir a
   publicação no mesmo documento permite retomá-lo após perda de conexão/resposta,
   inclusive em outra janela do mesmo perfil do navegador. Não contém tokens.

O armazenamento compara o UUID do pedido dentro de uma transação, evitando que
janelas sobrescrevam o pedido confirmado uma da outra. O servidor também registra
recibo por ator/UUID e hash do pedido. Repetir o pedido recupera a confirmação sem
criar outra página/revisão. O recibo pode ser consultado mesmo se a imagem privada
original tiver sido removida depois de uma confirmação anterior. Encerrar um pedido
local não retira uma página já publicada; é necessário conferir a página no site.

Ao republicar, a revisão atual da página e sua data de alteração precisam continuar
iguais às consultadas. Uma edição concorrente gera conflito em vez de substituição
silenciosa. Uma mesma revisão de origem não é publicada duas vezes na mesma página;
para outra atualização/retorno após retirada, é preciso uma nova revisão aprovada.
O painel mostra até 100 páginas do projeto. Administração/retirada e histórico
continuam no painel do site; esta etapa não cria um editor de publicações completo.

## Fonte privada e página pública

A Function monta o snapshot a partir de `doc_revisions.content`. O digest da
conferência precisa coincidir com a reconstrução no envio. O cliente não decide
que um HTML arbitrário é uma revisão aprovada. O caminho antigo `save_publication`
aceita snapshots v1 somente quando coincidem com a fonte legada aprovada.

O HTML atual é interpretado pelo parser inerte `parse5` **7.3.0**, dependência
fixada na Function ([repositório oficial](https://github.com/inikulin/parse5)).
Nunca se injeta o HTML de autoria no site. A projeção pública v2 contém apenas:

- Blocos tipados de título, parágrafo, citação, código e itens de lista.
- Imagens PNG/JPEG/WebP incorporadas ao texto, identificadas por SHA-256, MIME e
  tamanho. Só imagens do documento selecionado; não há varredura da biblioteca.
- Contagem das omissões, mostrada durante a conferência.

Diálogos/narração viram texto, escolhas viram pergunta opcional e opções, variações
usam a versão padrão (ou ativa/primeira quando falta padrão). Comandos de Cena,
ligações/condições de escolhas, versões alternativas, tabelas e diagramas são
explicitamente omitidos/indicados. Formatação inline, links e estilos de autoria
não são transportados. Isto é uma página estática de leitura; a exportação de
Cena permanece o caminho para distribuir o jogo/apresentação interativa.

Não vão para o snapshot: planejamento, registro de personagens, áudio, cenário,
ambientação, `project_ref`, condições, IDs de origem, paths, tokens, HTML executável
ou referências privadas do transporte de edição. Texto que o autor escreveu como
conteúdo é texto público após sua confirmação; a projeção não é um detector de
segredos inseridos deliberadamente no corpo do documento.

## Imagens e distribuição

A preparação aceita imagens inline, referências registradas de `docs-media` e
imagens antigas de `docs-assets` do mesmo projeto. Não busca URLs externas.
Imagem somente local/inacessível interrompe a preparação, sem publicar um vazio.
Assinatura, SHA-256 e tamanho são conferidos; cabeçalhos verificam dimensões e
animação. Isso não substitui um decoder completo no servidor. A conferência no
Docs espera também o decode das imagens antes de habilitar a confirmação.

As imagens são copiadas para o bucket **privado** `docs-publications`, por
projeto/revisão/hash, antes de confirmar a página. `docs_publication_media` guarda
os vínculos internos. Reutilizar um caminho exige conferir os bytes existentes.
Os hashes das imagens entram no digest: trocar uma imagem antiga no caminho da
edição exige uma nova conferência. A cópia publicada não depende do caminho
privado mutável da edição.

O leitor pede cada imagem por `get_publication_asset`. A Function só entrega os
hashes presentes no snapshot **atualmente publicado** da página. Paths, credenciais
e URLs assinadas não são entregues. MIME/tamanho/hash são conferidos também pelo
leitor; respostas binárias não têm cache público. Retirar uma página impede novos
pedidos; não revoga cópias que alguém já baixou. Links não listados podem ser
compartilhados; não são páginas privadas com controle de equipe.

Limites de proteção desta projeção: 500 blocos, 12.000 caracteres por bloco,
500.000 caracteres no snapshot, 8 MiB de HTML de entrada, 50.000 nós/marcadores,
150 níveis, 100 imagens/32 MiB totais, 4 MiB/40 megapixels por imagem, aresta de
20.000 px. Não são limites comerciais de assinatura. Preparações abandonadas podem
deixar cópias privadas órfãs; não há remoção automática, inclusive para preservar
históricos e recibos. Retenção/GC é uma tarefa operacional posterior.

## Hub/Core e contratos

A fila existente `.heartspace/docs_publication_requests` do Hub agora aceita
`payload.format: heartspace-html-v1`, `prepared_digest`, `operation_id`, documento,
revisão e número. Republicações incluem `expected_current_revision_id` e
`expected_updated_at`. O Hub encaminha o pedido conferido a `save_publication`;
a Function reconhece o formato e usa o mesmo fluxo protegido do Docs.

O digest deve vir de `prepare_docs_publication` após conferência humana. O Hub não
recalcula uma página diferente nem aprova automaticamente ao drenar a fila.
Produtores legados continuam sujeitos à correspondência exata com a revisão v1.
Recibos/repetições modernos têm também proteção no servidor.

**Limite da ponte atual:** o Docs web/desktop usa a sessão mínima autorizada e a
Function existente para publicar. A ponte Core v1 não fornece filesystem nem
escrita de pedidos locais. Esta implementação não finge que o Docs web escreve
na fila do Hub ou acessa Drive/OAuth. O Hub aceita pedidos modernos de produtores
com acesso legítimo à pasta; ligar o Docs web ao filesystem/catálogo compartilhado
continua dependendo de um contrato novo no Core. A fonte editável segue no Docs,
sem duplicar fontes do Canvas ou credenciais de provedores.

A Function preserva o callback Google GET existente. Operações de publicação e
imagens usam POST. `studioFunctionUrl` no Docs aponta para o serviço já configurado
no site (`heartspace-studio`); o diretório de código continua `heartspace-studios`.
O nome efetivamente implantado precisa coincidir com a configuração no deploy.

## Aplicação e QA

Migração nova: `20261116000400_docs_publication_transport.sql`, depois das fatias
4, 5A e 5B e da base anterior de publicações. Ela cria bucket/vínculos/recibos,
ajusta o gravador interno para snapshots versionados e acrescenta a RPC atômica
`heartspace_publish_docs_revision_v1`, exclusiva de `service_role`.

Atualizar juntos: Function e seus módulos (inclui dependência npm), site `/p`,
cliente Docs/loader/CSP desktop e encaminhamento do Hub. Não foi aplicada nenhuma
migração, publicado conteúdo real ou feito deploy. A lista provisória e as
necessidades da base estão em `MIGRATION_ROLLOUT.md`.

Conferência desta tarefa: sintaxe de JavaScript/TypeScript e leitura estática dos
fluxos/SQL. Nenhum teste foi adicionado ou executado. QA ainda precisa validar
aprovação/permissões, implantação Deno/dependências, RLS/storage, perda de resposta,
janelas concorrentes, conflitos/republicação/retirada, origem CORS, imagens antigas,
bytes inválidos, leitura pública e os recibos reais do Hub. Esta implementação não
é evidência de que o ambiente remoto já oferece estes contratos.
