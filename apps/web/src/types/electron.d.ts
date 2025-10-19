export interface ElectronProjectPayload {
  readonly filePath: string;
  readonly content: string;
}

export interface ElectronProjectErrorPayload {
  readonly filePath: string;
  readonly error: string;
}

export interface ElectronAPI {
  onProjectOpen: (
    callback: (payload: ElectronProjectPayload) => void,
  ) => void | (() => void);
  onProjectOpenError: (
    callback: (payload: ElectronProjectErrorPayload) => void,
  ) => void | (() => void);
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    __EDITOR_STORE__?: unknown;
  }
}

export {};
