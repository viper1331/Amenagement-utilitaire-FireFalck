# Aménagement utilitaire FireFalck

Ce dépôt pnpm regroupe le configurateur 3D pompier FireFalck : moteur métier, PWA Three.js, wrapper
Electron optionnel, données châssis normalisées et scénarios de tests automatisés.

## Démarrage rapide

1. Installer pnpm (`npm install -g pnpm` si besoin).
2. Installer les dépendances et préparer la PWA :
   ```bash
   pnpm install
   pnpm -w run setup
   ```
3. Lancer le serveur web :
   ```bash
   pnpm --filter @app/web dev
   ```
4. Ouvrir http://localhost:5173, charger `examples/demo_project.json`, déplacer des modules et tester les
   exports (BOM, DXF, OBJ, glTF, PDF).

Après le premier chargement, la PWA fonctionne hors-ligne grâce au service worker et à IndexedDB.

## Scripts utiles

| Commande | Description |
| --- | --- |
| `pnpm -w run setup` | Installation + validation des données + build PWA |
| `pnpm lint` | ESLint sur l’ensemble du monorepo |
| `pnpm typecheck` | Vérification TypeScript stricte |
| `pnpm test` | Tests unitaires (Vitest) pour données, moteur, UI, web |
| `pnpm e2e` | Tests Playwright (3 scénarios utilisateur complets) |
| `pnpm build` | Build agrégé (PWA + packages + Electron) |
| `pnpm preview` | Prévisualisation de la PWA construite |
| `pnpm --filter @pkg/scripts run validate:data` | Validation des schémas et JSON |

## Version Electron optionnelle

1. Construire la PWA : `pnpm --filter @app/web build` (génère `apps/web/dist`).
2. Compiler Electron : `pnpm --filter @app/electron build`.
3. Démarrer : `pnpm --filter @app/electron start`.

Le wrapper charge automatiquement le build `apps/web/dist`, gère l’ouverture de fichiers `.fpvproj` (glisser-déposer,
menu « Ouvrir un projet… » ou double-clic associé) et relaie les importations au store web.

## Données normalisées

Les six châssis demandés sont disponibles dans `packages/data/vehicles/` et le catalogue de 13 modules dans
`packages/data/catalog/`. Le projet de démonstration prêt à charger se situe dans `examples/demo_project.json` ainsi
que dans `apps/web/public/examples/demo_project.json` pour la PWA.

## Tests et qualité

- 31 tests Vitest couvrant collisions, dégagements, masses/essieux, exports texte et conversions unités.
- 3 scénarios Playwright : placement & export, chargement démo avec bascule FR/EN + FPV + sauvegarde, stress 30
  modules vérifiant les alertes critiques.
- CI GitHub Actions exécutant lint, typecheck, tests, E2E et builds.

Consultez `docs/USER_GUIDE.md` pour un tutoriel pas-à-pas et `docs/QA_CHECKLIST.md` pour la checklist de validation.
