import { useEffect } from 'react';
import { useEditorStore } from '../state/useEditorStore';

const isMac = () => navigator.platform.toLowerCase().includes('mac');

export const useKeyboardShortcuts = (): void => {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const setMeasureActive = useEditorStore((state) => state.setMeasureActive);
  const measure = useEditorStore((state) => state.measure);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const modifier = isMac() ? event.metaKey : event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelected();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setMeasureActive(!measure.active);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, removeSelected, duplicateSelected, measure.active, setMeasureActive]);
};
