# Aménagement utilitaire FireFalck

Ce dépôt monorepo héberge le configurateur 3D de véhicules pompiers FireFalck. Les premières briques
sont désormais en place : infrastructure pnpm, jeux de données châssis normalisés et catalogue
modules validés par Zod/JSON Schema, ainsi qu’un projet d’exemple immédiatement exploitable pour les
tests à venir.

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
3. Valider les données : `pnpm run validate:data` génère les JSON Schema et vérifie véhicules/modules.
4. Lancer les tests unitaires actuels : `pnpm test` (inclut les tests de cohérence des schémas).

Les prochaines étapes introduiront le moteur métier, la scène 3D et les scénarios E2E. Les données et
schémas publiés ici servent de base contractuelle pour ces développements.
