# Aplicação das migrações do Docs — registro provisório

**Estado informado pelo usuário em 16/11/2026: nenhuma migração destas etapas foi
aplicada.** Esta tarefa não conecta ao banco, não executa SQL e não faz deploy.
A relação final será entregue ao término das fatias, conforme solicitado.
Não considerar um arquivo versionado no Git como confirmação de SQL aplicado.

## Novos arquivos da revisão de arquitetura

Ordem obrigatória, em `website/supabase/migrations/`:

1. `20261116000100_docs_recoverable_sync.sql` — documentos/registro narrativo,
   revisões, recibos, permissões e restauração condicional (fatia 4).
2. `20261116000200_docs_books.sql` — livros/pranchetas independentes, inclusive
   vazios, planejamento, histórico, remoções e integridade dos vínculos (fatia 5A).
3. `20261116000300_docs_media_transport.sql` — arquivos privados por hash,
   registro/validação de mídia, pedidos de transporte duráveis e retomada das
   confirmações antigas (fatia 5B).
4. `20261116000400_docs_publication_transport.sql` — projeção pública a partir da
   revisão aprovada, bucket privado de distribuição, recibos e publicação
   condicional/atômica (fatia 5C).

As fatias 1–3 da revisão arquitetural não acrescentaram migrations SQL.
Não reexecutar arquivos já registrados/aplicados; conferir o histórico real do
ambiente quando chegar a etapa de aplicação. Os quatro arquivos acima exigem
atualizar o cliente junto com o servidor; clientes antigos de escrita direta
não são compatíveis com as permissões novas.

## Base anterior a conferir antes da relação final

A base existente do HeartSpace precisa fornecer `auth.users`, `projects`, `docs`,
usuários/equipes e suas relações. O primeiro SQL abaixo depende de
`website/account/SUPABASE_PROJECT_ROLE_SYSTEM.sql`; as migrações cronológicas não
são um instalador completo de um banco vazio. Os scripts `account/SUPABASE_*.sql`
têm suas próprias dependências e só devem entrar na lista final se faltarem no
ambiente de destino. Nenhuma presença dessa base foi confirmada nesta tarefa.

Arquivos anteriores relevantes, na ordem do diretório de migrações:

| Ordem | Arquivo | Uso |
| --- | --- | --- |
| 1 | `20260925000100_docs_authorization.sql` | Acesso, capacidades e atividade |
| 2 | `20260925000200_docs_revisions_and_conflicts.sql` | Revisões e gravação condicional anterior |
| 3 | `20260925000300_docs_publications.sql` | Snapshots públicos; depende da base de publicações |
| 4 | `20260927000100_publication_atomic_save.sql` | Publicação atômica |
| 5 | `20260927000200_closed_beta_access.sql` | Acesso do beta do HeartSpace; conferir configuração do ambiente |
| 6 | `20261017000100_docs_pgcrypto_search_path.sql` | Funções de hash |
| 7 | `20261017000200_docs_shared_images.sql` | Arquivos de imagem compartilhados |
| 8 | `20261017000300_docs_activity_read.sql` | Leitura da atividade |
| 9 | `20261017000400_docs_presence.sql` | Presença |
| 10 | `20261017000500_docs_revision_restore.sql` | Restauração anterior |
| 11 | `20261017000600_docs_storage_capability_rls.sql` | Permissões de storage |
| 12 | `20261022000100_docs_order.sql` | Ordenação compartilhada |
| 13 | `20261111000100_docs_narrative_registry.sql` | Personagens |
| 14 | `20261111000200_docs_narrative_variables.sql` | Variáveis |
| 15 | `20261112000100_docs_translation_glossary.sql` | Glossário |
| 16 | `20261114000100_docs_game_scene_settings.sql` | Formato global de Cena |
| 17 | `20261116000100_docs_recoverable_sync.sql` | Novo contrato recuperável |
| 18 | `20261116000200_docs_books.sql` | Novo contrato de livros |
| 19 | `20261116000300_docs_media_transport.sql` | Arquivos privados e transporte por referências |
| 20 | `20261116000400_docs_publication_transport.sql` | Snapshots públicos v2, imagens distribuíveis e recibos |

Esta tabela registra dependências e candidatos, **não uma ordem para aplicar tudo
indiscriminadamente agora**. Arquivos de Tasks no mesmo diretório não são
requisitos destas fatias do Docs. Publicações e beta têm efeitos no restante do
HeartSpace e precisam ser confrontados com o que já existe no ambiente.

## Conferências para o fechamento

- Comparar esta relação com o histórico de migrações do banco de destino.
- Confirmar base, funções de capacidades e estrutura de `docs` já existentes.
- Acrescentar as migrations que surgirem nas próximas etapas, sem renumerar as anteriores.
- Planejar cópia de segurança e aplicação coordenada cliente/servidor.
- Validar SQL, permissões e concorrência em ambiente de QA antes da aplicação final.

O novo SQL de livros preserva fontes antigas no histórico; não limpa snapshots
legados dos capítulos nem apaga automaticamente históricos/recibos de recuperação.

A fatia 5B torna internos os endpoints antigos de escrita. O cliente usa documentos/
registro v3 e livros v2; confirmações antigas são consultadas por RPC específica.
O bucket `docs-media` e suas políticas também fazem parte dessa migration. Ver
`MEDIA_TRANSPORT.md` antes de planejar a atualização coordenada. Não executar
limpeza de arquivos nesta aplicação: referências de revisões devem continuar válidas.

A fatia 5C também exige implantar a Function e seus módulos, o leitor `/p`, o
cliente Docs e o encaminhamento atualizado do Hub. O diretório da Function e o
nome configurado no endpoint têm grafias históricas diferentes; conferir no deploy.
Ver `PUBLICATION_TRANSPORT.md`. Nenhuma dessas operações foi executada nesta tarefa.
