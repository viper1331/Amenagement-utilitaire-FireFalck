import { get, set, del } from 'idb-keyval';
import type { Project } from '@pkg/data';

const STORAGE_KEY = 'firefalck-editor-project';

const hasIndexedDb = (): boolean => typeof indexedDB !== 'undefined';

export const persistProject = async (project: Project): Promise<void> => {
  if (!hasIndexedDb()) {
    return;
  }
  await set(STORAGE_KEY, project);
};

export const restoreProject = async (): Promise<Project | null> => {
  if (!hasIndexedDb()) {
    return null;
  }
  const data = await get<Project>(STORAGE_KEY);
  return data ?? null;
};

export const clearPersistedProject = async (): Promise<void> => {
  if (!hasIndexedDb()) {
    return;
  }
  await del(STORAGE_KEY);
};
