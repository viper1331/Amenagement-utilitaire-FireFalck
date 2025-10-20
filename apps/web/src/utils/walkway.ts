import type { Issue, IssueSeverity } from '@pkg/core';

const severityRank: Record<IssueSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export interface WalkwayStatus {
  readonly issues: readonly Issue[];
  readonly severity: IssueSeverity | null;
}

export const filterWalkwayIssues = (
  issues: readonly Issue[] | undefined,
): Issue[] => issues?.filter((issue) => issue.code.startsWith('walkway.')) ?? [];

export const deriveWalkwayStatus = (
  issues: readonly Issue[] | undefined,
): WalkwayStatus => {
  const walkwayIssues = filterWalkwayIssues(issues);
  let highest: IssueSeverity | null = null;
  for (const issue of walkwayIssues) {
    if (!highest || severityRank[issue.severity] > severityRank[highest]) {
      highest = issue.severity;
    }
  }
  return { issues: walkwayIssues, severity: highest };
};
