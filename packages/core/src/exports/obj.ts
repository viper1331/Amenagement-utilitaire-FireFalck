import type { ProjectContext } from '../project/context';
import { multiplyMatrixVector } from '../math/matrix';
import { add, vec3 } from '../math/vector';

const unitCubeCorners = [
  vec3(-1, -1, -1),
  vec3(1, -1, -1),
  vec3(1, 1, -1),
  vec3(-1, 1, -1),
  vec3(-1, -1, 1),
  vec3(1, -1, 1),
  vec3(1, 1, 1),
  vec3(-1, 1, 1),
];

const faces = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [1, 5, 8, 4],
  [2, 6, 7, 3],
  [3, 7, 8, 4],
  [1, 2, 6, 5],
];

export const generateObj = (context: ProjectContext): string => {
  const lines: string[] = ['# FireFalck configurateur OBJ'];
  let vertexOffset = 0;

  context.modules.forEach((module) => {
    lines.push(`o ${module.module.sku}`);
    const transform = (corner: ReturnType<typeof vec3>) => {
      const scaled = vec3(
        (corner.x * module.obb.halfSize.x) / 1,
        (corner.y * module.obb.halfSize.y) / 1,
        (corner.z * module.obb.halfSize.z) / 1
      );
      const rotated = multiplyMatrixVector([module.obb.orientation[0], module.obb.orientation[1], module.obb.orientation[2]], scaled);
      const world = add(module.obb.center, rotated);
      return world;
    };

    unitCubeCorners.forEach((corner) => {
      const world = transform(corner);
      lines.push(`v ${world.x.toFixed(4)} ${world.y.toFixed(4)} ${world.z.toFixed(4)}`);
    });

    faces.forEach((face) => {
      const indices = face.map((index) => index + vertexOffset).join(' ');
      lines.push(`f ${indices}`);
    });

    vertexOffset += unitCubeCorners.length;
  });

  return lines.join('\n');
};
