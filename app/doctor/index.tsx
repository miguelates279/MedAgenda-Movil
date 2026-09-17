import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import doctorsApi from '../../src/api/doctors';
import prescriptionsApi from '../../src/api/prescriptions';
import clinicsApi from '../../src/api/clinics';
import {
  DoctorAppointmentView,
  PatientHistoryGroup,
  PatientHistoryRow,
  PrescriptionDoctorView,
} from '../../src/api/types';
import { Badge, Button, Card, NavBar } from '../../src/components';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user, roles, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [patientHistories, setPatientHistories] = useState<PatientHistoryRow[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDoctorView[]>([]);
  const [doctorClinics, setDoctorClinics] = useState<{ clinicId: number; clinicName: string }[]>([]);

  const [rangeDays, setRangeDays] = useState<number>(14);
  const [patientQuery, setPatientQuery] = useState('');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [targetPatient, setTargetPatient] = useState<{
    patientId: number;
    patientName: string;
    clinics: { clinicId: number; clinicName: string }[];
  } | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null);
  const [editPrescriptionText, setEditPrescriptionText] = useState('');
  const [updatingPrescription, setUpdatingPrescription] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !roles?.isDoctor) {
      router.replace('/home' as any);
    }
  }, [isAuthenticated, roles]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsData, historiesData, doctorPrescriptionsData, userClinicsData] = await Promise.all([
        doctorsApi.getDoctorAppointments().catch(() => []),
        doctorsApi.getDoctorPatientHistories().catch(() => []),
        prescriptionsApi.getDoctorPrescriptions().catch(() => []),
        clinicsApi.getUserClinics().catch(() => []),
      ]);

      setAppointments(apptsData || []);
      setPatientHistories(historiesData || []);
      setPrescriptions(doctorPrescriptionsData || []);

      const clinicsFromDoctor = (userClinicsData || []).map((c) => ({
        clinicId: c.clinic_id,
        clinicName: c.clinic_name,
      }));

      const extractedClinics = Array.from(
        new Map(
          [
            ...clinicsFromDoctor,
            ...(apptsData || []).map((a) => ({
              clinicId: a.clinic_id || 0,
              clinicName: a.clinic_name || `Clínica ${a.clinic_id}`,
            })),
            ...(historiesData || []).map((h) => ({
              clinicId: h.clinic_id || 0,
              clinicName: h.clinic_name || `Clínica ${h.clinic_id}`,
            })),
          ]
            .filter((c) => c.clinicId > 0)
            .map((c) => [c.clinicId, c])
        ).values()
      );

      setDoctorClinics(extractedClinics);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudieron cargar los datos del doctor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + rangeDays);

    return appointments
      .filter((a) => {
        const start = new Date(a.start_date_time);
        if (isNaN(start.getTime())) return false;
        if (rangeDays === 0) return start >= now;
        return start >= now && start <= maxDate;
      })
      .sort((a, b) => new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime());
  }, [appointments, rangeDays]);

  const appointmentsByClinic = useMemo(() => {
    const grouped: Record<
      number,
      { clinicId: number; clinicName: string; appointments: DoctorAppointmentView[] }
    > = {};

    upcomingAppointments.forEach((appt) => {
      const cid = appt.clinic_id || 0;
      if (!grouped[cid]) {
        grouped[cid] = {
          clinicId: cid,
          clinicName: appt.clinic_name || `Clínica ${cid}`,
          appointments: [],
        };
      }
      grouped[cid].appointments.push(appt);
    });

    return Object.values(grouped).sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'es'));
  }, [upcomingAppointments]);

  const patientHistoryGroups = useMemo<PatientHistoryGroup[]>(() => {
    const query = patientQuery.trim().toLowerCase();
    const grouped: Record<number, PatientHistoryGroup> = {};

    const formatHistoryName = (h: PatientHistoryRow) =>
      [h.first_name, h.second_name, h.first_last_name, h.second_last_name].filter(Boolean).join(' ').trim();

    const formatApptName = (a: DoctorAppointmentView) =>
      [a.first_name, a.second_name, a.first_last_name, a.second_last_name].filter(Boolean).join(' ').trim();

    const ensureGroup = (patientId: number, name: string) => {
      if (!grouped[patientId]) {
        grouped[patientId] = {
          patientId,
          patientName: name || `Paciente #${patientId}`,
          clinics: [],
          records: [],
          prescriptions: [],
        };
      }
      return grouped[patientId];
    };

    patientHistories.forEach((h) => {
      const name = formatHistoryName(h);
      const group = ensureGroup(h.user_id, name);

      if (!group.clinics.some((c) => c.clinicId === h.clinic_id)) {
        group.clinics.push({
          clinicId: h.clinic_id,
          clinicName: h.clinic_name || `Clínica ${h.clinic_id}`,
        });
      }

      const displayDate = new Date(h.appointment_date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      group.records.push({
        appointmentDate: h.appointment_date,
        displayDate: isNaN(new Date(h.appointment_date).getTime()) ? h.appointment_date : displayDate,
        description: h.appointment_description,
        clinicId: h.clinic_id,
        clinicName: h.clinic_name,
      });
    });

    prescriptions.forEach((p) => {
      const group = ensureGroup(p.patient_id, grouped[p.patient_id]?.patientName || `Paciente #${p.patient_id}`);

      if (p.clinic_id && !group.clinics.some((c) => c.clinicId === p.clinic_id)) {
        group.clinics.push({
          clinicId: p.clinic_id,
          clinicName: `Clínica ${p.clinic_id}`,
        });
      }

      const displayDate = new Date(p.date_emitted).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      group.prescriptions.push({
        prescriptionId: p.prescription_id,
        date: p.date_emitted,
        displayDate: isNaN(new Date(p.date_emitted).getTime()) ? p.date_emitted : displayDate,
        description: p.prescription_description,
        clinicId: p.clinic_id,
      });
    });

    let result = Object.values(grouped).map((group) => ({
      ...group,
      clinics: group.clinics.sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'es')),
      records: [...group.records].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ),
      prescriptions: [...group.prescriptions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));

    if (query) {
      result = result.filter((g) => g.patientName.toLowerCase().includes(query));
    }

    return result.sort((a, b) => a.patientName.localeCompare(b.patientName, 'es'));
  }, [patientHistories, prescriptions, appointments, patientQuery]);

  const stats = useMemo(
    () => ({
      totalUpcoming: upcomingAppointments.length,
      totalPatients: patientHistoryGroups.length,
    }),
    [upcomingAppointments, patientHistoryGroups]
  );

  const handleOpenCreateModal = (patient: PatientHistoryGroup) => {
    const matchingClinics = doctorClinics.filter((dc) =>
      patient.clinics.some((pc) => pc.clinicId === dc.clinicId)
    );
    const selectableClinics =
      matchingClinics.length > 0
        ? matchingClinics
        : doctorClinics.length > 0
        ? doctorClinics
        : patient.clinics.length > 0
        ? patient.clinics
        : [{ clinicId: 1, clinicName: 'Clínica Principal' }];

    setTargetPatient({
      patientId: patient.patientId,
      patientName: patient.patientName,
      clinics: selectableClinics,
    });
    setSelectedClinicId(selectableClinics[0]?.clinicId || 1);
    setPrescriptionText('');
    setCreateModalVisible(true);
  };

  const handleSavePrescription = async () => {
    if (!targetPatient || !selectedClinicId || !prescriptionText.trim()) {
      Alert.alert('Campos incompletos', 'Por favor ingresa la descripción de la fórmula y selecciona una clínica.');
      return;
    }

    setSavingPrescription(true);
    try {
      await prescriptionsApi.assignPrescription({
        patient_id: targetPatient.patientId,
        clinic_id: selectedClinicId,
        prescription_description: prescriptionText.trim(),
      });
      Alert.alert('Éxito', 'Fórmula médica asignada correctamente.');
      setCreateModalVisible(false);
      setPrescriptionText('');
      await loadDashboardData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear la receta médica.');
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleOpenEditModal = (prescriptionId?: number, currentText?: string) => {
    if (!prescriptionId) {
      Alert.alert('Aviso', 'No se puede editar esta fórmula porque no tiene un ID asociado.');
      return;
    }
    setEditingPrescriptionId(prescriptionId);
    setEditPrescriptionText(currentText || '');
    setEditModalVisible(true);
  };

  const handleSaveEditPrescription = async () => {
    if (!editingPrescriptionId || !editPrescriptionText.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el contenido de la fórmula médica.');
      return;
    }

    setUpdatingPrescription(true);
    try {
      await prescriptionsApi.updatePrescription(editingPrescriptionId, {
        prescription_description: editPrescriptionText.trim(),
      });
      Alert.alert('Éxito', 'Fórmula médica actualizada correctamente.');
      setEditModalVisible(false);
      await loadDashboardData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo actualizar la fórmula médica.');
    } finally {
      setUpdatingPrescription(false);
    }
  };

  const handleDeletePrescription = (prescriptionId?: number) => {
    if (!prescriptionId) {
      Alert.alert('Aviso', 'No se puede eliminar esta fórmula porque no tiene un ID asociado.');
      return;
    }

    Alert.alert(
      'Eliminar Fórmula',
      '¿Estás seguro de que deseas eliminar esta fórmula médica? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await prescriptionsApi.deletePrescription(prescriptionId);
              Alert.alert('Eliminada', 'La fórmula médica ha sido eliminada.');
              await loadDashboardData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar la fórmula médica.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="bg-gray-50"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboardData} tintColor="#259487" />}
      >
        <View className="flex-row justify-between items-center mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <View className="flex-1">
            <Text className="text-xs font-bold text-primary uppercase tracking-wide">Panel Médico</Text>
            <Text className="text-xl font-extrabold text-neutral-900 mt-0.5">
              Bienvenido, Dr(a). {user?.first_name || 'Médico'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={loadDashboardData}
            activeOpacity={0.7}
            className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full flex-row items-center"
          >
            <Text className="text-primary font-bold text-xs">🔄 Recargar</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Rango de Tiempo</Text>
          <Text className="text-base font-bold text-neutral-900 mb-2">Filtra tus próximas citas</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setRangeDays(7)}
              activeOpacity={0.7}
              className={`flex-1 py-2 rounded-lg items-center border ${
                rangeDays === 7 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${rangeDays === 7 ? 'text-white' : 'text-gray-700'}`}>
                7 Días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRangeDays(14)}
              activeOpacity={0.7}
              className={`flex-1 py-2 rounded-lg items-center border ${
                rangeDays === 14 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${rangeDays === 14 ? 'text-white' : 'text-gray-700'}`}>
                14 Días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRangeDays(30)}
              activeOpacity={0.7}
              className={`flex-1 py-2 rounded-lg items-center border ${
                rangeDays === 30 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${rangeDays === 30 ? 'text-white' : 'text-gray-700'}`}>
                30 Días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRangeDays(0)}
              activeOpacity={0.7}
              className={`flex-1 py-2 rounded-lg items-center border ${
                rangeDays === 0 ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`text-xs font-bold ${rangeDays === 0 ? 'text-white' : 'text-gray-700'}`}>
                Todas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-row items-center">
            <Text className="text-3xl mr-3">📅</Text>
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase">Citas en rango</Text>
              <Text className="text-2xl font-black text-neutral-900">{stats.totalUpcoming}</Text>
            </View>
          </View>

          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-row items-center">
            <Text className="text-3xl mr-3">👥</Text>
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase">Pacientes</Text>
              <Text className="text-2xl font-black text-neutral-900">{stats.totalPatients}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-lg mr-2">🏥</Text>
            <Text className="text-base font-bold text-neutral-900">Próximas Citas por Clínica</Text>
          </View>

          {loading && appointmentsByClinic.length === 0 ? (
            <Card className="p-5 items-center justify-center">
              <ActivityIndicator size="small" color="#259487" />
              <Text className="text-xs text-gray-500 mt-2">Cargando citas...</Text>
            </Card>
          ) : appointmentsByClinic.length === 0 ? (
            <Card className="p-5 items-center justify-center">
              <Text className="text-xs text-gray-500">No hay citas en el rango de fechas seleccionado.</Text>
            </Card>
          ) : (
            appointmentsByClinic.map((clinic) => (
              <Card key={clinic.clinicId} className="mb-3 p-0 overflow-hidden">
                <View className="bg-teal-50 border-b border-teal-100 p-3 flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">🏢</Text>
                    <Text className="font-bold text-sm text-neutral-900">{clinic.clinicName}</Text>
                  </View>
                  <Badge text={`${clinic.appointments.length} cita(s)`} variant="primary" />
                </View>

                <View className="p-3">
                  {clinic.appointments.map((appt) => {
                    const startStr = new Date(appt.start_date_time).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const pName = [appt.first_name, appt.second_name, appt.first_last_name, appt.second_last_name]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <View
                        key={appt.appointment_id}
                        className="py-2.5 border-b border-gray-100 last:border-b-0 flex-row items-start"
                      >
                        <Text className="text-lg mr-2.5 mt-0.5">👤</Text>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-neutral-900">{pName || 'Paciente'}</Text>
                          <Text className="text-xs text-primary font-medium mt-0.5">🕒 {startStr}</Text>
                          {appt.appointment_description && (
                            <Text className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                              Nota: {appt.appointment_description}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ))
          )}
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">📋</Text>
              <Text className="text-base font-bold text-neutral-900">Historial y Fórmulas Médicas</Text>
            </View>
          </View>

          <View className="mb-3">
            <TextInput
              placeholder="🔍 Buscar por nombre de paciente..."
              value={patientQuery}
              onChangeText={setPatientQuery}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {loading && patientHistoryGroups.length === 0 ? (
            <Card className="p-5 items-center justify-center">
              <ActivityIndicator size="small" color="#259487" />
              <Text className="text-xs text-gray-500 mt-2">Cargando pacientes e historial...</Text>
            </Card>
          ) : patientHistoryGroups.length === 0 ? (
            <Card className="p-5 items-center justify-center">
              <Text className="text-xs text-gray-500">No se encontraron pacientes con ese nombre o historial.</Text>
            </Card>
          ) : (
            patientHistoryGroups.map((group) => (
              <Card key={group.patientId} className="mb-4 p-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-neutral-900">{group.patientName}</Text>
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {group.clinics.map((c) => (
                        <View key={c.clinicId} className="bg-gray-100 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] text-gray-700">{c.clinicName}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleOpenCreateModal(group)}
                    activeOpacity={0.7}
                    className="bg-primary px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <Text className="text-white text-xs font-bold">+ Asignar Receta</Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-2 border-t border-gray-100 pt-3">
                  <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                    Fórmulas Médicas ({group.prescriptions.length})
                  </Text>
                  {group.prescriptions.length === 0 ? (
                    <Text className="text-xs text-gray-400 italic mb-2">Sin recetas registradas para este paciente.</Text>
                  ) : (
                    group.prescriptions.map((pres, idx) => (
                      <View
                        key={pres.prescriptionId ? `pres-${pres.prescriptionId}` : `pres-idx-${idx}`}
                        className="bg-teal-50/50 border border-teal-100 rounded-lg p-3 mb-2"
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="text-xs font-bold text-teal-800">🗓️ {pres.displayDate}</Text>
                          <View className="flex-row gap-2">
                            {pres.prescriptionId && (
                              <>
                                <TouchableOpacity
                                  onPress={() => handleOpenEditModal(pres.prescriptionId, pres.description)}
                                  activeOpacity={0.7}
                                  className="bg-white border border-gray-200 px-2 py-1 rounded"
                                >
                                  <Text className="text-[11px] font-semibold text-primary">✏️ Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleDeletePrescription(pres.prescriptionId)}
                                  activeOpacity={0.7}
                                  className="bg-white border border-red-200 px-2 py-1 rounded"
                                >
                                  <Text className="text-[11px] font-semibold text-red-600">🗑️ Eliminar</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                        <Text className="text-xs text-gray-800 leading-relaxed font-medium mt-1">
                          {pres.description}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                {group.records.length > 0 && (
                  <View className="mt-2 border-t border-gray-100 pt-3">
                    <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Historial de Citas ({group.records.length})
                    </Text>
                    {group.records.slice(0, 3).map((rec, rIdx) => (
                      <View key={rIdx} className="py-1 flex-row items-center justify-between">
                        <Text className="text-xs text-gray-600 font-medium">📅 {rec.displayDate}</Text>
                        <Text className="text-[11px] text-gray-500">{rec.clinicName}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={createModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <View>
                <Text className="text-xs font-bold text-primary uppercase">Nueva Fórmula Médica</Text>
                <Text className="text-lg font-bold text-neutral-900">{targetPatient?.patientName}</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} className="p-1">
                <Text className="text-gray-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text className="text-xs font-bold text-neutral-900 mb-1.5">Clínica</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {targetPatient?.clinics.map((c) => (
                  <TouchableOpacity
                    key={c.clinicId}
                    onPress={() => setSelectedClinicId(c.clinicId)}
                    className={`px-3 py-2 rounded-lg border ${
                      selectedClinicId === c.clinicId
                        ? 'bg-primary border-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedClinicId === c.clinicId ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {c.clinicName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-neutral-900 mb-1.5">
                Descripción / Indicaciones de la Receta
              </Text>
              <TextInput
                multiline
                numberOfLines={5}
                placeholder="Escribe los medicamentos, dosis e indicaciones para el paciente..."
                value={prescriptionText}
                onChangeText={setPrescriptionText}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-neutral-900 mb-5 min-h-[120px]"
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />

              <View className="flex-row gap-3">
                <Button
                  text="Cancelar"
                  variant="outline"
                  onPress={() => setCreateModalVisible(false)}
                  className="flex-1"
                />
                <Button
                  text={savingPrescription ? 'Guardando...' : 'Asignar Receta'}
                  onPress={handleSavePrescription}
                  loading={savingPrescription}
                  disabled={savingPrescription || !prescriptionText.trim()}
                  className="flex-1"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <View>
                <Text className="text-xs font-bold text-primary uppercase">Editar Fórmula Médica</Text>
                <Text className="text-base font-bold text-neutral-900">ID #{editingPrescriptionId}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-1">
                <Text className="text-gray-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text className="text-xs font-bold text-neutral-900 mb-1.5">
                Descripción / Indicaciones
              </Text>
              <TextInput
                multiline
                numberOfLines={5}
                placeholder="Modifica los medicamentos, dosis e indicaciones..."
                value={editPrescriptionText}
                onChangeText={setEditPrescriptionText}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-neutral-900 mb-5 min-h-[120px]"
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />

              <View className="flex-row gap-3">
                <Button
                  text="Cancelar"
                  variant="outline"
                  onPress={() => setEditModalVisible(false)}
                  className="flex-1"
                />
                <Button
                  text={updatingPrescription ? 'Actualizando...' : 'Guardar Cambios'}
                  onPress={handleSaveEditPrescription}
                  loading={updatingPrescription}
                  disabled={updatingPrescription || !editPrescriptionText.trim()}
                  className="flex-1"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NavBar active="doctor" />
    </SafeAreaView>
  );
}
