import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Keyboard, Modal, Platform } from 'react-native';
import { appAlerts, AppAlertRequest } from '../utils/appAlerts';
import { AppAlertContent } from './AppAlertBoundary';
import { dialogBackdropColor } from './DialogCard';
import { ModalViewport } from './ModalViewport';

export function AppAlertHost() {
  const snapshot = useSyncExternalStore(
    appAlerts.subscribe,
    appAlerts.getSnapshot,
    appAlerts.getSnapshot,
  );
  const current = snapshot.hostId === null ? snapshot.current : null;
  const [visible, setVisible] = useState(false);
  const closing = useRef(false);
  const lastRequest = useRef<AppAlertRequest | null>(null);
  const latest = useRef(current);
  latest.current = current;
  if (current) lastRequest.current = current;
  useEffect(() => {
    if (current && !closing.current) {
      Keyboard.dismiss();
      setVisible(true);
    } else if (!current && visible) {
      closing.current = Platform.OS === 'ios';
      setVisible(false);
    }
  }, [current, visible]);
  const request = current ?? lastRequest.current;
  if (!request) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => appAlerts.dismiss(request.id)}
      onDismiss={() => {
        closing.current = false;
        if (latest.current) setVisible(true);
      }}
    >
      <ModalViewport
        alertHost={false}
        style={{ backgroundColor: dialogBackdropColor }}
      >
        <AppAlertContent request={request} />
      </ModalViewport>
    </Modal>
  );
}
