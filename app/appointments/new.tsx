import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import Field from '../../src/components/Field';
import SelectModal, { SelectOption } from '../../src/components/SelectModal';

interface AppointmentFormData {
  clinic_id: number | null;
  doctor_id: number | null;
  appointment_description: string;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ clinic_id?: string; doctor_id?: string }>();

  const initialClinicId = params.clinic_id ? Number(params.clinic_id) : null;
  const initialDoctorId = params.doctor_id ? Number(params.doctor_id) : null;

  // Form management
  const { control, handleSubmit, setValue, watch } = useForm<AppointmentFormData>({
    defaultValues: {
      clinic_id: initialClinicId,
      doctor_id: initialDoctorId,
      appointment_description: '',
    },
  });

  const selectedClinicId = watch('clinic_id');
  const selectedDoctorId = watch('doctor_id');

  // Clinic & Doctor Lists
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [clinicDoctors, setClinicDoctors] = useState<PublicDoctor[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Modals for selection
  const [modalType, setModalType] = useState<'clinic' | 'doctor' | null>(null);

  // Doctor Schedule Hook
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
  } = useDoctorSchedule(selectedClinicId || 0, selectedDoctorId || 0);

  // Load all clinics on mount
  useEffect(() => {
    (async () => {
      setLoadingInitial(true);
      try {
        const cList = await clinicsApi.getClinics({ countryId: 1 }); // default/fallback
        setAllClinics(cList);
      } catch {
        // Fallback: load countries then clinics
        try {
          const countries = await clinicsApi.getCountries();
          if (countries.length > 0) {
            const cList = await clinicsApi.getClinics({ countryId: countries[0].country_id });
            setAllClinics(cList);
          }
        } catch (err) {
          console.warn('Could not load initial clinics:', err);
        }
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, []);

  // Load doctors when clinic changes
  useEffect(() => {
    if (!selectedClinicId) {
      setClinicDoctors([]);
      return;
    }
    (async () => {
      try {
        const dList = await clinicsApi.getClinicDoctors(selectedClinicId);
        setClinicDoctors(dList);
        if (selectedDoctorId && !dList.some((d) => d.doctor_id === selectedDoctorId)) {
          setValue('doctor_id', null);
        }
      } catch (err) {
        console.warn('Error loading doctors for clinic:', err);
      }
    })();
  }, [selectedClinicId, setValue, selectedDoctorId]);

  const currentClinic = allClinics.find((c) => c.clinic_id === selectedClinicId);
  const currentDoctor = clinicDoctors.find((d) => d.doctor_id === selectedDoctorId);

  const clinicOptions: SelectOption[] = allClinics.map((c) => ({
    label: c.clinic_name,
    value: c.clinic_id,
  }));

  const doctorOptions: SelectOption[] = clinicDoctors.map((d) => {
    const fullName = [d.first_name, d.second_name, d.first_last_name, d.second_last_name]
      .filter(Boolean)
      .join(' ');
    const spec = d.specialties?.[0]?.specialty_name ? ` (${d.specialties[0].specialty_name})` : '';
    return {
      label: `${fullName}${spec}`,
      value: d.doctor_id,
    };
  });

  const onSubmit = () => {
    if (!selectedClinicId) {
      Alert.alert('Atención', 'Por favor selecciona una clínica.');
      return;
    }
    if (!selectedDoctorId) {
      Alert.alert('Atención', 'Por favor selecciona un doctor.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Atención', 'Por favor selecciona un horario disponible.');
      return;
    }

    const doctorName = currentDoctor
      ? `${currentDoctor.first_name} ${currentDoctor.first_last_name}`
      : 'el doctor';

    Alert.alert(
      'Confirmar Cita',
      `¿Deseas confirmar tu cita médica con ${doctorName} para el ${selectedDayLabel} a las ${selectedSlot.label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Agendar',
          onPress: async () => {
            try {
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Cita Médica</Text>
        </View>
        <View style={styles.guestGuardContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🔒</Text>
          <Text style={styles.guestGuardTitle}>Inicio de sesión requerido</Text>
          <Text style={styles.guestGuardSubtitle}>
            Debes iniciar sesión o crear una cuenta para poder agendar una cita médica.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            style={{ marginTop: 20, minWidth: 220 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Cita Médica</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Step 1: Clinic & Doctor Selection */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Selección de Clínica y Doctor</Text>

            {/* Clinic Picker */}
            <TouchableOpacity
              style={styles.pickerSelector}
              onPress={() => setModalType('clinic')}
            >
              <Text style={styles.pickerLabel}>Clínica *</Text>
              <Text style={styles.pickerValue}>
                {currentClinic ? currentClinic.clinic_name : 'Selecciona una clínica'}
              </Text>
            </TouchableOpacity>

            {/* Doctor Picker */}
            <TouchableOpacity
              style={[styles.pickerSelector, !selectedClinicId && styles.disabledSelector]}
              onPress={() => selectedClinicId && setModalType('doctor')}
              disabled={!selectedClinicId}
            >
              <Text style={styles.pickerLabel}>Doctor *</Text>
              <Text style={[styles.pickerValue, !selectedClinicId && styles.mutedText]}>
                {!selectedClinicId
                  ? 'Primero selecciona una clínica'
                  : currentDoctor
                  ? `${currentDoctor.first_name} ${currentDoctor.first_last_name}`
                  : 'Selecciona un doctor'}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Step 2: Schedule & Time Slot Selection */}
          {selectedClinicId && selectedDoctorId ? (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Selecciona Fecha y Horario</Text>

              {rulesError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{rulesError}</Text>
                </View>
              ) : null}

              {/* Month Selector */}
              <Text style={styles.subTitle}>Mes:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthsRow}
              >
                {months.map((m) => {
                  const isSelected = m.key === selectedMonthKey;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMonthKey(m.key)}
                      style={[styles.monthChip, isSelected && styles.monthChipSelected]}
                    >
                      <Text
                        style={[styles.monthText, isSelected && styles.monthTextSelected]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Day Selector */}
              <Text style={styles.subTitle}>Día:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysRow}
              >
                {days.map((d) => {
                  const isSelected = d.key === selectedDayKey;
                  return (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => setSelectedDayKey(d.key)}
                      style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    >
                      <Text style={[styles.dayWeek, isSelected && styles.dayWeekSelected]}>
                        {d.weekLabel}
                      </Text>
                      <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {days.length === 0 && (
                  <Text style={styles.mutedText}>No hay días disponibles este mes.</Text>
                )}
              </ScrollView>

              {/* Time Slots */}
              <View style={styles.slotsHeader}>
                <Text style={styles.subTitle}>Horarios para {selectedDayLabel}:</Text>
                {loadingSlots && <ActivityIndicator size="small" color="#259487" />}
              </View>

              {slotsError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{slotsError}</Text>
                </View>
              ) : null}

              <View style={styles.slotsGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const isAvailable = slot.status === 'available';

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      disabled={!isAvailable}
                      onPress={() => setSelectedSlotId(slot.id)}
                      style={[
                        styles.slotItem,
                        isAvailable && styles.slotAvailable,
                        isSelected && styles.slotSelected,
                        slot.status === 'booked' && styles.slotBooked,
                        slot.status === 'break' && styles.slotBreak,
                        slot.status === 'past' && styles.slotPast,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotLabel,
                          isSelected && styles.slotLabelSelected,
                          !isAvailable && styles.slotLabelDisabled,
                        ]}
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
                        style={{ marginTop: 4 }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!loadingSlots && slots.length === 0 && (
                <Text style={styles.noSlotsText}>
                  No hay horarios disponibles configurados para este día.
                </Text>
              )}
            </Card>
          ) : null}

          {/* Step 3: Optional Note & Submission */}
          {selectedSlot ? (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>3. Motivo o Nota (Opcional)</Text>
              <Field
                control={control}
                name="appointment_description"
                label="Notas para el médico"
                placeholder="Ej. Control de rutina, dolor de cabeza, etc."
                multiline
                numberOfLines={3}
                containerStyle={{ marginBottom: 0 }}
              />
            </Card>
          ) : null}

          {scheduleError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{scheduleError}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Button
            text={submitting ? 'Agendando cita...' : 'Confirmar y Guardar Cita'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            disabled={!selectedSlot || submitting}
            style={styles.submitBtn}
          />
        </ScrollView>

        {/* Modals */}
        <SelectModal
          title="Selecciona una Clínica"
          items={clinicOptions}
          selectedValue={selectedClinicId}
          isOpen={modalType === 'clinic'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setValue('clinic_id', val)}
          loading={loadingInitial}
        />

        <SelectModal
          title="Selecciona un Doctor"
          items={doctorOptions}
          selectedValue={selectedDoctorId}
          isOpen={modalType === 'doctor'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setValue('doctor_id', val)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: '#259487',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginVertical: 6,
  },
  pickerSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  disabledSelector: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  pickerLabel: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  pickerValue: {
    fontSize: 14,
    color: '#171717',
    marginTop: 2,
    fontWeight: '500',
  },
  mutedText: {
    color: '#9ca3af',
  },
  monthsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthChipSelected: {
    backgroundColor: '#259487',
    borderColor: '#259487',
  },
  monthText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  monthTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  dayCard: {
    width: 54,
    height: 62,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  dayCardSelected: {
    borderColor: '#259487',
    backgroundColor: '#e6f4f2',
  },
  dayWeek: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
  },
  dayWeekSelected: {
    color: '#259487',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginTop: 2,
  },
  dayNumSelected: {
    color: '#259487',
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  slotItem: {
    width: '48%',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  slotAvailable: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ffffff',
  },
  slotSelected: {
    borderColor: '#259487',
    backgroundColor: '#e6f4f2',
    borderWidth: 2,
  },
  slotBooked: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.7,
  },
  slotBreak: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    opacity: 0.7,
  },
  slotPast: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171717',
  },
  slotLabelSelected: {
    color: '#259487',
    fontWeight: '700',
  },
  slotLabelDisabled: {
    color: '#9ca3af',
  },
  noSlotsText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
  },
  guestGuardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  guestGuardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestGuardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
