import type { ProjectContext } from '../project/context';
import type { MassAnalysis } from './mass';
import { clamp, length, vec3, Vector3 } from '../math/vector';

export interface ModuleScoreBreakdown {
  readonly reachPriority: number;
  readonly nearDoor: number;
  readonly cgBalance: number;
  readonly pathClearance: number;
}

export interface ModuleScore {
  readonly instanceId: string;
  readonly total: number;
  readonly breakdown: ModuleScoreBreakdown;
}

const reachWeight = {
  high: 1,
  med: 0.6,
  low: 0.3,
} as const;

const computeDoorPositions = (context: ProjectContext): Vector3[] => {
  const positions: Vector3[] = [];
  const interior = context.vehicle.interiorBox;
  const halfWidth = interior ? interior.width_mm / 2 : 1000;
  const length = interior ? interior.length_mm : 4000;
  const frontX = interior ? interior.length_mm / 2 : length / 2;
  const rearDoor = context.vehicle.openings?.rearDoor;
  if (rearDoor) {
    positions.push(vec3(frontX, 0, rearDoor.height_mm / 2));
  }
  const slidingDoor = context.vehicle.openings?.slidingDoor;
  if (slidingDoor) {
    const offset = slidingDoor.offsetFromRear_mm ?? 0;
    const x = frontX - offset;
    positions.push(vec3(x, halfWidth, slidingDoor.height_mm / 2));
  }
  return positions.length > 0 ? positions : [vec3(frontX, halfWidth, 1000)];
};

const distanceToNearestDoor = (position: Vector3, doors: readonly Vector3[]): number => {
  return doors.reduce((min, door) => Math.min(min, length(vec3(position.x - door.x, position.y - door.y, position.z - door.z))), Infinity);
};

const computePathClearanceScore = (context: ProjectContext, moduleIndex: number): number => {
  const module = context.modules[moduleIndex];
  const walkwayHalf = context.walkwayMinWidth_mm / 2;
  const overlapWidth = Math.max(
    0,
    Math.min(module.aabb.max.y, walkwayHalf) - Math.max(module.aabb.min.y, -walkwayHalf)
  );
  if (overlapWidth <= 0) {
    return 1;
  }
  return Math.max(0, 1 - overlapWidth / context.walkwayMinWidth_mm);
};

export const scoreModules = (context: ProjectContext, mass: MassAnalysis): ModuleScore[] => {
  const doors = computeDoorPositions(context);
  const cgReference = mass.barycenterX_mm;
  const length = context.vehicle.interiorBox?.length_mm ?? 4000;

  return context.modules.map((module, index) => {
    const reach = reachWeight[module.module.reachPriority];
    const nearDoorDistance = distanceToNearestDoor(module.obb.center, doors);
    const nearDoorScore = 1 - clamp(nearDoorDistance / 3000, 0, 1);
    const cgScore = 1 - clamp(Math.abs(module.obb.center.x - cgReference) / (length / 2 || 1), 0, 1);
    const pathScore = computePathClearanceScore(context, index);

    const breakdown: ModuleScoreBreakdown = {
      reachPriority: reach,
      nearDoor: nearDoorScore,
      cgBalance: cgScore,
      pathClearance: pathScore,
    };

    const total = breakdown.reachPriority + breakdown.nearDoor + breakdown.cgBalance + breakdown.pathClearance;

    return {
      instanceId: module.placement.instanceId,
      total,
      breakdown,
    };
  });
};
