# Heartspace Docs 0.1.0-internal.11

Entrega interna de B4.2 — Ocorrências e Associações, baseada na referência
`0.1.0-internal.10`.

## Incluído

- Associação, reassociação, reutilização, desassociação e independência explícita
  de ocorrências de necessidades artísticas compartilhadas.
- Duplicação preservando a identidade compartilhada, localização de ocorrências
  entre sequências e exclusão reversível de necessidades e vínculos.
- Atualização imediata das contagens e consulta de representações reutilizáveis.
- Contexto de projeto limpo ao alternar para um projeto vazio.
- Palco com dimensões próprias, independentes da caixa de diálogo e do conteúdo,
  e confirmação de edição da ficha pelo teclado.
- Atualização de seletores e metadados do inspetor quando uma alteração artística
  ou operação de histórico é notificada.

## Compatibilidade e sincronização

Mantém o schema v7 e a leitura compatível dos formatos anteriores. Não há nova
evolução de formato, migração em massa nem alteração de contrato. A sincronização
remota de v2–v7 continua bloqueada e acompanhada em OI-27; salvamento local não
significa sincronização concluída.

## Evidências

- A bateria automatizada de B4.2 anteriormente aceita registrou 140/140 testes.
- Após os ajustes direcionados de interface, 29 testes automatizados pertinentes
  foram executados localmente: mídia 14/14, fundação B4 5/5 e histórico de autoria
  10/10. Sintaxe e `git diff --check` passaram.
- O fundador confirmou manualmente o palco: ocultar a caixa de diálogo preserva
  as dimensões; inserir e arrastar elementos funciona; sair e retornar à Cena
  preserva o layout sem precisar executar o teste da sequência. A avaliação
  manual de B4.2 também confirmou os fluxos de associação, duplicação,
  independência, desassociação, localização, exclusão e isolamento de projeto.
- A matriz de navegador não foi executada nesta consolidação. O caso B4.2-08 foi
  ampliado para conferir lista, ficha, seletor e inspetor após salvar, desfazer e
  refazer, mas permanece sem execução automatizada no navegador.

## Limitações conhecidas

- O fundador observou que confirmar a edição do nome com Enter ainda não atualiza
  imediatamente todos os nomes visíveis; outra ação pode ser necessária para
  atualizar alguns componentes. Os dados continuam sujeitos ao histórico autoral
  e a limitação não bloqueia esta entrega. Registrar para revisão futura de
  ergonomia e atualização da interface.
- Não houve execução da matriz ampla de navegador nesta entrega.
- As validações de B4.2 utilizaram documentos sintéticos e interações
  automatizadas, além dos fluxos manuais delimitados pelo fundador; não equivalem
  a certificação com projetos reais.

Geração de arte por inteligência artificial permanece excluída.

## Utilização e recuperação

Extraia o ZIP preservando os caminhos e sirva `index.html` por HTTP local; não
abra por `file://`. Confira `VERSION.json`, `SHA256SUMS` e `PACKAGE_SHA256SUMS`.
O registro local da entrega contém pacote, bundles Git, manifesto de recuperação
e `RECUPERACAO.md`. A tag `0.1.0-internal.10` permanece como referência anterior.
Pacotes e bundles não incluem documentos autorais de produção nem dados locais do
navegador; preserve-os separadamente.
