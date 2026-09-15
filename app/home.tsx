import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import appointmentsApi from '../src/api/appointments';
import { DoctorAppointmentView } from '../src/api/types';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import NavBar from '../src/components/NavBar';

export default function HomeScreen() {
  const router = useRouter();
  const { user, roles, signOut } = useAuth();
  const [upcomingAppt, setUpcomingAppt] = useState<DoctorAppointmentView | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(false);

  const loadNextAppointment = async () => {
    setLoadingAppt(true);
    try {
      const list = await appointmentsApi.getPatientAppointments();
      const now = new Date();
      const upcoming = list
        .filter((a) => new Date(a.start_date_time) >= now)
        .sort((a, b) => new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime())[0];
      setUpcomingAppt(upcoming || null);
    } catch {
      // ignore in dashboard summary
    } finally {
      setLoadingAppt(false);
    }
  };

  useEffect(() => {
    loadNextAppointment();
  }, []);

  const handleLogout = () => {
    signOut();
    router.replace('/login');
  };

  const fullName = user
    ? [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
        .filter(Boolean)
        .join(' ')
    : 'Paciente';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingAppt}
            onRefresh={loadNextAppointment}
            tintColor="#259487"
          />
        }
      >
        {/* Top Greeting Header */}
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.appName}>MedAgenda</Text>
            <Text style={styles.welcomeText}>Hola, {user?.first_name || 'Bienvenido'}</Text>
          </View>
          <Badge
            text={roles?.isAdmin ? 'Admin' : roles?.isDoctor ? 'Médico' : 'Paciente'}
            variant="primary"
          />
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => router.push('/appointments/new' as any)}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionPrimaryText}>Agendar Cita</Text>
              <Text style={styles.actionSubtextLight}>Busca horario disponible</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/clinics' as any)}
            >
              <Text style={styles.actionIcon}>🏥</Text>
              <Text style={styles.actionText}>Buscar Clínicas</Text>
              <Text style={styles.actionSubtext}>Filtra por ciudad y doctor</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionWideBtn}
            onPress={() => router.push('/appointments' as any)}
          >
            <View style={styles.wideBtnContent}>
              <Text style={styles.actionIcon}>📋</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actionText}>Mis Citas Médicas</Text>
                <Text style={styles.actionSubtext}>Consulta tus citas activas e historial</Text>
              </View>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Next Appointment Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próxima Cita</Text>
            <TouchableOpacity onPress={() => router.push('/appointments' as any)}>
              <Text style={styles.viewAllLink}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loadingAppt ? (
            <Card style={styles.centerCard}>
              <ActivityIndicator size="small" color="#259487" />
            </Card>
          ) : upcomingAppt ? (
            <Card
              onPress={() =>
                router.push(`/appointments/${upcomingAppt.appointment_id}` as any)
              }
              style={styles.upcomingCard}
            >
              <View style={styles.upcomingHeader}>
                <Badge text="Confirmada" variant="success" />
                <Text style={styles.upcomingDate}>
                  {new Date(upcomingAppt.start_date_time).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <Text style={styles.upcomingDoctor}>
                Dr(a). {upcomingAppt.first_name} {upcomingAppt.first_last_name}
              </Text>
              <Text style={styles.upcomingClinic}>📍 {upcomingAppt.clinic_name}</Text>
              <Text style={styles.managePrompt}>Toca para gestionar o ver detalles →</Text>
            </Card>
          ) : (
            <Card style={styles.centerCard}>
              <Text style={styles.noApptText}>No tienes citas médicas programadas.</Text>
              <Button
                text="Agendar una Cita"
                onPress={() => router.push('/appointments/new' as any)}
                style={{ marginTop: 10 }}
              />
            </Card>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil de Usuario</Text>
          <Card>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Nombre:</Text>
              <Text style={styles.profileValue}>{fullName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Correo:</Text>
              <Text style={styles.profileValue}>{user?.user_email_address}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Cédula:</Text>
              <Text style={styles.profileValue}>{user?.legal_id || '-'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Teléfono:</Text>
              <Text style={styles.profileValue}>{user?.user_phone_number || '-'}</Text>
            </View>
          </Card>
        </View>

        {/* Logout */}
        <Button
          text="Cerrar Sesión"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <NavBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  greetingBlock: {
    flex: 1,
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#259487',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
  },
  actionPrimary: {
    backgroundColor: '#259487',
    borderColor: '#259487',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },
  actionPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionSubtext: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 2,
  },
  actionSubtextLight: {
    fontSize: 11,
    color: '#e6f4f2',
    marginTop: 2,
  },
  actionWideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
  },
  wideBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  arrowText: {
    fontSize: 18,
    color: '#259487',
    fontWeight: '700',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '600',
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#259487',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  upcomingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#259487',
    textTransform: 'capitalize',
  },
  upcomingDoctor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 2,
  },
  upcomingClinic: {
    fontSize: 13,
    color: '#4b5563',
  },
  managePrompt: {
    fontSize: 12,
    color: '#259487',
    fontWeight: '600',
    marginTop: 8,
  },
  centerCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noApptText: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171717',
  },
  logoutBtn: {
    marginTop: 4,
  },
});
