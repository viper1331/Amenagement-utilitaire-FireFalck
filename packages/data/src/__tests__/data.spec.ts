import { describe, expect, it } from 'vitest';
import {
  equipmentCatalog,
  equipmentModuleJsonSchema,
  equipmentModuleSchema,
  projectJsonSchema,
  projectSchema,
  vehicleBlueprintJsonSchema,
  vehicleBlueprints,
} from '..';
import demoProject from '../../../../examples/demo_project.json';

const getPropertyKeys = (schema: unknown): string[] => {
  if (typeof schema !== 'object' || schema === null) {
    return [];
  }

  const record = schema as Record<string, unknown>;
  if (record.properties && typeof record.properties === 'object') {
    return Object.keys(record.properties as Record<string, unknown>).sort();
  }

  if (record.definitions && typeof record.definitions === 'object') {
    for (const definition of Object.values(record.definitions as Record<string, unknown>)) {
      const keys = getPropertyKeys(definition);
      if (keys.length > 0) {
        return keys;
      }
    }
  }

  return [];
};

describe('Vehicle data', () => {
  it('expose six véhicules normalisés', () => {
    expect(vehicleBlueprints).toHaveLength(6);
    const identifiers = vehicleBlueprints.map((vehicle) => vehicle.id);
    expect(new Set(identifiers).size).toBe(identifiers.length);
  });

  it('garantit la présence des champs critiques dans le JSON Schema', () => {
    const keys = getPropertyKeys(vehicleBlueprintJsonSchema);
    expect(keys).toEqual(
      expect.arrayContaining([
        '$schemaVersion',
        'id',
        'label',
        'maker',
        'gvw_kg',
        'wheelbase_mm',
      ]),
    );
  });
});

describe('Equipment catalog', () => {
  it('contient au moins douze modules distincts', () => {
    expect(equipmentCatalog.length).toBeGreaterThanOrEqual(12);
    const skus = equipmentCatalog.map((module) => module.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('rejette une priorité de portée invalide', () => {
    const result = equipmentModuleSchema.safeParse({
      $schemaVersion: '1.0.0',
      sku: 'TEST',
      name: 'Module invalide',
      bbox_mm: { length_mm: 100, width_mm: 100, height_mm: 100 },
      mass_kg: 1,
      mounting: { type: 'floor' },
      reachPriority: 'invalid',
      tags: [],
    });
    expect(result.success).toBe(false);
  });

  it('inclut les champs attendus dans le JSON Schema', () => {
    const keys = getPropertyKeys(equipmentModuleJsonSchema);
    expect(keys).toEqual(
      expect.arrayContaining(['sku', 'bbox_mm', 'mass_kg', 'reachPriority']),
    );
  });
});

describe('Project schema', () => {
  it('valide le projet de démonstration', () => {
    expect(() => projectSchema.parse(demoProject)).not.toThrow();
  });

  it('documente les réglages principaux dans le JSON Schema', () => {
    const keys = getPropertyKeys(projectJsonSchema);
    expect(keys).toEqual(expect.arrayContaining(['vehicle', 'placements', 'settings']));
  });
});
