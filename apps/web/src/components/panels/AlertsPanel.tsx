import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Issue, IssueSeverity } from '@pkg/core';
import { Panel, Badge, IconAlert, IconMass } from '@pkg/ui';
import { useProjectEvaluation } from '../../hooks/useProjectEvaluation';
import { formatLength, formatMass } from '../../utils/format';

const severityOrder: Record<IssueSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const severityConfig = [
  { level: 'critical' as const, badgeTone: 'danger' as const },
  { level: 'warning' as const, badgeTone: 'warning' as const },
  { level: 'info' as const, badgeTone: 'default' as const },
];

export const AlertsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { evaluation, vehicle } = useProjectEvaluation();

  const groupedIssues = useMemo(() => {
    const result: Record<IssueSeverity, Issue[]> = {
      critical: [],
      warning: [],
      info: [],
    };
    if (!evaluation) {
      return result;
    }
    evaluation.issues.forEach((issue) => {
      result[issue.severity].push(issue);
    });
    return result;
  }, [evaluation]);

  if (!evaluation || !vehicle) {
    return (
      <Panel title={t('alerts.title')} className="app-alerts">
        <p>{t('alerts.none')}</p>
      </Panel>
    );
  }

  const { mass } = evaluation;

  return (
    <Panel title={t('alerts.title')} className="app-alerts">
      <div className="status-bar">
        <span>
          <strong>{t('status.vehicle')}:</strong> {vehicle.label}
        </span>
        <span>
          <strong>{t('status.walkway')}:</strong> {formatLength(evaluation.context.walkwayMinWidth_mm, 'mm')}
        </span>
        <span>
          <IconMass /> {t('status.kpi.totalMass')}: {formatMass(mass.totalMass_kg)}
        </span>
        <span>
          {t('status.kpi.mass')}: {mass.barycenterX_mm.toFixed(1)} mm
        </span>
        {mass.axleLoads.map((axle) => (
          <span key={axle.index}>
            {t('status.kpi.axle', { index: axle.index })}: {axle.load_kg.toFixed(1)} kg ({Math.round(axle.utilization * 100)}%)
          </span>
        ))}
      </div>
      <div className="alerts-grid">
        {severityConfig.map(({ level, badgeTone }) => (
          <div key={level} className="alert-card">
            <header>
              <Badge tone={badgeTone}>
                {t(`alerts.severity.${level}`)} ({groupedIssues[level].length})
              </Badge>
            </header>
            <div className="alert-list scrollbar-thin">
              {groupedIssues[level].length === 0 ? (
                <p>{t('alerts.none')}</p>
              ) : (
                groupedIssues[level]
                  .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
                  .map((issue) => (
                    <div
                      key={`${issue.code}-${issue.relatedInstanceIds?.join('-') ?? 'global'}`}
                      className="alert-item"
                      data-severity={level}
                    >
                      <IconAlert />
                      <div>
                        <strong>{issue.code}</strong>
                        {issue.relatedInstanceIds && issue.relatedInstanceIds.length > 0 && (
                          <div>{issue.relatedInstanceIds.join(', ')}</div>
                        )}
                        {issue.message && <div>{issue.message}</div>}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};
