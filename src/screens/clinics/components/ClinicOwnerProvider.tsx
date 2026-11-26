import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useForm } from 'react-hook-form';
import type {
  ClinicMember,
  Specialty,
  UpdateClinicOwnerProviderDto,
} from '../../../api/types';
import { Button, Card, ClayPressable, SelectModal } from '../../../components';

interface Props {
  owner: ClinicMember;
  specialties: Specialty[];
  saving: boolean;
  onSave: (data: UpdateClinicOwnerProviderDto) => void;
}

export function ClinicOwnerProvider({
  owner,
  specialties,
  saving,
  onSave,
}: Props) {
  const serverDoctor = !!owner.isDoctor;
  const serverSpecialty =
    owner.specialties?.[0]?.specialty_id ?? owner.specialty_id ?? null;
  const form = useForm<{ isDoctor: boolean; specialty_id: number | null }>({
    defaultValues: { isDoctor: serverDoctor, specialty_id: serverSpecialty },
  });
  const isDoctor = form.watch('isDoctor');
  const specialtyId = form.watch('specialty_id');
  const dirty = useRef(form.formState.isDirty);
  dirty.current = form.formState.isDirty;
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const desired = form.getValues();
    if (
      !dirty.current ||
      (desired.isDoctor === serverDoctor &&
        (!serverDoctor || desired.specialty_id === serverSpecialty))
    )
      form.reset({ isDoctor: serverDoctor, specialty_id: serverSpecialty });
  }, [serverDoctor, serverSpecialty, form.reset, form.getValues]);
  return (
    <Card className="mb-4">
      <Text className="text-base font-bold text-med-text-main mb-2">
        Atender en mi clínica
      </Text>
      <Text className="text-xs text-med-text-muted mb-3">
        Configura tu atención como médico en esta clínica conservando tu rol de
        propietario. Esta elección no cambia tus otras clínicas.
      </Text>
      <ClayPressable
        onPress={() =>
          form.setValue('isDoctor', !isDoctor, { shouldDirty: true })
        }
        disabled={saving}
        accessibilityRole="checkbox"
        accessibilityLabel="Atender consultas en esta clínica"
        accessibilityState={{ checked: isDoctor, disabled: saving }}
        className={`min-h-touch max-w-full rounded-control border p-3 mb-3 ${isDoctor ? 'bg-med-primary-surface border-med-primary' : 'bg-med-bg border-med-border'}`}
      >
        <Text className="text-sm text-med-text-main">
          {isDoctor ? '✓ ' : ''}Atender consultas en esta clínica
        </Text>
      </ClayPressable>
      {isDoctor && (
        <>
          <ClayPressable
            onPress={() => setModalOpen(true)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar mi especialidad en la clínica"
            className="min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3 mb-3"
          >
            <Text className="text-xs font-semibold text-med-text-muted">
              Mi especialidad en esta clínica *
            </Text>
            <Text className="text-sm text-med-text-main mt-1">
              {specialties.find((item) => item.specialty_id === specialtyId)
                ?.specialty_name || 'Selecciona una especialidad'}
            </Text>
          </ClayPressable>
          {!specialties.length && (
            <Text className="text-xs text-med-warning-text mb-3">
              Guarda primero las especialidades ofrecidas en Datos y horarios.
            </Text>
          )}
        </>
      )}
      <Button
        text="Guardar mi atención"
        loading={saving}
        disabled={
          saving ||
          !form.formState.isDirty ||
          (isDoctor &&
            !specialties.some((item) => item.specialty_id === specialtyId))
        }
        onPress={() =>
          onSave({
            isDoctor,
            ...(isDoctor && specialtyId ? { specialty_id: specialtyId } : {}),
          })
        }
      />
      <SelectModal
        title="Mi especialidad en esta clínica"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        items={specialties.map((item) => ({
          value: item.specialty_id,
          label: item.specialty_name,
        }))}
        selectedValue={specialtyId}
        onSelect={(value) => {
          if (!saving)
            form.setValue('specialty_id', Number(value), { shouldDirty: true });
        }}
      />
    </Card>
  );
}
