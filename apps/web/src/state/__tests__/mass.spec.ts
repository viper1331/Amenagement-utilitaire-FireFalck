import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';
import { createEmptyProject } from '../../services/projectLoader';

const BLUEPRINT_ID = 'vsav_master_l2h2_etech_2025';

describe('useEditorStore mass overlay settings', () => {
  beforeEach(() => {
    const project = createEmptyProject({ name: 'Mass Test', vehicleBlueprintId: BLUEPRINT_ID });
    useEditorStore.getState().setProject(project);
  });

  it('toggles the mass overlay visibility and persists settings', () => {
    expect(useEditorStore.getState().massOverlayVisible).toBe(true);
    expect(useEditorStore.getState().project?.settings.mass?.showOverlay).toBe(true);

    const next = useEditorStore.getState().toggleMassOverlayVisible();
    expect(next).toBe(false);
    expect(useEditorStore.getState().massOverlayVisible).toBe(false);
    expect(useEditorStore.getState().project?.settings.mass?.showOverlay).toBe(false);

    useEditorStore.getState().setMassOverlayVisible(true);
    expect(useEditorStore.getState().massOverlayVisible).toBe(true);
    expect(useEditorStore.getState().project?.settings.mass?.showOverlay).toBe(true);
  });

  it('toggles the barycenter marker visibility', () => {
    expect(useEditorStore.getState().barycenterVisible).toBe(true);
    expect(useEditorStore.getState().project?.settings.mass?.showBarycenter).toBe(true);

    const next = useEditorStore.getState().toggleBarycenterVisible();
    expect(next).toBe(false);
    expect(useEditorStore.getState().barycenterVisible).toBe(false);
    expect(useEditorStore.getState().project?.settings.mass?.showBarycenter).toBe(false);

    useEditorStore.getState().setBarycenterVisible(true);
    expect(useEditorStore.getState().barycenterVisible).toBe(true);
    expect(useEditorStore.getState().project?.settings.mass?.showBarycenter).toBe(true);
  });
});
