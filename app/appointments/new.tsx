import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../src/context/AuthContext';
import clinicsApi from '../../src/api/clinics';
import { Clinic, PublicDoctor } from '../../src/api/types';
import { useDoctorSchedule } from '../../src/hooks/useDoctorSchedule';
import { Badge, Button, Card, Field } from '../../src/components';

interface AppointmentFormData {
  appointment_description: string;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ clinic_id?: string; doctor_id?: string }>();

  const clinicId = params.clinic_id ? Number(params.clinic_id) : null;
  const doctorId = params.doctor_id ? Number(params.doctor_id) : null;

  const { control, handleSubmit } = useForm<AppointmentFormData>({
    defaultValues: {
      appointment_description: '',
    },
  });

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctor, setDoctor] = useState<PublicDoctor | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const {
    rules,
    loadingRules,
    rulesError,
    months,
    selectedMonthKey,
    setSelectedMonthKey,
    days,
    selectedDayKey,
    setSelectedDayKey,
    selectedDayLabel,
    slots,
    loadingSlots,
    slotsError,
    selectedSlotId,
    setSelectedSlotId,
    selectedSlot,
    note,
    setNote,
    submitting,
    scheduleError,
    confirmBooking,
  } = useDoctorSchedule(clinicId || 0, doctorId || 0);

  useEffect(() => {
    if (!clinicId || !doctorId) return;

    let active = true;
    setLoadingDetails(true);

    (async () => {
      try {
        const [cData, dList] = await Promise.all([
          clinicsApi.getClinicDetails(clinicId).catch(() => null),
          clinicsApi.getClinicDoctors(clinicId).catch(() => []),
        ]);

        if (active) {
          setClinic(cData);
          const foundDoc = dList.find((d) => d.doctor_id === doctorId) || null;
          setDoctor(foundDoc);
        }
      } catch (err) {
        console.warn('Error loading clinic/doctor details:', err);
      } finally {
        if (active) setLoadingDetails(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clinicId, doctorId]);

  const onSubmit = (formData: AppointmentFormData) => {
    if (!selectedSlot) {
      Alert.alert('Atención', 'Por favor selecciona un horario disponible.');
      return;
    }

    const doctorName = doctor
      ? `${doctor.first_name} ${doctor.first_last_name}`
      : 'el doctor';

    Alert.alert(
      'Confirmar Cita Médica',
      `¿Deseas confirmar tu cita médica con ${doctorName} para el ${selectedDayLabel} a las ${selectedSlot.label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Agendar',
          onPress: async () => {
            try {
              if (formData.appointment_description) {
                setNote(formData.appointment_description);
              }
              await confirmBooking();
              Alert.alert('¡Cita Agendada!', 'Tu cita ha sido confirmada con éxito.', [
                {
                  text: 'Ver Mis Citas',
                  onPress: () => router.replace('/appointments' as any),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error al agendar', err.message || 'No se pudo agendar la cita.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900">Nueva Cita Médica</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Text className="text-5xl mb-3">🔒</Text>
          <Text className="text-lg font-bold text-neutral-900 mb-2 text-center">
            Inicio de sesión requerido
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5 max-w-[280px]">
            Debes iniciar sesión o crear una cuenta para poder agendar una cita médica.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            className="mt-5 min-w-[220px]"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!clinicId || !doctorId) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900">Agendar Cita</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Text className="text-5xl mb-3">🏥</Text>
          <Text className="text-lg font-bold text-neutral-900 mb-2 text-center">
            Selecciona una Clínica y Especialista
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5 max-w-[300px]">
            Para agendar tu cita, utiliza el buscador de clínicas para encontrar tu centro médico y seleccionar el doctor disponible.
          </Text>
          <Button
            text="Ir al Buscador de Clínicas"
            onPress={() => router.replace('/clinics' as any)}
            className="mt-5 min-w-[240px]"
          />
        </View>
      </SafeAreaView>
    );
  }

  const doctorFullName = doctor
    ? [doctor.first_name, doctor.second_name, doctor.first_last_name, doctor.second_last_name]
        .filter(Boolean)
        .join(' ')
    : `Doctor #${doctorId}`;

  const doctorSpecialtyName = doctor?.specialties?.[0]?.specialty_name
    ? ` • ${doctor.specialties[0].specialty_name}`
    : '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900">Agendar Cita Médica</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Card className="mb-4 bg-teal-50/70 border border-teal-100 p-4">
            <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
              Información de la Cita
            </Text>

            {loadingDetails ? (
              <ActivityIndicator size="small" color="#259487" className="py-2" />
            ) : (
              <>
                <View className="flex-row items-start mb-2">
                  <Text className="text-lg mr-2 mt-0.5">🏢</Text>
                  <View className="flex-1">
                    <Text className="text-[11px] text-gray-500 uppercase font-medium">Clínica</Text>
                    <Text className="text-sm font-bold text-neutral-900">
                      {clinic?.clinic_name || `Clínica #${clinicId}`}
                    </Text>
                    {clinic?.clinic_address && (
                      <Text className="text-xs text-gray-600 mt-0.5">📍 {clinic.clinic_address}</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-start border-t border-teal-100/70 pt-2 mt-1">
                  <Text className="text-lg mr-2 mt-0.5">👨‍⚕️</Text>
                  <View className="flex-1">
                    <Text className="text-[11px] text-gray-500 uppercase font-medium">Especialista</Text>
                    <Text className="text-sm font-bold text-neutral-900">
                      Dr(a). {doctorFullName}
                      <Text className="text-primary font-semibold">{doctorSpecialtyName}</Text>
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card>

          <Card className="mb-4">
            <Text className="text-[15px] font-bold text-neutral-900 mb-2">Selecciona Fecha y Horario</Text>

            {rulesError ? (
              <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2.5">
                <Text className="text-red-800 text-xs">{rulesError}</Text>
              </View>
            ) : null}

            <Text className="text-xs font-semibold text-gray-600 my-1.5">Mes:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}
            >
              {months.map((m) => {
                const isSelected = m.key === selectedMonthKey;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setSelectedMonthKey(m.key)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-gray-100 border-gray-200'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white font-bold' : 'text-gray-600 font-medium'
                      }`}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text className="text-xs font-semibold text-gray-600 my-1.5">Día:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 6 }}
            >
              {days.map((d) => {
                const isSelected = d.key === selectedDayKey;
                return (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setSelectedDayKey(d.key)}
                    className={`w-14 h-16 rounded-lg border items-center justify-center bg-white ${
                      isSelected
                        ? 'border-primary bg-[#e6f4f2]'
                        : 'border-gray-300'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-primary' : 'text-gray-600'
                      }`}
                    >
                      {d.weekLabel}
                    </Text>
                    <Text
                      className={`text-base font-bold mt-0.5 ${
                        isSelected ? 'text-primary' : 'text-neutral-900'
                      }`}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {days.length === 0 && (
                <Text className="text-sm text-gray-400">No hay días disponibles este mes.</Text>
              )}
            </ScrollView>

            <View className="flex-row justify-between items-center mt-2 mb-1">
              <Text className="text-xs font-semibold text-gray-600">Horarios para {selectedDayLabel}:</Text>
              {loadingSlots && <ActivityIndicator size="small" color="#259487" />}
            </View>

            {slotsError ? (
              <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2.5">
                <Text className="text-red-800 text-xs">{slotsError}</Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-2 mt-1.5">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const isAvailable = slot.status === 'available';

                return (
                  <TouchableOpacity
                    key={slot.id}
                    disabled={!isAvailable}
                    onPress={() => setSelectedSlotId(slot.id)}
                    className={`w-[48%] p-2.5 rounded-md border items-center justify-center ${
                      isAvailable
                        ? isSelected
                          ? 'border-primary bg-[#e6f4f2] border-2'
                          : 'border-emerald-200 bg-white'
                        : slot.status === 'booked'
                        ? 'bg-gray-100 border-gray-200 opacity-70'
                        : slot.status === 'break'
                        ? 'bg-amber-50 border-amber-200 opacity-70'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected
                          ? 'text-primary font-bold'
                          : !isAvailable
                          ? 'text-gray-400'
                          : 'text-neutral-900'
                      }`}
                    >
                      {slot.label}
                    </Text>
                    <Badge
                      text={
                        isAvailable
                          ? isSelected
                            ? 'Seleccionado'
                            : 'Disponible'
                          : slot.status === 'booked'
                          ? 'Ocupado'
                          : slot.status === 'break'
                          ? 'Descanso'
                          : 'Pasada'
                      }
                      variant={
                        isSelected
                          ? 'primary'
                          : isAvailable
                          ? 'success'
                          : slot.status === 'break'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="mt-1"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {!loadingSlots && slots.length === 0 && (
              <Text className="text-xs text-gray-400 text-center my-3">
                No hay horarios disponibles configurados para este día.
              </Text>
            )}
          </Card>

          {selectedSlot ? (
            <Card className="mb-4">
              <Text className="text-[15px] font-bold text-neutral-900 mb-2">Motivo o Nota (Opcional)</Text>
              <Field
                control={control}
                name="appointment_description"
                label="Notas para el médico"
                placeholder="Ej. Control de rutina, dolor de cabeza, etc."
                multiline
                numberOfLines={3}
                className="mb-0"
              />
            </Card>
          ) : null}

          {scheduleError ? (
            <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2.5">
              <Text className="text-red-800 text-xs">{scheduleError}</Text>
            </View>
          ) : null}

          <Button
            text={submitting ? 'Agendando cita...' : 'Confirmar y Guardar Cita'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            disabled={!selectedSlot || submitting}
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
