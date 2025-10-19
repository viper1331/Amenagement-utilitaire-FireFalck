# Schémas de données

Cette section décrit les structures contractuelles utilisées dans le configurateur. Les définitions
sont implémentées en Zod (`packages/data/src/schemas`) et publiées en JSON Schema (`packages/data/json-schema`).
Chaque fichier JSON du dépôt doit respecter ces schémas, validés via `pnpm run validate:data`.

## VehicleBlueprint

- **Chemin JSON Schema** : `packages/data/json-schema/vehicle-blueprint.schema.json`
- **Implémentation Zod** : `packages/data/src/schemas/vehicle.ts`
- **Champs principaux** :
  - `$schemaVersion` — version de l’enveloppe données.
  - `id`, `label`, `maker`, `family`, `variant`, `year`, `fuel` — identification du châssis.
  - `gvw_kg`, `wheelbase_mm` — masse totale admissible et empattement.
  - `overall` — dimensions extérieures (longueur/largeur/hauteur, valeurs nulles autorisées).
  - `interiorBox` — volume carrossable interne (null pour les PL carrossés).
  - `openings` — largeurs/hauteurs et angles des portes arrière/latérales.
  - `axles`, `axleSpacing`, `bodyworkConstraints` — définition essieux et plages carrosserie PL.
  - `forbiddenZones` — zones interdites (`shape: "box"`, origine/tailles mm, `critical` optionnel).
  - `notes`, `metadata` — informations libres.

## EquipmentModule

- **Chemin JSON Schema** : `packages/data/json-schema/equipment-module.schema.json`
- **Implémentation Zod** : `packages/data/src/schemas/module.ts`
- **Champs principaux** :
  - `$schemaVersion`, `sku`, `name`, `description` — identification catalogue.
  - `bbox_mm` — dimensions de l’encombrement (L × l × h en mm).
  - `mass_kg` — masse unitaire.
  - `clearances_mm` — dégagements requis (front/rear/left/right/top/bottom/extend).
  - `mounting` — mode de fixation (`type`: `floor|wall|ceiling|rail|mixed`, `hardware`, `notes`).
  - `reachPriority` — `high`, `med` ou `low` (logique d’ergonomie).
  - `tags`, `metadata` — catégorisation libre.

## Project

- **Chemin JSON Schema** : `packages/data/json-schema/project.schema.json`
- **Implémentation Zod** : `packages/data/src/schemas/project.ts`
- **Champs principaux** :
  - `$schemaVersion`, `id`, `name`, `description`, `version` — métadonnées projet.
  - `createdAt`, `updatedAt` — ISO 8601.
  - `vehicle` — référence du châssis (`blueprintId`) et marges de charge (`payloadReserve_kg`).
  - `placements` — liste d’instances : `instanceId`, `moduleSku`, `position_mm` (x,y,z),
    `rotation_deg` (rx,ry,rz), indicateur `locked`, `groupId`, `metadata`.
  - `settings` — préférences projet : `language`, `theme`, `unitOptions`, `snap`, `autosave`, `viewport`.
  - `issueOverrides` — levée contrôlée d’alertes.
  - `modulesCatalog` — surcharge optionnelle d’un catalogue embarqué.
  - `metadata`, `notes` — informations libres.

## Flux de validation

1. Ajouter/modifier les fichiers JSON dans `packages/data/vehicles` ou `packages/data/catalog`.
2. Exécuter `pnpm run validate:data` :
   - parse tous les fichiers avec les schémas Zod,
   - garantit l’unicité des `id` et `sku`,
   - vérifie que les exports TypeScript (`vehicleBlueprints`, `equipmentCatalog`) couvrent tous les fichiers,
   - valide `examples/demo_project.json`,
   - régénère les JSON Schema dans `packages/data/json-schema/`.
3. Commiter les fichiers JSON + JSON Schema mis à jour.

Ces schémas servent d’API contractuelle pour le moteur (`packages/core`), l’UI et les tests.
