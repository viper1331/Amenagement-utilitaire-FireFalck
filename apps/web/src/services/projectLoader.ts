import { projectSchema, type EquipmentModule, type Project } from '@pkg/data';
import { nanoid } from 'nanoid';

export const parseProjectFile = async (file: File): Promise<Project> => {
  const text = await file.text();
  const json = JSON.parse(text);
  return projectSchema.parse(json);
};

export const serializeProject = (project: Project): string => {
  return JSON.stringify(project, null, 2);
};

export const downloadProjectFile = (project: Project): void => {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.id}.fpvproj`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export interface CreateProjectOptions {
  readonly name: string;
  readonly vehicleBlueprintId: string;
  readonly modulesCatalog?: EquipmentModule[];
}

export const createEmptyProject = (options: CreateProjectOptions): Project => {
  const now = new Date().toISOString();
  return {
    $schemaVersion: '1.0.0',
    id: `project-${nanoid(6)}`,
    name: options.name,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    vehicle: {
      blueprintId: options.vehicleBlueprintId,
    },
    placements: [],
    modulesCatalog: options.modulesCatalog,
    settings: {
      language: 'fr',
      theme: 'system',
      unitOptions: { length: 'mm', mass: 'kg' },
      snap: { translation_mm: 50, rotation_deg: 5 },
      autosave: { enabled: true, interval_s: 60 },
      walkway: { minWidth_mm: 500, showOverlay: true },
      mass: { showOverlay: true, showBarycenter: true },
    },
    issueOverrides: [],
  };
};
