# Guide de développement

## Prérequis

- Node.js >= 18.17
- pnpm >= 8

## Installation

```bash
pnpm install
```

## Scripts pnpm

- `pnpm -w run setup` — Installe les dépendances, exécute la validation des données et prépare la build web.
- `pnpm -w run lint` — Exécute ESLint sur l’ensemble des packages.
- `pnpm -w run typecheck` — Lancement des vérifications TypeScript.
- `pnpm -w run test` — Tests unitaires (Vitest) agrégés.
- `pnpm -w run e2e` — Tests end-to-end Playwright.
- `pnpm -w run build` — Construction des artefacts.
- `pnpm -w run preview` — Prévisualisation de la PWA (sera implémenté).
- `pnpm -w run fetch:assets` — Téléchargement ou génération d’assets (no-op tant que non implémenté).

## Roadmap technique

Les étapes suivantes introduiront :

1. Les schémas de données et les catalogues normalisés (**implémentés**).
2. Le moteur métier (packages/core).
3. L’application web (apps/web) avec PWA, i18n, accessibilité et exports.
4. Les scripts spécialisés et le wrapper Electron.

## Maintenir les données

- Ajouter les fichiers véhicules dans `packages/data/vehicles/` et les modules dans `packages/data/catalog/`.
- Mettre à jour `packages/data/src/index.ts` pour exposer toute nouvelle ressource.
- Lancer `pnpm run validate:data` pour s’assurer que :
  - les JSON respectent les schémas,
  - le projet d’exemple reste valide,
  - les JSON Schema sont régénérés.
- Commiter les JSON Schema (`packages/data/json-schema/*.schema.json`) générés automatiquement.

Chaque étape s’accompagnera de tests et de documentation dédiés.
