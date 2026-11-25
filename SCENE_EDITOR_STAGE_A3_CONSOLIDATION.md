# Consolidação A3 — Heartspace Docs 0.1.0-internal.2

**Estado:** consolidação autorizada pelo fundador em 25/11/2026. **Escopo:** somente A3, sua documentação e evidências. A4 e parcelas posteriores permanecem sem autorização.

## Classificação

O estado recebido partiu exatamente do commit anotado pela tag `0.1.0-internal.1` (`a9cdaa8af42dc7f637487c08c34eeb5df11921bb`). A branch de trabalho era `codex/docs-scene-a3`, sem commits próprios.

| Arquivo ou conjunto | Classe | Destino |
|---|---|---|
| `scene-workspace.js`, `assets/docs/scene-workspace.css` | implementação A3 da organização de interface | commit e pacote |
| `index.html`, `scene-composer.js`, `desktop/loader.js`, `ops/desktop-csp.txt` | integração local, resolução do módulo e hash CSP | commit e pacote |
| `tests/prepare-stage0.cjs`, `tests/stage0-editor-matrix.js`, `tests/README.md` | infraestrutura e regressões A3 | commit; fontes de teste fora do pacote estático |
| `SCENE_EDITOR_STAGE_A_TECHNICAL_PLAN.md`, `SCENE_EDITOR_STAGE_A3_RESULTS.md` | planejamento e relatório A3 | commit; documentação de produto fora do pacote estático |
| `tests/evidence/stage-a3-*` e `tests/evidence/a3-visual/` | resultados, dados e capturas de validação | commit; evidências fora do pacote estático |
| `AGENTS.md` | instruções locais de trabalho | preservado localmente, excluído do commit e pacote |
| `.local-deliveries/`, caches e saídas de teste | artefatos privados/gerados | excluídos do commit e pacote |

A3 contém 8 arquivos rastreados modificados e 8 itens novos pertinentes (incluindo o diretório com cinco capturas). O empacotador foi generalizado para receber versão e tag; essa alteração operacional acompanha a entrega e mantém o empacotamento baseado no Git archive do commit.

## Integridade da referência anterior

Antes das alterações de Git foi preservada a tag `0.1.0-internal.1` e criado o diretório local `.local-deliveries/0.1.0-internal.2/pre-consolidation/`, além do bundle `docs-0.1.0-internal.2-pre-consolidation.bundle`. O manifesto de estado registra branch, base, arquivos, hashes do patch, snapshot e bundle. A tag anterior não foi movida nem reescrita.

## Inclusão da nova versão

O commit identificado contém a reorganização A3, os testes e as evidências, o relatório, estas notas e o empacotador parametrizado. `AGENTS.md`, documentos autorais, dados privados, caches, pacotes anteriores e conteúdo de `.local-deliveries/` ficam fora do commit. Nenhum contrato, formato ou migração foi alterado; a especificação e seu complemento são preservados.

## Verificação mínima do pacote

O pacote foi gerado a partir da tag anotada, extraído em uma pasta isolada e servido localmente. A conferência cobriu carregamento dos arquivos A3, navegação Documentos/Camadas/Recursos, seleção e inspetor, recolhimento e redimensionamento de painéis, salvamento e reabertura de cópia de teste, histórico de autoria e integridade dos hashes. Os resultados exatos, limites do ensaio e hashes ficam em `verification-results.json` no diretório local da entrega.

A validação aprovada de origem (119/119 automatizados, 47/47 cenários no editor) foi preservada. Os conjuntos 11/11 de compatibilidade e 24/24 de recuperação são referências da versão anterior; não foram repetidos como parte desta verificação mínima.

## Distribuição e recuperação

A versão está disponível localmente em `.local-deliveries/0.1.0-internal.2/distribution/`. Uma cópia do bundle, do pacote, dos manifestos e do registro fica em `.local-deliveries/recovery-0.1.0-internal.2/`. A recuperação local foi validada por leitura dos hashes e uso do bundle em um clone temporário.

Não houve push nem publicação hospedada. Cópia em armazenamento fisicamente independente permanece pendente operacional, sem bloquear a distribuição local. A falha de acesso SSH permanece documentada; autenticação e credenciais não foram alteradas.
