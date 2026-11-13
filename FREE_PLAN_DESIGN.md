# Docs — uso local, imagens e proposta de plano gratuito

Status: lançamento/divulgação focados no modo local. Online destinado à equipe e a participantes liberados para o beta fechado. Otimização de novas imagens implementada no cliente; cotas comerciais ainda não aplicadas.

## Estratégia atual de distribuição

- **Público geral:** modo local, com foco em estabilidade da edição, recuperação, imagens leves, importação/exportação e backups portáveis. A jornada local deve funcionar sem conta e sem depender da disponibilidade da nuvem.
- **Online:** beta fechado para a equipe e convidados autorizados pelo responsável do produto. A autorização precisa ser efetiva no servidor; esconder um botão não é o controle de acesso. Esta decisão de produto não equivale a uma nova configuração de permissões já publicada.
- **Durante o beta:** observar armazenamento real, crescimento do banco/histórico, volume de requisições, downloads e falhas de sincronização. O orçamento operacional é global à infraestrutura; não há franquia de nuvem pública anunciada.
- **Cotas e monetização:** definir após medir o beta e dimensionar a infraestrutura. Não adicionar bloqueios comerciais de caracteres ou tokens ao modo local nesta etapa.

A hipótese anterior de **250 MiB por conta não foi aprovada** e não é sustentável como promessa pública apoiada apenas no Supabase Free. Seus limites são compartilhados pela aplicação, enquanto banco, Storage e tráfego têm orçamentos distintos. Essa franquia só poderá ser reconsiderada com capacidade e custos dimensionados. A tabela a seguir registra hipóteses exploratórias, sem compromisso para o beta ou para a divulgação.

## 1. O que limitar

O usuário deve conseguir escrever uma história inteira, revisar, traduzir e exportar sem gastar créditos a cada palavra. O limite comercial deve acompanhar o recurso consumido: armazenamento compartilhado, quantidade de projetos sincronizados, colaboração e retenção de histórico.

Não recomendo limite comercial de caracteres nem tokens por autosave. Caracteres não representam bem o custo: traduções, imagens, histórico e respostas de sincronização podem pesar mais. Tokens por edição também tornam o custo imprevisível e incentivam a pessoa a evitar salvar.

| Recurso | Hipótese para avaliação futura | Ao atingir |
| --- | --- | --- |
| Escrita local e exportação | Sem franquia comercial de caracteres/documentos | Alertar sobre capacidade e desempenho do dispositivo; permitir dividir documentos e exportar backups |
| Projetos sincronizados de propriedade da conta | 3 ativos | Criar localmente ou arquivar um projeto antes de sincronizar outro |
| Armazenamento em nuvem | A definir com métricas do beta e orçamento disponível; hipótese de 250 MiB retirada da oferta | Impedir crescimento de mídia; leitura, download, exportação, exclusão e atualizações sem crescimento continuam disponíveis |
| Reserva para texto | Dimensionar junto da franquia; reservar parte do orçamento para documentos/metadados, indisponível para novas imagens | Evita que uma imagem impeça o próximo salvamento de texto; rascunho local continua protegido se o servidor recusar crescimento |
| Histórico | 7 dias, até 30 checkpoints por documento | Compactar/expirar versões antigas; preservar a versão atual. Autosave não cria uma revisão em cada alteração |
| Colaboração | Definir após medir uso real; sugestão inicial de 2 editores por projeto | Permitir leitura/exportação; oferecer aumento de capacidade |
| Texto muito grande | Aviso técnico baseado no tamanho serializado e no tempo de resposta | Sugerir capítulos/sequências ou arquivos separados; não cortar texto nem recusar digitação local |

Estes números não são promessa de capacidade nem configuração já ativa. Validar por custo por conta ativa, tamanho dos documentos com traduções, quantidade de assets e consumo de tráfego. Franquia pertence à conta proprietária para não ser multiplicada criando projetos. Definir explicitamente como projetos compartilhados contam para colaboradores.

O plano pago pode oferecer mais armazenamento, mais projetos/equipe, histórico mais longo, backups e publicação avançada. Edição básica, recuperação do próprio conteúdo e exportação devem continuar úteis no gratuito.

## 2. Imagens: proteção já implementada

`image-optimizer.js` prepara novas imagens antes de gravar no IndexedDB, incorporar em registros de personagens/cenas ou enviar pelo upload de documentos. O navegador gera um raster novo, sem copiar os metadados do arquivo original. Usa WebP; PNG é a alternativa quando a codificação WebP não estiver disponível, preservando transparência.

| Uso | Maior lado | Tamanho desejado | Máximo após otimização |
| --- | --- | --- | --- |
| Documento | 1920 px | 700 KiB | 1,5 MiB |
| Fundo de cena | 1920 px | 900 KiB | 1,5 MiB |
| Retrato | 1024 px | 250 KiB | 512 KiB |

