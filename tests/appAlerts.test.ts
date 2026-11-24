import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { test } from 'node:test';
import { createAppAlerts } from '../src/utils/appAlerts';

test('normalizes a default acknowledgement and prevents accidental outside dismissal', () => {
  const store = createAppAlerts();
  store.alert('Cambios guardados');
  const request = store.getSnapshot().current!;
  assert.equal(request.title, 'Cambios guardados');
  assert.equal(request.buttons.length, 1);
  assert.equal(request.buttons[0].text, 'Aceptar');
  assert.equal(request.cancelable, false);
  store.dismiss(request.id);
  assert.equal(store.getSnapshot().current?.id, request.id);
  store.press(request.id, 0);
  assert.equal(store.getSnapshot().current, null);
});

test('pressing Cancelar never executes the destructive action', async () => {
  const store = createAppAlerts();
  let deleted = 0;
  let cancelled = 0;
  store.alert('Eliminar clínica', 'Esta acción no se puede deshacer.', [
    {
      text: 'Cancelar',
      style: 'cancel',
      onPress: () => {
        cancelled++;
      },
    },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => {
        deleted++;
      },
    },
  ]);
  const request = store.getSnapshot().current!;
  store.press(request.id, 0);
  await nextTurn();
  assert.equal(cancelled, 1);
  assert.equal(deleted, 0);
  assert.equal(store.getSnapshot().current, null);
});

test('preserves FIFO when a confirmation callback enqueues its success message', async () => {
  const store = createAppAlerts();
  const seenInsideCallback: (string | undefined)[] = [];
  store.alert('Confirmar cambio', undefined, [
    {
      text: 'Guardar',
      onPress: () => {
        seenInsideCallback.push(store.getSnapshot().current?.title);
        store.alert('Éxito', 'La cita quedó reprogramada.');
      },
    },
  ]);
  const confirmationId = store.getSnapshot().current!.id;
  store.alert('Segunda confirmación');
  store.press(confirmationId, 0);
  await nextTurn();
  assert.deepEqual(seenInsideCallback, ['Segunda confirmación']);
  assert.equal(store.getSnapshot().current?.title, 'Segunda confirmación');
  store.press(store.getSnapshot().current!.id, 0);
  assert.equal(store.getSnapshot().current?.title, 'Éxito');
  store.press(store.getSnapshot().current!.id, 0);
  assert.equal(store.getSnapshot().current, null);
});

test('consumes a request before invoking its callback and ignores repeated or stale presses', async () => {
  const store = createAppAlerts();
  let calls = 0;
  let oldId = -1;
  store.alert('Guardar', undefined, [
    {
      text: 'Confirmar',
      onPress: async () => {
        calls++;
        assert.notEqual(store.getSnapshot().current?.id, oldId);
        await nextTurn();
      },
    },
  ]);
  oldId = store.getSnapshot().current!.id;
  store.alert('Siguiente');
  const press = () => store.press(oldId, 0);
  press();
  press();
  await nextTurn();
  press();
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().current?.title, 'Siguiente');
});

test('cancelable dismissal invokes onDismiss once without invoking any button', async () => {
  const store = createAppAlerts();
  let dismissals = 0;
  let buttonCalls = 0;
  store.alert(
    'Recordatorios',
    undefined,
    [
      {
        text: 'Permitir',
        onPress: () => {
          buttonCalls++;
        },
      },
    ],
    {
      cancelable: true,
      onDismiss: () => {
        dismissals++;
      },
    },
  );
  const id = store.getSnapshot().current!.id;
  store.alert('Mensaje posterior');
  store.dismiss(id);
  store.dismiss(id);
  store.press(id, 0);
  await nextTurn();
  assert.equal(dismissals, 1);
  assert.equal(buttonCalls, 0);
  assert.equal(store.getSnapshot().current?.title, 'Mensaje posterior');
});

test('dismissAll resolves pending permission promises and drops queued actions even when noncancelable', async () => {
  const store = createAppAlerts();
  let permitted = 0;
  let cancelledByButton = 0;
  let queuedDismissals = 0;
  let queuedActionCalls = 0;
  const permission = new Promise<boolean>((resolve) => {
    store.alert(
      'Permitir recordatorios',
      undefined,
      [
        {
          text: 'Ahora no',
          style: 'cancel',
          onPress: () => {
            cancelledByButton++;
            resolve(false);
          },
        },
        {
          text: 'Continuar',
          onPress: () => {
            permitted++;
            resolve(true);
          },
        },
      ],
      { cancelable: false, onDismiss: () => resolve(false) },
    );
  });
  const staleId = store.getSnapshot().current!.id;
  store.alert(
    'Eliminar clínica',
    undefined,
    [
      {
        text: 'Eliminar',
        onPress: () => {
          queuedActionCalls++;
        },
      },
    ],
    {
      cancelable: false,
      onDismiss: () => {
        queuedDismissals++;
      },
    },
  );
  store.dismissAll();
  assert.equal(store.getSnapshot().current, null);
  assert.equal(await permission, false);
  store.dismissAll();
  assert.equal(permitted, 0);
  assert.equal(cancelledByButton, 0);
  assert.equal(queuedActionCalls, 0);
  assert.equal(queuedDismissals, 1);
  store.alert('Nueva sesión');
  const freshId = store.getSnapshot().current!.id;
  assert.notEqual(freshId, staleId);
  store.press(staleId, 1);
  assert.equal(store.getSnapshot().current?.id, freshId);
});

