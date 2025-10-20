import type {
  Issue,
  IssueSeverity,
  MassAnalysis,
  ModuleMassContribution,
  AxleLoad,
} from '@pkg/core';

export interface MassStatus {
  readonly severity: IssueSeverity | null;
  readonly issues: readonly Issue[];
  readonly overloaded: readonly Issue[];
  readonly nearLimit: readonly Issue[];
}

const severityOrder: Record<IssueSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export const deriveMassStatus = (issues: readonly Issue[] | undefined): MassStatus => {
  if (!issues || issues.length === 0) {
    return { severity: null, issues: [], overloaded: [], nearLimit: [] };
  }

  let severity: IssueSeverity | null = null;
  const overloaded: Issue[] = [];
  const nearLimit: Issue[] = [];

  for (const issue of issues) {
    if (issue.code.startsWith('mass.axle.overload') || issue.code === 'mass.total' || issue.code === 'mass.payload.reserve') {
      overloaded.push(issue);
    }
    if (issue.code.startsWith('mass.axle.nearLimit')) {
      nearLimit.push(issue);
    }
    if (!severity || severityOrder[issue.severity] > severityOrder[severity]) {
      severity = issue.severity;
      if (severity === 'critical') {
        // no higher level possible
        break;
      }
    }
  }

  return { severity, issues, overloaded, nearLimit };
};

export const getUtilizationSeverity = (utilization: number): IssueSeverity | null => {
  if (!Number.isFinite(utilization)) {
    return null;
  }
  if (utilization >= 1) {
    return 'critical';
  }
  if (utilization >= 0.9) {
    return 'warning';
  }
  if (utilization >= 0.75) {
    return 'info';
  }
  return null;
};

export interface AxleContributionItem {
  readonly instanceId: string;
  readonly moduleSku: string;
  readonly moduleName: string;
  readonly load_kg: number;
  readonly share: number;
}

export interface AxleContributionSummary {
  readonly axle: AxleLoad;
  readonly contributions: readonly AxleContributionItem[];
  readonly othersLoad_kg: number;
  readonly othersShare: number;
}

const sortByLoadDesc = (a: AxleContributionItem, b: AxleContributionItem) => b.load_kg - a.load_kg;

const buildContribution = (
  module: ModuleMassContribution,
  axle: AxleLoad,
  axleIndex: number
): AxleContributionItem | null => {
  const load = module.axleLoads_kg[axleIndex] ?? 0;
  if (load <= 0) {
    return null;
  }
  const share = axle.load_kg === 0 ? 0 : load / axle.load_kg;
  return {
    instanceId: module.instanceId,
    moduleSku: module.moduleSku,
    moduleName: module.moduleName,
    load_kg: load,
    share,
  };
};

export const summarizeAxleContributions = (
  analysis: MassAnalysis,
  options?: { maxItems?: number; minShare?: number }
): AxleContributionSummary[] => {
  const maxItems = options?.maxItems ?? 5;
  const minShare = options?.minShare ?? 0.05;

  return analysis.axleLoads.map((axle, index) => {
    const contributions = analysis.moduleContributions
      .map((module) => buildContribution(module, axle, index))
      .filter((entry): entry is AxleContributionItem => entry !== null)
      .sort(sortByLoadDesc);

    const significant = contributions.filter((entry) => entry.share >= minShare);
    const display = (significant.length > 0 ? significant : contributions).slice(0, maxItems);
    const accountedLoad = display.reduce((sum, entry) => sum + entry.load_kg, 0);
    const othersLoad = Math.max(0, axle.load_kg - accountedLoad);
    const othersShare = axle.load_kg === 0 ? 0 : othersLoad / axle.load_kg;

    return {
      axle,
      contributions: display,
      othersLoad_kg: othersLoad,
      othersShare,
    };
  });
};

export interface DominantContributorSummary {
  readonly instanceId: string;
  readonly moduleSku: string;
  readonly moduleName: string;
  readonly mass_kg: number;
  readonly heaviestAxleIndex: number | null;
  readonly heaviestLoad_kg: number;
  readonly heaviestShare: number;
}

export const deriveDominantContributors = (
  analysis: MassAnalysis,
  limit = 5
): readonly DominantContributorSummary[] => {
  if (analysis.moduleContributions.length === 0) {
    return [];
  }

  return analysis.moduleContributions
    .map((module) => {
      let heaviestLoad = 0;
      let heaviestIndex = -1;
      module.axleLoads_kg.forEach((load, idx) => {
        if (load > heaviestLoad) {
          heaviestLoad = load;
          heaviestIndex = idx;
        }
      });
      const axle = heaviestIndex >= 0 ? analysis.axleLoads[heaviestIndex] : undefined;
      const share = axle && axle.load_kg > 0 ? heaviestLoad / axle.load_kg : 0;
      return {
        instanceId: module.instanceId,
        moduleSku: module.moduleSku,
        moduleName: module.moduleName,
        mass_kg: module.mass_kg,
        heaviestAxleIndex: axle?.index ?? null,
        heaviestLoad_kg: heaviestLoad,
        heaviestShare: share,
      };
    })
    .sort((a, b) => {
      if (b.heaviestShare === a.heaviestShare) {
        return b.heaviestLoad_kg - a.heaviestLoad_kg;
      }
      return b.heaviestShare - a.heaviestShare;
    })
    .slice(0, limit);
};
