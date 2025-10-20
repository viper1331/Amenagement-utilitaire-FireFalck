import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Toolbar,
  Button,
  IconButton,
  NumberInput,
  IconPlus,
  IconFolderOpen,
  IconSave,
  IconExport,
  IconUndo,
  IconRedo,
  IconRuler,
  IconFPV,
  IconSnap,
  IconWalkway,
  IconMass,
  IconLanguage,
  IconTheme,
  IconEye,
  IconEyeOff,
  IconTarget,
} from '@pkg/ui';
import { triggerProjectExportDownloads } from '../../services/exporters';
import { downloadProjectFile, parseProjectFile, createEmptyProject } from '../../services/projectLoader';
import { useEditorStore, type LengthUnit } from '../../state/useEditorStore';
import {
  WALKWAY_MAX_MM,
  WALKWAY_MIN_MM,
  WALKWAY_STEP_MM,
} from '../../constants/walkway';

const SNAP_OPTIONS = [25, 50, 100] as const;

export const AppToolbar: React.FC = () => {
  const { t } = useTranslation();
  const project = useEditorStore((state) => state.project);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setMeasureActive = useEditorStore((state) => state.setMeasureActive);
  const measure = useEditorStore((state) => state.measure);
  const viewMode = useEditorStore((state) => state.viewMode);
  const setViewMode = useEditorStore((state) => state.setViewMode);
  const translationSnap = useEditorStore((state) => state.translationSnap);
  const rotationSnap = project?.settings.snap.rotation_deg ?? 5;
  const setTranslationSnap = useEditorStore((state) => state.setTranslationSnap);
  const setRotationSnap = useEditorStore((state) => state.setRotationSnap);
  const evaluation = useEditorStore((state) => state.evaluation);
  const walkwayMinWidth = useEditorStore((state) => state.walkwayMinWidth);
  const walkwayVisible = useEditorStore((state) => state.walkwayVisible);
  const massOverlayVisible = useEditorStore((state) => state.massOverlayVisible);
  const toggleMassOverlayVisible = useEditorStore((state) => state.toggleMassOverlayVisible);
  const barycenterVisible = useEditorStore((state) => state.barycenterVisible);
  const toggleBarycenterVisible = useEditorStore((state) => state.toggleBarycenterVisible);
  const setWalkwayMinWidth = useEditorStore((state) => state.setWalkwayMinWidth);
  const toggleWalkwayVisible = useEditorStore((state) => state.toggleWalkwayVisible);
  const importProject = useEditorStore((state) => state.importProject);
  const setProject = useEditorStore((state) => state.setProject);
  const loadDemo = useEditorStore((state) => state.loadDemo);
  const lengthUnit = useEditorStore((state) => state.lengthUnit);
  const setLengthUnit = useEditorStore((state) => state.setLengthUnit);
  const addToast = useEditorStore((state) => state.addToast);
  const setLanguage = useEditorStore((state) => state.setLanguage);
  const setTheme = useEditorStore((state) => state.setTheme);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    if (evaluation) {
      triggerProjectExportDownloads(evaluation);
      addToast(t('status.exportSuccess'), 'success');
    } else {
      addToast(t('status.exportFailed'), 'warning');
    }
  };

  const handleSaveProject = () => {
    if (project) {
      downloadProjectFile(project);
    }
  };

  const handleOpenProject = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const parsed = await parseProjectFile(file);
      importProject(parsed);
      addToast(t('panel.demoLoaded'), 'success');
    } catch (error) {
      console.error(error);
      addToast(String((error as Error).message), 'danger');
    }
  };

  const handleNewProject = () => {
    const blueprintId = project?.vehicle.blueprintId ?? 'vsav_master_l2h2_etech_2025';
    const empty = createEmptyProject({ name: 'Nouveau projet', vehicleBlueprintId: blueprintId });
    setProject(empty);
    addToast(t('menu.newProject'), 'info');
  };

  const handleSnapChange = (value: number) => {
    setTranslationSnap(value);
  };

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLengthUnit(event.target.value as LengthUnit);
  };

  const handleWalkwayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    if (!Number.isFinite(value)) {
      return;
    }
    const clamped = Math.min(WALKWAY_MAX_MM, Math.max(WALKWAY_MIN_MM, value));
    setWalkwayMinWidth(clamped);
  };

  const handleWalkwayToggle = () => {
    const next = toggleWalkwayVisible();
    addToast(
      next ? t('toast.walkwayShown') ?? 'Walkway overlay shown' : t('toast.walkwayHidden') ?? 'Walkway overlay hidden',
      'info',
    );
  };

  const handleMassOverlayToggle = () => {
    const next = toggleMassOverlayVisible();
    addToast(
      next
        ? t('toast.massOverlayShown') ?? 'Mass overlay shown'
        : t('toast.massOverlayHidden') ?? 'Mass overlay hidden',
      'info',
    );
  };

  const handleBarycenterToggle = () => {
    const next = toggleBarycenterVisible();
    addToast(
      next
        ? t('toast.barycenterShown') ?? 'Barycenter marker shown'
        : t('toast.barycenterHidden') ?? 'Barycenter marker hidden',
      'info',
    );
  };

  return (
    <div className="app-toolbar">
      <Toolbar
        left={
          <div className="toolbar-section">
            <Button variant="primary" icon={<IconPlus />} onClick={handleNewProject}>
              {t('toolbar.newProject')}
            </Button>
            <Button variant="secondary" icon={<IconFolderOpen />} onClick={handleOpenProject}>
              {t('toolbar.openProject')}
            </Button>
            <Button variant="secondary" icon={<IconSave />} onClick={handleSaveProject}>
              {t('toolbar.saveProject')}
            </Button>
            <Button variant="secondary" icon={<IconExport />} onClick={handleExport}>
              {t('toolbar.export')}
            </Button>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept=".json,.fpvproj,application/json"
              onChange={handleFileChange}
            />
          </div>
        }
        right={
          <div className="toolbar-section">
            <span className="language-selector">
              <IconLanguage />
              <select
                data-testid="language-select"
                value={project?.settings.language ?? 'fr'}
                onChange={(event) => setLanguage(event.target.value as 'fr' | 'en')}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </span>
            <span className="theme-selector">
              <IconTheme />
              <select
                value={project?.settings.theme ?? 'system'}
                onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
              >
                <option value="light">{t('toolbar.theme.light')}</option>
                <option value="dark">{t('toolbar.theme.dark')}</option>
                <option value="system">{t('toolbar.theme.system')}</option>
              </select>
            </span>
          </div>
        }
      >
        <div className="toolbar-section">
          <Button variant="secondary" icon={<IconUndo />} onClick={undo}>
            {t('toolbar.undo')}
          </Button>
          <Button variant="secondary" icon={<IconRedo />} onClick={redo}>
            {t('toolbar.redo')}
          </Button>
          <Button
            variant={measure.active ? 'primary' : 'secondary'}
            icon={<IconRuler />}
            onClick={() => setMeasureActive(!measure.active)}
          >
            {t('toolbar.measure')}
          </Button>
          <Button
            variant={viewMode === 'fpv' ? 'primary' : 'secondary'}
            icon={<IconFPV />}
            onClick={() => setViewMode(viewMode === 'fpv' ? 'orbit' : 'fpv')}
          >
            {t('toolbar.fpv')}
          </Button>
          <Button variant="secondary" onClick={() => loadDemo()}>
            {t('panel.demo')}
          </Button>
        </div>
        <div className="toolbar-section">
          <span className="snap-selector">
            <IconSnap />
            <select value={translationSnap} onChange={(event) => handleSnapChange(Number(event.target.value))}>
              {SNAP_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`toolbar.snap.${value}`)}
                </option>
              ))}
            </select>
          </span>
          <span className="snap-selector">
            {t('legend.rotation')}
            <select value={rotationSnap} onChange={(event) => setRotationSnap(Number(event.target.value))}>
              {[5, 10, 15].map((value) => (
                <option key={value} value={value}>
                  {value}°
                </option>
              ))}
            </select>
          </span>
          <span className="snap-selector walkway-controls">
            <IconWalkway />
            <IconButton
              className="toolbar-walkway-toggle"
              label={
                walkwayVisible
                  ? t('toolbar.hideWalkway') ?? 'Hide walkway overlay'
                  : t('toolbar.showWalkway') ?? 'Show walkway overlay'
              }
              icon={walkwayVisible ? <IconEye /> : <IconEyeOff />}
              active={walkwayVisible}
              aria-pressed={walkwayVisible}
              onClick={handleWalkwayToggle}
            />
            <NumberInput
              aria-label={t('toolbar.walkway') ?? 'Walkway'}
              min={WALKWAY_MIN_MM}
              max={WALKWAY_MAX_MM}
              step={WALKWAY_STEP_MM}
              value={walkwayMinWidth.toString()}
              onChange={handleWalkwayChange}
              title={t('toolbar.walkwayHint') ?? ''}
            />
            <span className="snap-selector__unit">mm</span>
          </span>
          <span className="snap-selector mass-controls">
            <IconMass />
            <IconButton
              className="toolbar-mass-toggle"
              label={
                massOverlayVisible
                  ? t('toolbar.hideMassOverlay') ?? 'Hide mass overlay'
                  : t('toolbar.showMassOverlay') ?? 'Show mass overlay'
              }
              icon={massOverlayVisible ? <IconEye /> : <IconEyeOff />}
              active={massOverlayVisible}
              aria-pressed={massOverlayVisible}
              onClick={handleMassOverlayToggle}
            />
            <IconButton
              className="toolbar-barycenter-toggle"
              label={
                barycenterVisible
                  ? t('toolbar.hideBarycenter') ?? 'Hide barycenter marker'
                  : t('toolbar.showBarycenter') ?? 'Show barycenter marker'
              }
              icon={<IconTarget />}
              active={barycenterVisible}
              aria-pressed={barycenterVisible}
              onClick={handleBarycenterToggle}
            />
          </span>
          <span className="language-selector">
            {t('legend.units')}
            <select value={lengthUnit} onChange={handleUnitChange}>
              <option value="mm">{t('toolbar.units.mm')}</option>
              <option value="in">{t('toolbar.units.in')}</option>
            </select>
          </span>
        </div>
      </Toolbar>
    </div>
  );
};
