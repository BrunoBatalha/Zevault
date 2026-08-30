# React + TypeScript + Vite

## Sincronização E2EE

A sincronização entre dispositivos usa Firebase Anonymous Auth e Firestore. O backup cifrado é dividido em chunks binários temporários de até 700 KiB, remontado no receptor e apagado após a importação. Copie `.env.example` para `.env.local` e preencha as variáveis do projeto Firebase. Sem essas variáveis, o aplicativo continua local-first e a sincronização fica desabilitada.

Antes de usar em produção:

- habilite Anonymous Authentication, Firestore e App Check no console;
- publique `firestore.rules` e o TTL declarado em `firestore.indexes.json`;
- valide o fluxo com dois navegadores usando os emuladores definidos em `firebase.json`;
- confirme no Firestore as políticas TTL de `syncSessions.transferExpiresAt` e `syncChunks.expiresAt`.

As chaves ECDH são efêmeras e ficam somente na memória. Recarregar ou fechar a página invalida a transferência em andamento.

Para testar contra um projeto Firebase real no `localhost`, registre um token em App Check → Gerenciar tokens de depuração e configure `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` somente no `.env.local`. Esse token nunca deve ser publicado ou incluído no bundle de produção.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
