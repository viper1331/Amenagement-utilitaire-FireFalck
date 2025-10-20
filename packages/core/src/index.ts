export type { ProjectContext, ModulePlacementInstance } from './project/context';
export { buildProjectContext, DEFAULT_WALKWAY_MM } from './project/context';
export type { EvaluateProjectOptions, ProjectEvaluation } from './project/evaluate';
export { evaluateProject } from './project/evaluate';
export type { Issue, IssueSeverity } from './rules/types';
export type {
  MassAnalysis,
  MassCheckResult,
  AxleLoad,
  ModuleMassContribution,
} from './rules/mass';
export { evaluateMassDistribution } from './rules/mass';
export { checkModuleCollisions } from './rules/collisions';
export { checkModuleClearances } from './rules/clearances';
export { scoreModules } from './rules/scoring';
export type { ModuleScore, ModuleScoreBreakdown } from './rules/scoring';
export { buildBomEntries, bomToCsv, bomToJson } from './exports/bom';
export type { BomEntry } from './exports/bom';
export { generateDxf } from './exports/dxf';
export { generateObj } from './exports/obj';
export { generateGltf } from './exports/gltf';
export { generatePdfReport } from './exports/pdf';
