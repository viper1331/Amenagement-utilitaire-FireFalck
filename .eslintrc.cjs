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
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    },
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',
  },
  overrides: [
    {
      files: [
        'apps/web/**/*.{ts,tsx}',
        'packages/ui/**/*.{ts,tsx}',
      ],
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
      },
    },
  ],
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
};
