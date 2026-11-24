export type AppAlertVariant =
  'primary' | 'success' | 'error' | 'warning' | 'danger';

export interface AppAlertButton {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
  variant?: AppAlertVariant;
}

export interface AppAlertRequest {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly buttons: readonly AppAlertButton[];
  readonly variant: AppAlertVariant;
  readonly cancelable: boolean;
  readonly onDismiss?: () => void;
}

export interface AppAlertSnapshot {
  readonly current: AppAlertRequest | null;
  readonly hostId: string | null;
}

export function createAppAlerts() {
  let nextId = 0;
  let generation = 0;
  let queue: AppAlertRequest[] = [];
  let hosts: { id: string; key: symbol }[] = [];
  let snapshot: AppAlertSnapshot = { current: null, hostId: null };
  const listeners = new Set<() => void>();

  const publish = () => {
    snapshot = {
      current: queue[0] ?? null,
      hostId: hosts[hosts.length - 1]?.id ?? null,
    };
    for (const listener of listeners) listener();
  };

  const alert = (
    title: string,
    message = '',
    buttons?: readonly AppAlertButton[],
    options: AppAlertOptions = {},
  ) => {
    queue.push({
      id: ++nextId,
      title,
      message,
      buttons: buttons?.length
        ? buttons.map((button) => ({ ...button }))
        : [{ text: 'Aceptar' }],
      variant: options.variant ?? 'primary',
      cancelable: options.cancelable ?? false,
      onDismiss: options.onDismiss,
    });
    publish();
  };

  const invoke = (callback?: () => void | Promise<void>, report = true) => {
    const actionGeneration = generation;
    const failed = () => {
      if (report && generation === actionGeneration)
        alert(
          'No se pudo completar',
          'No se pudo completar la acción. Vuelve a intentarlo.',
          undefined,
          { variant: 'error' },
        );
    };
    try {
      const result = callback?.();
      if (result) void Promise.resolve(result).catch(failed);
    } catch {
      failed();
    }
  };

  return {
    alert,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    registerHost: (id: string) => {
      const key = Symbol(id);
      hosts.push({ id, key });
      publish();
      return () => {
        hosts = hosts.filter((host) => host.key !== key);
        publish();
      };
    },
    press: (id: number, index: number) => {
      const current = queue[0];
      if (current?.id !== id || !current.buttons[index]) return;
      const button = current.buttons[index];
      queue.shift();
      publish();
      invoke(button.onPress);
    },
    dismiss: (id: number) => {
      const current = queue[0];
      if (current?.id !== id || !current.cancelable) return;
      queue.shift();
      publish();
      invoke(current.onDismiss);
    },
    dismissAll: () => {
      ++generation;
      const dismissed = queue;
      queue = [];
      publish();
      for (const request of dismissed) invoke(request.onDismiss, false);
    },
  };
}

export const appAlerts = createAppAlerts();
