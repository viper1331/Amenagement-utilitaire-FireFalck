import type { VehicleBlueprint } from '@pkg/data';
import { vec3 } from '../math/vector';
import { createIssue } from './types';
import type { Issue } from './types';
import type { ModulePlacementInstance, ProjectContext } from '../project/context';
import { Aabb, createObb, intersectsObb, Obb } from '../geometry/bounds';

const computeOverlapVolume = (a: Aabb, b: Aabb): number => {
  const dx = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x));
  const dy = Math.max(0, Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y));
  const dz = Math.max(0, Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
  return dx * dy * dz;
};

const interiorAabbFromVehicle = (vehicle: VehicleBlueprint): Aabb | null => {
  const interior = vehicle.interiorBox;
  if (!interior) {
    return null;
  }
  const halfLength = interior.length_mm / 2;
  const halfWidth = interior.width_mm / 2;
  return {
    min: vec3(-halfLength, -halfWidth, 0),
    max: vec3(halfLength, halfWidth, interior.height_mm),
  };
};

const moduleOutsideInterior = (module: ModulePlacementInstance, interior: Aabb): Issue[] => {
  const issues: Issue[] = [];
  const { aabb } = module;
  if (aabb.min.x < interior.min.x - 1e-6) {
    issues.push(
      createIssue(
        'vehicle.interior.minX',
        `Module ${module.module.sku} dépasse la limite avant`,
        'critical',
        [module.placement.instanceId],
        { axis: 'x', side: 'min' }
      )
    );
  }
  if (aabb.max.x > interior.max.x + 1e-6) {
    issues.push(
      createIssue(
        'vehicle.interior.maxX',
        `Module ${module.module.sku} dépasse la limite arrière`,
        'critical',
        [module.placement.instanceId],
        { axis: 'x', side: 'max' }
      )
    );
  }
  if (aabb.min.y < interior.min.y - 1e-6) {
    issues.push(
      createIssue(
        'vehicle.interior.minY',
        `Module ${module.module.sku} empiète sur la paroi gauche`,
        'warning',
        [module.placement.instanceId],
        { axis: 'y', side: 'min' }
      )
    );
  }
  if (aabb.max.y > interior.max.y + 1e-6) {
    issues.push(
      createIssue(
        'vehicle.interior.maxY',
        `Module ${module.module.sku} empiète sur la paroi droite`,
        'warning',
        [module.placement.instanceId],
        { axis: 'y', side: 'max' }
      )
    );
  }
  if (aabb.max.z > interior.max.z + 1e-6) {
    issues.push(
      createIssue(
        'vehicle.interior.maxZ',
        `Module ${module.module.sku} dépasse la hauteur utile`,
        'warning',
        [module.placement.instanceId],
        { axis: 'z', side: 'max' }
      )
    );
  }
  return issues;
};

const buildForbiddenZoneObb = (zone: VehicleBlueprint['forbiddenZones'][number]): Obb => {
  const size = vec3(zone.size_mm[0], zone.size_mm[1], zone.size_mm[2]);
  const center = vec3(zone.origin_mm[0], zone.origin_mm[1], zone.origin_mm[2]);
  return createObb(center, size, vec3(0, 0, 0));
};

export interface CollisionResult {
  readonly issues: readonly Issue[];
  readonly overlappingPairs: readonly [ModulePlacementInstance, ModulePlacementInstance][];
}

export const checkModuleCollisions = (context: ProjectContext): CollisionResult => {
  const issues: Issue[] = [];
  const overlappingPairs: [ModulePlacementInstance, ModulePlacementInstance][] = [];
  const modules = context.modules;

  for (let i = 0; i < modules.length; i += 1) {
    for (let j = i + 1; j < modules.length; j += 1) {
      const a = modules[i];
      const b = modules[j];
      if (intersectsObb(a.obb, b.obb)) {
        overlappingPairs.push([a, b]);
        const overlap = computeOverlapVolume(a.aabb, b.aabb);
        issues.push(
          createIssue(
            'collision.modules',
            `Collision détectée entre ${a.module.sku} et ${b.module.sku}`,
            overlap > 1 ? 'critical' : 'warning',
            [a.placement.instanceId, b.placement.instanceId],
            { overlapVolume_mm3: overlap }
          )
        );
      }
    }
  }

  const interior = interiorAabbFromVehicle(context.vehicle);
  if (interior) {
    for (const module of modules) {
      issues.push(...moduleOutsideInterior(module, interior));
    }
  }

  const forbiddenZones = context.vehicle.forbiddenZones ?? [];
  const zoneObbs = forbiddenZones.map(buildForbiddenZoneObb);
  zoneObbs.forEach((zone, index) => {
    const descriptor = forbiddenZones[index];
    for (const module of modules) {
      if (intersectsObb(zone, module.obb)) {
        issues.push(
          createIssue(
            descriptor.critical ? 'forbidden.critical' : 'forbidden.zone',
            `Le module ${module.module.sku} intersecte la zone ${descriptor.id}`,
            descriptor.critical ? 'critical' : 'warning',
            [module.placement.instanceId],
            { zoneId: descriptor.id }
          )
        );
      }
    }
  });

  return { issues, overlappingPairs };
};
