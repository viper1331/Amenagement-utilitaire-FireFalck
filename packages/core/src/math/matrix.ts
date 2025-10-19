import { degToRad, Vector3, vec3 } from './vector';

export type Matrix3 = readonly [Vector3, Vector3, Vector3];

export const identityMatrix = (): Matrix3 => [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)];

export const multiplyMatrixVector = (matrix: Matrix3, vector: Vector3): Vector3 => {
  return vec3(
    matrix[0].x * vector.x + matrix[1].x * vector.y + matrix[2].x * vector.z,
    matrix[0].y * vector.x + matrix[1].y * vector.y + matrix[2].y * vector.z,
    matrix[0].z * vector.x + matrix[1].z * vector.y + matrix[2].z * vector.z
  );
};

export const transpose = (matrix: Matrix3): Matrix3 => [
  vec3(matrix[0].x, matrix[1].x, matrix[2].x),
  vec3(matrix[0].y, matrix[1].y, matrix[2].y),
  vec3(matrix[0].z, matrix[1].z, matrix[2].z),
];

export const rotationMatrixFromEuler = (rotationDeg: Vector3): Matrix3 => {
  const rx = degToRad(rotationDeg.x);
  const ry = degToRad(rotationDeg.y);
  const rz = degToRad(rotationDeg.z);

  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);

  const m00 = cz * cy;
  const m01 = cz * sy * sx - sz * cx;
  const m02 = cz * sy * cx + sz * sx;
  const m10 = sz * cy;
  const m11 = sz * sy * sx + cz * cx;
  const m12 = sz * sy * cx - cz * sx;
  const m20 = -sy;
  const m21 = cy * sx;
  const m22 = cy * cx;

  return [vec3(m00, m10, m20), vec3(m01, m11, m21), vec3(m02, m12, m22)];
};

export const determinant = (matrix: Matrix3): number =>
  matrix[0].x * (matrix[1].y * matrix[2].z - matrix[1].z * matrix[2].y) -
  matrix[1].x * (matrix[0].y * matrix[2].z - matrix[0].z * matrix[2].y) +
  matrix[2].x * (matrix[0].y * matrix[1].z - matrix[0].z * matrix[1].y);
