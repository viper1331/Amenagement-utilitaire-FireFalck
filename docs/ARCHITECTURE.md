# Architecture du configurateur FireFalck

Cette documentation décrit la structure globale du monorepo. Elle sera complétée au fil des étapes.

## Vue d’ensemble

- **apps/web** : Application PWA React/Three.js (à implémenter dans les prochaines étapes).
- **apps/electron** : Wrapper Electron optionnel pour usage desktop.
- **packages/core** : Moteur métier (collisions, règles, exports).
- **packages/ui** : Bibliothèque de composants UI réutilisables.
- **packages/data** : Schémas Zod + JSON Schema, véhicules normalisés et catalogue modules.
- **packages/scripts** : Scripts Node.js (validation des données, génération d’artefacts SVG/JSON).
- **e2e** : Tests Playwright orchestrant des scénarios utilisateur clés.

## Flux de développement

1. Les packages exposent des API TypeScript strictes.
2. Les apps consomment ces packages via pnpm workspaces.
3. Les pipelines CI exécutent linting, type-check, tests unitaires et E2E, puis la construction de la PWA.

## Packages déjà activés

- `packages/data` charge l’ensemble des fichiers JSON depuis `packages/data/vehicles` et `packages/data/catalog`,
  expose les tableaux typés (`vehicleBlueprints`, `equipmentCatalog`) et génère les JSON Schema
  correspondants dans `packages/data/json-schema` via le script `pnpm run validate:data`.
- `packages/scripts` fournit la commande `validate:data` qui s’assure de la conformité des données,
  synchronise les exports TypeScript et garantit la validité du projet d’exemple.

Les diagrammes détaillés et la modélisation des flux seront ajoutés lors de l’implémentation des fonctionnalités.
