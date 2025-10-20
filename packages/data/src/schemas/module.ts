import { z } from 'zod';

const clearanceSchema = z
  .object({
    front_mm: z.number().nonnegative().optional(),
    rear_mm: z.number().nonnegative().optional(),
    left_mm: z.number().nonnegative().optional(),
    right_mm: z.number().nonnegative().optional(),
    top_mm: z.number().nonnegative().optional(),
    bottom_mm: z.number().nonnegative().optional(),
    extend_mm: z.number().nonnegative().optional(),
  })
  .strict();

const bboxSchema = z
  .object({
    length_mm: z.number().positive(),
    width_mm: z.number().positive(),
    height_mm: z.number().positive(),
  })
  .strict();

const mountingSchema = z
  .object({
    type: z.enum(['floor', 'wall', 'ceiling', 'rail', 'mixed']),
    hardware: z.array(z.string().min(1)).optional(),
    notes: z.string().optional(),
  })
  .strict();

export const equipmentModuleSchema = z
  .object({
    $schemaVersion: z.string().min(1).default('1.0.0'),
    sku: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    bbox_mm: bboxSchema,
    mass_kg: z.number().nonnegative(),
    clearances_mm: clearanceSchema.optional(),
    mounting: mountingSchema,
    reachPriority: z.enum(['high', 'med', 'low']),
    tags: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type EquipmentModule = z.infer<typeof equipmentModuleSchema>;
