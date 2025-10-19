module.exports = {
  root: true,
  env: {
    browser: true,
    es2023: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './tsconfig.base.json',
      './packages/*/tsconfig.json',
      './apps/*/tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: [
          './tsconfig.base.json',
          './packages/*/tsconfig.json',
          './apps/*/tsconfig.json',
        ],
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',
  },
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
};
