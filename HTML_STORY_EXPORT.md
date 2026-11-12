# Exportação de história HTML

## Uso

Na Central de produção, abra **Sequência** ou **Mapa** e clique em **Exportar**.
Escolha nome, sequência inicial e idioma; clique em **Baixar HTML**. O mesmo
diálogo mantém a opção de baixar o JSON do documento atual.

O arquivo abre diretamente no navegador, sem servidor, conexão ou conta do Docs.
Pode ser enviado a outra pessoa ou servido como uma página HTML em hospedagem
que aceite JavaScript. Sinais externos não executam código; sua presença gera
um aviso na exportação.

A escolha da sequência inicial determina o pacote: todas as opções de escolhas
são seguidas para reunir as sequências alcançáveis, inclusive em outros documentos
carregados no projeto. Ciclos são permitidos; IDs duplicados e destinos ausentes
impedem a exportação. Documentos não conectados ficam fora do arquivo.

O pacote contém os blocos narrativos dessas sequências. Texto comum do documento,
controles de produção, dados da conta, credenciais e documentos completos não são
incluídos. A configuração da aba **Cena** acompanha cada sequência. Quando uma
tradução estiver ausente, usa-se o trecho original e o diálogo informa a quantidade
de fallbacks; traduções desatualizadas também geram aviso.

## Fatias

1. **História jogável — implementada.** Nome e sequência inicial, seleção de idioma,
   diálogos, narração, personagens, escolhas, variáveis, condições, efeitos,
   variações, pausas, modelos de apresentação e reinício. Um único HTML sem assets
   externos. Movimento reduzido do sistema já é respeitado.
2. **Compartilhamento — pendente.** Continuar de onde parou, histórico de falas,
   preferências de velocidade e movimento, acabamento para celular e orientação
   para incorporação em outros sites. Idioma, toque e layout adaptável já possuem
   a base na primeira fatia.
3. **Cena visual — pendente.** Fundos, retratos, posições, transições e pacote ZIP
   para imagens/áudio. Reutilizar o mesmo contrato narrativo.

Godot vem depois dessa sequência.

## Motor e apresentação

- `narrative-runtime.js`: motor sem DOM, rede ou execução de strings. Estados,
  condições, efeitos, resolução de versões, avanço, escolha, restauração,
  reinício e descoberta dos caminhos conectados.
- `narrative-html.js`: apresentador e geração do HTML independente. Embute o
  motor da aplicação e JSON escapado; insere os textos com `textContent`.
- `index.html`: seleção, validação e montagem dos dados do jogo. O simulador
  existente usa o mesmo motor e mantém suas ferramentas de inspeção e histórico.

No HTML: Enter/Espaço/clique revelam ou avançam; setas e números escolhem;
Escape volta ao início. Pausas podem ser puladas. Sinais são ignorados. O final
oferece reinício. Uma escolha sem opções disponíveis apresenta uma mensagem e
permite recomeçar. O estado desta fatia dura apenas a sessão; recarregar ou
reiniciar começa novamente.

A CSP do arquivo impede conexões externas. A exportação não usa `eval`, não
carrega scripts remotos e não transforma textos, expressões ou sinais em código.

## Verificação

Execute `node --test tests/narrative-html.test.cjs` para verificar o motor,
descoberta de caminhos, efeitos, restauração, prioridade das variações,
serialização segura, adaptação de idiomas e controles do player em um DOM
simulado. Esse harness não mede layout nem substitui a conferência visual.

Após mudanças no script inline do editor, atualize a política desktop com
`python3 scripts/generate_desktop_csp.py`.
