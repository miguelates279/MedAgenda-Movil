import assert from 'node:assert/strict';
import test from 'node:test';
import apiClient from '../src/api/client';
import prescriptionsApi from '../src/api/prescriptions';
import type { PrescriptionDocument } from '../src/api/types';

const document: PrescriptionDocument = {
  prescription_id: 17,
  clinic_id: 5,
  clinic_name: 'Clínica San José',
  clinic_address: 'Calle 20 #4-15',
  clinic_phone: '+573001234567',
  doctor_id: 10,
  doctor_name: 'María José Díaz López',
  patient_id: 30,
  patient_name: 'Andrés Felipe Pérez Gómez',
  date_emitted: '2026-11-26T15:00:00.000Z',
  prescription_description:
    'Indicación guardada\nSegunda línea: áéíóú & <texto>',
};

test('consulta el documento con la sesión vigente y conserva el contenido clínico sin enviarlo en la URL', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = apiClient.getToken();
  const originalSession = apiClient.getSessionId();
  const requests: { url: string; authorization: string | null }[] = [];
  globalThis.fetch = async (url, options) => {
    requests.push({
      url: String(url),
      authorization: new Headers(options?.headers).get('Authorization'),
    });
    return new Response(JSON.stringify(document), { status: 200 });
  };
  try {
    apiClient.setSession('prescription-test-session', 9001);
    assert.deepEqual(
      await prescriptionsApi.getPrescriptionDocument(17),
      document,
    );
    assert.equal(requests.length, 1);
    assert.equal(
      new URL(requests[0].url).pathname,
      '/prescriptions/17/document',
    );
    assert.equal(new URL(requests[0].url).search, '');
    assert.equal(requests[0].authorization, 'Bearer prescription-test-session');
  } finally {
    globalThis.fetch = originalFetch;
    apiClient.setSession(originalToken, originalSession);
  }
});

test('vuelve a pedir la versión guardada en cada exportación después de una edición', async () => {
  const originalFetch = globalThis.fetch;
  let current = document;
  let requests = 0;
  globalThis.fetch = async () => {
    ++requests;
    return new Response(JSON.stringify(current), { status: 200 });
  };
  try {
    const first = await prescriptionsApi.getPrescriptionDocument(17);
    current = { ...document, prescription_description: 'Indicación corregida' };
    const second = await prescriptionsApi.getPrescriptionDocument(17);
    assert.equal(
      first.prescription_description,
      document.prescription_description,
    );
    assert.equal(second.prescription_description, 'Indicación corregida');
    assert.equal(second.date_emitted, document.date_emitted);
    assert.equal(requests, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('propaga recetas eliminadas y acceso denegado sin devolver un documento anterior ni cerrar otra sesión', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = apiClient.getToken();
  const originalSession = apiClient.getSessionId();
  try {
    apiClient.setSession('patient-test-session', 9002);
    for (const status of [403, 404]) {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Receta no disponible' }), {
          status,
        });
      await assert.rejects(
        prescriptionsApi.getPrescriptionDocument(17),
        (error: Error & { status?: number }) => error.status === status,
      );
      assert.equal(apiClient.getSessionId(), 9002);
      assert.equal(apiClient.getToken(), 'patient-test-session');
    }
  } finally {
    globalThis.fetch = originalFetch;
    apiClient.setSession(originalToken, originalSession);
  }
});
