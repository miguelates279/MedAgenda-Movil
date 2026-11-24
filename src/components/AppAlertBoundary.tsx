import React, { useEffect, useId, useSyncExternalStore } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { appAlerts, AppAlertRequest } from '../utils/appAlerts';
import { DialogCard, dialogBackdropColor } from './DialogCard';

export function AppAlertContent({ request }: { request: AppAlertRequest }) {
  return (
    <View
      className="flex-1 justify-center items-center px-5 py-4"
      style={{ minHeight: 0 }}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        accessible={false}
        onPress={() => appAlerts.dismiss(request.id)}
      />
      <DialogCard
        title={request.title}
        message={request.message}
        variant={request.variant}
        actions={request.buttons.map((button, index) => ({
          text: button.text ?? 'Aceptar',
          variant:
            button.style === 'destructive'
              ? 'danger'
              : button.style === 'cancel'
                ? 'secondary'
                : 'primary',
          onPress: () => appAlerts.press(request.id, index),
        }))}
      />
    </View>
  );
}

export function AppAlertBoundary({ children }: { children: React.ReactNode }) {
  const hostId = useId();
  const snapshot = useSyncExternalStore(
    appAlerts.subscribe,
    appAlerts.getSnapshot,
    appAlerts.getSnapshot,
  );
  useEffect(() => appAlerts.registerHost(hostId), [hostId]);
  const current = snapshot.hostId === hostId ? snapshot.current : null;
  useEffect(() => {
    if (!current) return;
    Keyboard.dismiss();
  }, [current?.id]);
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View
        style={{ flex: 1, minHeight: 0 }}
        importantForAccessibility={current ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={!!current}
      >
        {children}
      </View>
      {current && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 1000, backgroundColor: dialogBackdropColor },
          ]}
          accessibilityViewIsModal
          onAccessibilityEscape={() => appAlerts.dismiss(current.id)}
        >
          <AppAlertContent request={current} />
        </View>
      )}
    </View>
  );
}
