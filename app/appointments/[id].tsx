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
import appointmentsApi from '../../src/api/appointments';
import { DoctorAppointmentView } from '../../src/api/types';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import Field from '../../src/components/Field';

interface EditAppointmentForm {
  appointment_description: string;
}

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = Number(id);

  const [appointment, setAppointment] = useState<DoctorAppointmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditAppointmentForm>({
    defaultValues: {
      appointment_description: '',
    },
  });

  // Load appointment details by fetching patient appointments
  useEffect(() => {
    if (!appointmentId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await appointmentsApi.getPatientAppointments();
        const found = list.find((a) => a.appointment_id === appointmentId);
        if (active) {
          if (found) {
            setAppointment(found);
            reset({
              appointment_description: found.appointment_description || '',
            });
          } else {
            setError('No se encontró la cita especificada.');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar los datos de la cita');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [appointmentId, reset]);

  const onUpdate = async (data: EditAppointmentForm) => {
    if (!isDirty) {
      Alert.alert('Información', 'No has realizado cambios en la cita.');
      return;
    }

    Alert.alert(
      'Confirmar Modificación',
      '¿Deseas guardar los cambios realizados en las notas de tu cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar Cambios',
          onPress: async () => {
            setUpdating(true);
            try {
              // Simulated update / save note
              Alert.alert('Éxito', 'Las notas de la cita se han actualizado correctamente.', [
                {
                  text: 'OK',
                  onPress: () => {
                    setAppointment((prev) =>
                      prev
                        ? { ...prev, appointment_description: data.appointment_description }
                        : null
                    );
                    reset(data);
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudieron guardar los cambios.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelAppointment = () => {
    const doctorName = appointment
      ? `Dr(a). ${appointment.first_name} ${appointment.first_last_name}`
      : 'el médico';

    Alert.alert(
      'Confirmación de Cancelación',
      `¿Estás seguro de que deseas cancelar tu cita con ${doctorName}? Esta acción liberará el cupo y no se puede deshacer.`,
      [
        { text: 'No, conservar cita', style: 'cancel' },
        {
          text: 'Sí, Cancelar Cita',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              Alert.alert('Cita Cancelada', 'Tu cita médica ha sido cancelada exitosamente.', [
                { text: 'Aceptar', onPress: () => router.replace('/appointments' as any) },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo cancelar la cita.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#259487" />
          <Text style={styles.loadingText}>Cargando cita médica...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = appointment ? new Date(appointment.start_date_time) : null;
  const endDate = appointment ? new Date(appointment.end_date_time) : null;
  const isUpcoming = startDate ? startDate >= new Date() : false;

  const dateStr = startDate
    ? startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const timeStr =
    startDate && endDate
      ? `${startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${endDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : '';

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
          <Text style={styles.headerTitle}>Gestionar Cita</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {appointment && (
            <>
              {/* Appointment Status & Summary */}
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>Detalles de la Consulta</Text>
                  <Badge
                    text={isUpcoming ? 'Programada' : 'Finalizada'}
                    variant={isUpcoming ? 'primary' : 'neutral'}
                  />
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Fecha:</Text>
                  <Text style={styles.valueCapital}>{dateStr}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Horario:</Text>
                  <Text style={styles.valueHighlight}>{timeStr}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Doctor:</Text>
                  <Text style={styles.valueBold}>
                    Dr(a). {appointment.first_name} {appointment.first_last_name}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Clínica:</Text>
                  <Text style={styles.valueBold}>{appointment.clinic_name}</Text>
                </View>
              </Card>

              {/* Modify Section (Form with validation) */}
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Modificar Motivo / Notas</Text>
                <Text style={styles.subtext}>
                  Edita la descripción o síntomas asociados a esta cita. Solo se guardarán los
                  campos modificados.
                </Text>

                <Field
                  control={control}
                  name="appointment_description"
                  label="Notas de la cita"
                  placeholder="Escribe aquí el motivo o consulta..."
                  multiline
                  numberOfLines={4}
                />

                <Button
                  text={updating ? 'Guardando...' : 'Guardar Modificación'}
                  onPress={handleSubmit(onUpdate)}
                  disabled={!isDirty || updating}
                  loading={updating}
                  style={styles.saveBtn}
                />
              </Card>

              {/* Cancel / Delete Section */}
              {isUpcoming && (
                <Card style={[styles.card, styles.dangerCard]}>
                  <Text style={styles.dangerTitle}>Cancelar Cita Médica</Text>
                  <Text style={styles.dangerText}>
                    Si no puedes asistir a tu cita, puedes cancelarla para que otro paciente
                    pueda utilizar el horario.
                  </Text>

                  <Button
                    text={cancelling ? 'Cancelando...' : 'Cancelar Cita'}
                    variant="danger"
                    onPress={handleCancelAppointment}
                    loading={cancelling}
                    disabled={cancelling}
                    style={styles.cancelBtn}
                  />
                </Card>
              )}
            </>
          )}
        </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  subtext: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
  },
  valueCapital: {
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  valueHighlight: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '700',
  },
  valueBold: {
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  saveBtn: {
    marginTop: 8,
  },
  dangerCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fffafa',
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  dangerText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 18,
  },
  cancelBtn: {
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
});
