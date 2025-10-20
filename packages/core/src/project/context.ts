import type { EquipmentModule, Project, VehicleBlueprint } from '@pkg/data';
import { vec3, Vector3 } from '../math/vector';
import { Aabb, createObb, obbToAabb, Obb } from '../geometry/bounds';

export interface ModulePlacementInstance {
  readonly placement: Project['placements'][number];
  readonly module: EquipmentModule;
  readonly obb: Obb;
  readonly aabb: Aabb;
}

export interface ProjectContext {
  readonly project: Project;
  readonly vehicle: VehicleBlueprint;
  readonly modules: readonly ModulePlacementInstance[];
  readonly walkwayMinWidth_mm: number;
}

export const DEFAULT_WALKWAY_MM = 500;

const tupleToVector = (tuple: readonly [number, number, number]): Vector3 => vec3(tuple[0], tuple[1], tuple[2]);

const resolveModule = (
  sku: string,
  catalog: ReadonlyMap<string, EquipmentModule>,
  inlineCatalog: EquipmentModule[] | undefined
): EquipmentModule => {
  if (inlineCatalog) {
    const inline = inlineCatalog.find((entry) => entry.sku === sku);
    if (inline) {
      return inline;
    }
  }
  const module = catalog.get(sku);
  if (!module) {
    throw new Error(`Module SKU inconnu: ${sku}`);
  }
  return module;
};

const createModuleInstance = (
  placement: Project['placements'][number],
  module: EquipmentModule
): ModulePlacementInstance => {
  const position = tupleToVector(placement.position_mm);
  const rotation = tupleToVector(placement.rotation_deg);
  const size = vec3(module.bbox_mm.length_mm, module.bbox_mm.width_mm, module.bbox_mm.height_mm);
  const obb = createObb(position, size, rotation);
  const aabb = obbToAabb(obb);
  return {
    placement,
    module,
    obb,
    aabb,
  };
};

export interface BuildContextOptions {
  readonly walkwayMinWidth_mm?: number;
  readonly modulesCatalog: ReadonlyMap<string, EquipmentModule>;
}

export const buildProjectContext = (
  project: Project,
  vehicle: VehicleBlueprint,
  options: BuildContextOptions
): ProjectContext => {
  const walkwayMinWidth =
    options.walkwayMinWidth_mm ?? project.settings.walkway?.minWidth_mm ?? DEFAULT_WALKWAY_MM;
  const modules: ModulePlacementInstance[] = project.placements.map((placement) => {
    const module = resolveModule(placement.moduleSku, options.modulesCatalog, project.modulesCatalog);
    return createModuleInstance(placement, module);
  });

  return {
    project,
    vehicle,
    modules,
    walkwayMinWidth_mm: walkwayMinWidth,
  };
};
