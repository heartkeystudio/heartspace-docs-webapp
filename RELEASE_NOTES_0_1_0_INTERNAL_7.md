# Heartspace Docs 0.1.0-internal.7

## Incluído

- B2 — biblioteca nativa e offline com oito objetos genéricos e três silhuetas de personagens.
- Inserção de placeholders e conversão de representações existentes, preservando identidade e propriedades.
- Identificação progressiva e opcional por nome, categoria e descrição artística.
- Associações explícitas entre ocorrências e necessidades artísticas; objetos genéricos não criam necessidades automaticamente.
- Metadados de autoria e indicadores de placeholder omitidos da exportação ao jogador, mantendo a representação visual provisória.
- Schema autoral v5 opt-in, preservando v1–v4, sem downgrade automático e com confirmação prévia da incompatibilidade e do salvamento local.
- Salvamento e recuperação locais de metadados e associações; versões v5 continuam bloqueadas para sincronização remota.

## Verificação

- Testes automatizados direcionados já aprovados para B2: 130/130.
- Matriz de navegador B2 já aprovada: 8/8.
- Nesta consolidação: recuperação local v5 com identidade e metadados preservados (1/1); desfazer/refazer de associação e retirada da condição de placeholder (1/1).
- Leitor da tag `0.1.0-internal.6` rejeitou v5 sem modificar a fonte (1/1).
- Verificações finais de sintaxe e `git diff --check` aprovadas. O pacote foi validado por smoke test após geração.

As fixtures são documentos sintéticos em origem local de teste. Não constituem validação com documentos de produção nem ensaio de hardware de entrada.

## Limitações conhecidas

- Necessidades e associações são mantidas no contexto da sequência/composição. Identidade artística compartilhada entre sequências deverá ser investigada em B4.
- Não há catálogo de produção nem fluxo de gerenciamento artístico nesta versão.
- A sincronização remota de v5 não está disponível; salvamento local não significa sincronização concluída.
- A política geral de evolução do formato autoral permanece pendente. Esta versão somente autoriza a evolução localizada de B2.
- Documentos v5 não são compatíveis com versões anteriores; `0.1.0-internal.6` os rejeita antes de substituir ou gravar a fonte.
- B3–B6, contratos transversais, migrações em massa e geração de arte por IA não fazem parte desta entrega.

## Uso e recuperação

Extraia o pacote preservando os caminhos e sirva a pasta por HTTP local; não abra `index.html` por `file://`. Confira `PACKAGE_SHA256SUMS`, `SHA256SUMS` e `VERSION.json`. Para recuperação do código, valide o bundle Git e siga `RECUPERACAO.md` no registro local da entrega. `0.1.0-internal.6` permanece como referência anterior. Pacote e bundle não incluem documentos autorais de produção; preserve `.hdocs` e o armazenamento do navegador separadamente.
