import { z } from 'zod';
import { equipmentModuleSchema } from './module';

const vector3Schema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

const placementSchema = z
  .object({
    instanceId: z.string().min(1),
    moduleSku: z.string().min(1),
    position_mm: vector3Schema,
    rotation_deg: vector3Schema,
    locked: z.boolean().default(false),
    groupId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const issueOverrideSchema = z
  .object({
    code: z.string().min(1),
    acknowledgedAt: z.string().datetime().optional(),
    note: z.string().optional(),
  })
  .strict();

const autosaveSchema = z
  .object({
    enabled: z.boolean().default(true),
    interval_s: z.number().positive().default(30),
  })
  .strict();

const unitOptionsSchema = z
  .object({
    length: z.enum(['mm', 'in']).default('mm'),
    mass: z.enum(['kg', 'lb']).default('kg'),
  })
  .strict();

const snapSettingsSchema = z
  .object({
    translation_mm: z.number().positive().default(50),
    rotation_deg: z.number().positive().default(5),
  })
  .strict();

const walkwaySettingsSchema = z
  .object({
    minWidth_mm: z.number().positive().default(500),
    showOverlay: z.boolean().default(true),
  })
  .strict();

const massSettingsSchema = z
  .object({
    showOverlay: z.boolean().default(true),
    showBarycenter: z.boolean().default(true),
  })
  .strict();

const projectVehicleSchema = z
  .object({
    blueprintId: z.string().min(1),
    payloadReserve_kg: z.number().nonnegative().optional(),
    overrides: z.record(z.unknown()).optional(),
  })
  .strict();

const projectSettingsSchema = z
  .object({
    language: z.enum(['fr', 'en']).default('fr'),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    unitOptions: unitOptionsSchema.default({ length: 'mm', mass: 'kg' }),
    snap: snapSettingsSchema.default({ translation_mm: 50, rotation_deg: 5 }),
    autosave: autosaveSchema.default({ enabled: true, interval_s: 30 }),
    viewport: z
      .object({
        target_mm: vector3Schema,
        position_mm: vector3Schema,
        up: vector3Schema.optional(),
      })
      .optional(),
    walkway: walkwaySettingsSchema.default({ minWidth_mm: 500 }),
    mass: massSettingsSchema.default({ showOverlay: true, showBarycenter: true }),
  })
  .strict();

export const projectSchema = z
  .object({
    $schemaVersion: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    version: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    vehicle: projectVehicleSchema,
    placements: z.array(placementSchema),
    modulesCatalog: z.array(equipmentModuleSchema).optional(),
    settings: projectSettingsSchema,
    issueOverrides: z.array(issueOverrideSchema).default([]),
    metadata: z.record(z.unknown()).optional(),
    notes: z.string().optional(),
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
