# Heartspace Docs — Resultados de B3

**Escopo:** B3 — Esboços e Anotações, schema autoral v6 opt-in.
**Base de recuperação:** `0.1.0-internal.7` (`8642de64f4551d48ebe4eaf5ba54eb64a196db28`).
**Estado:** B3 validada; pronta para consolidação interna autorizada.

## Entrega

- Adicionados lápis, borracha de traço inteiro, cor, espessura, seta, nota e marca autorais, com indicação explícita do modo de trabalho.
- Esboços são elementos editáveis da cena e utilizam seleção, transformações, camadas, grupos, visibilidade, bloqueio e histórico existentes.
- Anotações permanecem no contexto de autoria. Podem ser livres ou vinculadas a um elemento; acompanham mudanças de posição, são desanexadas ao remover o elemento e não são copiadas ao duplicá-lo.
- Cada gesto de desenho confirmado cria uma operação de histórico; cancelamento e gesto sem alteração não criam operações. A borracha remove o traço inteiro e não apaga anotações.
- Schema v6 é opt-in e aderente: documentos v1–v5 sem novos dados mantêm sua versão. A primeira gravação que exige v6 pede confirmação, informa incompatibilidade com versões anteriores e indisponibilidade de sincronização. Remover esboços/anotações não causa downgrade.
- Exportação narrativa inclui o esboço visual e remove anotações e metadados exclusivos de autoria. Nenhum contrato remoto foi alterado; sincronização v6 continua bloqueada.

## Validação realizada

- Suíte automatizada estrita pertinente: **135/135 aprovada**, sem TODOs pendentes.
- Matriz direcionada do editor em navegador local: **9/9 cenários B3 aprovados** após ampliar os casos de borracha e anotações. Confirma gesto de desenho único, cancelamento, apagamento inteiro, respeito ao bloqueio autoral, vínculo/desanexação reversível, ausência de duplicação automática de anotações, visibilidade autoral, recuperação v6 pela interface, composição representativa, gestos vazios sem histórico e falha de quota sem sobrescrever a última cópia local.
- Falha de persistência: uma transação IndexedDB de teste foi abortada e o fallback localStorage recebeu uma falha `QuotaExceededError`; a cópia recuperável anterior permaneceu byte-a-byte igual e a interface exibiu “Não foi possível salvar a recuperação local”, sem indicar salvamento concluído.
- Compatibilidade: o **pacote distribuível completo** da tag `0.1.0-internal.7` rejeitou um `.hdocs` sintético v6 com a mensagem “versão autoral incompatível; o conteúdo existente deve ser preservado”. O documento v1 que já estava aberto manteve título e conteúdo; a fonte v6 de teste permaneceu inalterada.
- Exportação: testes confirmam que esboços permanecem e anotações não são incluídas nos artefatos do jogador.
- Desempenho sintético no navegador: 32 traços × 512 pontos (16.384 pontos) foram carregados e renderizados em **908 ms**, sem perda de pontos. A medição inclui construção e abertura do arquivo descartável.
- Cenário sintético máximo para dimensionamento: 80 traços × 2.048 pontos (163.840 pontos) resultaram em JSON de **17.372.980 bytes**; validação levou **25,23 ms** e serialização **160,5 ms** neste ambiente Node. Não é uma medição de renderização máxima no navegador.
- Sintaxe dos módulos JavaScript alterados e `git diff --check`: aprovados.
- Captura real do editor local após recuperar um documento v6 descartável: [SCENE_EDITOR_STAGE_B3_EVIDENCE.jpg](./SCENE_EDITOR_STAGE_B3_EVIDENCE.jpg).

## Limites e riscos conhecidos

- Os limites atuais são 80 elementos de composição, 2.048 pontos por traço e 500 anotações. Ao atingir o limite de elementos ou pontos, a interface cancela a operação com aviso; não trunca silenciosamente o desenho. O cenário de 17,4 MB sugere acompanhar espaço de armazenamento local antes de recomendar composições próximas do teto.
- Os cenários de interação usaram eventos de ponteiro sintéticos e documentos descartáveis. Não equivalem a validação com caneta/tela tátil especializada nem em projetos reais extensos.
- A anotação vinculada foi exercitada para reposicionamento e remoção/desanexação; não foi realizada avaliação visual ampla de sobreposição em composições densas.
- Compatibilidade `.7` foi exercitada no pacote distribuível completo via navegador local. O teste de abertura forneceu o arquivo sintético por harness de navegador, sem exercitar um seletor de arquivos nativo.
- Sincronização remota para v6 permanece indisponível. A política geral de evolução do formato autoral continua pendente.

## Git e continuidade

Alterações permaneceram locais durante a validação. A autorização atual permite consolidar `0.1.0-internal.8`; B4–B6 não foram iniciadas. A versão `.7` permanece intacta como base de recuperação.
