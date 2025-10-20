import type { ProjectEvaluation } from '@pkg/core';

export interface ExportAsset {
  readonly filename: string;
  readonly content: string;
  readonly mime: string;
}

const createDownload = (asset: ExportAsset) => {
  const blob = new Blob([asset.content], { type: asset.mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = asset.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const buildProjectExports = (evaluation: ProjectEvaluation): ExportAsset[] => [
  { filename: 'bill-of-materials.csv', content: evaluation.exports.bomCsv, mime: 'text/csv' },
  { filename: 'bill-of-materials.json', content: evaluation.exports.bomJson, mime: 'application/json' },
  { filename: 'floorplan.dxf', content: evaluation.exports.dxf, mime: 'image/vnd.dxf' },
  { filename: 'scene.obj', content: evaluation.exports.obj, mime: 'text/plain' },
  { filename: 'scene.gltf', content: evaluation.exports.gltf, mime: 'model/gltf+json' },
  { filename: 'report.pdf', content: evaluation.exports.pdf, mime: 'application/pdf' },
];

export const triggerProjectExportDownloads = (evaluation: ProjectEvaluation): void => {
  buildProjectExports(evaluation).forEach(createDownload);
};
