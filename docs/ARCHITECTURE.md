# Architecture du configurateur FireFalck

Cette documentation présente la structure courante du monorepo et les responsabilités clés de chaque
paquet.

## Vue d’ensemble

- **apps/web** — Application PWA React + Three.js. Charge automatiquement le projet de démonstration, gère
  l’état via Zustand, expose catalogue/propriétés/alerts, visualise le couloir par une surbrillance turquoise et
  orchestre les exports (BOM, DXF, OBJ, glTF, PDF).
- **apps/electron** — Wrapper desktop facultatif. Lance la PWA packagée (`apps/web/dist`), relaie
  l’ouverture de fichiers `.fpvproj` et applique un menu minimal (ouvrir, recharger, outils, aide).
- **packages/core** — Moteur métier : collisions AABB/OBB, dégagements, couloirs, priorisation, masses et
  essieux, exports texte. `evaluateProject` renvoie `ProjectEvaluation` consumée par le front.
- **packages/ui** — Bibliothèque de composants accessibles (Toolbar, Panels, champs, icônes SVG inline,
  thèmes clair/sombre) utilisée par la PWA.
- **packages/data** — Schémas Zod + JSON Schema pour `VehicleBlueprint`, `EquipmentModule`, `Project`. Fournit
  les six châssis officiels, le catalogue 13 modules et le projet exemple versionné.
- **packages/scripts** — Scripts Node (`validate:data`, `fetch:assets`, `generate:thumbs`) utilisés dans la CI.
- **e2e** — Projet Playwright pilotant la PWA réelle via Vite, avec trois scénarios utilisateur critiques.
- **examples** — Jeux de projets prêts à charger (dont `demo_project.json`).

## Flux de données

1. Les schémas Zod valident chaque fichier JSON au build (`pnpm --filter @pkg/scripts run validate:data`).
2. `packages/core` consomme les blueprints et modules pour calculer collisions, KPI et exports.
3. `apps/web` récupère les données, instancie l’éditeur 3D (Three.js + TransformControls + PointerLock) et
   synchronise les règles métiers en temps réel.
4. `apps/electron` charge la PWA bâtie et transmet les projets ouverts via `window.electronAPI`.
5. La CI (`.github/workflows/ci.yml`) exécute lint, typecheck, tests Vitest, tests Playwright puis build.

## Persistances et offline

- IndexedDB (`idb-keyval`) conserve le dernier projet chargé et l’autosave utilisateur.
- Le service worker `apps/web/public/sw.js` met en cache l’index, la démo et les icônes pour un usage offline.
- L’export JSON (`downloadProjectFile`) génère des fichiers `.fpvproj` compatibles web et Electron.

## Tests

- `packages/core`: 31 tests couvrant géométrie, masse, scoring et exports.
- `apps/web`: tests UI via Testing Library (rendu du shell, i18n, stores).
- `packages/ui`: tests de composants unitaires.
- `e2e`: 3 scénarios Playwright couvrant création, exports, FPV, bascule langue, stress alertes.
