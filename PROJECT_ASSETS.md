# Recursos compartilhados — fatia 3

Implementação local/web em `project-assets.js`. Referências são preservadas pelos
normalizadores de mídia, pelo editor e pelos arquivos `.hdocs`.

## Uso

- Em Cena, **Recurso do projeto…** escolhe fundo, áudio ou imagem de uma camada.
  **+ Recurso do projeto** cria uma camada de imagem.
- Em Personagens, o mesmo botão escolhe ou atualiza o retrato.
- Na escrita, `/` → **Imagem do projeto** insere uma imagem vinculada.
  Na legenda, **Opções desta imagem** → **Recurso do projeto…** permite verificar,
  substituir ou tornar a cópia independente, mantendo legenda e formatação.
- Na ambientação do capítulo/sequência e nas fichas de lugares do planejamento,
  o botão também fica ao lado da importação de textura.

Escolha a pasta raiz do projeto. O navegador entrega os arquivos autorizados pela
pessoa. A seleção fica em memória nesta sessão/contexto; não concede acesso
permanente ao disco. Não há leitura automática da pasta do Hub, ponte de
filesystem nova ou transporte Drive neste fluxo.

**Buscar atualização** pede a pasta novamente para obter uma leitura nova.
**Usar versão selecionada** confirma a substituição. Cancelamento, mídia ausente,
assinatura divergente, mudança de projeto ou perda de permissão preservam a versão
anterior. **Usar cópia independente** remove a referência e mantém a mídia salva,
quando disponível. Atualizar retratos e fichas de lugares mantém seu escopo
compartilhado normal; controles de cena mantêm o escopo de composição escolhido.

## Referência e origem

O Docs lê mídia renderizada; não abre nem altera árvores internas de `.hcs`,
`.hcanvas`, `.hcd`, `.hrig` ou bancos do Beats. PNG/JPEG/WebP são imagens;
MP3/OGG/WAV/WebM/M4A seguem as regras de áudio do player existente.

Cada vínculo tem uma cópia da mídia e um `project_ref` de autoria:

| Campo | Regra |
| --- | --- |
| `schema_version` | 1 |
| `kind` | `artifact` ou `file` |
| `project_id` | Identidade do projeto de origem |
| `artifact_id`, `source_app_id`, `type`, `revision` | Identidade estável e revisão inteira positiva; apenas para `artifact` |
| `path` | Caminho relativo da mídia |
| `sha256` | 64 caracteres hexadecimais dos bytes fixados |
| `policy` | `pinned` |

Identidade/revisão usam o vocabulário público de
`hub/core/ecosystem/artifact_ref.gd`. Os demais campos são metadados do consumidor
Docs, sem substituir o catálogo do produtor. A referência não contém caminho
absoluto, credenciais, URL temporária nem fonte editável.

O adaptador lê catálogos v1 `.heartspace/*_artifacts.json`, com `artifacts`
indexados por `artifact_id`. Usa `runtime_ref.path` para mídia compatível
(`image`, `artwork`, `illustration`, `texture`, `audio`, `audio_event`, `sound`),
conferindo `sha256`/`size_bytes` quando declarados. Recusa versões desconhecidas,
projetos misturados e catálogos de outro projeto no contexto online autorizado.

**Limite atual do Canvas:** publica principalmente `animation` com `.hrig` e
prévia `heartkey.sprite_sheet`. Esses runtimes e folhas de sprites são excluídos;
precisam de render estático ou de adaptador próprio. Não foi alterado o catálogo
do Canvas nem inventada uma pasta canônica nova.

Arquivos comuns também podem ser vinculados: `kind: file`, projeto, caminho e
SHA-256, sem inventar ID estável, revisão ou app autor. Sem catálogo, o contexto
do projeto Docs identifica o vínculo manual. Renomear/mover exige selecionar
novamente. Uma referência de catálogo procura a identidade no mesmo projeto/app
e aceita novo caminho na nova revisão, sem escolher nomes parecidos como substituto.

Vínculos são fixados, com atualização explícita. Não há observação contínua da
pasta nem política de seguir a última revisão automaticamente. Regressão de
revisão ou mudança de bytes sem nova revisão impede atualizar a mesma identidade.
Selecionar outra identidade é uma substituição explícita.

Vínculos não recomprimem imagens, preservando a assinatura exata: até 4 MiB por
imagem e 8 MiB por áudio, com verificação de assinatura e decodificação de imagens.
Importações comuns mantêm a otimização existente. Limites do seletor: 20 mil
arquivos, 10 mil mídias, 20 catálogos de até 2 MiB. Requer Web Crypto para SHA-256.

## Persistência e distribuição

- Cena/retratos guardam `project_ref` junto da cópia incorporada. Imagens da folha
  usam `data-project-ref`; texturas guardam a referência ao lado do ID do cache.
  Nenhuma fonte editável de outro app é copiada.
- `.hdocs` preserva referências e deduplica cópias na tabela de mídia. Salvar/abrir
  confere bytes contra o SHA-256 fixado. Reabrir dispensa a pasta original.
- HTML jogável contém os bytes fixados; ZIP inclui arquivos fixados em `assets/`.
  O HTML distribuído remove `project_ref`, sem expor identidades/caminhos locais.
  O jogo não consulta catálogo nem servidor.
- Fonte v1/cache v3 preservam as referências como campos opcionais. Arquivos
  anteriores continuam válidos; `.hdocs` com vínculo de versão desconhecida é
  recusado. Editores antigos podem descartar o campo e não devem editar esses
  projetos novos.

**Fronteira remota:** cenas/retratos ainda podem levar cópias incorporadas nas
linhas legadas do Supabase; imagens/texturas usam o storage existente. Extrair
caches desse transporte, resolver recursos entre membros da equipe, ampliar
Core e integrar publicação continuam nas próximas fatias. A fila e a reconciliação
de documentos/recursos foram acrescentadas na fatia 4; ver `SYNC_REVISIONS.md`.
Não há sincronização automática entre apps nem mudança de provedor nesta entrega.

Conferência: sintaxe JavaScript, leitura estática da persistência/exportação e
atualização da CSP. Validação funcional no navegador, reabertura de `.hdocs` e
revisão visual permanecem pendentes.
