# Guide de développement

## Prérequis

- Node.js >= 18.17
- pnpm >= 8

## Installation

```bash
pnpm install
```

Ensuite :

```bash
pnpm -w run setup
```

Cette commande vérifie les données (`validate:data`) puis construit la PWA (`@app/web build`).

## Scripts pnpm

- `pnpm --filter @app/web dev` — serveur Vite (http://localhost:5173).
- `pnpm --filter @app/web build` — build PWA (Vite).
- `pnpm --filter @app/web preview` — prévisualisation du build.
- `pnpm --filter @app/electron build` — compilation du wrapper Electron (TypeScript → `apps/electron/dist`).
- `pnpm --filter @app/electron start` — lance Electron sur le build web.
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — qualité globale.
- `pnpm e2e` — scénarios Playwright (le serveur Vite est démarré automatiquement).
- `pnpm --filter @pkg/scripts run validate:data` — contrôle des JSON + régénération des JSON Schema.

## Développer sur Electron

1. Construire la PWA (`pnpm --filter @app/web build`).
2. Compiler l’app (`pnpm --filter @app/electron build`).
3. Lancer en local (`pnpm --filter @app/electron start`).
4. Les fichiers `.fpvproj` peuvent être ouverts via le menu Fichier > Ouvrir un projet… ou en les glissant dans
   la fenêtre. Les projets reçus sont relayés au store web par `window.electronAPI`.

Le script `fetch:electron-binaries` reste un no-op conformément aux contraintes (aucun binaire dans le dépôt).

## Ajouter un châssis ou un module

1. Créer un JSON dans `packages/data/vehicles/` ou `packages/data/catalog/` (respect strict des schémas).
2. Lancer `pnpm --filter @pkg/scripts run validate:data` pour valider, régénérer les exports TypeScript et les
   JSON Schema.
3. Ajouter/mettre à jour les tests correspondants si nécessaire.
4. Mettre à jour la documentation (`docs/DATA_SCHEMA.md`, changelog, etc.).

## Flux de contribution

1. `pnpm install`
2. Implémentation + tests unitaires (`pnpm test`) + e2e (`pnpm e2e`).
3. `pnpm build` pour vérifier la production PWA + Electron.
4. Commits puis ouverture de PR. La CI rejouera lint/typecheck/tests/e2e/build et publiera les artefacts.
