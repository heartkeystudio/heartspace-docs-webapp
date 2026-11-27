# Heartspace Docs — B4.0: Fundação de identidade e compatibilidade

**Referência preservada:** `0.1.0-internal.8` (`5837ff3919f8a5653b9242a1ed0e0a230bd4cf33`)
**Estado:** implementação local, ainda não consolidada.
**Escopo:** modelo persistente opt-in de identidades artísticas compartilhadas em schema v7.

## Resultado

O formato v7 mantém as necessidades artísticas em um registro do projeto, separado das ocorrências em sequências. A projeção do editor continua entregando às telas existentes os dados associados a cada sequência, enquanto a serialização v7 remove essa duplicação local e mantém as associações por identidade.

A conversão de documentos v1–v6 para v7 é explícita e não altera a fonte recebida. As necessidades antigas são reunidas sem deduplicação por semelhança descritiva. Colisões de identificadores são remapeadas deterministicamente e as referências de elementos e patches narrativos são atualizadas. A reconciliação de edições locais detecta divergências entre projeções de sequências e falha de modo seguro em vez de escolher um valor e sobrescrever o outro.

Documentos v1–v6 continuam representáveis sem evolução incidental. Uma vez v7, a remoção de todas as necessidades ou ocorrências não reduz o schema. Leitores que não suportam v7 rejeitam o documento em vez de descartar os novos campos.

## Validação executada

- **139 testes automatizados aprovados** ao executar os arquivos de teste existentes e o novo teste B4.0 individualmente no mesmo processo de trabalho.
- O teste dedicado cobre promoção explícita e colisões, round-trip/cache/recuperação, preservação de schemas antigos e ausência de downgrade, rejeição do schema incompatível e conflitos entre projeções.
- O pacote completo de `0.1.0-internal.8` rejeitou um documento v7 com a mensagem de formato incompatível, sem alterar a fonte fornecida ao leitor.
- `node --check` passou para `authoring-project.js` e `tests/b4-foundation.test.cjs`.
- `git diff --check` passou.

O agregador estrito não conseguiu iniciar seus processos filhos neste ambiente (erro de permissão `EPERM` ao executar `/usr/bin/node-22`). Por isso, os 139 testes foram executados diretamente por arquivo; não se declara sucesso do agregador estrito.

## Compatibilidade, recuperação e sincronização

- O estado de projeto e a lista de necessidades são incluídos nos adaptadores locais de cache e recuperação.
- O aplicativo reconhece v7 como formato sem suporte de sincronização remota e preserva a distinção entre salvamento local e sincronização. O envio remoto não foi testado nem habilitado.
- O teste com a versão `.8` carregou o leitor do pacote consolidado completo; não exercitou a abertura do documento v7 pela interface completa do pacote antigo.
- Não houve migração em massa, alteração de contrato externo ou mudança de serviço.

## Limites desta parcela

- Esta entrega estabelece modelo, validação, promoção explícita e round-trip; ainda não há fluxo de interface B4 que solicite confirmação ao criador e invoque a promoção. A chamada futura deverá apresentar previamente as consequências de compatibilidade e sincronização.
- Não foram implementadas consulta/ficha artística, operações de ocorrências, observações ou substituição de recursos (B4.1–B4.4 e B5 permanecem fora do escopo).
- Não houve matriz de navegador nem capturas de interface, pois B4.0 não acrescenta uma experiência visual de usuário.
- O teste com documentos sintéticos não substitui validação em projetos reais extensos.

## Repositório

As alterações permanecem sem commit em `master`. `HEAD` continua em `5837ff3919f8a5653b9242a1ed0e0a230bd4cf33`, igual à referência `origin/master` observada. Arquivos locais não relacionados foram preservados. Não houve push, tag ou empacotamento.

## Encaminhamento transversal

O Master foi notificado da autorização específica de v7 para atualização de OI-27 e da manutenção do bloqueio de sincronização remota para v2–v7 até suporte confirmado. A notificação não solicita alteração transversal.

## Nota editorial posterior à consolidação

As referências a “implementação local, ainda não consolidada”, ausência da experiência de interface e estado Git neste relatório descrevem o momento em que os resultados de B4.0 foram redigidos. O encerramento e a consolidação foram posteriormente aprovados em `0.1.0-internal.9`, commit `8a32e2e2f492b7f009a108ce1aa552e7b9e2669e`, tag anotada do mesmo nome. Esse marco é a referência recuperável de B4.0; este adendo contextualiza o histórico sem reescrever suas evidências datadas nem alterar a versão tagueada. B4.1 é uma parcela subsequente e independente.
