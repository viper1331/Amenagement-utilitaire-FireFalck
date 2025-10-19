import { createIssue } from './types';
import type { Issue } from './types';
import type { ProjectContext } from '../project/context';
import { add, scale, vec3 } from '../math/vector';
import { intersectsObb } from '../geometry/bounds';

const clearanceKeys = [
  ['front_mm', 0, 1, 'front'] as const,
  ['rear_mm', 0, -1, 'rear'] as const,
  ['left_mm', 1, 1, 'left'] as const,
  ['right_mm', 1, -1, 'right'] as const,
  ['top_mm', 2, 1, 'top'] as const,
  ['bottom_mm', 2, -1, 'bottom'] as const,
];

export const checkModuleClearances = (context: ProjectContext): Issue[] => {
  const issues: Issue[] = [];
  const walkwayHalf = context.walkwayMinWidth_mm / 2;

  for (const module of context.modules) {
    // Walkway check: ensure module footprint does not block the central corridor.
    if (module.aabb.min.y < walkwayHalf && module.aabb.max.y > -walkwayHalf) {
      issues.push(
        createIssue(
          'walkway.blocked',
          `Le module ${module.module.sku} réduit le couloir central (<${context.walkwayMinWidth_mm} mm)`,
          'warning',
          [module.placement.instanceId],
          { walkwayWidth_mm: context.walkwayMinWidth_mm }
        )
      );
    }

    const clearances = module.module.clearances_mm;
    if (!clearances) {
      continue;
    }

    for (const [key, axisIndex, direction, label] of clearanceKeys) {
      const value = clearances[key as keyof typeof clearances];
      if (typeof value !== 'number' || value <= 0) {
        continue;
      }
      const axis = module.obb.orientation[axisIndex];
      const halfSize = module.obb.halfSize;
      let clearanceHalfSize;
      if (axisIndex === 0) {
        clearanceHalfSize = vec3(value / 2, halfSize.y, halfSize.z);
      } else if (axisIndex === 1) {
        clearanceHalfSize = vec3(halfSize.x, value / 2, halfSize.z);
      } else {
        clearanceHalfSize = vec3(halfSize.x, halfSize.y, value / 2);
      }

      const axisExtent = axisIndex === 0 ? halfSize.x : axisIndex === 1 ? halfSize.y : halfSize.z;
      const offset = scale(axis, (axisExtent + value / 2) * direction);
      const center = add(module.obb.center, offset);
      const clearanceObb = {
        center,
        halfSize: clearanceHalfSize,
        orientation: module.obb.orientation,
      };

      for (const other of context.modules) {
        if (other === module) {
          continue;
        }
        if (intersectsObb(clearanceObb, other.obb)) {
          issues.push(
            createIssue(
              'clearance.blocked',
              `La zone ${label} (${value} mm) du module ${module.module.sku} est obstruée par ${other.module.sku}`,
              'critical',
              [module.placement.instanceId, other.placement.instanceId],
              { clearance: label, required_mm: value }
            )
          );
        }
      }
    }

    if (typeof clearances.extend_mm === 'number' && clearances.extend_mm > 0) {
      const axis = module.obb.orientation[0];
      const extensionHalf = clearances.extend_mm / 2;
      const center = add(module.obb.center, scale(axis, module.obb.halfSize.x + extensionHalf));
      const clearanceObb = {
        center,
        halfSize: vec3(clearances.extend_mm / 2, module.obb.halfSize.y, module.obb.halfSize.z),
        orientation: module.obb.orientation,
      };
      for (const other of context.modules) {
        if (other === module) {
          continue;
        }
        if (intersectsObb(clearanceObb, other.obb)) {
          issues.push(
            createIssue(
              'extension.blocked',
              `L'extension (${clearances.extend_mm} mm) du module ${module.module.sku} est bloquée par ${other.module.sku}`,
              'critical',
              [module.placement.instanceId, other.placement.instanceId],
              { extend_mm: clearances.extend_mm }
            )
          );
        }
      }
    }
  }

  return issues;
};
