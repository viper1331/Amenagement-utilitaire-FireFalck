import { describe, it, expect } from 'vitest';
import type { Issue } from '@pkg/core';
import { deriveWalkwayStatus, filterWalkwayIssues } from '../walkway';

describe('walkway utilities', () => {
  const makeIssue = (code: string, severity: Issue['severity']): Issue => ({
    code,
    message: code,
    severity,
  });

  it('filters walkway issues only', () => {
    const issues: Issue[] = [
      makeIssue('walkway.blocked', 'warning'),
      makeIssue('mass.overload', 'critical'),
    ];
    const walkway = filterWalkwayIssues(issues);
    expect(walkway).toHaveLength(1);
    expect(walkway[0].code).toBe('walkway.blocked');
  });

  it('returns null severity when there is no walkway issue', () => {
    const status = deriveWalkwayStatus(undefined);
    expect(status.issues).toHaveLength(0);
    expect(status.severity).toBeNull();
  });

  it('tracks the highest walkway severity', () => {
    const issues: Issue[] = [
      makeIssue('walkway.info', 'info'),
      makeIssue('walkway.blocked', 'warning'),
      makeIssue('walkway.blocked-critical', 'critical'),
    ];
    const status = deriveWalkwayStatus(issues);
    expect(status.issues).toHaveLength(3);
    expect(status.severity).toBe('critical');
  });
});
