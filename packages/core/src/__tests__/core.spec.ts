import { describe, expect, it } from 'vitest';
import {
  equipmentModuleBySku,
  equipmentCatalog,
  vehicleBlueprintById,
  type EquipmentModule,
  type VehicleBlueprint,
  type Project,
} from '@pkg/data';
import demoProject from '../../../../examples/demo_project.json';
import { add, subtract, degToRad, almostEquals, vec3 } from '../math/vector';
import { determinant, rotationMatrixFromEuler } from '../math/matrix';
import { createObb, intersectsObb, obbToAabb } from '../geometry/bounds';
import { buildProjectContext } from '../project/context';
import { checkModuleCollisions } from '../rules/collisions';
import { checkModuleClearances } from '../rules/clearances';
import { evaluateMassDistribution } from '../rules/mass';
import { scoreModules } from '../rules/scoring';
import { buildBomEntries, bomToCsv, bomToJson } from '../exports/bom';
import { generateDxf } from '../exports/dxf';
import { generateObj } from '../exports/obj';
import { generateGltf } from '../exports/gltf';
import { generatePdfReport } from '../exports/pdf';
import { evaluateProject } from '../project/evaluate';

const demo: Project = demoProject as unknown as Project;
const vehicle = vehicleBlueprintById.get(demo.vehicle.blueprintId)!;

const modulesCatalog = new Map<string, EquipmentModule>(equipmentModuleBySku);

const tuple = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

const cloneProject = (project: Project): Project => JSON.parse(JSON.stringify(project)) as Project;

const buildContextFromProject = (project: Project = demo, blueprint: VehicleBlueprint = vehicle) =>
  buildProjectContext(project, blueprint, { modulesCatalog });

