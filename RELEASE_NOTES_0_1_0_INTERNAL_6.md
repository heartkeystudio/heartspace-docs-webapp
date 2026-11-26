# Heartspace Docs 0.1.0-internal.6

## Inclusões

- B1 — inserção de retângulos, elipses, linhas e setas diretamente na composição.
- Inserção rápida e ferramenta de desenho por clique e arraste; linhas e setas permitem ajustar as extremidades separadamente.
- Preenchimento, contorno, espessura, geometria e transformações permanecem editáveis no inspetor e após salvar e reabrir.
- As primitivas reutilizam seleção, grupos, ordenação, visibilidade, bloqueio e histórico existentes.
- O formato autoral v4 é opt-in: a primeira primitiva pede confirmação, a remoção das formas não provoca downgrade e o estado autoral continua separado da projeção de apresentação/exportação.
- Compatibilidade local mantida para documentos v1, v2 e v3. Fontes v4 são rejeitadas por leitores anteriores antes de substituir ou gravar a fonte.

## Verificação desta entrega

- Compatibilidade e ida e volta: 29/29 casos automatizados; cinco arquivos de regressão direcionados executados anteriormente para B1 também passaram.
- Matriz B1 no editor: 6/6 casos passaram, cobrindo ferramentas visíveis, cancelamento do upgrade, quatro primitivas, persistência, histórico, exportação, grupos, visibilidade, bloqueio e sincronização.
- Confirmações pontuais: recuperação local de uma primitiva v4 (1/1); remoção da última primitiva sem downgrade após salvar e reabrir (1/1); rejeição pelo leitor da tag 0.1.0-internal.5 com a fonte integralmente preservada.
- Sintaxe JavaScript e `git diff --check` passaram. Consulte `verification-results.json` no registro local da entrega para os limites de cada execução.

## Compatibilidade e limitações

- Documentos v4 salvam localmente. A sincronização remota permanece bloqueada; nenhum suporte ou contrato remoto foi alterado.
- Os documentos dos testes eram sintéticos. Inserção por arrasto e ajuste de extremidade na matriz foram validados com eventos de ponteiro simulados, não como ensaio de hardware de entrada.
- A validação automatizada foi direcionada ao escopo B1; não representa nova execução integral de todas as suítes históricas.
- B2–B6, editor vetorial genérico, migração em massa e dependência obrigatória do Canvas não estão incluídos. A política geral de evolução do formato autoral não é considerada aprovada por esta entrega.
- Geração de arte por IA continua excluída.

## Utilização e recuperação

Extraia o ZIP preservando os caminhos e sirva os arquivos por HTTP local; não abra `index.html` por `file://`. Confira `PACKAGE_SHA256SUMS`, `SHA256SUMS` e `VERSION.json`. Use os bundles Git em `recovery/` segundo `recovery/RECUPERACAO.md`. `0.1.0-internal.5` permanece como referência funcional anterior. Os pacotes e bundles não incluem documentos autorais de produção; preserve `.hdocs` e o armazenamento local separadamente.
