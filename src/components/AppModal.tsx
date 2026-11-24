import React from 'react';
import { Modal, ModalProps } from 'react-native';
import { appAlerts } from '../utils/appAlerts';

export function AppModal({ onRequestClose, ...props }: ModalProps) {
  return (
    <Modal
      {...props}
      onRequestClose={(event) => {
        const { current, hostId } = appAlerts.getSnapshot();
        if (current && hostId !== null) {
          appAlerts.dismiss(current.id);
          return;
        }
        onRequestClose?.(event);
      }}
    />
  );
}
