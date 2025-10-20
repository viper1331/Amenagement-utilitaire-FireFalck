export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const vec3 = (x: number, y: number, z: number): Vector3 => ({ x, y, z });

export const add = (a: Vector3, b: Vector3): Vector3 => vec3(a.x + b.x, a.y + b.y, a.z + b.z);

export const subtract = (a: Vector3, b: Vector3): Vector3 => vec3(a.x - b.x, a.y - b.y, a.z - b.z);

export const scale = (v: Vector3, scalar: number): Vector3 => vec3(v.x * scalar, v.y * scalar, v.z * scalar);

export const dot = (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vector3, b: Vector3): Vector3 =>
  vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const length = (v: Vector3): number => Math.sqrt(dot(v, v));

export const normalize = (v: Vector3): Vector3 => {
  const len = length(v);
  if (len === 0) {
    return vec3(0, 0, 0);
  }
  return scale(v, 1 / len);
};

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const almostEquals = (a: number, b: number, epsilon = 1e-6): boolean => Math.abs(a - b) <= epsilon;
