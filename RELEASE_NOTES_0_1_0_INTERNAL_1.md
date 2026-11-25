# Heartspace Docs 0.1.0-internal.1

Versão funcional para uso interno da HeartKey Studios. Consolida Etapa 0, A1 e A2
aprovadas em 25/11/2026. A3 e parcelas posteriores não estão incluídas.

## Conteúdo

- Histórico textual por documento, mantido ao alternar documentos durante a sessão.
- Cronologia coordenada de Escrever e comandos existentes de Cena: texto de título
  e subtítulo, transformações, duplicação/remoção/ordem e animação no alcance A2.
- Confirmação única de campos contínuos e arraste; cancelamento e ausência de
  mudança não geram entradas. Conflitos preservam o estado atual e são comunicados.
- S0-P01/P02: validação de mídia na exportação e importação pelo perfil suportado.
- S0-P03: Salvar como renomeia somente após gravação confirmada ou download iniciado,
  conservando nome e alterações em caso de falha/cancelamento.
- S0-P04/P05: isolamento de autoria e consistência dos comandos de formatação.

Evidências aprovadas: 119/119 automatizados, 11/11 compatibilidade, 24/24 recuperação,
41/41 cenários no editor, fechamento/reabertura e teclado real. O ensaio do pacote
final é registrado separadamente junto à distribuição. Contratos e formatos não
mudam; não há migração nem geração de arte por IA.

## Limitações conhecidas

Histórico de sessão somente em memória, até 60 entradas por documento. Salvar não
apaga o histórico; fechar/reabrir inicia nova sessão. Recuperação de trabalho não
salvo não recupera undo/redo. Com foco textual, usar o comando explícito de autoria
quando a próxima operação pertencer a outra superfície; não se saltam operações.

Ainda fora do histórico coordenado validado: alinhamento/formatação rica de
título/subtítulo, viewport global, cadastros compartilhados de recursos,
personagens/variáveis, cobertura integral de inspetores narrativos e ações remotas.
Zoom, seleção, navegação e reprodução não são ações autorais de Cena.
Listas sem identidade estável são atômicas e conflitos não têm mesclagem automática.
Repetição de tecla mantida não tem agrupamento próprio. Nem toda opção/importação
assíncrona conectada às rotas foi validada individualmente. Ponteiros/composição
sintéticos não certificam todos os dispositivos reais.

H07 permanece na herança existente: uma sobrescrita de valor coincidente pode
perder sua intenção ao reconstruir diferenças. Esta versão não anuncia o sistema
futuro de herança explícita nem substituição assistida ou novos grupos.

Seletor nativo, IME e tecnologias assistivas são pendências ambientais aceitas,
sem certificação ou renúncia à acessibilidade. Core real e fluxos remotos não são
certificados pelos testes locais. Não se promete funcionamento integral offline.

## Utilização interna

Extraia o ZIP preservando caminhos. Com Python 3 instalado, na pasta extraída use:

```sh
python3 -m http.server 8791 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8791/` no navegador. O servidor fica restrito à máquina local;
o ZIP pode ser copiado pela equipe para suas próprias máquinas. Não use file://.
Pare o servidor com Ctrl+C. Dependências externas existentes podem exigir rede.
Conserve a origem/porta entre usos: o armazenamento local é isolado por origem.
Não exponha este servidor na rede. Este pacote não configura hospedagem ou contas.

Antes de usar projetos reais, conserve cópias .hdocs. Para transportar trabalho,
use Abrir projeto e Salvar projeto/Salvar como. Não confunda início de download
com confirmação de gravação do arquivo pelo sistema operacional. Evite editar o
mesmo projeto simultaneamente em duas versões durante a troca.

## Identificação e recuperação

`VERSION.json` informa versão, commit e tag. `SHA256SUMS` relaciona todos os arquivos
(exceto ele próprio). O arquivo ZIP possui hash externo junto à distribuição.

Para reinstalar a versão, confira o hash do ZIP e extraia uma nova cópia. Preserve
os documentos e o armazenamento atual antes de trocar de versão; não limpe o
armazenamento do navegador. Abra uma cópia .hdocs quando precisar recuperar autoria.
Undo/redo não é backup nem mecanismo de migração.

A recuperação do código usa o bundle Git independente, a tag 0.1.0-internal.1 e
as instruções de recuperação entregues à equipe. Os fontes não fazem parte do ZIP
estático. O backup anterior à consolidação é privado e contém também os arquivos
não rastreados; deve ser restaurado em outra pasta, nunca sobre trabalho pendente.
