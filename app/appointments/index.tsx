import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import appointmentsApi from '../../src/api/appointments';
import { DoctorAppointmentView } from '../../src/api/types';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import NavBar from '../../src/components/NavBar';

export default function AppointmentsIndexScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentsApi.getPatientAppointments();
      setAppointments(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const now = new Date();

  const filteredAppointments = appointments
    .filter((appt) => {
      const apptDate = new Date(appt.start_date_time);
      if (tab === 'upcoming') {
        return apptDate >= now;
      }
      return apptDate < now;
    })
    .filter((appt) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const doctorName = `${appt.first_name} ${appt.first_last_name}`.toLowerCase();
      const clinicName = (appt.clinic_name || '').toLowerCase();
      const desc = (appt.appointment_description || '').toLowerCase();
      return (
        doctorName.includes(term) ||
        clinicName.includes(term) ||
        desc.includes(term)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_date_time).getTime();
      const timeB = new Date(b.start_date_time).getTime();
      return tab === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

  const renderAppointmentItem = ({ item }: { item: DoctorAppointmentView }) => {
    const startDate = new Date(item.start_date_time);
    const endDate = new Date(item.end_date_time);

    const dateStr = startDate.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timeStr = `${startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const doctorName = `Dr(a). ${item.first_name} ${item.first_last_name}`;
    const isUpcoming = startDate >= now;

    return (
      <Card
        onPress={() => router.push(`/appointments/${item.appointment_id}` as any)}
        style={styles.appointmentCard}
      >
        <View style={styles.cardTop}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <Badge
            text={isUpcoming ? 'Programada' : 'Finalizada'}
            variant={isUpcoming ? 'primary' : 'neutral'}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.doctorText}>👨‍⚕️ {doctorName}</Text>
        <Text style={styles.clinicText}>🏥 {item.clinic_name}</Text>

        {item.appointment_description ? (
          <Text style={styles.descText} numberOfLines={2}>
            📝 {item.appointment_description}
          </Text>
        ) : null}

        <View style={styles.cardActions}>
          <Text style={styles.detailsLink}>Ver detalles / Gestionar →</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
            <Text style={styles.backText}>← Inicio</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Citas</Text>
          <Button
            text="+ Nueva"
            onPress={() => router.push('/appointments/new' as any)}
            style={styles.newBtn}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por doctor, clínica o motivo..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setTab('upcoming')}
            style={[styles.tabItem, tab === 'upcoming' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
              Próximas Citas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('past')}
            style={[styles.tabItem, tab === 'past' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => String(item.appointment_id)}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAppointments}
              tintColor="#259487"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {tab === 'upcoming'
                  ? 'No tienes citas próximas'
                  : 'No tienes citas en tu historial'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'upcoming'
                  ? 'Agenda una nueva cita médica con un doctor disponible.'
                  : 'Las citas finalizadas aparecerán aquí.'}
              </Text>
              {tab === 'upcoming' && (
                <Button
                  text="Agendar Cita Ahora"
                  onPress={() => router.push('/appointments/new' as any)}
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          }
        />

        {/* Bottom Navigation Bar */}
        <NavBar active="appointments" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
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
  },
  newBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#171717',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#259487',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  tabTextActive: {
    color: '#259487',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateBlock: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 10,
  },
  doctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  clinicText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  detailsLink: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '600',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    margin: 16,
    borderRadius: 6,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
});
