import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import type { PrescriptionDocument } from '../src/api/types';
import { tokens } from '../src/theme/tokens';
import * as documentRenderer from '../src/utils/prescriptionDocument';
import * as exportCore from '../src/utils/prescriptionExport';

const document: PrescriptionDocument = {
  prescription_id: 42,
  clinic_id: 7,
  clinic_name: 'Clínica Ñ & Salud',
  clinic_address: 'Calle 1 #2-3',
  clinic_phone: '+573001234567',
  doctor_id: 11,
  doctor_name: 'Ángela María Muñoz Pérez',
  patient_id: 12,
  patient_name: 'José Andrés Núñez Gómez',
  date_emitted: '2026-11-27T01:15:00.000Z',
  prescription_description: 'Primera línea.\nSegunda: ½ tableta, 5 mg.',
};
const pdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55, 10, 0, 255]);
const source = readFileSync(
  join(process.cwd(), 'src/utils/prescriptionPdf.ts'),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

function fixture() {
  const state = {
    now: Date.parse('2026-11-27T12:00:00Z'),
    current: true,
    pickerError: undefined as Error | undefined,
    createError: undefined as Error | undefined,
    writeError: undefined as Error | undefined,
    shareError: undefined as Error | undefined,
    readGate: undefined as (() => Promise<void>) | undefined,
    afterWrite: undefined as (() => void) | undefined,
  };
  const files = new Map<string, { bytes: Uint8Array; modified: number }>();
  const directories = new Set<string>();
  const calls = {
    print: [] as { html: string; width: number; height: number }[],
    copies: [] as { source: string; destination: string }[],
    creates: [] as { uri: string; mime: string }[],
    writes: [] as { uri: string; bytes: Uint8Array }[],
    deletes: [] as string[],
    reads: [] as number[],
    shares: [] as {
      uri: string;
      options: { mimeType: string; UTI: string; dialogTitle: string };
    }[],
    pickers: 0,
  };
  const cacheUri = 'file:///private/cache/prescription-pdf';
  let printSequence = 0;
  let outputSequence = 0;
  const uri = (...parts: (string | { uri: string })[]) =>
    parts
      .map((part) => (typeof part === 'string' ? part : part.uri))
      .reduce(
        (path, part, index) =>
          index === 0
            ? part.replace(/\/+$/, '')
            : `${path}/${part.replace(/^\/+|\/+$/g, '')}`,
        '',
      );

  class NativeFile {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(...parts);
    }
    get exists() {
      return files.has(this.uri);
    }
    get modificationTime() {
      return files.get(this.uri)?.modified ?? null;
    }
    delete() {
      calls.deletes.push(this.uri);
      files.delete(this.uri);
    }
    async copy(destination: NativeFile) {
      calls.copies.push({ source: this.uri, destination: destination.uri });
      if (destination.uri.startsWith('content://')) {
        throw new Error(
          'Provider copy overwrites or deletes the created document',
        );
      }
      const original = files.get(this.uri);
      assert.ok(original);
      files.set(destination.uri, {
        bytes: new Uint8Array(original.bytes),
        modified: state.now,
      });
    }
    async bytes() {
      await state.readGate?.();
      const entry = files.get(this.uri);
      assert.ok(entry);
      return new Uint8Array(entry.bytes);
    }
    write(bytes: Uint8Array) {
      calls.writes.push({ uri: this.uri, bytes: new Uint8Array(bytes) });
      if (state.writeError) throw state.writeError;
      files.set(this.uri, {
        bytes: new Uint8Array(bytes),
        modified: state.now,
      });
      state.afterWrite?.();
    }
  }
  class NativeDirectory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(...parts);
    }
    get exists() {
      return directories.has(this.uri);
    }
    create() {
      directories.add(this.uri);
    }
    list() {
      return [...files.keys()]
        .filter((path) => path.startsWith(`${this.uri}/`))
        .map((path) => new NativeFile(path));
    }
    createFile(name: string, mime: string) {
      if (state.createError) throw state.createError;
      const output = new NativeFile(this, `${++outputSequence}-${name}`);
      calls.creates.push({ uri: output.uri, mime });
      files.set(output.uri, { bytes: new Uint8Array(), modified: state.now });
      return output;
    }
    static async pickDirectoryAsync() {
      ++calls.pickers;
      if (state.pickerError) throw state.pickerError;
      return new NativeDirectory('content://documents/tree/selected');
    }
  }
  class Clock extends Date {
    static now() {
      return state.now;
    }
  }
  const modules: Record<string, unknown> = {
    'react-native': { Platform: { OS: 'android' } },
    'expo-file-system': {
      Directory: NativeDirectory,
      File: NativeFile,
      Paths: { cache: 'file:///private/cache' },
    },
    'expo-print': {
      printToFileAsync: async (options: {
        html: string;
        width: number;
        height: number;
      }) => {
        calls.print.push(options);
        const output = `file:///private/print-${++printSequence}.pdf`;
        files.set(output, {
          bytes: new Uint8Array(pdfBytes),
          modified: state.now,
        });
        return { uri: output };
      },
    },
    'expo-sharing': {
      isAvailableAsync: async () => true,
      shareAsync: async (
        fileUri: string,
        options: { mimeType: string; UTI: string; dialogTitle: string },
      ) => {
        calls.shares.push({ uri: fileUri, options });
        if (state.shareError) throw state.shareError;
      },
    },
    '../api/prescriptions': {
      __esModule: true,
      default: {
        getPrescriptionDocument: async (id: number) => {
          calls.reads.push(id);
          return document;
        },
      },
    },
    '../theme/tokens': { tokens },
    './prescriptionDocument': documentRenderer,
    './prescriptionExport': exportCore,
  };
  const module = {
    exports: {} as {
      exportPrescriptionPdf: ReturnType<
        typeof exportCore.createPrescriptionExporter
      >;
    },
  };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    Date: Clock,
    require: (name: string) => {
      assert.ok(name in modules, `Unexpected native import: ${name}`);
      return modules[name];
    },
  });
  const exportPdf = module.exports.exportPrescriptionPdf!;
  const temporaryFiles = () =>
    [...files.keys()].filter((path) => path.startsWith('file:///private/'));
  return {
    state,
    files,
    calls,
    cacheUri,
    temporaryFiles,
    exportPdf,
    current: () => state.current,
  };
}

