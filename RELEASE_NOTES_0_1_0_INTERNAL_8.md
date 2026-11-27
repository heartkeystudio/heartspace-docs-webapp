# Heartspace Docs 0.1.0-internal.8

**Entrega interna — B3: Esboços e Anotações**

B3 acrescenta desenho simples e anotações de autoria ao Editor de Cena. Lápis, borracha de traço inteiro, cor, espessura, setas, marcas e notas permitem registrar ideias diretamente no palco. Esboços permanecem editáveis e participam da composição; anotações podem ficar livres ou vinculadas a elementos, acompanham sua posição e se desanexam com segurança quando a camada é removida.

O formato autoral v6 é opt-in. Documentos antigos não evoluem incidentalmente; a primeira operação que necessita de v6 pede confirmação e explica incompatibilidade com versões anteriores e indisponibilidade de sincronização remota. Remover esboços ou notas não rebaixa o formato. Salvamento local e sincronização permanecem distintos; suporte remoto v6 continua indisponível.

Na apresentação e exportação ao jogador, esboços visuais são preservados e anotações e seus metadados autorais são omitidos. Nenhuma entidade narrativa ou vínculo de gameplay é criado automaticamente.

## Verificações desta entrega

- 135/135 testes automatizados estritos aprovados.
- Nove cenários B3 únicos aprovados na matriz local do editor, com eventos de ponteiro simulados e documentos descartáveis.
- O pacote completo 0.1.0-internal.7 rejeitou um arquivo v6 e preservou a fonte de teste e o documento v1 que já estava aberto.
- Falha simulada de capacidade no armazenamento preservou a última cópia recuperável e foi apresentada como erro, não como salvamento concluído.
- O cenário representativo de 32 traços com 512 pontos cada carregou e renderizou sem perda; a medição anterior foi de 908 ms. Não é certificação de projetos extensos reais.

## Limitações conhecidas

- Não houve validação com canetas especializadas, IME ou tecnologias assistivas nesta parcela.
- Desempenho em projetos reais extensos permanece pendente; o dimensionamento sintético de até 80 elementos e 2.048 pontos por traço produziu um arquivo de cerca de 17,4 MB.
- A disponibilidade de armazenamento do navegador varia. Falhas são comunicadas, e a última cópia local concluída é preservada; mantenha também um arquivo .hdocs independente.
- Sincronização remota v6 não está habilitada; a política geral de evolução do formato permanece pendente.
- Permanecem oportunidades de refinamento na descoberta dos instrumentos, indicação da intenção ativa, tipografia das notas, contornos de seleção e integração visual dos instrumentos de blocagem.

A exclusão de geração de arte por IA permanece inalterada. B4–B6 não fazem parte desta versão.
