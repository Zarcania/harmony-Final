import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'supabase/functions/**', 'src/types/database.types.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': reactPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Sécurité/SEO de base
      'react/jsx-no-target-blank': ['warn', { enforceDynamicLinks: 'always' }],
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
    },
  },
  {
    files: ['src/contexts/BookingContext.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