test('guardar escribe los bytes originales y MIME PDF en el documento SAF sin copiar sobre su URI', async () => {
  const f = fixture();
  assert.equal(await f.exportPdf(42, 'save', f.current), 'completed');
  assert.deepEqual(f.calls.reads, [42]);
  assert.equal(f.calls.print.length, 1);
  assert.equal(
    f.calls.print[0].html,
    documentRenderer.buildPrescriptionHtml(document),
  );
  assert.equal(f.calls.print[0].width, tokens.prescriptionPdf.pageWidth);
  assert.equal(f.calls.print[0].height, tokens.prescriptionPdf.pageHeight);
  assert.equal(f.calls.creates.length, 1);
  assert.equal(f.calls.creates[0].mime, 'application/pdf');
  assert.equal(f.calls.writes.length, 1);
  assert.deepEqual(f.calls.writes[0].bytes, pdfBytes);
  assert.deepEqual(f.files.get(f.calls.creates[0].uri)?.bytes, pdfBytes);
  assert.equal(f.calls.copies.length, 1);
  assert.ok(
    f.calls.copies.every((copy) =>
      copy.destination.startsWith(`${f.cacheUri}/`),
    ),
  );
  assert.deepEqual(f.temporaryFiles(), []);
});

test('cancelar el selector no guarda ni informa éxito y elimina ambos temporales', async () => {
  for (const error of [
    Object.assign(new Error('Picker closed'), { code: 'ERR_PICKER_CANCELLED' }),
    new Error('User cancelled directory picker'),
  ]) {
    const f = fixture();
    f.state.pickerError = error;
    assert.equal(await f.exportPdf(42, 'save', f.current), 'cancelled');
    assert.equal(f.calls.creates.length, 0);
    assert.equal(f.calls.writes.length, 0);
    assert.deepEqual(f.temporaryFiles(), []);
  }
});

