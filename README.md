# Aménagement utilitaire FireFalck

Ce dépôt monorepo héberge le configurateur 3D de véhicules pompiers FireFalck. Cette première étape
de mise en place installe l’infrastructure commune (pnpm workspace, linting, tests, documentation) qui
servira de base aux développements fonctionnels ultérieurs.

## Structure du dépôt

- `apps/` — Applications finales (web PWA, wrapper Electron).
- `packages/` — Bibliothèques partagées (moteur métier, UI, données, scripts).
- `docs/` — Documentation produit et technique.
- `e2e/` — Tests end-to-end Playwright.
- `examples/` — Projets d’exemple.
- `.github/workflows/` — Intégration continue.

## Démarrage rapide

1. Installer pnpm (`npm install -g pnpm`).
2. Installer les dépendances : `pnpm install`.
3. Vérifier l’infrastructure : `pnpm lint`, `pnpm test` (stub pour le moment).

Les étapes suivantes apporteront l’application web, les données, le moteur métier et les tests complets.
