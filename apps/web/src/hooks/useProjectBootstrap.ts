import { useEffect, useState } from 'react';
import { restoreProject } from '../services/indexedDb';
import { useEditorStore } from '../state/useEditorStore';

export const useProjectBootstrap = (): { loading: boolean; error?: string } => {
  const project = useEditorStore((state) => state.project);
  const setProject = useEditorStore((state) => state.setProject);
  const loadDemo = useEditorStore((state) => state.loadDemo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (project) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const boot = async () => {
      try {
        const stored = await restoreProject();
        if (cancelled) {
          return;
        }
        if (stored) {
          setProject(stored);
        } else {
          await loadDemo();
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [project, setProject, loadDemo]);

  return { loading, error };
};
