import { add, cross, dot, scale, subtract, vec3, Vector3 } from '../math/vector';
import { Matrix3, multiplyMatrixVector, rotationMatrixFromEuler, transpose } from '../math/matrix';

export interface Aabb {
  readonly min: Vector3;
  readonly max: Vector3;
}

export interface Obb {
  readonly center: Vector3;
  readonly halfSize: Vector3;
  readonly orientation: Matrix3;
}

export const createAabb = (min: Vector3, max: Vector3): Aabb => ({ min, max });

export const createObb = (center: Vector3, size: Vector3, rotationDeg: Vector3): Obb => {
  const orientation = rotationMatrixFromEuler(rotationDeg);
  return { center, halfSize: scale(size, 0.5), orientation };
};

export const obbToAabb = (obb: Obb): Aabb => {
  const axes = obb.orientation;
  const halfSize = obb.halfSize;
  const corners = [
    vec3(halfSize.x, halfSize.y, halfSize.z),
    vec3(halfSize.x, halfSize.y, -halfSize.z),
    vec3(halfSize.x, -halfSize.y, halfSize.z),
    vec3(halfSize.x, -halfSize.y, -halfSize.z),
    vec3(-halfSize.x, halfSize.y, halfSize.z),
    vec3(-halfSize.x, halfSize.y, -halfSize.z),
    vec3(-halfSize.x, -halfSize.y, halfSize.z),
    vec3(-halfSize.x, -halfSize.y, -halfSize.z),
  ];

  let min = vec3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = vec3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  for (const corner of corners) {
    const world = add(obb.center, multiplyMatrixVector(axes, corner));
    min = vec3(Math.min(min.x, world.x), Math.min(min.y, world.y), Math.min(min.z, world.z));
    max = vec3(Math.max(max.x, world.x), Math.max(max.y, world.y), Math.max(max.z, world.z));
  }

  return { min, max };
};

export const intersectsAabb = (a: Aabb, b: Aabb): boolean =>
  a.min.x <= b.max.x && a.max.x >= b.min.x &&
  a.min.y <= b.max.y && a.max.y >= b.min.y &&
  a.min.z <= b.max.z && a.max.z >= b.min.z;

const getAxesFromObb = (obb: Obb): readonly Vector3[] => obb.orientation;

const projectObbOnAxis = (obb: Obb, axis: Vector3): { min: number; max: number } => {
  const normalized = (() => {
    const length = Math.sqrt(dot(axis, axis));
    return length === 0 ? axis : scale(axis, 1 / length);
  })();

  const axisX = dot(obb.orientation[0], normalized);
  const axisY = dot(obb.orientation[1], normalized);
  const axisZ = dot(obb.orientation[2], normalized);

  const radius =
    Math.abs(axisX) * obb.halfSize.x + Math.abs(axisY) * obb.halfSize.y + Math.abs(axisZ) * obb.halfSize.z;
  const centerProjection = dot(obb.center, normalized);
  return { min: centerProjection - radius, max: centerProjection + radius };
};

const overlapOnAxis = (a: Obb, b: Obb, axis: Vector3): boolean => {
  if (axis.x === 0 && axis.y === 0 && axis.z === 0) {
    return true;
  }
  const projectionA = projectObbOnAxis(a, axis);
  const projectionB = projectObbOnAxis(b, axis);
  return projectionA.min <= projectionB.max && projectionA.max >= projectionB.min;
};

export const intersectsObb = (a: Obb, b: Obb): boolean => {
  const axes: Vector3[] = [];
  axes.push(...getAxesFromObb(a));
  axes.push(...getAxesFromObb(b));

  const aAxes = getAxesFromObb(a);
  const bAxes = getAxesFromObb(b);

  for (const axisA of aAxes) {
    for (const axisB of bAxes) {
      axes.push(cross(axisA, axisB));
    }
  }

  for (const axis of axes) {
    if (!overlapOnAxis(a, b, axis)) {
      return false;
    }
  }
  return true;
};

export const transformPointToLocal = (obb: Obb, point: Vector3): Vector3 => {
  const relative = subtract(point, obb.center);
  const orientationT = transpose(obb.orientation);
  return multiplyMatrixVector(orientationT, relative);
};

export const pointInsideObb = (obb: Obb, point: Vector3): boolean => {
  const local = transformPointToLocal(obb, point);
  return (
    Math.abs(local.x) <= obb.halfSize.x + 1e-6 &&
    Math.abs(local.y) <= obb.halfSize.y + 1e-6 &&
    Math.abs(local.z) <= obb.halfSize.z + 1e-6
  );
};