test('synchronous callback failures become styled error requests instead of escaping the press handler', async () => {
  const store = createAppAlerts();
  store.alert('Guardar receta', undefined, [
    {
      text: 'Guardar',
      onPress: () => {
        throw new Error('No se pudo guardar la receta.');
      },
    },
  ]);
  const id = store.getSnapshot().current!.id;
  assert.doesNotThrow(() => store.press(id, 0));
  await nextTurn();
  assert.equal(store.getSnapshot().current?.variant, 'error');
  assert.notEqual(store.getSnapshot().current?.id, id);
  store.press(store.getSnapshot().current!.id, 0);
  assert.equal(store.getSnapshot().current, null);
});

test('asynchronous callback rejections become styled errors with no unhandled rejection', async () => {
  const store = createAppAlerts();
  store.alert('Guardar cita', undefined, [
    {
      text: 'Guardar',
      onPress: async () => {
        await nextTurn();
        throw new Error('La conexión falló al guardar.');
      },
    },
  ]);
  const id = store.getSnapshot().current!.id;
  store.press(id, 0);
  assert.equal(store.getSnapshot().current, null);
  await nextTurn();
  await nextTurn();
  assert.equal(store.getSnapshot().current?.variant, 'error');
});

test('error feedback respects an already queued confirmation', async () => {
  const store = createAppAlerts();
  store.alert('Primera', undefined, [
    {
      text: 'Continuar',
      onPress: async () => {
        throw new Error('Falló la operación');
      },
    },
  ]);
  const firstId = store.getSnapshot().current!.id;
  store.alert('Confirmación pendiente');
  store.press(firstId, 0);
  await nextTurn();
  assert.equal(store.getSnapshot().current?.title, 'Confirmación pendiente');
  store.press(store.getSnapshot().current!.id, 0);
  assert.equal(store.getSnapshot().current?.variant, 'error');
});

test('a callback rejection from a cleared session never appears in the new session queue', async () => {
  const store = createAppAlerts();
  let rejectOperation!: (error: Error) => void;
  const operation = new Promise<void>((_resolve, reject) => {
    rejectOperation = reject;
  });
  store.alert('Operación de la sesión anterior', undefined, [
    { text: 'Guardar', onPress: () => operation },
  ]);
  store.press(store.getSnapshot().current!.id, 0);
  store.dismissAll();
  store.alert('Mensaje de la cuenta nueva');
  const freshId = store.getSnapshot().current!.id;
  rejectOperation(new Error('La respuesta anterior llegó tarde.'));
  await nextTurn();
  assert.equal(store.getSnapshot().current?.id, freshId);
  store.press(freshId, 0);
  assert.equal(store.getSnapshot().current, null);
});

test('the latest active modal host wins and unregistering it restores the previous active host', () => {
  const store = createAppAlerts();
  const unregisterRoot = store.registerHost('root');
  store.alert('Cita pendiente');
  const requestId = store.getSnapshot().current!.id;
  const unregisterModal = store.registerHost('modal');
  const unregisterNested = store.registerHost('nested-modal');
  assert.equal(store.getSnapshot().hostId, 'nested-modal');
  assert.equal(store.getSnapshot().current?.id, requestId);
  unregisterModal();
  assert.equal(store.getSnapshot().hostId, 'nested-modal');
  unregisterNested();
  assert.equal(store.getSnapshot().hostId, 'root');
  assert.equal(store.getSnapshot().current?.id, requestId);
  unregisterRoot();
  assert.equal(store.getSnapshot().hostId, null);
  assert.equal(store.getSnapshot().current?.id, requestId);
  store.registerHost('replacement-root');
  assert.equal(store.getSnapshot().hostId, 'replacement-root');
  assert.equal(store.getSnapshot().current?.id, requestId);
});

test('host cleanup is idempotent and never dismisses the visible request', () => {
  const store = createAppAlerts();
  const removeRoot = store.registerHost('root');
  const removeModal = store.registerHost('modal');
  store.alert('Confirmar', undefined, undefined, { cancelable: true });
  const requestId = store.getSnapshot().current!.id;
  removeModal();
  removeModal();
  assert.equal(store.getSnapshot().hostId, 'root');
  assert.equal(store.getSnapshot().current?.id, requestId);
  removeRoot();
  assert.equal(store.getSnapshot().current?.id, requestId);
});

test('snapshots stay stable between updates and unsubscribed listeners stop receiving changes', () => {
  const store = createAppAlerts();
  assert.equal(store.getSnapshot(), store.getSnapshot());
  let changes = 0;
  const unsubscribe = store.subscribe(() => {
    changes++;
  });
  const before = changes;
  store.alert('Mensaje');
  assert.ok(changes > before);
  const snapshot = store.getSnapshot();
  assert.equal(store.getSnapshot(), snapshot);
  const afterAlert = changes;
  unsubscribe();
  unsubscribe();
  store.press(snapshot.current!.id, 0);
  store.alert('Otro mensaje');
  store.registerHost('modal');
  assert.equal(changes, afterAlert);
});
