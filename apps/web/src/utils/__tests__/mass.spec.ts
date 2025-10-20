import { describe, it, expect } from 'vitest';
import type { Issue } from '@pkg/core';
import {
  deriveMassStatus,
  getUtilizationSeverity,
  summarizeAxleContributions,
  deriveDominantContributors,
} from '../mass';
import type { MassAnalysis } from '@pkg/core';

describe('mass utilities', () => {
  it('derives the highest severity from issues', () => {
    const issues: Issue[] = [
      { code: 'mass.axle.nearLimit', severity: 'warning', message: '', relatedInstanceIds: [] },
      { code: 'mass.total', severity: 'critical', message: '', relatedInstanceIds: [] },
    ];
    const status = deriveMassStatus(issues);
    expect(status.severity).toBe('critical');
    expect(status.overloaded).toHaveLength(1);
    expect(status.nearLimit).toHaveLength(1);
  });

  it('returns null severity when there are no issues', () => {
    const status = deriveMassStatus([]);
    expect(status.severity).toBeNull();
    expect(status.overloaded).toHaveLength(0);
    expect(status.nearLimit).toHaveLength(0);
  });

  it('maps utilization to severity thresholds', () => {
    expect(getUtilizationSeverity(0.5)).toBeNull();
    expect(getUtilizationSeverity(0.8)).toBe('info');
    expect(getUtilizationSeverity(0.92)).toBe('warning');
    expect(getUtilizationSeverity(1.05)).toBe('critical');
  });

  it('summarizes axle contributions with fallback when share is small', () => {
    const analysis: MassAnalysis = {
      totalMass_kg: 200,
      barycenterX_mm: 0,
      payloadMargin_kg: null,
      axleLoads: [
        { index: 1, position_mm: 0, load_kg: 120, maxLoad_kg: 150, utilization: 0.8 },
        { index: 2, position_mm: 2000, load_kg: 80, maxLoad_kg: 150, utilization: 0.53 },
      ],
      moduleContributions: [
        {
          instanceId: 'a',
          moduleSku: 'mod-a',
          moduleName: 'Module A',
          mass_kg: 100,
          barycenterX_mm: 0,
          axleLoads_kg: [90, 10],
        },
        {
          instanceId: 'b',
          moduleSku: 'mod-b',
          moduleName: 'Module B',
          mass_kg: 100,
          barycenterX_mm: 0,
          axleLoads_kg: [30, 70],
        },
      ],
    };

    const breakdown = summarizeAxleContributions(analysis, { minShare: 0.4 });
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].contributions).toHaveLength(1);
    expect(breakdown[0].contributions[0].instanceId).toBe('a');
    expect(breakdown[0].othersLoad_kg).toBeCloseTo(30, 5);
    expect(breakdown[1].contributions[0].instanceId).toBe('b');
  });

  it('derives dominant contributors sorted by share then load', () => {
    const analysis: MassAnalysis = {
      totalMass_kg: 100,
      barycenterX_mm: 0,
      payloadMargin_kg: null,
      axleLoads: [
        { index: 1, position_mm: 0, load_kg: 40, maxLoad_kg: 150, utilization: 0.26 },
        { index: 2, position_mm: 1000, load_kg: 60, maxLoad_kg: 150, utilization: 0.4 },
      ],
      moduleContributions: [
        {
          instanceId: 'a',
          moduleSku: 'mod-a',
          moduleName: 'Module A',
          mass_kg: 40,
          barycenterX_mm: 0,
          axleLoads_kg: [30, 10],
        },
        {
          instanceId: 'b',
          moduleSku: 'mod-b',
          moduleName: 'Module B',
          mass_kg: 60,
          barycenterX_mm: 0,
          axleLoads_kg: [10, 50],
        },
      ],
    };

    const dominant = deriveDominantContributors(analysis, 2);
    expect(dominant[0].instanceId).toBe('b');
    expect(dominant[0].heaviestAxleIndex).toBe(2);
    expect(dominant[0].heaviestShare).toBeCloseTo(50 / 60, 5);
    expect(dominant[1].instanceId).toBe('a');
  });
});
