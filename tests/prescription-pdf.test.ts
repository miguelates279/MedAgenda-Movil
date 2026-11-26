import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrescriptionDocument } from "../src/api/types";
import {
  buildPrescriptionHtml,
  prescriptionFileName,
} from "../src/utils/prescriptionDocument";
import {
  createPrescriptionExporter,
  type PrescriptionExportAdapter,
} from "../src/utils/prescriptionExport";

const document: PrescriptionDocument = {
  prescription_id: 42,
  clinic_id: 7,
  clinic_name: "Clínica Ñ & Salud",
  clinic_address: "Calle 1 # 2-3",
  clinic_phone: "+57 3001234567",
  doctor_id: 11,
  doctor_name: "Ángela María Muñoz Pérez",
  patient_id: 12,
  patient_name: "José Andrés Núñez Gómez",
  date_emitted: "2026-11-27T01:15:00.000Z",
  prescription_description:
    'Primera línea.\r\nSegunda: ½ tableta, 5 mg.\n<script>alert("x")</script> & <img src="https://example.test/a">',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function fixture(overrides: Partial<PrescriptionExportAdapter> = {}) {
  const calls: string[] = [];
  const file = {
    uri: "file:///private/receta.pdf",
    name: "receta.pdf",
    dispose: async () => {
      calls.push("dispose");
    },
  };
  const adapter: PrescriptionExportAdapter = {
    supported: true,
    getDocument: async (id) => {
      calls.push(`read:${id}`);
      return document;
    },
    canShare: async () => {
      calls.push("available");
      return true;
    },
    create: async (value) => {
      calls.push(`create:${value.prescription_description}`);
      return file;
    },
    save: async (_file, current) => {
      calls.push("save");
      return current();
    },
    share: async () => {
      calls.push("share");
    },
    ...overrides,
  };
  return {
    calls,
    adapter,
    file,
    exportPdf: createPrescriptionExporter(adapter),
  };
}

test("el PDF usa el registro guardado, nombres completos y fecha de Colombia sin inventar firma", () => {
  const html = buildPrescriptionHtml(document);
  assert.match(html, /José Andrés Núñez Gómez/);
  assert.match(html, /Ángela María Muñoz Pérez/);
  assert.match(html, /Clínica Ñ &amp; Salud/);
  assert.match(html, /26 de noviembre de 2026.*20:15/);
  assert.match(html, /hora de Colombia/);
  assert.doesNotMatch(
    html,
    /Firma digital|Registro profesional|licencia médica/,
  );
  assert.equal(
    prescriptionFileName(document),
    "MedAgenda-Receta-42-2026-11-26.pdf",
  );
  assert.doesNotMatch(prescriptionFileName(document), /Núñez|Muñoz|[/\\]/);
});

test("toda entrada médica se muestra como texto literal y no carga recursos ni ejecuta HTML", () => {
  const html = buildPrescriptionHtml({
    ...document,
    patient_name: '</style><iframe src="x">',
  });
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=&quot;https:\/\/example.test\/a&quot;&gt;/);
  assert.match(html, /&lt;\/style&gt;&lt;iframe/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<script|<img|<iframe|<link|<font/i);
  assert.match(html, /Primera línea\.\nSegunda: ½ tableta, 5 mg\./);
});

test("recetas extensas conservan el final, admiten páginas y no reducen ni recortan indicaciones", () => {
  const description = `${"Áéíóú Ñ · ½ mg\n".repeat(2000)}${"L".repeat(1200)}\nFIN-ÚNICO`;
  const html = buildPrescriptionHtml({
    ...document,
    prescription_description: description,
    clinic_phone: null,
  });
  assert.ok(html.includes(description));
  assert.match(html, /overflow-wrap: anywhere/);
  assert.match(html, /white-space: pre-wrap/);
  assert.doesNotMatch(html, /text-overflow|overflow: hidden|height: \d+px/);
  assert.doesNotMatch(html, /Teléfono/);
});

test("una fecha inválida impide generar un documento con datos inventados", () => {
  assert.throws(
    () => buildPrescriptionHtml({ ...document, date_emitted: "invalid" }),
    /fecha de emisión válida/,
  );
});

test("guardar consulta la versión canónica de nuevo, guarda y elimina su temporal", async () => {
  const f = fixture();
  assert.equal(await f.exportPdf(42, "save", () => true), "completed");
  assert.deepEqual(f.calls, [
    "read:42",
    `create:${document.prescription_description}`,
    "save",
    "dispose",
  ]);
});

