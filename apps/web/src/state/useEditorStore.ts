import {
  equipmentCatalog,
  equipmentModuleBySku,
  projectSchema,
  type EquipmentModule,
  type Project,
  type VehicleBlueprint,
  vehicleBlueprintById,
} from '@pkg/data';
import { evaluateProject, type ProjectEvaluation } from '@pkg/core';
import { nanoid } from 'nanoid';
import { create } from 'zustand';

export type LengthUnit = 'mm' | 'in';

type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  readonly id: string;
  readonly message: string;
  readonly tone: ToastTone;
}

export interface MeasureState {
  readonly active: boolean;
  readonly points: Array<[number, number, number]>;
  readonly distance_mm?: number;
}

export interface HistoryState {
  readonly past: Project['placements'][];
  readonly future: Project['placements'][];
}

export interface EditorState {
  readonly ready: boolean;
  readonly catalog: readonly EquipmentModule[];
  readonly project: Project | null;
  readonly vehicle: VehicleBlueprint | null;
  readonly evaluation: ProjectEvaluation | null;
  readonly selectedIds: string[];
  readonly measure: MeasureState;
  readonly viewMode: 'orbit' | 'fpv';
  readonly translationSnap: number;
  readonly rotationSnap: number;
  readonly lengthUnit: LengthUnit;
  readonly toasts: readonly ToastMessage[];
  readonly history: HistoryState;
  readonly lastAutosave?: number;
  setProject: (project: Project) => void;
  importProject: (raw: unknown) => void;
  loadDemo: () => Promise<void>;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  updatePlacement: (
    id: string,
    updates: Partial<Project['placements'][number]>,
    options?: { skipHistory?: boolean },
  ) => void;
  translateSelected: (delta: [number, number, number]) => void;
  rotateSelected: (delta: [number, number, number]) => void;
  addModule: (
    sku: string,
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  toggleLockSelected: (locked: boolean) => void;
  setViewMode: (mode: 'orbit' | 'fpv') => void;
  setMeasureActive: (active: boolean) => void;
  pushMeasurePoint: (point: [number, number, number]) => void;
  clearMeasure: () => void;
  setTranslationSnap: (value: number) => void;
  setRotationSnap: (value: number) => void;
  setLengthUnit: (unit: LengthUnit) => void;
  setLanguage: (language: 'fr' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  recalcEvaluation: () => void;
  undo: () => void;
  redo: () => void;
  addToast: (message: string, tone?: ToastTone) => void;
  removeToast: (id: string) => void;
  markAutosaved: () => void;
}

type StoreSetState = (
  partial:
    | EditorState
    | Partial<EditorState>
    | ((state: EditorState) => EditorState | Partial<EditorState>),
  replace?: boolean,
) => void;

type Vector3 = [number, number, number];

const clonePlacements = (placements: Project['placements']): Project['placements'] =>
  placements.map((placement) => ({
    ...placement,
    position_mm: [...placement.position_mm] as Vector3,
    rotation_deg: [...placement.rotation_deg] as Vector3,
    metadata: placement.metadata ? { ...placement.metadata } : undefined,
  }));

const ensureVehicle = (blueprintId: string): VehicleBlueprint => {
  const vehicle = vehicleBlueprintById.get(blueprintId);
  if (!vehicle) {
    throw new Error(`Blueprint introuvable: ${blueprintId}`);
  }
  return vehicle;
};

const calculateDistance = (a: Vector3, b: Vector3): number => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const applyProjectUpdate = (
  set: StoreSetState,
  get: () => EditorState,
  mutate: (project: Project) => void,
  trackHistory = true,
  nextSelection?: string[],
) => {
  const { project } = get();
  if (!project) {
    return;
  }
  const snapshot = trackHistory ? clonePlacements(project.placements) : null;
  const next = structuredClone(project);
  mutate(next);
  next.updatedAt = new Date().toISOString();
  set((state: EditorState) => ({
    project: next,
    selectedIds: nextSelection ?? state.selectedIds,
    translationSnap: next.settings.snap.translation_mm,
    rotationSnap: next.settings.snap.rotation_deg,
    lengthUnit: next.settings.unitOptions.length,
    history: snapshot
      ? { past: [...state.history.past, snapshot], future: [] }
      : state.history,
  }));
  get().recalcEvaluation();
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ready: false,
  catalog: equipmentCatalog,
  project: null,
  vehicle: null,
  evaluation: null,
  selectedIds: [],
  measure: { active: false, points: [] },
  viewMode: 'orbit',
  translationSnap: 50,
  rotationSnap: 5,
  lengthUnit: 'mm',
  toasts: [],
  history: { past: [], future: [] },
  setProject: (project) => {
    const parsed = projectSchema.parse(project);
    const vehicle = ensureVehicle(parsed.vehicle.blueprintId);
    set({
      ready: true,
      project: parsed,
      vehicle,
      selectedIds: [],
      translationSnap: parsed.settings.snap.translation_mm,
      rotationSnap: parsed.settings.snap.rotation_deg,
      lengthUnit: parsed.settings.unitOptions.length,
      history: { past: [], future: [] },
      measure: { active: false, points: [] },
    });
    get().recalcEvaluation();
  },
  importProject: (raw) => {
    const parsed = projectSchema.parse(raw);
    get().setProject(parsed);
  },
  loadDemo: async () => {
    const response = await fetch('/examples/demo_project.json', { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error('Impossible de charger le projet de démonstration');
    }
    const data = await response.json();
    get().importProject(data);
  },
  setSelection: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  updatePlacement: (id, updates, options) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        const target = project.placements.find((placement) => placement.instanceId === id);
        if (!target) {
          return;
        }
        if (updates.position_mm) {
          target.position_mm = [...updates.position_mm] as Vector3;
        }
        if (updates.rotation_deg) {
          target.rotation_deg = [...updates.rotation_deg] as Vector3;
        }
        if (typeof updates.locked === 'boolean') {
          target.locked = updates.locked;
        }
        if (updates.groupId !== undefined) {
          target.groupId = updates.groupId;
        }
        if (updates.metadata) {
          target.metadata = { ...target.metadata, ...updates.metadata };
        }
      },
      !options?.skipHistory,
    );
  },
  translateSelected: (delta) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    applyProjectUpdate(set, get, (project) => {
      project.placements = project.placements.map((placement) => {
        if (!selectedIds.includes(placement.instanceId) || placement.locked) {
          return placement;
        }
        return {
          ...placement,
          position_mm: [
            placement.position_mm[0] + delta[0],
            placement.position_mm[1] + delta[1],
            placement.position_mm[2] + delta[2],
          ],
        };
      });
    });
  },
  rotateSelected: (delta) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    applyProjectUpdate(set, get, (project) => {
      project.placements = project.placements.map((placement) => {
        if (!selectedIds.includes(placement.instanceId) || placement.locked) {
          return placement;
        }
        return {
          ...placement,
          rotation_deg: [
            placement.rotation_deg[0] + delta[0],
            placement.rotation_deg[1] + delta[1],
            placement.rotation_deg[2] + delta[2],
          ],
        };
      });
    });
  },
  addModule: (sku, position, rotation) => {
    if (!equipmentModuleBySku.has(sku)) {
      throw new Error(`Module inconnu: ${sku}`);
    }
    applyProjectUpdate(
      set,
      get,
      (project) => {
        const newId = `inst-${nanoid(6)}`;
        project.placements.push({
          instanceId: newId,
          moduleSku: sku,
          position_mm: position,
          rotation_deg: rotation,
          locked: false,
        });
        project.settings.autosave = project.settings.autosave ?? { enabled: true, interval_s: 30 };
        set({ selectedIds: [newId] });
      },
      true,
    );
  },
  removeSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.placements = project.placements.filter(
          (placement) => !selectedIds.includes(placement.instanceId),
        );
      },
      true,
      [],
    );
  },
  duplicateSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    const newIds: string[] = [];
    applyProjectUpdate(
      set,
      get,
      (project) => {
        const additions = project.placements
          .filter((placement) => selectedIds.includes(placement.instanceId))
          .map<Project['placements'][number]>((placement) => {
            const instanceId = `inst-${nanoid(6)}`;
            newIds.push(instanceId);
            const nextPosition: [number, number, number] = [
              placement.position_mm[0] + 100,
              placement.position_mm[1],
              placement.position_mm[2],
            ];
            return {
              ...placement,
              instanceId,
              position_mm: nextPosition,
              locked: false,
            };
          });
        project.placements.push(...additions);
      },
      true,
      newIds,
    );
  },
  toggleLockSelected: (locked) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    applyProjectUpdate(set, get, (project) => {
      project.placements = project.placements.map((placement) =>
        selectedIds.includes(placement.instanceId) ? { ...placement, locked } : placement,
      );
    });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setMeasureActive: (active) => set({ measure: { active, points: [] } }),
  pushMeasurePoint: (point) => {
    const { measure } = get();
    if (!measure.active) {
      return;
    }
    const points = [...measure.points, point];
    if (points.length === 2) {
      const distance = calculateDistance(points[0], points[1]);
      set({ measure: { active: true, points, distance_mm: distance } });
    } else {
      set({ measure: { active: true, points } });
    }
  },
  clearMeasure: () => set({ measure: { active: false, points: [] } }),
  setTranslationSnap: (value) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.settings.snap.translation_mm = value;
      },
      false,
    );
    set({ translationSnap: value });
  },
  setRotationSnap: (value) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.settings.snap.rotation_deg = value;
      },
      false,
    );
    set({ rotationSnap: value });
  },
  setLengthUnit: (unit) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.settings.unitOptions.length = unit;
      },
      false,
    );
    set({ lengthUnit: unit });
  },
  setLanguage: (language) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.settings.language = language;
      },
      false,
    );
  },
  setTheme: (theme) => {
    applyProjectUpdate(
      set,
      get,
      (project) => {
        project.settings.theme = theme;
      },
      false,
    );
  },
  recalcEvaluation: () => {
    const { project, vehicle } = get();
    if (!project || !vehicle) {
      return;
    }
    const evaluation = evaluateProject(project, vehicle, {
      modulesCatalog: equipmentModuleBySku,
    });
    set({ evaluation });
  },
  undo: () => {
    const { project, history } = get();
    if (!project || history.past.length === 0) {
      return;
    }
    const previous = history.past[history.past.length - 1];
    const restPast = history.past.slice(0, -1);
    const snapshot = clonePlacements(project.placements);
    const next = structuredClone(project);
    next.placements = clonePlacements(previous);
    next.updatedAt = new Date().toISOString();
    set({
      project: next,
      selectedIds: [],
      history: { past: restPast, future: [snapshot, ...history.future] },
    });
    get().recalcEvaluation();
  },
  redo: () => {
    const { project, history } = get();
    if (!project || history.future.length === 0) {
      return;
    }
    const [nextPlacements, ...restFuture] = history.future;
    const snapshot = clonePlacements(project.placements);
    const next = structuredClone(project);
    next.placements = clonePlacements(nextPlacements);
    next.updatedAt = new Date().toISOString();
    set({
      project: next,
      selectedIds: [],
      history: { past: [...history.past, snapshot], future: restFuture },
    });
    get().recalcEvaluation();
  },
  addToast: (message, tone = 'info') => {
    const toast: ToastMessage = { id: nanoid(6), message, tone };
    set((state) => ({ toasts: [...state.toasts.slice(-3), toast] }));
    window.setTimeout(() => get().removeToast(toast.id), 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  markAutosaved: () => set({ lastAutosave: Date.now() }),
}));

if (typeof window !== 'undefined') {
  const globalWindow = window as typeof window & { __EDITOR_STORE__?: typeof useEditorStore };
  if (!globalWindow.__EDITOR_STORE__) {
    globalWindow.__EDITOR_STORE__ = useEditorStore;
  }
}

export const useEditorStoreSelector = <T,>(selector: (state: EditorState) => T): T =>
  useEditorStore(selector);
