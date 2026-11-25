# Heartspace Docs 0.1.0-internal.3

Versão interna da HeartKey Studios, consolidada sobre `0.1.0-internal.2` e incluindo A4 — seleção e manipulação coletiva temporária no Editor de Cena. O pacote é produzido a partir da tag anotada e identifica o commit correspondente em `VERSION.json`.

## Novidades de A4

- Seleção múltipla no palco e no painel de Camadas, com adição e remoção de elementos e seleção por área baseada em interseção.
- Movimento, rotação em torno do centro da seleção e escala uniforme de elementos de tipos diferentes.
- Moldura coletiva com controles de transformação e comandos acessíveis por teclado.
- Inspetor identifica o escopo coletivo; propriedades individuais permanecem disponíveis ao selecionar um único elemento.
- Transformações coletivas confirmadas integram-se ao histórico compartilhado de autoria de A2 como uma operação. Cancelamentos e operações sem alteração não criam entradas.
- Identidades, vínculos narrativos e dados de parallax são preservados. Durante a prévia de parallax, transformações coletivas ficam suspensas.

## Validação registrada

As evidências de origem preservadas registram 119/119 testes automatizados estritos. A matriz de navegador foi executada como 55/55 antes do ajuste final de parallax; depois do ajuste, foram executados 10/10 casos direcionados (A4-01–09 e M20). Esses resultados cobrem 56 cenários únicos no conjunto, sem representar uma execução integral de 56/56 no estado final. As validações de navegador utilizam fixture descartável e eventos de ponteiro sintéticos.

A verificação mínima do pacote final está registrada em `verification-results.json` no diretório local da entrega. Ela cobre abertura do pacote, documento de teste, seleção múltipla, transformação coletiva, desfazer e refazer, salvamento/reabertura de cópia e integridade do pacote; não constitui nova auditoria abrangente.

## Limitações e oportunidades conhecidas

Uma seleção mista não oferece edição coletiva de outros campos no inspetor; esses campos permanecem disponíveis durante seleção única. A seleção por área considera interseção visual. Não foram introduzidos grupos persistentes, hierarquias novas, mecanismos de bloqueio ou mudança de formato persistido.

Permanecem oportunidades futuras de refinamento: legibilidade e tamanho dos controles coletivos; prevenção de recorte junto aos limites do palco; diferenciação visual entre contornos individuais, seleção coletiva e regiões interativas; melhor aproveitamento do inspetor durante a seleção múltipla. Não são bloqueadores conhecidos desta versão e não foram implementadas nesta parcela.

As limitações ambientais aceitas continuam pendentes de validação específica: seletor nativo de arquivos, métodos de entrada textual especializados (IME) e tecnologias assistivas. As evidências de navegador utilizam eventos de ponteiro sintéticos, sem certificar hardware, toque ou tecnologias assistivas. A geração de arte por IA permanece excluída.

## Utilização e recuperação

Extraia o ZIP preservando os caminhos. Na pasta extraída, inicie um servidor somente local com `python3 -m http.server 8791 --bind 127.0.0.1` e abra `http://127.0.0.1:8791/`; não use `file://`. Preserve cópias `.hdocs` antes de adotar o pacote em projetos reais.

Confira o ZIP em `PACKAGE_SHA256SUMS` e os arquivos em `SHA256SUMS`. `VERSION.json` identifica tag e commit. Para recuperar o código consolidado, use a tag `0.1.0-internal.3` ou o bundle incluído no registro local; `0.1.0-internal.2` permanece como referência imutável anterior. Preserve documentos e armazenamento local ao trocar de versão.