describe('math utilities', () => {
  it('adds vectors', () => {
    expect(add(vec3(1, 2, 3), vec3(4, 5, 6))).toEqual({ x: 5, y: 7, z: 9 });
  });

  it('subtracts vectors', () => {
    expect(subtract(vec3(5, 7, 9), vec3(1, 2, 3))).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('checks approximate equality', () => {
    expect(almostEquals(1.000001, 1.0000015)).toBe(true);
  });

  it('creates rotation matrices with determinant 1', () => {
    const matrix = rotationMatrixFromEuler(vec3(15, 25, 35));
    expect(determinant(matrix)).toBeCloseTo(1, 5);
  });
});

describe('geometry bounds', () => {
  it('converts OBB to AABB enclosing center', () => {
    const obb = createObb(vec3(10, 0, 0), vec3(100, 200, 300), vec3(0, 45, 0));
    const aabb = obbToAabb(obb);
    expect(aabb.min.x).toBeLessThanOrEqual(10);
    expect(aabb.max.x).toBeGreaterThanOrEqual(10);
  });

  it('detects overlapping OBBs', () => {
    const a = createObb(vec3(0, 0, 0), vec3(100, 100, 100), vec3(0, 0, 0));
    const b = createObb(vec3(40, 0, 0), vec3(100, 100, 100), vec3(0, 0, 0));
    expect(intersectsObb(a, b)).toBe(true);
  });

  it('detects separated OBBs', () => {
    const a = createObb(vec3(0, 0, 0), vec3(100, 100, 100), vec3(0, 0, 0));
    const b = createObb(vec3(300, 0, 0), vec3(100, 100, 100), vec3(0, 0, 0));
    expect(intersectsObb(a, b)).toBe(false);
  });
});

describe('project context and rules', () => {
  it('builds context with matching placement count', () => {
    const context = buildContextFromProject();
    expect(context.modules).toHaveLength(demo.placements.length);
  });

  it('detects no module collision when placements are separated', () => {
    const projectClone = cloneProject(demo);
    projectClone.placements = [
      {
        instanceId: 'left',
        moduleSku: projectClone.placements[0].moduleSku,
        position_mm: tuple(-1000, -700, 0),
        rotation_deg: tuple(0, 0, 0),
        locked: false,
      },
      {
        instanceId: 'right',
        moduleSku: projectClone.placements[1].moduleSku,
        position_mm: tuple(1000, 700, 0),
        rotation_deg: tuple(0, 0, 0),
        locked: false,
      },
    ];
    const context = buildContextFromProject(projectClone);
    const result = checkModuleCollisions(context);
    expect(result.issues.filter((issue) => issue.code === 'collision.modules')).toHaveLength(0);
  });

  it('flags collisions when modules overlap', () => {
    const projectClone = cloneProject(demo);
    projectClone.placements[0].position_mm = projectClone.placements[1].position_mm;
    const context = buildContextFromProject(projectClone);
    const result = checkModuleCollisions(context);
    expect(result.issues.some((issue) => issue.code === 'collision.modules')).toBe(true);
  });

  it('detects walkway obstruction when module enters corridor', () => {
    const projectClone = cloneProject(demo);
    projectClone.placements[0].position_mm = tuple(900, 0, 0);
    const context = buildContextFromProject(projectClone);
    const issues = checkModuleClearances(context);
    expect(issues.some((issue) => issue.code === 'walkway.blocked')).toBe(true);
  });

  it('propagates walkway configuration from project settings', () => {
    const projectClone = cloneProject(demo);
    projectClone.settings.walkway = {
      ...projectClone.settings.walkway,
      minWidth_mm: 720,
    };
    const context = buildContextFromProject(projectClone);
    expect(context.walkwayMinWidth_mm).toBe(720);
  });

  it('detects clearance blockage on custom module extension', () => {
    const baseModule = equipmentCatalog[0];
    const extendModule: EquipmentModule = {
      ...baseModule,
      sku: 'TEST-EXTEND',
      clearances_mm: { ...(baseModule.clearances_mm ?? {}), extend_mm: 400 },
    };
    const catalog = new Map(modulesCatalog);
    catalog.set(extendModule.sku, extendModule);
    const projectClone = cloneProject(demo);
    projectClone.placements = [
      {
        instanceId: 'extend-1',
        moduleSku: extendModule.sku,
        position_mm: tuple(0, -200, 0),
        rotation_deg: tuple(0, 0, 0),
        locked: false,
      },
      {
        instanceId: 'blocker',
        moduleSku: demo.placements[1].moduleSku,
        position_mm: tuple(350, -200, 0),
        rotation_deg: tuple(0, 0, 0),
        locked: false,
      },
    ];
    const context = buildProjectContext(projectClone, vehicle, { modulesCatalog: catalog });
    const issues = checkModuleClearances(context);
    expect(issues.some((issue) => issue.code === 'extension.blocked')).toBe(true);
  });

  it('evaluates mass distribution with consistent totals', () => {
    const context = buildContextFromProject();
    const result = evaluateMassDistribution(context);
    const axleSum = result.analysis.axleLoads.reduce((sum, axle) => sum + axle.load_kg, 0);
    expect(axleSum).toBeCloseTo(result.analysis.totalMass_kg, 3);
  });

  it('raises payload reserve issue when exceeding limit', () => {
    const projectClone = cloneProject(demo);
    projectClone.vehicle.payloadReserve_kg = 50;
    const context = buildContextFromProject(projectClone);
    const result = evaluateMassDistribution(context);
    expect(result.issues.some((issue) => issue.code === 'mass.payload.reserve')).toBe(true);
  });

  it('reports module-level contributions aligned with axle loads', () => {
    const context = buildContextFromProject();
    const result = evaluateMassDistribution(context).analysis;
    expect(result.moduleContributions.length).toBeGreaterThan(0);
    result.moduleContributions.forEach((contribution) => {
      const axleSum = contribution.axleLoads_kg.reduce((sum, value) => sum + value, 0);
      expect(axleSum).toBeCloseTo(contribution.mass_kg, 3);
    });
    const recomputed = result.axleLoads.map((axle, index) =>
      result.moduleContributions.reduce((sum, contribution) => sum + (contribution.axleLoads_kg[index] ?? 0), 0)
    );
    recomputed.forEach((value, index) => {
      expect(value).toBeCloseTo(result.axleLoads[index].load_kg, 3);
    });
  });

  it('scores modules and returns positive totals', () => {
    const context = buildContextFromProject();
    const mass = evaluateMassDistribution(context).analysis;
    const scores = scoreModules(context, mass);
    expect(scores.every((score) => score.total > 0)).toBe(true);
  });

  it('prefers modules nearer to door in scoring', () => {
    const context = buildContextFromProject();
    const mass = evaluateMassDistribution(context).analysis;
    const scores = scoreModules(context, mass);
    const nearDoor = scores.find((score) => score.instanceId === 'drawer-1200-01')!;
    const farther = scores.find((score) => score.instanceId === 'absorbent-01')!;
    expect(nearDoor.total).toBeGreaterThanOrEqual(farther.total - 0.5);
  });
});

describe('exporters', () => {
  it('builds BOM entries for each module', () => {
    const context = buildContextFromProject();
    const bom = buildBomEntries(context);
    expect(bom).toHaveLength(demo.placements.length);
  });

  it('creates BOM CSV with header and rows', () => {
    const context = buildContextFromProject();
    const csv = bomToCsv(buildBomEntries(context));
    expect(csv.split('\n')[0]).toContain('instanceId');
    expect(csv.split('\n')).toHaveLength(demo.placements.length + 1);
  });

  it('produces BOM JSON array', () => {
    const context = buildContextFromProject();
    const json = bomToJson(buildBomEntries(context));
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].sku).toBeDefined();
  });

  it('generates DXF with expected layers', () => {
    const context = buildContextFromProject();
    const dxf = generateDxf(context);
    expect(dxf).toContain('FLOOR');
    expect(dxf).toContain('LWPOLYLINE');
    expect(dxf).toContain('WALKWAY');
  });

  it('projects walkway width into DXF annotations', () => {
    const context = buildContextFromProject();
    const dxf = generateDxf(context);
    expect(dxf).toContain('Couloir');
    expect(dxf).toMatch(/Couloir\s+\d+\s+mm/);
  });

  it('generates OBJ with vertex definitions', () => {
    const context = buildContextFromProject();
    const obj = generateObj(context);
    expect(obj).toContain('\nv ');
    expect(obj.split('\n').filter((line) => line.startsWith('o '))).toHaveLength(
      demo.placements.length
    );
  });

  it('generates glTF JSON with nodes', () => {
    const context = buildContextFromProject();
    const gltf = JSON.parse(generateGltf(context));
    expect(gltf.meshes).toHaveLength(1);
    expect(gltf.nodes.length).toBe(demo.placements.length);
  });

  it('generates PDF starting with header', () => {
    const context = buildContextFromProject();
    const mass = evaluateMassDistribution(context).analysis;
    const scores = scoreModules(context, mass);
    const pdf = generatePdfReport(context, mass, [], scores, buildBomEntries(context));
    expect(pdf.startsWith('%PDF')).toBe(true);
    expect(pdf).toContain('Couloir min');
    expect(pdf).toContain('Modules influents');
  });
});

