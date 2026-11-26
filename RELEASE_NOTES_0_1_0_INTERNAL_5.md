# Heartspace Docs 0.1.0-internal.5

## Inclusões

- Conclusão funcional da Etapa A: histórico textual por documento, coordenação entre Escrever e Cena, organização do editor, seleção coletiva e grupos persistentes.
- Controles autorais individuais e coletivos de visibilidade e bloqueio para elementos e grupos aninhados.
- Estados efetivos da hierarquia são indicados no painel de camadas; configurações próprias dos descendentes permanecem preservadas.
- Elementos bloqueados não aceitam edição pelo inspetor ou transformações coletivas incompatíveis. Uma transformação que inclua conteúdo bloqueado é cancelada sem gravação parcial.
- Visibilidade e bloqueio são integrados ao histórico de autoria, com desfazer e refazer.
- Formato autoral v3 opt-in para persistir visibilidade e bloqueio. Documentos v1 e v2 continuam suportados; a evolução de formato é apresentada antes da confirmação e não há downgrade automático.
- A apresentação narrativa e a exportação não recebem metadados de bloqueio autoral.

## Compatibilidade e limitações

- Documentos v1, v2 e v3 são suportados localmente pela nova versão. Versões anteriores sem suporte a v3 rejeitam o documento para evitar perda silenciosa.
- Sincronização remota de documentos v2 e v3 permanece bloqueada enquanto os consumidores remotos não declararem suporte. O estado local é informado separadamente; não representa sincronização concluída. Dependência transversal acompanhada pelo Heartspace Master em OI-27.
- A correção da gravação explícita de visibilidade foi confirmada funcionalmente no ambiente HTTPS. A aplicação hospedada não expõe o hash da revisão servido.
- A validação manual no HTTPS cobriu os fluxos descritos no registro de entrega; não representa execução integral da matriz automatizada de navegador. O harness de navegador não esteve disponível.
- As pendências ambientais aceitas para seletor nativo de arquivos, métodos de entrada textual especializados (IME) e tecnologias assistivas permanecem registradas, sem certificação dessas capacidades ou renúncia aos requisitos de acessibilidade.
- A geração de arte por IA permanece explicitamente excluída.

## Utilização e recuperação

Extraia o pacote preservando os caminhos e sirva os arquivos por HTTP local; não abra `index.html` por `file://`. Confira `PACKAGE_SHA256SUMS`, `SHA256SUMS` e `VERSION.json`. A entrega local contém um bundle Git verificável e o pacote anterior `0.1.0-internal.4` como referência de recuperação. O pacote não contém documentos autorais de produção.
