import { contextBridge, ipcRenderer } from 'electron';

type ProjectPayload = {
  readonly filePath: string;
  readonly content: string;
};

type ProjectErrorPayload = {
  readonly filePath: string;
  readonly error: string;
};

const expose = () => {
  const api = {
    onProjectOpen(callback: (payload: ProjectPayload) => void) {
      const listener = (_event: unknown, payload: ProjectPayload) => callback(payload);
      ipcRenderer.on('project:open', listener);
      return () => ipcRenderer.removeListener('project:open', listener);
    },
    onProjectOpenError(callback: (payload: ProjectErrorPayload) => void) {
      const listener = (_event: unknown, payload: ProjectErrorPayload) => callback(payload);
      ipcRenderer.on('project:open-error', listener);
      return () => ipcRenderer.removeListener('project:open-error', listener);
    },
  } as const;

  contextBridge.exposeInMainWorld('electronAPI', api);
};

try {
  expose();
} catch (error) {
  console.error('Impossible d\'exposer electronAPI', error);
}
