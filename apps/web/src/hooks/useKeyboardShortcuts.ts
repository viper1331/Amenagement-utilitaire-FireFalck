import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../state/useEditorStore';
import {
  WALKWAY_MAX_MM,
  WALKWAY_MIN_MM,
  WALKWAY_STEP_COARSE_MM,
  WALKWAY_STEP_MM,
} from '../constants/walkway';

const isMac = () => navigator.platform.toLowerCase().includes('mac');

export const useKeyboardShortcuts = (): void => {
  const { t } = useTranslation();
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const setMeasureActive = useEditorStore((state) => state.setMeasureActive);
  const measure = useEditorStore((state) => state.measure);
  const walkwayMinWidth = useEditorStore((state) => state.walkwayMinWidth);
  const setWalkwayMinWidth = useEditorStore((state) => state.setWalkwayMinWidth);
  const vehicle = useEditorStore((state) => state.vehicle);
  const addToast = useEditorStore((state) => state.addToast);

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
      if (modifier && event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? 1 : -1;
        const step = event.shiftKey ? WALKWAY_STEP_COARSE_MM : WALKWAY_STEP_MM;
        const vehicleWidth = vehicle?.interiorBox?.width_mm;
        const maxWalkway = Math.max(
          WALKWAY_MIN_MM,
          Math.min(WALKWAY_MAX_MM, Math.round(vehicleWidth ?? WALKWAY_MAX_MM)),
        );
        const next = Math.min(
          maxWalkway,
          Math.max(WALKWAY_MIN_MM, Math.round(walkwayMinWidth + direction * step)),
        );
        if (next !== walkwayMinWidth) {
          setWalkwayMinWidth(next);
          addToast(t('toast.walkwayAdjusted', { value: next }), 'info');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    undo,
    redo,
    removeSelected,
    duplicateSelected,
    measure.active,
    setMeasureActive,
    walkwayMinWidth,
    setWalkwayMinWidth,
    vehicle,
    addToast,
    t,
  ]);
};
