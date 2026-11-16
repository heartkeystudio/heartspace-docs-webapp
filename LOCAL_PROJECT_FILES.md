# Docs — arquivos locais e recuperação (fatia 2)

A fatia 3 acrescenta vínculos com recursos do projeto, mantendo as mídias no
arquivo portátil e conferindo suas versões fixadas. Ver `PROJECT_ASSETS.md`.

A fatia 4 acrescenta fila e recuperações privadas de sincronização. O `.hdocs`
normal salva a fonte atual; versões protegidas podem ser exportadas separadamente
pela Revisão. Ver `SYNC_REVISIONS.md` para escopo e aplicação do contrato remoto.

## Uso

- **Novo projeto local…**, em Ações, cria uma área vazia e independente.
- O ícone **Abrir projeto**, **Ações → Abrir projeto…** ou **Ctrl/Cmd+O** abre um
  arquivo `.hdocs`. A área anterior permanece na recuperação local.
- O ícone **Salvar projeto** ou **Ctrl/Cmd+S** salva a fonte completa.
- **Ações → Salvar projeto como…** ou **Ctrl/Cmd+Shift+S** permite outro destino.
- **Ações → Recuperar projeto…** lista cópias locais, a sessão anterior e as
  fontes preservadas de migração. Recuperar cria outra área; não sobrescreve a
  cópia escolhida.

Ao entrar pelo endereço comum do Docs, sem pedido de projeto/login, a área local
abre sem exigir conta. A conexão online é uma ação explícita em **Conectar ao
HeartSpace**; pedidos do Dashboard, links com projeto e callbacks de login
continuam abrindo o fluxo online.

O arquivo contém livros/pranchetas, capítulos/seções, texto, planejamento,
traduções, personagens, variáveis, glossário, cenas, animações, áudio e texturas
efetivamente referenciados. Inclui também documentos arquivados e na lixeira.
Preferências de interface, credenciais, permissões, vínculos de sync e o histórico
remoto não fazem parte da fonte portátil. Templates pessoais continuam sendo
preferências do dispositivo.

## Salvamento direto e download

Quando o navegador oferece seletores de arquivos e permissão de escrita, o Docs
guarda o handle somente em memória. Salvar novamente atualiza o arquivo após
`write` e `close`; cancelar/recusar a permissão mantém o documento aberto.
**Salvar como** escolhe outro destino. Reabrir a página não reaproveita uma
permissão de escrita oculta; o arquivo precisa ser escolhido novamente.

Sem esse recurso, o Docs inicia o download de uma cópia `.hdocs`. A mensagem é
**Download do projeto iniciado**: ela não confirma que o navegador terminou de
gravar no sistema de arquivos. Nomeação, cancelamento e arquivos repetidos ficam
sob os controles de download do navegador.

A montagem usa um snapshot coerente da autoria. Se a pessoa continuar editando
durante a preparação, o arquivo contém esse snapshot e a interface informa que
existem alterações mais recentes. Reabrir um projeto não envia seu conteúdo ao
Supabase nem o associa automaticamente ao projeto online aberto anteriormente.

## Container `.hdocs` v1

É um JSON único, sem compressão e sem código executável de jogador:

```text
format:         heartspace.docs.project-file
schema_version: 1
source:         fonte autoral v1 com referências internas projectAsset
assets:         [{ id, mime, bytes, base64, checksum }]
```

No container, `data-project-asset` identifica imagens do documento;
`projectAsset` substitui dados incorporados de mídia narrativa e referências de
textura. O adaptador reconstitui as representações usadas pelo editor antes de
normalizar o conteúdo. Não passar `container.source` diretamente ao editor sem
essa resolução.

A tabela guarda uma só cópia de cada combinação de MIME e bytes. Nomes e
propriedades de apresentação continuam junto das referências. Imagens de
documentos/texturas são restauradas em novas chaves de IndexedDB, evitando
sobrescrever assets de outros projetos. Mídias narrativas voltam aos registros
compatíveis com o runtime atual. Não há recompressão de imagens ao reabrir.

IDs de projeto, livro, capítulo, sequência, bloco e tradução são mantidos.
Aliases antigos de documento remoto conhecidos pelo cache são convertidos em
referências autorais na cópia portátil. IDs internos de armazenamento de imagem
podem mudar: não são identidade de conteúdo narrativo.

## Conferência na abertura e falhas

