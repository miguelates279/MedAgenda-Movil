import type { PrescriptionDocument } from "../api/types";

export type PrescriptionPdfAction = "save" | "share";
export type PrescriptionPdfResult = "completed" | "cancelled";

export interface PrescriptionPdfFile {
  uri: string;
  name: string;
  dispose: () => Promise<void>;
}

export interface PrescriptionExportAdapter {
  supported: boolean;
  getDocument: (id: number) => Promise<PrescriptionDocument>;
  canShare: () => Promise<boolean>;
  create: (document: PrescriptionDocument) => Promise<PrescriptionPdfFile>;
  save: (
    file: PrescriptionPdfFile,
    isCurrent: () => boolean,
  ) => Promise<boolean>;
  share: (file: PrescriptionPdfFile) => Promise<void>;
}

export function createPrescriptionExporter(adapter: PrescriptionExportAdapter) {
  let busy = false;

  return async (
    prescriptionId: number,
    action: PrescriptionPdfAction,
    isCurrent: () => boolean,
  ): Promise<PrescriptionPdfResult> => {
    if (!isCurrent()) return "cancelled";
    if (!Number.isSafeInteger(prescriptionId) || prescriptionId <= 0) {
      throw new Error("No se pudo identificar la receta. Recarga el listado.");
    }
    if (!adapter.supported) {
      throw new Error(
        "Abre MedAgenda en Android o iOS para guardar o compartir la receta en PDF.",
      );
    }
    if (busy) {
      throw new Error("Espera a que termine la exportación actual.");
    }

    busy = true;
    let file: PrescriptionPdfFile | undefined;
    try {
      if (action === "share") {
        const available = await adapter.canShare();
        if (!isCurrent()) return "cancelled";
        if (!available)
          throw new Error(
            "No se puede abrir el menú para compartir en este dispositivo.",
          );
      }
      const document = await adapter.getDocument(prescriptionId);
      if (!isCurrent()) return "cancelled";
      if (Number(document.prescription_id) !== prescriptionId) {
        throw new Error("La receta recibida no coincide. Recarga el listado.");
      }
      file = await adapter.create(document);
      if (!isCurrent()) return "cancelled";
      if (action === "save") {
        const saved = await adapter.save(file, isCurrent);
        return saved && isCurrent() ? "completed" : "cancelled";
      }
      await adapter.share(file);
      return isCurrent() ? "completed" : "cancelled";
    } finally {
      try {
        await file?.dispose();
      } finally {
        busy = false;
      }
    }
  };
}