- O tamanho desejado orienta qualidade/dimensões; o teto é verificado antes de persistir. Não se promete uma porcentagem fixa de redução.
- Entrada de até 24 MiB, 40 megapixels e maior lado de até 20 mil pixels como proteções técnicas do processamento. Arquivos passam por validação de assinatura e decodificação; MIME/nome fornecidos não são usados como única validação.
- Processamento sequencial para não decodificar várias imagens grandes simultaneamente. O mesmo arquivo preparado é reutilizado entre cache, envio e exibição.
- O original não é enviado como alternativa quando a otimização falha: a operação informa o erro.
- Imagens animadas requerem outro fluxo; não são achatadas silenciosamente. Esta entrada aceita PNG, JPEG e WebP estáticos.
- Assets já existentes não são recomprimidos ou apagados automaticamente. Uma migração futura deve apresentar estimativa e manter referências recuperáveis.
- Áudio ainda usa seu limite técnico anterior de 8 MiB; não houve nova compressão de áudio.

A otimização reduz o consumo normal. Ela não substitui proteção no servidor: um cliente modificado pode ignorar esse código.

## 3. Proteção real da nuvem

O Storage permite restringir tamanho e tipos por bucket. Permissões de acesso devem ser aplicadas pelas políticas RLS. Isso precisa ser configurado/verificado no ambiente de produção; este trabalho não alterou o bucket nem publicou migrações. Referências: [limites de upload](https://supabase.com/docs/guides/storage/uploads/file-limits), [controle de acesso](https://supabase.com/docs/guides/storage/security/access-control).

Antes de habilitar cotas comerciais:

1. Medir no servidor os bytes reais de documentos, traduções, registros narrativos, versões e mídias. Atualmente fundos/retratos são embutidos nos registros em base64; devem contar para a franquia e depois migrar para assets separados, evitando retransmiti-los em cada edição de nome ou cor.
2. Aplicar permissões e cota em todas as rotas de escrita. Validar upload por tamanho, assinatura e dimensões em serviço confiável; limite MIME do bucket sozinho não prova que uma imagem foi otimizada.
3. Reservar bytes de forma atômica por conta antes de emitir autorização de upload. Concluir ou liberar a reserva; aplicar expiração. Duas abas não podem consumir o mesmo saldo.
4. Atualizações de documentos usam o delta de bytes e comparação de revisão esperada. Reenvios da mesma operação são idempotentes, sem cobrança em duplicidade. Remoções e substituições menores liberam espaço.
5. Contabilizar versões de histórico e reservas junto da mídia. Exclusões da lixeira liberam a franquia conforme retenção explícita; só declarar espaço liberado quando a remoção for concluída.
6. Deduplicar assets por hash no escopo do proprietário/projeto. Coletar somente assets sem referências após um prazo de segurança; não apagar mídia ainda citada em outros documentos ou revisões válidas.
7. Aplicar limites de frequência e concorrência contra abuso no servidor. Responder com motivo, consumo, capacidade, operação afetada e prazo para nova tentativa quando houver limitação temporária.

## 4. Sincronização econômica e previsível

- Salvar localmente durante a edição; agrupar alterações para enviar a versão mais recente. Uma requisição em voo por documento, seguida de uma atualização acumulada, evita concorrência e perda de edições.
- Repetir falhas transitórias com espera progressiva e variação, respeitando `Retry-After`. Respostas de cota/permissão não devem causar um ciclo de tentativas.
- Suspender consultas periódicas de abas ocultas/offline; retomar uma verificação quando voltarem ao primeiro plano. Usar sinais de atualização e leituras incrementais em vez de baixar a biblioteca inteira a cada consulta.
- Desacoplar checkpoints de histórico do autosave. Preservar marcos manuais; criar marcos automáticos por pausa significativa ou janela de trabalho, evitando versões de cada palavra.
- Solicitar respostas mínimas nos envios. Medir também leituras e downloads: tráfego de saída inclui respostas do banco e recuperação de assets, não apenas upload. Referência: [gestão de egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress).
- Manter cache de mídia com deduplicação e limpeza de itens não referenciados, com orçamento próprio. Nunca remover rascunhos não sincronizados para liberar cache. No navegador, usar uma estimativa de armazenamento disponível; os números são aproximados e o sistema pode remover dados do site, portanto oferecer exportação/backup.

## 5. Experiência ao se aproximar do limite

Indicador de uso em Configurações do projeto: armazenamento, projetos ativos e histórico, com os dados do servidor como referência. Avisar em 80% e explicar antecipadamente quais ações param no teto. Mostrar opções de remover mídia sem uso, exportar, arquivar projetos ou ampliar a capacidade.

Se o servidor recusar um salvamento, manter a revisão local como pendente e mostrar **Salvo neste dispositivo; sincronização pausada por limite**. Nunca apresentar o documento como salvo na nuvem sem confirmação. Não apagar dados nem impedir continuar escrevendo.

## 6. Ordem para colocar em produção

1. Instrumentação de uso e relatório interno, sem bloqueios comerciais. Conferir bucket, RLS e limites técnicos.
2. Separar assets narrativos dos registros e consolidar uploads/contagem. Medir custo de armazenamento, histórico, requisições e downloads.
3. Indicador de uso, avisos e fluxo de recuperação de capacidade.
4. Cotas atômicas no servidor, idempotência e proteção de frequência, com aviso e período de adaptação para contas existentes.
5. Calibrar os números e oferecer ampliação paga. Avaliar créditos apenas para operações de custo variável explícito, como serviços de IA, caso venham a existir.
