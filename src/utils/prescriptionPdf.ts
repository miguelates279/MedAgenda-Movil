import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import prescriptionsApi from "../api/prescriptions";
import { tokens } from "../theme/tokens";
import {
  buildPrescriptionHtml,
  prescriptionFileName,
} from "./prescriptionDocument";
import {
  createPrescriptionExporter,
  type PrescriptionPdfFile,
} from "./prescriptionExport";

const cacheLifetimeMs = 24 * 60 * 60 * 1000;
const sharedFiles = new Set<string>();
let sequence = 0;

function removeFile(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {}
}

function clearExpiredFiles(directory: Directory): void {
  if (!directory.exists) return;
  const cutoff = Date.now() - cacheLifetimeMs;
  for (const entry of directory.list()) {
    if (
      entry instanceof File &&
      entry.modificationTime !== null &&
      entry.modificationTime < cutoff
    ) {
      removeFile(entry);
      sharedFiles.delete(entry.uri);
    }
  }
}

function pickerCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: string; message?: string };
  return (
    value.code === "ERR_PICKER_CANCELLED" ||
    value.code === "ERR_PICKER_CANCELED" ||
    /directory picker (?:was )?cancelled|user cancel(?:led|ed)/i.test(
      value.message || "",
    )
  );
}

export const exportPrescriptionPdf = createPrescriptionExporter({
  supported: Platform.OS === "android" || Platform.OS === "ios",
  getDocument: (id) => prescriptionsApi.getPrescriptionDocument(id),
  canShare: () => Sharing.isAvailableAsync(),
  create: async (document) => {
    const directory = new Directory(Paths.cache, "prescription-pdf");
    directory.create({ idempotent: true });
    clearExpiredFiles(directory);
    const name = prescriptionFileName(document);
    const result = await Print.printToFileAsync({
      html: buildPrescriptionHtml(document),
      width: tokens.prescriptionPdf.pageWidth,
      height: tokens.prescriptionPdf.pageHeight,
    });
    const original = new File(result.uri);
    const file = new File(directory, `${Date.now()}-${++sequence}-${name}`);
    try {
      await original.copy(file);
      return {
        uri: file.uri,
        name,
        dispose: async () => {
          if (!sharedFiles.has(file.uri)) removeFile(file);
        },
      };
    } catch (error) {
      removeFile(file);
      throw error;
    } finally {
      removeFile(original);
    }
  },
  save: async (file: PrescriptionPdfFile, isCurrent) => {
    let directory: Directory;
    try {
      directory = await Directory.pickDirectoryAsync();
    } catch (error) {
      if (pickerCancelled(error)) return false;
      throw new Error(
        "No se pudo abrir la carpeta de destino. Intenta nuevamente o comparte el PDF.",
      );
    }
    if (!isCurrent()) return false;
    let destination: File | undefined;
    try {
      const bytes = await new File(file.uri).bytes();
      if (!isCurrent()) return false;
      destination = directory.createFile(file.name, "application/pdf");
      destination.write(bytes);
      if (!isCurrent()) {
        removeFile(destination);
        return false;
      }
      return true;
    } catch {
      if (destination) removeFile(destination);
      throw new Error(
        "No se pudo guardar el PDF en esa carpeta. Selecciona otra ubicación.",
      );
    }
  },
  share: async (file) => {
    sharedFiles.add(file.uri);
    try {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Compartir fórmula médica",
      });
    } catch (error) {
      sharedFiles.delete(file.uri);
      throw error;
    }
  },
});
