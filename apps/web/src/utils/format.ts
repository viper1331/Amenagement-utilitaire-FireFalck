import type { EquipmentModule } from '@pkg/data';
import type { LengthUnit } from '../state/useEditorStore';

const MM_PER_INCH = 25.4;

export const convertLength = (valueMm: number, unit: LengthUnit): number => {
  if (unit === 'mm') {
    return valueMm;
  }
  return valueMm / MM_PER_INCH;
};

export const formatLength = (valueMm: number, unit: LengthUnit): string => {
  if (unit === 'mm') {
    return `${Math.round(valueMm)} mm`;
  }
  return `${(valueMm / MM_PER_INCH).toFixed(2)} in`;
};

export const formatVector = (vector: readonly [number, number, number], unit: LengthUnit): string => {
  const [x, y, z] = vector;
  if (unit === 'mm') {
    return `${x.toFixed(0)} / ${y.toFixed(0)} / ${z.toFixed(0)} mm`;
  }
  return `${(x / MM_PER_INCH).toFixed(2)} / ${(y / MM_PER_INCH).toFixed(2)} / ${(z / MM_PER_INCH).toFixed(2)} in`;
};

export const formatMass = (valueKg: number): string => `${valueKg.toFixed(1)} kg`;

export const formatPercentage = (ratio: number): string => `${Math.round(ratio * 100)}%`;

export const describeModule = (module: EquipmentModule): string =>
  `${module.bbox_mm.length_mm}×${module.bbox_mm.width_mm}×${module.bbox_mm.height_mm} mm`;
