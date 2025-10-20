export type IssueSeverity = 'info' | 'warning' | 'critical';

export interface Issue {
  readonly code: string;
  readonly message: string;
  readonly severity: IssueSeverity;
  readonly relatedInstanceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export const createIssue = (
  code: string,
  message: string,
  severity: IssueSeverity,
  relatedInstanceIds?: readonly string[],
  metadata?: Record<string, unknown>
): Issue => ({ code, message, severity, relatedInstanceIds, metadata });
