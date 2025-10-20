import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../state/useEditorStore';

export const useElectronBridge = (): void => {
  const { t } = useTranslation();
  const importProject = useEditorStore((state) => state.importProject);
  const addToast = useEditorStore((state) => state.addToast);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      return;
    }

    const unsubscribeOpen = api.onProjectOpen?.(({ content, filePath }) => {
      try {
        const parsed = JSON.parse(content);
        importProject(parsed);
        addToast(t('toast.electronImported', { filePath }), 'success');
      } catch (error) {
        console.error('Import Electron échoué', error);
        addToast(t('toast.electronImportFailed', { filePath }), 'danger');
      }
    });

    const unsubscribeError = api.onProjectOpenError?.(({ filePath, error }) => {
      console.error('Erreur Electron', error);
      addToast(t('toast.electronImportFailed', { filePath }), 'danger');
    });

    return () => {
      if (typeof unsubscribeOpen === 'function') {
        unsubscribeOpen();
      }
      if (typeof unsubscribeError === 'function') {
        unsubscribeError();
      }
    };
  }, [addToast, importProject, t]);
};
