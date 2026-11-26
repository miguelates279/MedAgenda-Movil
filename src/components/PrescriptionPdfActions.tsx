import React from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import type {
  PrescriptionPdfAction,
  PrescriptionPdfPending,
} from '../hooks/usePrescriptionExport';

interface PrescriptionPdfActionsProps {
  prescriptionId?: number;
  pending: PrescriptionPdfPending | null;
  disabled?: boolean;
  onExport: (prescriptionId: number, action: PrescriptionPdfAction) => void;
}

export function PrescriptionPdfActions({
  prescriptionId,
  pending,
  disabled = false,
  onExport,
}: PrescriptionPdfActionsProps) {
  if (
    typeof prescriptionId !== 'number' ||
    !Number.isSafeInteger(prescriptionId) ||
    prescriptionId <= 0
  )
    return null;
  const ownPending =
    pending?.prescriptionId === prescriptionId ? pending.action : null;
  const blocked = disabled || pending !== null;

  return (
    <View className="min-w-0 max-w-full mt-3 gap-2">
      <Button
        text={ownPending === 'save' ? 'Guardando PDF...' : 'Guardar PDF'}
        variant="outline"
        onPress={() => onExport(prescriptionId, 'save')}
        disabled={blocked}
        loading={ownPending === 'save'}
      />
      <Button
        text={ownPending === 'share' ? 'Preparando PDF...' : 'Compartir PDF'}
        variant="secondary"
        onPress={() => onExport(prescriptionId, 'share')}
        disabled={blocked}
        loading={ownPending === 'share'}
      />
    </View>
  );
}
