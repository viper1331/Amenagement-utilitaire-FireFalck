# Changelog

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
