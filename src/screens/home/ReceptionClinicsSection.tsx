import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '../../components';
import { useDispatchClinics } from '../../hooks/useDispatchClinics';

export function ReceptionClinicsSection() {
  const { clinics, error, loading, load } = useDispatchClinics();
  const router = useRouter();
  const receptionClinics = clinics.filter(
    (clinic) => clinic.role_within_clinic === 'Employee',
  );
  if (!receptionClinics.length) return null;
  return (
    <View className="mb-5 min-w-0 max-w-full">
      <Text className="text-base font-bold text-med-text-main mb-3">
        Recepción
      </Text>
      {error ? (
        <Card className="mb-3 border-med-error-border bg-med-error-bg">
          <Text className="text-sm text-med-error-badge-text">{error}</Text>
          <Button
            text="Reintentar recepción"
            variant="outline"
            loading={loading}
            onPress={() => {
              void load();
            }}
            className="mt-3"
          />
        </Card>
      ) : null}
      {receptionClinics.map((clinic) => (
        <Card key={clinic.clinic_id} className="mb-3">
          <Text className="text-base font-bold text-med-text-main">
            {clinic.clinic_name}
          </Text>
          <Text className="text-sm text-med-text-muted mt-1">
            Consulta la agenda de hoy y registra la llegada de los pacientes.
          </Text>
          <Button
            text="Abrir agenda de recepción"
            variant="outline"
            onPress={() => router.push(`/clinics/${clinic.clinic_id}` as any)}
            className="mt-3"
          />
        </Card>
      ))}
    </View>
  );
}
