# Heartspace Docs 0.1.0-internal.4

## Inclusões

- A5: grupos persistentes de camadas, incluindo nomeação, aninhamento, reorganização, duplicação, remoção e integração com o histórico de autoria.
- Formato autoral v2 opt-in para documentos que utilizam grupos; documentos v1 sem grupos permanecem em v1. A exportação narrativa mantém a composição plana.
- Antes de evoluir um documento v1 para v2, o Docs apresenta a mudança de compatibilidade e solicita confirmação. O aviso informa que o salvamento permanece local e que a sincronização remota fica indisponível até existir suporte remoto ao formato v2.
- O indicador de salvamento distingue gravação local em andamento, gravação local concluída e sincronização. Documentos v2 vinculados a projetos remotos permanecem marcados como locais e não enviados; o bloqueio preventivo de envio continua ativo.

## Compatibilidade e limitações

- Documentos v1 continuam compatíveis. O primeiro uso de grupos evolui o documento para v2; não há downgrade automático após remover os grupos.
- Documentos v2 podem ser abertos e editados localmente nesta versão. Sincronização remota e publicação permanecem indisponíveis até que os consumidores remotos suportem o formato v2. Exporte o `.hdocs` para transportar o trabalho.
- Versões anteriores sem suporte a grupos não devem abrir documentos v2. A versão `0.1.0-internal.3` foi validada rejeitando v2 sem descartar conteúdo.
- Reabertura de cópias `.hdocs` v2 validada na matriz do editor. A recuperação v2 pela interface de recuperação de projetos e a restauração de uma sessão remota após recarga completa ainda não foram exercitadas diretamente.
- Seletor nativo de arquivos, IME e tecnologias assistivas seguem como limitações ambientais pendentes de validação. Eventos de ponteiro sintéticos permanecem identificados nas evidências históricas.
- A geração de arte por IA permanece excluída.

## Utilização e recuperação

Extraia o pacote preservando os caminhos e sirva-o localmente em `http://127.0.0.1:<porta>/`; não abra por `file://`. Confira `PACKAGE_SHA256SUMS`, `SHA256SUMS` e `VERSION.json`. O registro local de entrega contém o bundle Git e o pacote de `0.1.0-internal.3`, além da cópia pré-consolidação de A5.
