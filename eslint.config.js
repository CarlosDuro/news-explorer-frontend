import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  // Ignorar archivos que no queremos lint
  { ignores: ['eslint.config.js'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // 👉 Aquí declaramos los globals del navegador
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      prettier,
    },
    rules: {
      // Conjuntos recomendados de los plugins
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Ajustes
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
