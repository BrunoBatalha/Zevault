# Direção de UX para o Zevault

Pesquisa visual realizada no Pinterest em 27/08/2026 com as buscas:

- `money ui ux web design`
- `personal finance dashboard budget planner ui`

## Objetivo da interface

O dashboard deve responder, em poucos segundos, a quatro perguntas reais:

1. Quanto dinheiro está disponível agora?
2. Quanto ainda está comprometido até a próxima entrada?
3. O que precisa da minha atenção hoje?
4. Qual é a ação mais provável que eu quero executar?

Uma interface bonita que só exibe totais e gráficos não resolve essas perguntas. A direção proposta prioriza decisão, confiança e velocidade de lançamento.

## Referências aproveitáveis

### Monexo — Finance Dashboard UI Kit

https://br.pinterest.com/pin/53972895530621840/

- Saldo principal com maior peso visual.
- Ações frequentes junto do saldo, sem depender da navegação lateral.
- Transações recentes e gráfico no mesmo campo de visão.
- Verde escuro transmite estabilidade sem depender do padrão roxo genérico de fintech.

**Usar no Zevault:** hierarquia, densidade moderada e proximidade entre informação e ação.

### Payno — Personal Finance Dashboard

https://br.pinterest.com/pin/347269821291163017/

- Combina saldo, receitas/despesas, atividade recente e próximos pagamentos.
- “Upcoming payments” transforma o dashboard em ferramenta de antecipação.
- Ações rápidas reduzem o caminho para tarefas recorrentes.

**Usar no Zevault:** próximos compromissos e lançamento rápido. Evitar glassmorphism porque reduz contraste e aumenta ruído.

### Finance Dashboard — Clarity Meets Control

https://br.pinterest.com/pin/302022718786289804/

- Organização por blocos de decisão, com controles próximos aos gráficos.
- Contraste suficiente entre resumo e exploração.

**Usar no Zevault:** filtros de período reais e títulos que expliquem claramente a métrica.

### Wise Redesign — Clean Fintech Dashboard UI

https://br.pinterest.com/pin/30610472462961557/

- Linguagem visual contida e boa quantidade de espaço em branco.
- Poucas cores competindo pela atenção.

**Usar no Zevault:** base neutra, números legíveis e cor semântica reservada para estado.

### Budget planners e planilhas pessoais

https://br.pinterest.com/pin/30469734975089172/

- São menos sofisticados visualmente, mas deixam orçamento, categorias e progresso muito explícitos.
- Aproximam o modelo mental de pessoas que já controlam dinheiro em planilhas.

**Usar no Zevault:** mostrar realizado versus planejado quando orçamento estiver disponível. Não inventar metas com dados que o produto ainda não possui.

