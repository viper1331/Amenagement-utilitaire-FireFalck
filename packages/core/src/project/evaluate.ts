import type { EquipmentModule, Project, VehicleBlueprint } from '@pkg/data';
import { buildProjectContext, BuildContextOptions } from './context';
import { checkModuleCollisions } from '../rules/collisions';
import { checkModuleClearances } from '../rules/clearances';
import { evaluateMassDistribution } from '../rules/mass';
import { scoreModules } from '../rules/scoring';
import type { Issue } from '../rules/types';
import { buildBomEntries, bomToCsv, bomToJson } from '../exports/bom';
import type { BomEntry } from '../exports/bom';
import { generateDxf } from '../exports/dxf';
import { generateObj } from '../exports/obj';
import { generateGltf } from '../exports/gltf';
import { generatePdfReport } from '../exports/pdf';

export interface EvaluateProjectOptions extends Partial<BuildContextOptions> {
  readonly modulesCatalog: ReadonlyMap<string, EquipmentModule>;
}

export interface ProjectEvaluation {
  readonly context: ReturnType<typeof buildProjectContext>;
  readonly issues: readonly Issue[];
  readonly mass: ReturnType<typeof evaluateMassDistribution>['analysis'];
  readonly massIssues: readonly Issue[];
  readonly scores: ReturnType<typeof scoreModules>;
  readonly bom: readonly BomEntry[];
  readonly exports: {
    readonly bomCsv: string;
    readonly bomJson: string;
    readonly dxf: string;
    readonly obj: string;
    readonly gltf: string;
    readonly pdf: string;
  };
}

export const evaluateProject = (
  project: Project,
  vehicle: VehicleBlueprint,
  options: EvaluateProjectOptions
): ProjectEvaluation => {
  const context = buildProjectContext(project, vehicle, options);
  const collisionResult = checkModuleCollisions(context);
  const clearanceIssues = checkModuleClearances(context);
  const massResult = evaluateMassDistribution(context);
  const scores = scoreModules(context, massResult.analysis);
  const issues: Issue[] = [...collisionResult.issues, ...clearanceIssues, ...massResult.issues];
  const bomEntries = buildBomEntries(context);
  const bomCsv = bomToCsv(bomEntries);
  const bomJson = bomToJson(bomEntries);
  const dxf = generateDxf(context);
  const obj = generateObj(context);
  const gltf = generateGltf(context);
  const pdf = generatePdfReport(context, massResult.analysis, issues, scores, bomEntries);

  return {
    context,
    issues,
    mass: massResult.analysis,
    massIssues: massResult.issues,
    scores,
    bom: bomEntries,
    exports: {
      bomCsv,
      bomJson,
      dxf,
      obj,
      gltf,
      pdf,
    },
  };
};
