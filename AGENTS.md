# AGENTS.md

## Visão geral

Zevault é um MVP de controle financeiro local-first, identificado na interface e no código como **Financier Pro**. É uma SPA em React que armazena os dados financeiros no navegador, via IndexedDB.

## Stack e comandos

- React 19, TypeScript estrito, Vite, Tailwind CSS v4 e React Router.
- Testes: Vitest, Testing Library e fake-indexeddb.
- Gráficos: Recharts. Ícones: Lucide.

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

Use os aliases configurados no `vite.config.ts` e `tsconfig.app.json` (`@/`, `@/core`, `@/features`, `@/components` e `@/types`) em vez de caminhos relativos longos.

## Organização do código

- `src/features/`: telas e regras de cada domínio (contas, cartões, transações, categorias, dashboard, configurações e landing).
- `src/components/`: componentes visuais reutilizáveis, layout e modais compartilhados.
- `src/core/database/`: wrapper nativo do IndexedDB e definição dos stores.
- `src/core/hooks/`: hooks de dados, tema e armazenamento local.
- `src/core/i18n/`: idiomas e formatadores de data/moeda.
- `src/types/`: entidades do domínio e tipos compartilhados.

Mantenha a regra de negócio próxima à feature. Extraia para `core` apenas código realmente compartilhado e independente de tela.

## Dados e regras financeiras

- O banco é `FinancierProDB_Native`, com stores `accounts`, `categories`, `costCenters`, `transactions` e `creditCards`.
- A fonte de verdade é o IndexedDB; `useData()` recarrega os consumidores após mutações do wrapper `db`.
- Toda alteração de saldo deve considerar tipo (`income`, `expense`, `transfer`) e status (`paid`, `pending`). Não atualize uma transação sem verificar o efeito no saldo da conta.
- Despesas de cartão são transações pendentes separadas por parcela, agrupadas por `groupId`; preserve esse agrupamento ao editar ou excluir parcelas.
- Ao modificar o schema, incremente `DB_VERSION` e crie a migração em `onupgradeneeded`. Não quebre bancos existentes silenciosamente.
- Exportação/importação de backup deve incluir todos os stores e validar a estrutura antes de limpar dados existentes.

## UI, i18n e acessibilidade

- Use Tailwind e os componentes em `src/components/ui` antes de criar estilos ou primitives duplicados.
- Todo texto novo visível ao usuário deve existir em `pt-BR.json`, `en-US.json` e `es-ES.json`; use `useI18n()` e não strings literais em componentes novos.
- Preserve suporte a tema claro/escuro e layouts responsivos.
- Para modais e botões, mantenha rótulos acessíveis e fluxo de teclado coerente.

## Limites atuais do produto

- Não há autenticação real: o estado de acesso é apenas uma flag no `localStorage`.
- Não há backend neste repositório. `DataShare` depende de um serviço externo em `http://localhost:3000/share`.
- Não existe criptografia de dados implementada. Não faça ou mantenha alegações de criptografia sem implementar e testar o mecanismo.
- `db.seed()` ainda não popula os dados definidos em `seeding.ts`; não assuma que o reset recria dados de exemplo.

## Antes de concluir uma alteração

1. Rode o teste mais específico da feature afetada.
2. Rode `npm run lint` e `npm run build` para mudanças TypeScript/React mais amplas.
3. Teste manualmente os fluxos que alteram saldo, parcelas, importação ou exclusão.
4. Não altere dados do IndexedDB do usuário durante desenvolvimento ou testes manuais sem autorização explícita.

## Versionamento e pushes

- Antes de cada `git push`, incremente a versão exibida em `src/core/utils/constants.ts` e mantenha-a idêntica à de `package.json`, no formato `vX.Y.Z` (SemVer).
- Atualize `X` para mudanças incompatíveis, `Y` para novas funcionalidades compatíveis e `Z` para correções compatíveis. Cada push deve aumentar exatamente um desses componentes.
