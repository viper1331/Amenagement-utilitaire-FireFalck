import { degToRad, Vector3 } from './vector';

export interface Quaternion {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export const quaternionFromEuler = (rotationDeg: Vector3): Quaternion => {
  const rx = degToRad(rotationDeg.x) / 2;
  const ry = degToRad(rotationDeg.y) / 2;
  const rz = degToRad(rotationDeg.z) / 2;

  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);

  return {
    x: sx * cy * cz + cx * sy * sz,
    y: cx * sy * cz - sx * cy * sz,
    z: cx * cy * sz + sx * sy * cz,
    w: cx * cy * cz - sx * sy * sz,
  };
};
