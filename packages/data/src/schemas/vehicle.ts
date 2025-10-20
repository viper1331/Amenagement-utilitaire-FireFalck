import { z } from 'zod';

const nullableNumber = z.number().finite().nullable();

const overallDimensionsSchema = z
  .object({
    length_mm: nullableNumber,
    width_excl_mirrors_mm: nullableNumber,
    width_incl_mirrors_mm: nullableNumber.optional(),
    height_mm: nullableNumber,
    ground_clearance_mm: nullableNumber.optional(),
  })
  .partial({
    width_incl_mirrors_mm: true,
    ground_clearance_mm: true,
  });

const interiorBoxSchema = z
  .object({
    length_mm: z.number().finite(),
    width_mm: z.number().finite(),
    height_mm: z.number().finite(),
  })
  .strict();

const rectangularZoneSchema = z.object({
  id: z.string().min(1),
  shape: z.literal('box'),
  origin_mm: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
  size_mm: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]),
  note: z.string().optional(),
  critical: z.boolean().optional(),
});

const doorOpeningSchema = z
  .object({
    width_mm: z.number().positive(),
    height_mm: z.number().positive(),
    openingAngle_deg: z.number().positive().max(360).optional(),
    offsetFromRear_mm: z.number().finite().optional(),
  })
  .strict();

const axleSchema = z
  .object({
    index: z.number().int().nonnegative(),
    x_mm: z.number().finite(),
    maxLoad_kg: z.number().positive().nullable().optional(),
  })
  .strict();

const bodyworkConstraintsSchema = z
  .object({
    rear_overhang_min_mm: z.number().nonnegative().optional(),
    rear_overhang_max_mm: z.number().nonnegative().optional(),
    body_length_min_mm: z.number().nonnegative().optional(),
    body_length_max_mm: z.number().nonnegative().optional(),
  })
  .strict();

const axleSpacingSchema = z
  .object({
    axle2_to_3_mm: z.number().positive(),
  })
  .strict();

export const vehicleBlueprintSchema = z
  .object({
    $schemaVersion: z.string().min(1),
    id: z.string().min(1),
    label: z.string().min(1),
    maker: z.string().min(1),
    family: z.string().min(1),
    variant: z.string().min(1),
    year: z.number().int().min(1900).max(2100).optional(),
    fuel: z.enum(['diesel', 'electric', 'hybrid', 'gasoline', 'cng', 'hydrogen']).optional(),
    gvw_kg: z.number().positive(),
    wheelbase_mm: z.number().positive(),
    overall: overallDimensionsSchema.optional(),
    interiorBox: z.union([interiorBoxSchema, z.null()]).optional(),
    openings: z
      .object({
        slidingDoor: doorOpeningSchema.optional(),
        rearDoor: doorOpeningSchema.optional(),
        other: z.array(doorOpeningSchema).optional(),
      })
      .optional(),
    axles: z.array(axleSchema).default([]),
    axleSpacing: axleSpacingSchema.optional(),
    bodyworkConstraints: bodyworkConstraintsSchema.optional(),
    forbiddenZones: z.array(rectangularZoneSchema).default([]),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type VehicleBlueprint = z.infer<typeof vehicleBlueprintSchema>;