test("compartir exige disponibilidad y usa el archivo creado para la receta", async () => {
  const f = fixture();
  assert.equal(await f.exportPdf(42, "share", () => true), "completed");
  assert.deepEqual(f.calls, [
    "available",
    "read:42",
    `create:${document.prescription_description}`,
    "share",
    "dispose",
  ]);
});

test("cancelar la carpeta no muestra éxito y retira el archivo temporal", async () => {
  const f = fixture({ save: async () => false });
  assert.equal(await f.exportPdf(42, "save", () => true), "cancelled");
  assert.equal(f.calls.at(-1), "dispose");
  assert.ok(!f.calls.includes("share"));
});

test("la sesión que cambia mientras responde la API no genera ni entrega PDF", async () => {
  const response = deferred<PrescriptionDocument>();
  const f = fixture({ getDocument: () => response.promise });
  let current = true;
  const operation = f.exportPdf(42, "save", () => current);
  current = false;
  response.resolve(document);
  assert.equal(await operation, "cancelled");
  assert.deepEqual(f.calls, []);
});

test("la sesión que cambia durante la generación destruye el temporal sin abrir menús", async () => {
  let current = true;
  const f = fixture();
  f.adapter.create = async () => {
    current = false;
    return f.file;
  };
  assert.equal(await f.exportPdf(42, "share", () => current), "cancelled");
  assert.ok(f.calls.includes("dispose"));
  assert.ok(!f.calls.includes("share"));
});

test("un cambio de sesión dentro del selector impide confirmar el guardado", async () => {
  let current = true;
  const f = fixture({
    save: async (_file, guard) => {
      current = false;
      assert.equal(guard(), false);
      return false;
    },
  });
  assert.equal(await f.exportPdf(42, "save", () => current), "cancelled");
  assert.equal(f.calls.at(-1), "dispose");
});

test("el bloqueo evita exportaciones simultáneas y se libera al terminar", async () => {
  const response = deferred<PrescriptionDocument>();
  const f = fixture({ getDocument: () => response.promise });
  const first = f.exportPdf(42, "save", () => true);
  await assert.rejects(
    f.exportPdf(42, "share", () => true),
    /exportación actual/,
  );
  response.resolve(document);
  await first;
  assert.equal(await f.exportPdf(42, "save", () => true), "completed");
});

test("errores de autorización, borrado o red no generan archivos y permiten reintentar", async () => {
  let fails = true;
  const f = fixture({
    getDocument: async () => {
      if (fails) throw new Error("Forbidden");
      return document;
    },
  });
  await assert.rejects(
    f.exportPdf(42, "save", () => true),
    /Forbidden/,
  );
  assert.deepEqual(f.calls, []);
  fails = false;
  assert.equal(await f.exportPdf(42, "save", () => true), "completed");
});

test("si falla la entrega del archivo se limpia el temporal y puede reintentarse", async () => {
  const f = fixture({
    share: async () => {
      throw new Error("native failure");
    },
  });
  await assert.rejects(
    f.exportPdf(42, "share", () => true),
    /native failure/,
  );
  assert.equal(f.calls.at(-1), "dispose");
  assert.equal(await f.exportPdf(42, "save", () => true), "completed");
});

test("una respuesta con otra receta se rechaza antes de imprimir", async () => {
  const f = fixture({
    getDocument: async () => ({ ...document, prescription_id: 99 }),
  });
  await assert.rejects(
    f.exportPdf(42, "save", () => true),
    /no coincide/,
  );
  assert.deepEqual(f.calls, []);
});

test("web, identificadores inválidos, sesión caducada y compartir no disponible fallan antes de leer datos", async () => {
  const web = fixture({ supported: false });
  await assert.rejects(
    web.exportPdf(42, "save", () => true),
    /Android o iOS/,
  );
  assert.deepEqual(web.calls, []);
  const f = fixture({ canShare: async () => false });
  for (const id of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(
      f.exportPdf(id, "save", () => true),
      /identificar la receta/,
    );
  }
  assert.equal(await f.exportPdf(42, "save", () => false), "cancelled");
  await assert.rejects(
    f.exportPdf(42, "share", () => true),
    /menú para compartir/,
  );
  assert.deepEqual(f.calls, []);
});
