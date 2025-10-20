import React from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@pkg/ui';
import { useEditorStore } from './state/useEditorStore';
import { useAutosave } from './hooks/useAutosave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useProjectBootstrap } from './hooks/useProjectBootstrap';
import { useI18nSync } from './hooks/useI18nSync';
import { useElectronBridge } from './hooks/useElectronBridge';
import { AppToolbar } from './components/layout/AppToolbar';
import { CatalogPanel } from './components/panels/CatalogPanel';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { AlertsPanel } from './components/panels/AlertsPanel';
import { SceneCanvas } from './components/canvas/SceneCanvas';
import { ToastViewport } from './components/layout/ToastViewport';
import './assets/app.css';

const MeasureOverlay: React.FC = () => {
  const { t } = useTranslation();
  const measure = useEditorStore((state) => state.measure);
  const lengthUnit = useEditorStore((state) => state.lengthUnit);
  if (!measure.active) {
    return null;
  }
  const distance = measure.distance_mm
    ? lengthUnit === 'mm'
      ? `${measure.distance_mm.toFixed(1)} mm`
      : `${(measure.distance_mm / 25.4).toFixed(2)} in`
    : '…';
  return (
    <div className="measure-overlay">
      <strong>{t('toolbar.measure')}</strong>
      <span>{distance}</span>
      <span>{measure.points.length} points</span>
    </div>
  );
};

const SnapOverlay: React.FC = () => {
  const translationSnap = useEditorStore((state) => state.translationSnap);
  const project = useEditorStore((state) => state.project);
  const lengthUnit = useEditorStore((state) => state.lengthUnit);
  const rotationSnap = project?.settings.snap.rotation_deg ?? 5;
  const length = lengthUnit === 'mm' ? `${translationSnap} mm` : `${(translationSnap / 25.4).toFixed(2)} in`;
  return (
    <div className="canvas-snap-info">
      <span>Snap: {length}</span>
      <span>Rotation: {rotationSnap}°</span>
    </div>
  );
};

const AppContent: React.FC = () => {
  useServiceWorker();
  useAutosave();
  useKeyboardShortcuts();
  useI18nSync();
  useElectronBridge();
  const { loading, error } = useProjectBootstrap();

  if (loading) {
    return <div style={{ padding: '3rem' }}>Chargement du projet…</div>;
  }
  if (error) {
    return <div style={{ padding: '3rem', color: 'var(--color-accent)' }}>Erreur: {error}</div>;
  }

  return (
    <div className="app-shell">
      <AppToolbar />
      <CatalogPanel />
      <div className="app-viewport">
        <SceneCanvas />
        <MeasureOverlay />
        <SnapOverlay />
      </div>
      <PropertiesPanel />
      <AlertsPanel />
      <ToastViewport />
    </div>
  );
};

const App: React.FC = () => {
  const project = useEditorStore((state) => state.project);
  const theme = project?.settings.theme ?? 'system';
  return (
    <ThemeProvider initialTheme={theme as 'light' | 'dark' | 'system'}>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