describe('project evaluation integration', () => {
  it('evaluates project and returns exports', () => {
    const evaluation = evaluateProject(demo, vehicle, { modulesCatalog });
    expect(evaluation.exports.bomCsv.length).toBeGreaterThan(20);
    expect(evaluation.exports.dxf.includes('EOF')).toBe(true);
  });

  it('aggregates issues from multiple rule sets', () => {
    const projectClone = cloneProject(demo);
    projectClone.placements[0].position_mm = tuple(5000, 0, 0);
    const evaluation = evaluateProject(projectClone, vehicle, { modulesCatalog });
    expect(evaluation.issues.some((issue) => issue.code.includes('vehicle.interior'))).toBe(true);
  });

  it('detects forbidden zones when intersected', () => {
    const truck = vehicleBlueprintById.get('depollution_master_l2h2_etech_2025')!;
    const projectClone: Project = {
      ...cloneProject(demo),
      vehicle: { blueprintId: truck.id },
      placements: [
        {
          instanceId: 'battery-hit',
          moduleSku: demo.placements[0].moduleSku,
          position_mm: tuple(0, 0, -50),
          rotation_deg: tuple(0, 0, 0),
          locked: false,
        },
      ],
    };
    const evaluation = evaluateProject(projectClone, truck, { modulesCatalog });
    expect(evaluation.issues.some((issue) => issue.code.startsWith('forbidden'))).toBe(true);
  });

  it('maintains export consistency between JSON and CSV entry counts', () => {
    const evaluation = evaluateProject(demo, vehicle, { modulesCatalog });
    const csvLines = evaluation.exports.bomCsv.trim().split('\n').length - 1;
    const jsonEntries = JSON.parse(evaluation.exports.bomJson).length;
    expect(csvLines).toBe(jsonEntries);
  });

  it('ensures OBJ vertex count scales with modules', () => {
    const evaluation = evaluateProject(demo, vehicle, { modulesCatalog });
    const vertexCount = evaluation.exports.obj.split('\n').filter((line) => line.startsWith('v ')).length;
    expect(vertexCount).toBe(demo.placements.length * 8);
  });

  it('produces glTF nodes matching placements', () => {
    const evaluation = evaluateProject(demo, vehicle, { modulesCatalog });
    const gltf = JSON.parse(evaluation.exports.gltf);
    expect(gltf.nodes.length).toBe(demo.placements.length);
  });

  it('returns PDF with EOF marker', () => {
    const evaluation = evaluateProject(demo, vehicle, { modulesCatalog });
    expect(evaluation.exports.pdf.trim().endsWith('%%EOF')).toBe(true);
  });
});
