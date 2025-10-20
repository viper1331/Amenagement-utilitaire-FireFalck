import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { IssueSeverity } from '@pkg/core';
import { Panel, IconButton, IconMass, IconEye, IconEyeOff, IconTarget } from '@pkg/ui';
import { useProjectEvaluation } from '../../hooks/useProjectEvaluation';
import { useEditorStore } from '../../state/useEditorStore';
import { formatLength, formatMass, formatPercentage } from '../../utils/format';
import {
  deriveMassStatus,
  getUtilizationSeverity,
  summarizeAxleContributions,
  deriveDominantContributors,
} from '../../utils/mass';

const severityClass = (severity: IssueSeverity | null | undefined): string => {
  if (!severity) {
    return 'mass-gauge--ok';
  }
  return `mass-gauge--${severity}`;
};

const axleSeverityClass = (utilization: number): string => {
  const severity = getUtilizationSeverity(utilization);
  if (!severity) {
    return 'mass-axle--ok';
  }
  return `mass-axle--${severity}`;
};

export const MassPanel: React.FC = () => {
  const { t } = useTranslation();
  const { evaluation, vehicle } = useProjectEvaluation();
  const massOverlayVisible = useEditorStore((state) => state.massOverlayVisible);
  const toggleMassOverlayVisible = useEditorStore((state) => state.toggleMassOverlayVisible);
  const barycenterVisible = useEditorStore((state) => state.barycenterVisible);
  const toggleBarycenterVisible = useEditorStore((state) => state.toggleBarycenterVisible);
  const addToast = useEditorStore((state) => state.addToast);
  const setSelection = useEditorStore((state) => state.setSelection);

  const status = useMemo(() => deriveMassStatus(evaluation?.massIssues), [evaluation]);

  const axleBreakdown = useMemo(
    () => (evaluation ? summarizeAxleContributions(evaluation.mass) : []),
    [evaluation]
  );

  const dominantModules = useMemo(
    () => (evaluation ? deriveDominantContributors(evaluation.mass) : []),
    [evaluation]
  );

  if (!evaluation || !vehicle) {
    return (
      <Panel title={t('massPanel.title')} className="app-mass">
        <p>{t('massPanel.empty')}</p>
      </Panel>
    );
  }

  const { mass } = evaluation;
  const axleRange = evaluation.mass.axleLoads.length > 0
    ? {
        min: Math.min(...evaluation.mass.axleLoads.map((axle) => axle.position_mm)),
        max: Math.max(...evaluation.mass.axleLoads.map((axle) => axle.position_mm)),
      }
    : { min: 0, max: vehicle.wheelbase_mm ?? 1 };
  const span = Math.max(1, axleRange.max - axleRange.min);
  const barycenterRatio = Math.max(0, Math.min(1, (mass.barycenterX_mm - axleRange.min) / span));

  const handleMassToggle = () => {
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

  const payloadMargin = mass.payloadMargin_kg;
  const payloadSeverity: IssueSeverity | null =
    payloadMargin === null
      ? null
      : payloadMargin < 0
      ? 'critical'
      : payloadMargin < 50
      ? 'warning'
      : null;

  const focusModule = (instanceId: string) => {
    setSelection([instanceId]);
  };

  return (
    <Panel title={t('massPanel.title')} className="app-mass">
      <div className="mass-panel">
        <div className="mass-panel__actions">
          <div className="mass-panel__actions-primary">
            <IconMass />
            <strong>{t('massPanel.totalMass')}: {formatMass(mass.totalMass_kg)}</strong>
            <span>{t('massPanel.barycenterLabel')}: {formatLength(mass.barycenterX_mm, 'mm')}</span>
          </div>
          <div className="mass-panel__action-buttons">
            <IconButton
              className="mass-panel__toggle"
              label={
                massOverlayVisible
                  ? t('toolbar.hideMassOverlay') ?? 'Hide mass overlay'
                  : t('toolbar.showMassOverlay') ?? 'Show mass overlay'
              }
              icon={massOverlayVisible ? <IconEye /> : <IconEyeOff />}
              active={massOverlayVisible}
              aria-pressed={massOverlayVisible}
              onClick={handleMassToggle}
            />
            <IconButton
              className="mass-panel__toggle"
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
          </div>
        </div>
        <div className={`mass-gauge ${severityClass(status.severity)}`}>
          <div className="mass-gauge__header">
            <span>{t('massPanel.barycenterTitle')}</span>
            <span>{Math.round(barycenterRatio * 100)}%</span>
          </div>
          <div className="mass-gauge__track" aria-hidden>
            <span className="mass-gauge__fill" style={{ width: `${barycenterRatio * 100}%` }} />
          </div>
          <div className="mass-gauge__footer">
            <span>{t('massPanel.axleFront')}</span>
            <span>{t('massPanel.axleRear')}</span>
          </div>
        </div>
        {payloadMargin !== null && (
          <div className={`mass-payload ${severityClass(payloadSeverity)}`}>
            {payloadMargin >= 0
              ? t('massPanel.payloadReserve', { value: formatMass(payloadMargin) })
              : t('massPanel.payloadExceeded', { value: formatMass(Math.abs(payloadMargin)) })}
          </div>
        )}
        <div className="mass-axle-grid">
          {evaluation.mass.axleLoads.map((axle) => (
            <div key={axle.index} className={`mass-axle ${axleSeverityClass(axle.utilization)}`}>
              <div className="mass-axle__header">
                <span>{t('massPanel.axleLabel', { index: axle.index })}</span>
                <span>{Math.round(axle.utilization * 100)}%</span>
              </div>
              <div className="mass-axle__track" aria-hidden>
                <span
                  className="mass-axle__fill"
                  style={{ width: `${Math.min(1.2, Math.max(0, axle.utilization)) * 100}%` }}
                />
              </div>
              <div className="mass-axle__metrics">
                <span>{formatMass(axle.load_kg)}</span>
                {axle.maxLoad_kg ? (
                  <span>{t('massPanel.axleLimit', { value: formatMass(axle.maxLoad_kg) })}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {dominantModules.length > 0 ? (
          <div className="mass-dominant">
            <h4>{t('massPanel.dominantModulesTitle')}</h4>
            <ul>
              {dominantModules.map((module) => (
                <li key={module.instanceId}>
                  <button
                    type="button"
                    className="mass-dominant__focus"
                    onClick={() => focusModule(module.instanceId)}
                    aria-label={t('massPanel.focusModule', { name: module.moduleName }) ?? 'Focus module'}
                  >
                    {module.moduleName}
                  </button>
                  <span className="mass-dominant__details">
                    {formatMass(module.heaviestLoad_kg)} ·{' '}
                    {module.heaviestAxleIndex
                      ? t('massPanel.axleLabel', { index: module.heaviestAxleIndex })
                      : t('massPanel.axleUnknown')}
                    {' · '}
                    {formatPercentage(module.heaviestShare)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mass-contributions">
          <h4>{t('massPanel.axleBreakdownTitle')}</h4>
          {axleBreakdown.map((summary) => (
            <div key={summary.axle.index} className="mass-contributions__axle">
              <div className="mass-contributions__axle-header">
                <span>{t('massPanel.axleLabel', { index: summary.axle.index })}</span>
                <span>{formatMass(summary.axle.load_kg)}</span>
              </div>
              <ul className="mass-contributions__list">
                {summary.contributions.map((contribution) => (
                  <li key={contribution.instanceId}>
                    <button
                      type="button"
                      className="mass-contributions__module"
                      onClick={() => focusModule(contribution.instanceId)}
                      aria-label={
                        t('massPanel.focusModule', { name: contribution.moduleName }) ?? 'Focus module'
                      }
                    >
                      {contribution.moduleName}
                    </button>
                    <span className="mass-contributions__details">
                      {formatMass(contribution.load_kg)} · {formatPercentage(contribution.share)}
                    </span>
                  </li>
                ))}
              </ul>
              {summary.othersShare > 0 ? (
                <div className="mass-contributions__others">
                  {t('massPanel.axleOthers', {
                    share: formatPercentage(summary.othersShare),
                    mass: formatMass(summary.othersLoad_kg),
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};