## Estrutura recomendada

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Bom dia, Ana                         [Buscar] [ + Novo lançamento ] │
├──────────────────────────────────────────────────────────────────────┤
│ DISPONÍVEL AGORA     COMPROMETIDO     LIVRE APÓS CONTAS             │
│ R$ 8.420,00          R$ 2.180,00      R$ 6.240,00                   │
│ 3 contas             até 15 set       cálculo explicado             │
├───────────────────────────────────────────┬──────────────────────────┤
│ Fluxo do período [30 dias ▾]              │ Precisa de atenção       │
│ gráfico com entradas, saídas e saldo      │ 2 vencem nesta semana    │
│                                           │ [Ver pendências]         │
├───────────────────────────────────────────┴──────────────────────────┤
│ Próximos compromissos       [7 dias] [30 dias] [Todos]              │
│ Hoje · Energia · R$ 183,40 · Pendente                [Marcar pago]   │
│ 12 set · Cartão · R$ 1.240,00 · Pendente             [Ver fatura]    │
├──────────────────────────────────────────────────────────────────────┤
│ Gastos por categoria                 Transações recentes [Ver todas]│
└──────────────────────────────────────────────────────────────────────┘
```

No celular, a lateral deve virar navegação inferior com até cinco destinos. “Novo lançamento” deve permanecer acessível como ação primária, sem cobrir conteúdo ou controles.

## Regras de usabilidade

### Confiança financeira

- Todo total precisa dizer qual período e quais estados entram no cálculo.
- Saldo atual, saldo projetado e valor comprometido não podem parecer a mesma coisa.
- Variações percentuais só aparecem quando forem calculadas com dados reais.
- Gráficos vazios devem orientar a próxima ação; não devem deixar um painel de 350 px vazio.
- Verde e vermelho não podem ser o único meio de diferenciar receita e despesa.

### Velocidade

- Um novo lançamento deve começar em um clique e aceitar operação completa por teclado.
- Valores devem abrir teclado numérico em telas móveis.
- O formulário deve revelar campos de cartão, transferência e parcelamento apenas quando necessários.
- A seleção anterior pode servir de sugestão, mas nunca alterar silenciosamente o lançamento.

### Prevenção de erros

- Antes de salvar, exibir o efeito: “reduz Conta Corrente em R$ 120,00”.
- Alteração de status deve dizer o efeito no saldo.
- Parcelas devem deixar claro se a ação afeta uma parcela, as seguintes ou todas.
- Exclusão e importação precisam de resumo do impacto e caminho seguro de cancelamento.

### Acessibilidade e responsividade

- Área de toque mínima de 44 × 44 px.
- Foco visível, ordem de tabulação previsível e Escape para fechar superfícies temporárias.
- Rótulos persistentes em campos financeiros; placeholder não substitui label.
- Gráficos precisam de resumo textual e valores disponíveis sem depender de hover.
- Contraste mínimo WCAG AA e suporte a zoom de 200% sem perda de função.

## Lacunas atuais observadas no código

- O cartão de saldo mostra `+2.5%` fixo; isso reduz a confiança e deve ser removido até existir um cálculo real.
- “Últimos 30 dias” está fixo no seletor, enquanto os dados representam os últimos 30 dias **com movimento**. O rótulo precisa refletir o cálculo ou o cálculo precisa usar dias corridos.
- A tela inicial não traz transações recentes nem ações rápidas, embora sejam os principais trabalhos diários.
- Há três gráficos grandes antes de qualquer lista acionável; a interface informa muito, mas ajuda pouco a decidir.
- A lateral fixa usa margens de 80/256 px sem estratégia móvel visível no layout principal.
- A landing page exibe chaves de tradução cruas e alega backup criptografado/criptografia habilitada, capacidades que não estão implementadas no produto atual.

## Ordem de implementação

1. Corrigir confiança: remover números fictícios, alinhar períodos e retirar alegações não comprovadas.
2. Criar o resumo “disponível / comprometido / livre após contas” com definições explícitas.
3. Adicionar próximos compromissos e transações recentes com ações contextuais.
4. Encurtar o novo lançamento, com campos progressivos e prévia do impacto.
5. Fazer a navegação responsiva e adicionar resumos acessíveis aos gráficos.
6. Só então evoluir identidade visual, animações e detalhes de acabamento.

## Como verificar “usabilidade extremamente superior”

Não é possível sustentar essa afirmação apenas com screenshots. A interface pode ser validada com cinco tarefas e métricas antes/depois:

| Tarefa | Métrica principal |
| --- | --- |
| Saber quanto pode gastar sem comprometer contas | acerto e tempo até a resposta |
| Registrar uma despesa comum | tempo, cliques e taxa de erro |
| Registrar uma compra parcelada | compreensão das parcelas e erros |
| Encontrar e corrigir um lançamento | tempo e sucesso sem ajuda |
| Entender os próximos 30 dias | acerto ao identificar pico e vencimento |

Meta inicial: pelo menos 90% de conclusão sem ajuda, nenhum erro de saldo e redução de 30% no tempo mediano em relação à interface atual.
