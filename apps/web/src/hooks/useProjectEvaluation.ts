import { useEditorStore } from '../state/useEditorStore';

export const useProjectEvaluation = () =>
  useEditorStore((state) => ({
    evaluation: state.evaluation,
    project: state.project,
    vehicle: state.vehicle,
  }));
