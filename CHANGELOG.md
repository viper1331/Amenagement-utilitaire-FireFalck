# Changelog

## [0.5.0] - 2024-05-XX
### Added
- Application web complète : PWA Three.js avec catalogue, propriétés, alertes, exports (BOM, DXF, OBJ, glTF, PDF).
- Persistance IndexedDB, service worker offline-first, i18n FR/EN, thèmes clair/sombre, raccourcis clavier.
- Wrapper Electron avec ouverture `.fpvproj`, menu minimal et passerelle `window.electronAPI`.
- Scénarios Playwright (3) couvrant placement & export, bascule FR/EN + FPV + sauvegarde, stress alertes.
- Documentation mise à jour (README, ARCHITECTURE, DEV_GUIDE, USER_GUIDE, QA_CHECKLIST, SHORTCUTS).
- Mise en évidence visuelle du couloir : surbrillance synchronisée avec la largeur minimale et couleur dynamique
  selon la sévérité (vert/bleu, orange, rouge) des alertes couloir.
- Bascule d’affichage du couloir (toolbar + Ctrl/Cmd+Alt+W) persistée dans le projet et synchronisée avec les toasts.
- Export DXF et rapport PDF mentionnant la largeur de couloir et ses alertes pour la traçabilité atelier.
- Ajustement clavier du couloir (Ctrl/Cmd+Alt+↑/↓ avec Shift pour ±100 mm) avec toast de confirmation.

## [0.4.0] - 2024-05-XX
### Added
- Intégration du moteur dans la PWA : bootstrap projet, IndexedDB, toasts, mesure, FPV, hooks de service worker.
- Ajustements TypeScript strict (store Zustand, i18n, thème, base64 glTF) et tests UI web.

## [0.3.0] - 2024-05-XX
### Added
- Moteur `@pkg/core` : collisions AABB/OBB, dégagements, couloirs, scoring, masses/essieux.
- Exporteurs texte (BOM CSV/JSON, DXF, OBJ ASCII, glTF JSON, PDF) + pipeline `evaluateProject`.
- 31 tests Vitest couvrant géométrie, règles et exports.

## [0.2.0] - 2024-05-XX
### Added
- Schémas Zod + JSON Schema pour `VehicleBlueprint`, `EquipmentModule` et `Project`.
- Jeux de données véhicules fournis (6 châssis Renault Master/Trafic et Renault Trucks K).
- Catalogue modules pompier (13 références) validé automatiquement.
- Script `pnpm run validate:data` générant les JSON Schema et contrôlant le projet d’exemple.
- `examples/demo_project.json` conforme aux schémas avec 8 modules pré-positionnés.

## [0.1.0] - 2024-05-XX
### Added
- Initialisation du monorepo pnpm.
- Configuration des outils partagés (TypeScript strict, ESLint, Prettier).
- Documentation de base et pipeline CI stub.
- Structures de dossiers pour apps, packages, e2e et docs.
