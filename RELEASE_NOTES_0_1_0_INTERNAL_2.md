# Heartspace Docs 0.1.0-internal.2

Versão interna da HeartKey Studios, consolidada sobre `0.1.0-internal.1` e incluindo A3 — organização do ambiente do Editor de Cena. O pacote é derivado da tag anotada e identifica o commit em `VERSION.json`.

## Novidades de A3

- O Editor de Cena organiza os controles existentes em barra de contexto, painel esquerdo contextual, ferramentas, palco, inspetor e painel inferior de momentos.
- O painel esquerdo alterna entre Documentos, Camadas e Recursos usando os controles existentes; a navegação volta ao lugar original ao sair de Cena.
- O inspetor expõe os escopos Experiência, Cena, Momento e Elemento para as propriedades que já existiam.
- Painéis laterais e inferior podem ser recolhidos e redimensionados com ponteiro ou teclado. Em janelas estreitas, as regiões usam uma coluna rolável e podem ser recolhidas.
- A seleção, foco textual, operações de autoria e histórico existentes foram mantidos ao reorganizar os controles.

A3 não acrescenta seleção múltipla, grupos persistentes, novos mecanismos de bloqueio, blocagem, herança explícita, exploração persistente ou novas integrações. Contratos e formatos persistidos não mudam.

## Base funcional e validação

Mantém a Etapa 0, A1 e A2 aprovadas na versão anterior. As evidências A3 registram 119/119 testes automatizados e 47/47 cenários no editor, fechamento/reabertura, entrada real de teclado e redimensionamento por ponteiro. Compatibilidade 11/11 e recuperação 24/24 são referências aprovadas da versão anterior e não foram repetidas nesta consolidação.

## Limitações conhecidas

A organização visual mantém a lista de camadas plana e o painel de recursos limitado às ações já disponíveis. O estado de painel e suas dimensões são locais à página e reiniciam após recarga. Em janelas muito estreitas, a navegação global de áreas ainda pode rolar horizontalmente. Refinamentos visuais de comandos, inspetor, camadas e momentos ficam como oportunidades futuras.

Permanecem as limitações da versão anterior: histórico em memória limitado a 60 entradas por documento; H07; cobertura parcial dos campos/operações no histórico de autoria; limitações ambientais do seletor nativo, IME e tecnologias assistivas, sem certificação; Core real e fluxos remotos não certificados. As pendências de cópia fisicamente independente e acesso SSH continuam operacionais e não bloqueiam esta entrega local.

A geração de arte por IA permanece excluída.

## Utilização e recuperação

Extraia o ZIP preservando os caminhos. Na pasta extraída, use Python 3 para iniciar `python3 -m http.server 8791 --bind 127.0.0.1` e abra `http://127.0.0.1:8791/`. Mantenha o servidor restrito à máquina local e não use `file://`. Preserve cópias `.hdocs` antes de adotar o pacote em projetos reais.

Confira o hash externo do ZIP em `PACKAGE_SHA256SUMS` e os arquivos internos em `SHA256SUMS`. `VERSION.json` identifica tag e commit. Para recuperar o código, use a tag `0.1.0-internal.2` ou o bundle Git preservado com esta entrega. `0.1.0-internal.1` permanece como ponto anterior de recuperação. Antes de trocar de versão, preserve documentos e armazenamento do navegador; não limpe os dados locais.
