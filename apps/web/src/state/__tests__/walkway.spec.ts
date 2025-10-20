import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';
import { createEmptyProject } from '../../services/projectLoader';
import {
  WALKWAY_MIN_MM,
  WALKWAY_MAX_MM,
} from '../../constants/walkway';

const BLUEPRINT_ID = 'vsav_master_l2h2_etech_2025';

describe('useEditorStore walkway adjustments', () => {
  beforeEach(() => {
    const project = createEmptyProject({ name: 'Walkway Test', vehicleBlueprintId: BLUEPRINT_ID });
    useEditorStore.getState().setProject(project);
  });

  it('clamps walkway width to the configured maximum', () => {
    useEditorStore.getState().setWalkwayMinWidth(WALKWAY_MAX_MM + 500);
    const { walkwayMinWidth, project } = useEditorStore.getState();
    expect(walkwayMinWidth).toBe(WALKWAY_MAX_MM);
    expect(project?.settings.walkway.minWidth_mm).toBe(WALKWAY_MAX_MM);
  });

  it('clamps walkway width to the configured minimum', () => {
    useEditorStore.getState().setWalkwayMinWidth(WALKWAY_MIN_MM - 200);
    const { walkwayMinWidth, project } = useEditorStore.getState();
    expect(walkwayMinWidth).toBe(WALKWAY_MIN_MM);
    expect(project?.settings.walkway.minWidth_mm).toBe(WALKWAY_MIN_MM);
  });

  it('toggles walkway overlay visibility and persists to the project settings', () => {
    const { walkwayVisible: initialVisibility, project: initialProject } = useEditorStore.getState();
    expect(initialVisibility).toBe(true);
    expect(initialProject?.settings.walkway.showOverlay).toBe(true);

    const next = useEditorStore.getState().toggleWalkwayVisible();
    expect(next).toBe(false);
    const { walkwayVisible: afterToggleVisibility, project: afterToggleProject } = useEditorStore.getState();
    expect(afterToggleVisibility).toBe(false);
    expect(afterToggleProject?.settings.walkway.showOverlay).toBe(false);

    useEditorStore.getState().setWalkwayVisible(true);
    const { walkwayVisible: restoredVisibility, project: restoredProject } = useEditorStore.getState();
    expect(restoredVisibility).toBe(true);
    expect(restoredProject?.settings.walkway.showOverlay).toBe(true);
  });
});
