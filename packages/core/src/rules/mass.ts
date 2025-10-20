import type { ProjectContext } from '../project/context';
import { createIssue } from './types';
import type { Issue } from './types';

export interface AxleLoad {
  readonly index: number;
  readonly position_mm: number;
  readonly load_kg: number;
  readonly maxLoad_kg?: number | null;
  readonly utilization: number;
}

export interface MassAnalysis {
  readonly totalMass_kg: number;
  readonly barycenterX_mm: number;
  readonly axleLoads: readonly AxleLoad[];
  readonly payloadMargin_kg: number | null;
}

const distributeMassAcrossAxles = (
  axles: readonly { index: number; x_mm: number; maxLoad_kg?: number | null }[],
  mass_kg: number,
  x_mm: number
): number[] => {
  if (axles.length === 0) {
    return [];
  }
  if (axles.length === 1) {
    return [mass_kg];
  }

  const loads = new Array(axles.length).fill(0);
  if (x_mm <= axles[0].x_mm) {
    loads[0] = mass_kg;
    return loads;
  }
  const lastIndex = axles.length - 1;
  if (x_mm >= axles[lastIndex].x_mm) {
    loads[lastIndex] = mass_kg;
    return loads;
  }

  for (let i = 0; i < axles.length - 1; i += 1) {
    const left = axles[i];
    const right = axles[i + 1];
    if (x_mm >= left.x_mm && x_mm <= right.x_mm) {
      const span = right.x_mm - left.x_mm;
      const ratio = span === 0 ? 0.5 : (x_mm - left.x_mm) / span;
      loads[i] += mass_kg * (1 - ratio);
      loads[i + 1] += mass_kg * ratio;
      return loads;
    }
  }

  loads[0] += mass_kg;
  return loads;
};

export interface MassCheckResult {
  readonly analysis: MassAnalysis;
  readonly issues: readonly Issue[];
}

export const evaluateMassDistribution = (context: ProjectContext): MassCheckResult => {
  let totalMass = 0;
  let weightedX = 0;
  const axleLoads = new Array(context.vehicle.axles.length).fill(0);

  for (const module of context.modules) {
    const mass = module.module.mass_kg;
    totalMass += mass;
    weightedX += mass * module.obb.center.x;
    const contributions = distributeMassAcrossAxles(context.vehicle.axles, mass, module.obb.center.x);
    contributions.forEach((value, idx) => {
      axleLoads[idx] += value;
    });
  }

  const barycenterX = totalMass === 0 ? 0 : weightedX / totalMass;
  const payloadReserve = context.project.vehicle.payloadReserve_kg ?? null;
  const payloadMargin = payloadReserve === null ? null : payloadReserve - totalMass;

  const analysis: MassAnalysis = {
    totalMass_kg: totalMass,
    barycenterX_mm: barycenterX,
    axleLoads: context.vehicle.axles.map((axle, index) => {
      const maxLoad = axle.maxLoad_kg ?? null;
      const limit = maxLoad ?? (context.vehicle.gvw_kg / Math.max(1, context.vehicle.axles.length));
      const load = axleLoads[index];
      return {
        index: axle.index,
        position_mm: axle.x_mm,
        load_kg: load,
        maxLoad_kg: axle.maxLoad_kg ?? null,
        utilization: limit === 0 ? 0 : load / limit,
      };
    }),
    payloadMargin_kg: payloadMargin,
  };

  const issues: Issue[] = [];

  if (context.vehicle.gvw_kg < totalMass) {
    issues.push(
      createIssue(
        'mass.total',
        `La masse embarquée (${totalMass.toFixed(1)} kg) dépasse le PTAC (${context.vehicle.gvw_kg} kg)`,
        'critical'
      )
    );
  }

  analysis.axleLoads.forEach((axle) => {
    if (axle.maxLoad_kg && axle.load_kg > axle.maxLoad_kg) {
      issues.push(
        createIssue(
          'mass.axle.overload',
          `L'essieu ${axle.index} est surchargé (${axle.load_kg.toFixed(1)} kg > ${axle.maxLoad_kg} kg)`,
          'critical',
          undefined,
          { axleIndex: axle.index, load_kg: axle.load_kg, max_kg: axle.maxLoad_kg }
        )
      );
    } else if (axle.utilization > 0.9) {
      issues.push(
        createIssue(
          'mass.axle.nearLimit',
          `L'essieu ${axle.index} atteint ${Math.round(axle.utilization * 100)}% de sa charge`,
          'warning',
          undefined,
          { axleIndex: axle.index, utilization: axle.utilization }
        )
      );
    }
  });

  if (payloadMargin !== null && payloadMargin < 0) {
    issues.push(
      createIssue(
        'mass.payload.reserve',
        `La réserve de charge utile est dépassée (${payloadMargin.toFixed(1)} kg)`,
        'critical'
      )
    );
  }

  return { analysis, issues };
};
