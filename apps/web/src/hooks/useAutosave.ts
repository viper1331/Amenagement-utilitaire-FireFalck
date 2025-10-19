import { useEffect } from 'react';
import { persistProject } from '../services/indexedDb';
import { useEditorStore } from '../state/useEditorStore';

export const useAutosave = (): void => {
  const project = useEditorStore((state) => state.project);
  const markAutosaved = useEditorStore((state) => state.markAutosaved);

  useEffect(() => {
    if (!project) {
      return;
    }
    void (async () => {
      await persistProject(project);
      markAutosaved();
    })();
  }, [project, markAutosaved]);

  useEffect(() => {
    if (!project) {
      return;
    }
    const { autosave } = project.settings;
    if (!autosave?.enabled) {
      return;
    }
    const intervalMs = (autosave.interval_s ?? 60) * 1000;
    const tick = async () => {
      await persistProject(project);
      markAutosaved();
    };
    const handle = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(handle);
  }, [project, markAutosaved]);
};