- Validar formato, versões, relações e identidades antes de substituir a área.
- Conferir base64, tamanho, tipo real de mídia, imagens estáticas/dimensões e
  integridade dos assets. SHA-256 é utilizado quando Web Crypto está disponível;
  o caminho compatível utiliza CRC32. São verificações de corrupção, não
  assinaturas de autoria ou prova de confiança.
- Remover conteúdo ativo do HTML, eventos, elementos não suportados, URLs CSS e
  atributos fora da lista permitida antes de inserir no editor. Essa proteção
  pertence à abertura local; não declara resolvida a higienização remota do QA.
- Recusar dependências ausentes. Um salvamento incompleto não é apresentado como
  projeto completo. URLs externas de imagens precisam ser incorporadas por uma
  importação suportada; o salvamento não baixa URLs arbitrárias com credenciais.
- Gravar assets preparados em chaves novas e depois confirmar a cópia de trabalho
  do novo projeto. A área anterior só é substituída após essa confirmação.
- Falhas de preparo/gravação preservam a área anterior. Um encerramento durante
  staging pode deixar assets sem referência; não há coleta automática destrutiva.

Proteções de processamento desta implementação: 256 MiB por container, 192 MiB
de mídia decodificada, 24 MiB por asset, até 10 mil assets e estrutura JSON
limitada em profundidade/elementos. Os limites atuais de mídia narrativa e de
decodificação de imagens também se aplicam. São limites técnicos deste leitor,
independentes de assinatura e de franquias online; uma futura revisão do formato
pode permitir pacotes maiores/streaming. O container não promete anonimizar o
conteúdo autoral, legendas ou metadados dos arquivos já existentes.

## Cópia de trabalho e retomada

`project-storage.js` usa o banco `heartspace-docs-projects-v1` com uma transação de
escrita por área em ordem de chamada. A confirmação ocorre no término da
transação. O registro guarda a cópia atual, uma cópia da sessão anterior e a
fonte anterior à migração quando disponível. A lista de recuperação consulta
metadados; não carrega todos os projetos e suas mídias na memória de uma vez.

`localStorage` guarda a indicação do último projeto local e o ponteiro para a
cópia durável. Uma cópia pequena em localStorage é a alternativa quando o
navegador nega IndexedDB, com aviso explícito; abrir um projeto com imagens ou
criar uma área recuperável exige armazenamento local disponível.

A escrita atualiza a memória e é agrupada pela pausa existente do editor. Ao
ocultar/sair, o trecho pendente é capturado. Pendências e falhas entram no estado
informado ao desktop; o navegador recebe uma solicitação de aviso ao fechar com
gravação pendente ou arquivo modificado. O navegador decide se exibe esse aviso.
Encerramento forçado do processo não garante completar a última transação.

As cópias continuam sujeitas a espaço disponível, limpeza dos dados do site,
políticas do navegador e concorrência entre janelas. Isto não é um protocolo de
edição colaborativa local. Arquivos `.hdocs` salvos fora do navegador continuam
sendo necessários como backups independentes.

O editor pode ser executado a partir dos seus arquivos locais com as dependências
presentes. Esta fatia não adiciona instalação PWA/service worker nem garante
abrir pela primeira vez um endereço web sem rede.

## Limite do desktop v1

A janela admitida pelo Core pertence a uma conta/app/projeto, conforme o contrato
existente, e não expõe uma API de arquivos ou troca para projeto standalone.
Por isso abrir, criar e recuperar projetos locais nessa janela ficam desabilitados
com uma explicação; o fluxo local é usado no Docs pelo navegador. Salvar uma cópia
utiliza os recursos disponibilizados pelo navegador/WebView, sem criar uma API
nativa não contratada nem expor caminhos arbitrários.

Ficam pendentes para um contrato próprio: lançamento standalone pelo Core,
associação de extensão no sistema operacional, acesso nativo a pastas, catálogo
compartilhado com Canvas/Beats e sincronização dessa árvore pelo Hub.

## Conferência e aceite

Esta entrega foi conferida por leitura e compilação de sintaxe; a CSP desktop
é regenerada a partir do script atual. Não foram adicionados/executados testes
nem realizadas interações de navegador ou validação em aparelho.

O aceite funcional deve incluir roundtrip com texto/tradução e todas as mídias,
cancelamento de seletor, erro de quota/permissão, arquivo corrompido ou futuro,
edição durante salvamento, recuperação após reabrir, troca entre nuvem/local e
comportamento real dos downloads no WebView. Estes cenários são pendentes de QA,
não resultados já obtidos.