test('cambiar de sesión mientras se leen los bytes impide crear un archivo en la carpeta del usuario', async () => {
  const f = fixture();
  let started!: () => void;
  let finish!: () => void;
  const reading = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  f.state.readGate = async () => {
    started();
    await gate;
  };
  const result = f.exportPdf(42, 'save', f.current);
  await reading;
  f.state.current = false;
  finish();
  assert.equal(await result, 'cancelled');
  assert.equal(f.calls.creates.length, 0);
  assert.equal(f.calls.writes.length, 0);
  assert.deepEqual(f.temporaryFiles(), []);
});

test('una sesión invalidada inmediatamente al escribir retira el documento recién creado', async () => {
  const f = fixture();
  f.state.afterWrite = () => {
    f.state.current = false;
  };
  assert.equal(await f.exportPdf(42, 'save', f.current), 'cancelled');
  assert.equal(f.calls.creates.length, 1);
  assert.equal(f.files.has(f.calls.creates[0].uri), false);
  assert.deepEqual(f.temporaryFiles(), []);
});

test('fallos de creación o escritura limpian el documento parcial, muestran un error en español y permiten reintentar', async () => {
  for (const failure of ['createError', 'writeError'] as const) {
    const f = fixture();
    f.state[failure] = new Error('Provider write denied');
    await assert.rejects(
      f.exportPdf(42, 'save', f.current),
      /No se pudo guardar el PDF en esa carpeta/,
    );
    assert.equal(
      [...f.files.keys()].some((path) => path.startsWith('content://')),
      false,
    );
    assert.deepEqual(f.temporaryFiles(), []);
    f.state[failure] = undefined;
    assert.equal(await f.exportPdf(42, 'save', f.current), 'completed');
    assert.equal(f.calls.pickers, 2);
    assert.equal(
      [...f.files.keys()].filter((path) => path.startsWith('content://'))
        .length,
      1,
    );
    assert.deepEqual(f.temporaryFiles(), []);
  }
});

test('un proveedor que no abre la carpeta produce un mensaje útil y libera el bloqueo de exportación', async () => {
  const f = fixture();
  f.state.pickerError = new Error('Provider unavailable');
  await assert.rejects(
    f.exportPdf(42, 'save', f.current),
    /No se pudo abrir la carpeta de destino/,
  );
  assert.deepEqual(f.temporaryFiles(), []);
  f.state.pickerError = undefined;
  assert.equal(await f.exportPdf(42, 'save', f.current), 'completed');
});

test('compartir utiliza una URI local con MIME y UTI PDF y conserva el archivo para que lo lea el destinatario', async () => {
  const f = fixture();
  assert.equal(await f.exportPdf(42, 'share', f.current), 'completed');
  assert.equal(f.calls.shares.length, 1);
  const share = f.calls.shares[0];
  assert.ok(share.uri.startsWith(`${f.cacheUri}/`));
  assert.equal(share.options.mimeType, 'application/pdf');
  assert.equal(share.options.UTI, 'com.adobe.pdf');
  assert.deepEqual(f.files.get(share.uri)?.bytes, pdfBytes);
  assert.equal(f.calls.deletes.includes(share.uri), false);
  assert.deepEqual(f.temporaryFiles(), [share.uri]);
});

test('la limpieza mantiene una receta compartida durante 24 horas y retira su copia caducada en la próxima exportación', async () => {
  const f = fixture();
  await f.exportPdf(42, 'share', f.current);
  const shared = f.calls.shares[0].uri;
  f.state.now += 24 * 60 * 60 * 1000;
  await f.exportPdf(42, 'save', f.current);
  assert.equal(f.files.has(shared), true);
  f.state.now += 1;
  await f.exportPdf(42, 'save', f.current);
  assert.equal(f.files.has(shared), false);
  assert.equal(f.calls.deletes.filter((uri) => uri === shared).length, 1);
  assert.deepEqual(f.temporaryFiles(), []);
});

test('fallar al abrir el menú de compartir elimina su temporal y permite repetir la acción', async () => {
  const f = fixture();
  f.state.shareError = new Error('Share sheet unavailable');
  await assert.rejects(
    f.exportPdf(42, 'share', f.current),
    /Share sheet unavailable/,
  );
  assert.deepEqual(f.temporaryFiles(), []);
  f.state.shareError = undefined;
  assert.equal(await f.exportPdf(42, 'share', f.current), 'completed');
  assert.equal(f.calls.shares.length, 2);
  assert.equal(f.files.has(f.calls.shares[1].uri), true);
});
