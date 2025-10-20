import type { Issue } from '../rules/types';
import type { ProjectContext } from '../project/context';
import type { MassAnalysis } from '../rules/mass';
import type { ModuleScore } from '../rules/scoring';
import type { BomEntry } from './bom';

interface PdfObject {
  readonly id: number;
  readonly body: string;
}

const formatTextLine = (x: number, y: number, text: string): string =>
  `BT /F1 12 Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj ET`;

const buildContentStream = (
  context: ProjectContext,
  mass: MassAnalysis,
  issues: readonly Issue[],
  scores: readonly ModuleScore[],
  bom: readonly BomEntry[]
): string => {
  const lines: string[] = [];
  let cursor = 800;
  const step = 16;

  const pushLine = (text: string) => {
    lines.push(formatTextLine(50, cursor, text));
    cursor -= step;
  };

  pushLine(`Projet: ${context.project.name}`);
  pushLine(`Véhicule: ${context.vehicle.label}`);
  pushLine(`Couloir min: ${context.walkwayMinWidth_mm.toFixed(0)} mm`);
  pushLine(`Masse totale: ${mass.totalMass_kg.toFixed(1)} kg - Barycentre X: ${mass.barycenterX_mm.toFixed(1)} mm`);
  mass.axleLoads.forEach((axle) => {
    pushLine(
      `Essieu ${axle.index}: ${axle.load_kg.toFixed(1)} kg (${Math.round(axle.utilization * 100)}%)`
    );
  });

  const walkwayIssues = issues.filter((issue) => issue.code.startsWith('walkway'));

  if (issues.length === 0) {
    pushLine('Aucune alerte.');
  } else {
    pushLine('Alertes:');
    issues.slice(0, 6).forEach((issue) => {
      pushLine(`- [${issue.severity}] ${issue.code}`);
    });
  }

  if (walkwayIssues.length === 0) {
    pushLine('Couloir: conforme.');
  } else {
    pushLine(`Couloir: ${walkwayIssues.length} alerte(s).`);
  }

  pushLine('Scores modules (top 5):');
  scores
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .forEach((score) => {
      pushLine(`- ${score.instanceId}: ${score.total.toFixed(2)}`);
    });

  pushLine('BOM (premiers éléments):');
  bom.slice(0, 5).forEach((entry) => {
    pushLine(`- ${entry.sku} (${entry.mass_kg.toFixed(1)} kg)`);
  });

  return lines.join('\n');
};

const buildPdf = (objects: readonly PdfObject[]): string => {
  let offset = '%PDF-1.4\n'.length;
  const xref: number[] = [0];
  let body = '%PDF-1.4\n';

  objects.forEach((object) => {
    const objectHeader = `${object.id} 0 obj\n`;
    const objectFooter = '\nendobj\n';
    xref.push(offset);
    body += objectHeader + object.body + objectFooter;
    offset += objectHeader.length + object.body.length + objectFooter.length;
  });

  const xrefStart = offset;
  body += 'xref\n';
  body += `0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let i = 1; i < xref.length; i += 1) {
    body += `${xref[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  body += 'trailer\n';
  body += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += 'startxref\n';
  body += `${xrefStart}\n`;
  body += '%%EOF';

  return body;
};

export const generatePdfReport = (
  context: ProjectContext,
  mass: MassAnalysis,
  issues: readonly Issue[],
  scores: readonly ModuleScore[],
  bom: readonly BomEntry[]
): string => {
  const content = buildContentStream(context, mass, issues, scores, bom);
  const contentStream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

  const objects: PdfObject[] = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { id: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      id: 3,
      body: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    },
    { id: 4, body: contentStream },
    { id: 5, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
  ];

  return buildPdf(objects);
};
