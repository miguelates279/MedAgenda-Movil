import type { PrescriptionDocument } from "../api/types";
import { tokens } from "../theme/tokens";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function prescriptionFileName(document: PrescriptionDocument): string {
  const date = new Date(document.date_emitted);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("La receta no tiene una fecha de emisión válida.");
  }
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return `MedAgenda-Receta-${document.prescription_id}-${day}.pdf`;
}

export function buildPrescriptionHtml(document: PrescriptionDocument): string {
  prescriptionFileName(document);
  const date = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(document.date_emitted));
  const { colors, spacing, fontSize, prescriptionPdf: pdf } = tokens;
  const field = (label: string, value: string) =>
    `<div class="field"><div class="label">${label}</div><div>${escapeHtml(value)}</div></div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>Receta ${document.prescription_id} - MedAgenda</title>
<style>
@page { size: A4; margin: ${pdf.pageMargin}px; }
* { box-sizing: border-box; }
body { margin: 0; color: ${colors.textMain}; background: ${colors.bg}; font-family: ${pdf.fontFamily}; font-size: ${fontSize.xs}px; line-height: ${pdf.lineHeight}; overflow-wrap: anywhere; word-wrap: break-word; word-break: break-word; }
header { border-bottom: ${spacing.xxs}px solid ${colors.primary}; padding-bottom: ${spacing.md}px; margin-bottom: ${spacing.lg}px; break-inside: avoid; }
.brand { color: ${colors.primaryDark}; font-weight: bold; font-size: ${fontSize.lg}px; }
h1 { font-size: ${fontSize["2xl"]}px; margin: ${spacing.xs}px 0; color: ${colors.textMain}; }
.reference, .label, footer { color: ${colors.textMuted}; font-size: ${fontSize.tiny}px; }
.field { margin-bottom: ${spacing.sm}px; white-space: pre-wrap; }
.label { font-weight: bold; }
.identity { padding: ${spacing.md}px; background: ${colors.surfaceMuted}; border-radius: ${tokens.borderRadius.sm}px; margin-bottom: ${spacing.lg}px; }
h2 { font-size: ${fontSize.base}px; color: ${colors.primaryDark}; margin: 0 0 ${spacing.sm}px; break-after: avoid; }
.instructions { white-space: pre-wrap; orphans: 3; widows: 3; }
footer { border-top: ${tokens.borderWidth.DEFAULT}px solid ${colors.border}; margin-top: ${spacing.lg}px; padding-top: ${spacing.sm}px; break-inside: avoid; }
</style>
</head>
<body>
<header><div class="brand">MedAgenda</div><h1>Fórmula médica</h1><div class="reference">Receta #${document.prescription_id} · Emitida el ${escapeHtml(date)} (hora de Colombia)</div></header>
<section class="identity" aria-label="Datos de la receta">
${field("Clínica", document.clinic_name)}
${field("Dirección", document.clinic_address)}
${document.clinic_phone ? field("Teléfono", document.clinic_phone) : ""}
${field("Paciente", document.patient_name)}
${field("Médico/a", document.doctor_name)}
</section>
<h2>Prescripción e indicaciones</h2>
<div class="instructions">${escapeHtml(document.prescription_description.replace(/\r\n?/g, "\n"))}</div>
<footer>Receta #${document.prescription_id} · MedAgenda<br>Copia de la fórmula médica registrada. Conserva las indicaciones de tu médico.</footer>
</body>
</html>`;
}
