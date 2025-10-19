import type { ProjectContext } from '../project/context';

export interface BomEntry {
  readonly instanceId: string;
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly mass_kg: number;
  readonly position_mm: readonly [number, number, number];
}

export const buildBomEntries = (context: ProjectContext): BomEntry[] =>
  context.modules.map((module) => ({
    instanceId: module.placement.instanceId,
    sku: module.module.sku,
    name: module.module.name,
    quantity: 1,
    mass_kg: module.module.mass_kg,
    position_mm: module.placement.position_mm,
  }));

export const bomToCsv = (entries: readonly BomEntry[]): string => {
  const header = 'instanceId,sku,name,quantity,mass_kg,pos_x_mm,pos_y_mm,pos_z_mm';
  const rows = entries.map((entry) =>
    [
      entry.instanceId,
      entry.sku,
      entry.name.replace(/"/g, '""'),
      entry.quantity.toString(),
      entry.mass_kg.toFixed(2),
      entry.position_mm[0].toFixed(1),
      entry.position_mm[1].toFixed(1),
      entry.position_mm[2].toFixed(1),
    ]
      .map((value) => (value.includes(',') ? `"${value}"` : value))
      .join(',')
  );
  return [header, ...rows].join('\n');
};

export const bomToJson = (entries: readonly BomEntry[]): string => JSON.stringify(entries, null, 2);
