import type { ProjectContext } from '../project/context';
import { multiplyMatrixVector } from '../math/matrix';
import { add, vec3, Vector3 } from '../math/vector';

const polygonToLwPolyline = (layer: string, points: readonly Vector3[]): string => {
  const segments: string[] = [
    '0',
    'LWPOLYLINE',
    '8',
    layer,
    '90',
    points.length.toString(),
    '70',
    '1',
  ];
  points.forEach((point) => {
    segments.push('10', point.x.toFixed(2), '20', point.y.toFixed(2));
  });
  return segments.join('\n');
};

const addTextEntity = (layer: string, point: Vector3, text: string, height = 120): string =>
  ['0', 'TEXT', '8', layer, '10', point.x.toFixed(2), '20', point.y.toFixed(2), '40', height.toFixed(2), '1', text].join('\n');

const localFootprintCorners = (halfSize: Vector3): readonly Vector3[] => [
  vec3(halfSize.x, halfSize.y, -halfSize.z),
  vec3(halfSize.x, -halfSize.y, -halfSize.z),
  vec3(-halfSize.x, -halfSize.y, -halfSize.z),
  vec3(-halfSize.x, halfSize.y, -halfSize.z),
];

const transformLocalToWorld = (center: Vector3, orientation: readonly Vector3[], local: Vector3): Vector3 => {
  const rotated = multiplyMatrixVector([orientation[0], orientation[1], orientation[2]], local);
  return add(center, rotated);
};

export const generateDxf = (context: ProjectContext): string => {
  const sections: string[] = [];
  sections.push('0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC');
  sections.push('0', 'SECTION', '2', 'ENTITIES');

  const interior = context.vehicle.interiorBox;
  if (interior) {
    const halfLength = interior.length_mm / 2;
    const halfWidth = interior.width_mm / 2;
    const floorPoints = [
      vec3(-halfLength, -halfWidth, 0),
      vec3(halfLength, -halfWidth, 0),
      vec3(halfLength, halfWidth, 0),
      vec3(-halfLength, halfWidth, 0),
    ];
    sections.push(polygonToLwPolyline('FLOOR', floorPoints));
  }

  context.modules.forEach((module) => {
    const corners = localFootprintCorners(module.obb.halfSize).map((corner) =>
      transformLocalToWorld(module.obb.center, module.obb.orientation, corner)
    );
    sections.push(polygonToLwPolyline('MODULES', corners));

    const lengthLabel = add(module.obb.center, vec3(module.obb.halfSize.x + 50, 0, 0));
    const text = `${module.module.name} (${module.module.bbox_mm.length_mm}×${module.module.bbox_mm.width_mm})`;
    sections.push(addTextEntity('DIMS', lengthLabel, text));
  });

  context.modules.forEach((module) => {
    sections.push(addTextEntity('MODULES', module.obb.center, module.module.sku, 100));
  });

  sections.push('0', 'ENDSEC', '0', 'EOF');
  return sections.join('\n');
};
