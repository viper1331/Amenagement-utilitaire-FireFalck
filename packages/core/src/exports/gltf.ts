import type { ProjectContext } from '../project/context';
import { quaternionFromEuler } from '../math/quaternion';
import { vec3 } from '../math/vector';

const positions = new Float32Array([
  -0.5, -0.5, -0.5,
  0.5, -0.5, -0.5,
  0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5,
  -0.5, -0.5, 0.5,
  0.5, -0.5, 0.5,
  0.5, 0.5, 0.5,
  -0.5, 0.5, 0.5,
]);

const indices = new Uint16Array([
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  0, 1, 5, 0, 5, 4,
  2, 3, 7, 2, 7, 6,
  1, 2, 6, 1, 6, 5,
  0, 3, 7, 0, 7, 4,
]);

const toBase64 = (data: Uint8Array): string => {
  const globalRef = globalThis as {
    btoa?: (data: string) => string;
    Buffer?: { from(data: Uint8Array): { toString(encoding: string): string } };
  };
  if (typeof globalRef.btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.subarray(offset, offset + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return globalRef.btoa(binary);
  }
  if (globalRef.Buffer) {
    return globalRef.Buffer.from(data).toString('base64');
  }
  throw new Error('No base64 encoder available in this environment');
};

const tupleToVector = (tuple: readonly [number, number, number]) => vec3(tuple[0], tuple[1], tuple[2]);

export const generateGltf = (context: ProjectContext): string => {
  const positionBytes = new Uint8Array(positions.buffer);
  const indexBytes = new Uint8Array(indices.buffer);
  const combined = new Uint8Array(positionBytes.byteLength + indexBytes.byteLength);
  combined.set(positionBytes, 0);
  combined.set(indexBytes, positionBytes.byteLength);

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'FireFalck Core',
    },
    buffers: [
      {
        byteLength: combined.byteLength,
        uri: `data:application/octet-stream;base64,${toBase64(combined)}`,
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: positionBytes.byteLength,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: positionBytes.byteLength,
        byteLength: indexBytes.byteLength,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: 'VEC3',
        min: [-0.5, -0.5, -0.5],
        max: [0.5, 0.5, 0.5],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    meshes: [
      {
        name: 'ModuleCube',
        primitives: [
          {
            attributes: {
              POSITION: 0,
            },
            indices: 1,
          },
        ],
      },
    ],
    nodes: context.modules.map((module) => {
      const rotation = quaternionFromEuler(tupleToVector(module.placement.rotation_deg));
      return {
        name: module.module.sku,
        mesh: 0,
        translation: Array.from(module.placement.position_mm),
        scale: [
          module.module.bbox_mm.length_mm,
          module.module.bbox_mm.width_mm,
          module.module.bbox_mm.height_mm,
        ],
        rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
      };
    }),
    scenes: [
      {
        nodes: context.modules.map((_, index) => index),
      },
    ],
    scene: 0,
  };

  return JSON.stringify(gltf, null, 2);
};
