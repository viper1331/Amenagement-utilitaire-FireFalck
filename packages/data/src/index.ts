import { z } from 'zod';
import {
  equipmentModuleSchema,
  projectSchema,
  vehicleBlueprintSchema,
  type EquipmentModule,
  type Project,
  type VehicleBlueprint,
} from './schemas';
import { zodToJsonSchema } from 'zod-to-json-schema';

import vsavMaster from '../vehicles/vsav_master_l2h2_etech_2025.json';
import depollutionMaster from '../vehicles/depollution_master_l2h2_etech_2025.json';
import vtuTrafic from '../vehicles/vtu_trafic_l2h1_2025.json';
import vidTrafic from '../vehicles/vid_trafic_l1h1_2025.json';
import fptRenaultK from '../vehicles/fpt_renault_k_4x2_wb3900_euro6.json';
import fptsrRenaultK from '../vehicles/fptsr_renault_k_6x4_wb3900_euro6.json';

import rackAriDouble from '../catalog/rack_ari_double.json';
import rackAriCompact from '../catalog/rack_ari_compact.json';
import drawer1200 from '../catalog/drawer_1200.json';
import drawer800 from '../catalog/drawer_800.json';
import adjustableShelf from '../catalog/adjustable_shelf.json';
import fanMount from '../catalog/fan_mount.json';
import hoseChest from '../catalog/hose_chest.json';
import ladderSupport from '../catalog/internal_ladder_support.json';
import extinguisher12kg from '../catalog/extinguisher_12kg.json';
import extinguisher6kg from '../catalog/extinguisher_6kg.json';
import compactGenerator from '../catalog/compact_generator.json';
import absorbentEpiBin from '../catalog/absorbent_epi_bin.json';
import foldingWorktop from '../catalog/folding_worktop.json';

const vehicleBlueprintData = [
  vsavMaster,
  depollutionMaster,
  vtuTrafic,
  vidTrafic,
  fptRenaultK,
  fptsrRenaultK,
] as const;

const moduleCatalogData = [
  rackAriDouble,
  rackAriCompact,
  drawer1200,
  drawer800,
  adjustableShelf,
  fanMount,
  hoseChest,
  ladderSupport,
  extinguisher12kg,
  extinguisher6kg,
  compactGenerator,
  absorbentEpiBin,
  foldingWorktop,
] as const;

const parseArray = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: readonly unknown[],
): Array<z.infer<Schema>> => {
  return data.map((entry) => schema.parse(entry));
};

export const vehicleBlueprints: VehicleBlueprint[] = parseArray(
  vehicleBlueprintSchema,
  vehicleBlueprintData,
);

export const equipmentCatalog: EquipmentModule[] = parseArray(
  equipmentModuleSchema,
  moduleCatalogData,
);

export const vehicleBlueprintById = new Map<string, VehicleBlueprint>(
  vehicleBlueprints.map((vehicle) => [vehicle.id, vehicle]),
);

export const equipmentModuleBySku = new Map<string, EquipmentModule>(
  equipmentCatalog.map((module) => [module.sku, module]),
);

export const vehicleBlueprintJsonSchema = zodToJsonSchema(
  vehicleBlueprintSchema,
  'VehicleBlueprint',
);
export const equipmentModuleJsonSchema = zodToJsonSchema(
  equipmentModuleSchema,
  'EquipmentModule',
);
export const projectJsonSchema = zodToJsonSchema(projectSchema, 'Project');

export { vehicleBlueprintSchema, equipmentModuleSchema, projectSchema };
export type { VehicleBlueprint, EquipmentModule, Project };
