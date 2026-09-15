import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import clinicsApi from '../../src/api/clinics';
import { Clinic, ClinicScheduleRules, PublicDoctor } from '../../src/api/types';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';

export default function ClinicDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cData, dList, rData] = await Promise.all([
          clinicsApi.getClinicDetails(clinicId),
          clinicsApi.getClinicDoctors(clinicId),
          clinicsApi.getClinicScheduleRules(clinicId).catch(() => null),
        ]);
        if (active) {
          setClinic(cData);
          setDoctors(dList);
          setRules(rData);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar detalles de la clínica');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clinicId]);

  const handleBookWithDoctor = (doctorId: number) => {
    router.push({
      pathname: '/appointments/new',
      params: { clinic_id: clinicId, doctor_id: doctorId },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#259487" />
          <Text style={styles.loadingText}>Cargando información de la clínica...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {clinic?.clinic_name || 'Detalles de la Clínica'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {clinic && (
            <Card style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.clinicTitle}>{clinic.clinic_name}</Text>
                <Badge
                  text={clinic.is_open ? 'Abierta' : 'Cerrada'}
                  variant={clinic.is_open ? 'success' : 'error'}
                />
              </View>

              <Text style={styles.infoItem}>📍 {clinic.clinic_address}</Text>
              <Text style={styles.infoItem}>📞 {clinic.clinic_phone_number}</Text>

              {clinic.clinic_description ? (
                <Text style={styles.descText}>{clinic.clinic_description}</Text>
              ) : null}

              {/* Schedule Rules Summary */}
              {rules && (
                <View style={styles.rulesBox}>
                  <Text style={styles.rulesTitle}>Reglas y Horario de Atención</Text>
                  <View style={styles.rulesRow}>
                    <Text style={styles.ruleLabel}>Apertura:</Text>
                    <Text style={styles.ruleValue}>{rules.clinic_opening_time}</Text>
                  </View>
                  <View style={styles.rulesRow}>
                    <Text style={styles.ruleLabel}>Cierre:</Text>
                    <Text style={styles.ruleValue}>{rules.clinic_close_time}</Text>
                  </View>
                  <View style={styles.rulesRow}>
                    <Text style={styles.ruleLabel}>Duración de cita:</Text>
                    <Text style={styles.ruleValue}>{rules.clinic_average_appointment_time}</Text>
                  </View>
                  {rules.clinic_break_time && (
                    <View style={styles.rulesRow}>
                      <Text style={styles.ruleLabel}>Descanso:</Text>
                      <Text style={styles.ruleValue}>
                        {rules.clinic_break_time} ({rules.clinic_break_duration || '60 min'})
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          )}

          {/* Doctors Section */}
          <View style={styles.doctorsSection}>
            <Text style={styles.sectionTitle}>Médicos Disponibles</Text>

            {doctors.length === 0 ? (
              <Card style={styles.emptyDoctorCard}>
                <Text style={styles.emptyText}>No hay doctores registrados en esta clínica.</Text>
              </Card>
            ) : (
              doctors.map((doc) => {
                const fullName = [
                  doc.first_name,
                  doc.second_name,
                  doc.first_last_name,
                  doc.second_last_name,
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <Card key={doc.doctor_id} style={styles.doctorCard}>
                    <View style={styles.docHeader}>
                      <View style={styles.docAvatar}>
                        <Text style={styles.docAvatarText}>
                          {(doc.first_name?.[0] || 'D').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docName}>{fullName}</Text>
                        <View style={styles.specialtiesList}>
                          {doc.specialties && doc.specialties.length > 0 ? (
                            doc.specialties.map((sp) => (
                              <Badge
                                key={sp.specialty_id}
                                text={sp.specialty_name}
                                variant="info"
                                style={styles.specBadge}
                              />
                            ))
                          ) : (
                            <Text style={styles.noSpecText}>Sin especialidades asignadas</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <Button
                      text="Agendar con este doctor"
                      onPress={() => handleBookWithDoctor(doc.doctor_id)}
                      style={styles.bookDoctorBtn}
                    />
                  </Card>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    flex: 1,
    marginRight: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: '#171717',
    marginTop: 8,
    lineHeight: 18,
  },
  rulesBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  rulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ruleLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  ruleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171717',
  },
  doctorsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 12,
  },
  doctorCard: {
    marginBottom: 12,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6f4f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#259487',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 4,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specBadge: {
    marginRight: 4,
    marginTop: 2,
  },
  noSpecText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookDoctorBtn: {
    marginTop: 4,
  },
  emptyDoctorCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
});
