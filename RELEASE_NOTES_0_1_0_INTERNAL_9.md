# Heartspace Docs 0.1.0-internal.9

Entrega interna da fundação B4.0 para identidades artísticas compartilhadas.

## Incluído

- Schema autoral v7 opt-in com registro de necessidades artísticas no nível do projeto.
- Conversão explícita de documentos v1–v6, preservando a fonte, identidades distintas e referências de ocorrências.
- Remapeamento determinístico de colisões e rejeição segura de conflitos entre projeções locais.
- Round-trip e recuperação local das identidades compartilhadas.
- Reconhecimento de v7 no bloqueio de sincronização remota.

## Compatibilidade e consentimento

Documentos v1–v6 não evoluem incidentalmente. A API de conversão exige chamada explícita e retorna uma cópia validada; esta versão ainda não oferece uma ação de interface para promover o documento. Nenhuma interface de autoria chama a conversão, portanto a entrega não oferece fluxo de evolução sem consentimento. A evolução somente poderá ser exposta futuramente junto da confirmação prévia exigida pela política vigente. Documentos v7 não são reduzidos a versões anteriores.

A sincronização remota permanece bloqueada para v2–v7 até suporte confirmado. Salvamento local não significa sincronização concluída.

## Limitações conhecidas

- B4.0 é a fundação de identidade e compatibilidade; consulta/ficha, associação de ocorrências e observações autorais ficam para subetapas posteriores.
- Testes de rejeição usaram o leitor do pacote consolidado 0.1.0-internal.8; a interface completa antiga não foi exercitada.
- Os dados de validação são sintéticos; não há matriz de navegador ampla nem avaliação em projetos reais extensos.
- O agregador estrito de testes não iniciou processos filhos por `EPERM`; 139 testes passaram por execução direta de cada arquivo.
- O suporte remoto v2–v7 permanece indisponível e é acompanhado em OI-27 pelo Heartspace Master.

Geração de arte por inteligência artificial permanece excluída.
