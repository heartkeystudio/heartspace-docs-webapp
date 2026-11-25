# Consolidação da versão interna 0.1.0-internal.1

Autorizada pelo fundador em 25/11/2026. A1 e A2 aprovadas no alcance validado.
Etapa 0 e ciclo de estabilização encerrados; A3 não iniciada.

Foram preservados antes de mutações Git: fontes rastreados/não rastreados,
manifesto SHA-256, estado Git e bundle do histórico. Cópia privada persistente em
`.local-deliveries/0.1.0-internal.1/pre-consolidation/`, fora do versionamento.
O bundle também conserva referências internas de checkpoints existentes do Codex;
essas referências não são tags de release nem substituem a consolidação aprovada.

## Classificação do estado recebido

10 modificados e 69 não rastreados. AGENTS.md preservado localmente, sem inclusão
no commit ou pacote. Nenhuma alteração de outro produto neste repositório.
Fontes e evidências são as parcelas aprovadas, sem reconstrução de commits.

| Arquivo | Estado | Classificação | Commit |
|---|---|---|---|
| `book-pagination.js` | modified | implementação e carregamento | sim |
| `desktop/loader.js` | modified | implementação e carregamento | sim |
| `index.html` | modified | implementação e carregamento | sim |
| `local-projects.js` | modified | implementação e carregamento | sim |
| `narrative-package.js` | modified | implementação e carregamento | sim |
| `ops/desktop-csp.txt` | modified | implementação e carregamento | sim |
| `scene-composer.js` | modified | implementação e carregamento | sim |
| `tests/narrative-html.test.cjs` | modified | testes e infraestrutura de validação | sim |
| `tests/narrative-media.test.cjs` | modified | testes e infraestrutura de validação | sim |
| `tests/player-dom.cjs` | modified | testes e infraestrutura de validação | sim |
| `AGENTS.md` | untracked | instrução local preservada; excluída do commit | não |
| `DOCS_POST_A2_RELEASE_PROPOSAL.md` | untracked | documentação | sim |
| `SCENE_EDITOR_FUNCTIONAL_COMPLEMENT_V1.md` | untracked | documentação | sim |
| `SCENE_EDITOR_FUNCTIONAL_SPEC_V1.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_AUTHORING_HISTORY.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_CLOSURE.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_CONSOLIDATED_ASSESSMENT.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_PLAN.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_RECOVERY_INHERITANCE.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_REMAINING_REVIEW.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_RESULTS.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_0_S0P05_RESULTS.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_A1_RESULTS.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_A2_RESULTS.md` | untracked | documentação | sim |
| `SCENE_EDITOR_STAGE_A_TECHNICAL_PLAN.md` | untracked | documentação | sim |
| `authoring-history-patch.js` | untracked | implementação e carregamento | sim |
| `tests/.gitignore` | untracked | testes e infraestrutura de validação | sim |
| `tests/README.md` | untracked | testes e infraestrutura de validação | sim |
| `tests/authoring-history-patch.test.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/evidence/stage-a1-editor-matrix-before-a2.js` | untracked | evidência de validação | sim |
| `tests/evidence/stage-a1-results-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage-a2-node-2026-11-25.txt` | untracked | evidência de validação | sim |
| `tests/evidence/stage-a2-results-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-browser-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-consolidated-assessment-check-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-fixes-browser-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-fixes-node-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-formal-closure-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-functional-complement-provenance-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-functional-complement-received-2026-11-25.txt` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-functional-complement-section8-completed-2026-11-25.txt` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-history-browser-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-history-editor-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-history-hashes-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-history-node-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-history-recovery-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-parcel2-browser-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-parcel2-hashes-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-parcel2-node-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-parcel2-recovery-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-remaining-observations-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p03-browser-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p03-editor-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p03-hashes-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p03-node-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p03-recovery-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p04-browser-summary-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p04-hashes-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p04-node-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-s0p05-results-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-section8-completion-check-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/evidence/stage0-summary-2026-11-25.json` | untracked | evidência de validação | sim |
| `tests/fixtures/stage0-current.hdocs` | untracked | fixture sintética | sim |
| `tests/fixtures/stage0-editor-saved.hdocs` | untracked | fixture sintética | sim |
| `tests/fixtures/stage0-legacy.hdocs` | untracked | fixture sintética | sim |
| `tests/fixtures/stage0.js` | untracked | fixture sintética | sim |
| `tests/prepare-stage0.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/run-stage0.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-browser.html` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-browser.js` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-compatibility.test.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-editor-matrix.js` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-editor-support.js` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-history.test.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-inheritance.test.cjs` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-native-input.js` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-recovery.html` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-recovery.js` | untracked | testes e infraestrutura de validação | sim |
| `tests/stage0-storage-context.html` | untracked | testes e infraestrutura de validação | sim |

## Exclusões e novos registros de entrega

Excluídos: AGENTS.md local, `.local-deliveries/`, `.git`, caches e saídas geradas
`tests/.stage0-output/`. Nenhuma credencial ou projeto real é necessário à entrega.
Os dados dos testes/fixtures são sintéticos; textos recebidos/evidências permanecem
no repositório de fontes, mas não no pacote estático.
Acrescentados somente documentação de release, procedimento de empacotamento
e regra de exclusão dos artefatos locais; nenhum código funcional alterado.

SSH continua indisponível por erro de permissões na configuração do ambiente,
sem alteração de autenticação. Não há push ou publicação hospedada autorizados.

A tag autorizada é exatamente `0.1.0-internal.1` (sem prefixo v).
O pacote e o bundle finais serão identificados pelo commit e pela tag; resultados
da conferência do artefato ficam junto à distribuição, sem alterar o commit tagueado.
