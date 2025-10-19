# Architecture du configurateur FireFalck

Cette documentation décrit la structure globale du monorepo. Elle sera complétée au fil des étapes.

## Vue d’ensemble

- **apps/web** : Application PWA React/Three.js (à implémenter dans les prochaines étapes).
- **apps/electron** : Wrapper Electron optionnel pour usage desktop.
- **packages/core** : Moteur métier (collisions, règles, exports).
- **packages/ui** : Bibliothèque de composants UI réutilisables.
- **packages/data** : Schémas de données et catalogues normalisés.
- **packages/scripts** : Scripts Node.js pour la validation et la génération d’assets.
- **e2e** : Tests Playwright orchestrant des scénarios utilisateur clés.

## Flux de développement

1. Les packages exposent des API TypeScript strictes.
2. Les apps consomment ces packages via pnpm workspaces.
3. Les pipelines CI exécutent linting, type-check, tests unitaires et E2E, puis la construction de la PWA.

Des diagrammes détaillés et la modélisation des flux seront ajoutés lors de l’implémentation des fonctionnalités.
