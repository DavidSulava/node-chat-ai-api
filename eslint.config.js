// eslint.config.js
import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 1️⃣ Ignore patterns – files we do NOT want ESLint to process
  {
    ignores: [
      'node_modules/',
      'dist/',
      'drizzle.config.ts',
      '.eslintignore',
      'src/__tests__/',
    ],
  },

  // 2️⃣ Global language options (Node globals)
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },

  // 3️⃣ Base recommended rules (no need to specify files – they apply everywhere)
  eslint.configs.recommended,

  // 4️⃣ TypeScript‑specific configuration
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript specific: allow unused vars that start with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General JavaScript
      'no-unused-vars': 'off',
      'no-console': ['warn'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Prettier integration (enforces formatting as an ESLint rule)
      'prettier/prettier': 'error',
    },
  },

  // 5️⃣ Disable rules that conflict with Prettier
  prettierConfig,
];