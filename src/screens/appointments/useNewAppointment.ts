import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import clinicsApi from '../../api/clinics';
import { Clinic, PublicDoctor } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useDoctorSchedule } from '../../hooks/useDoctorSchedule';

export interface AppointmentFormData {
  appointment_description: string;
}

export function useNewAppointment() {
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

  const doctorFullName = doctor
    ? [doctor.first_name, doctor.second_name, doctor.first_last_name, doctor.second_last_name]
        .filter(Boolean)
        .join(' ')
    : `Doctor #${doctorId}`;

  const doctorSpecialtyName = doctor?.specialties?.[0]?.specialty_name
    ? ` • ${doctor.specialties[0].specialty_name}`
    : '';

  return {
    router,
    isAuthenticated,
    clinicId,
    doctorId,
    clinic,
    doctor,
    doctorFullName,
    doctorSpecialtyName,
    loadingDetails,
    control,
    handleSubmit,
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
    submitting,
    scheduleError,
    onSubmit,
  };
}
