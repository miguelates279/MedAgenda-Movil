import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import clinicsApi from '../../api/clinics';
import doctorsApi from '../../api/doctors';
import prescriptionsApi from '../../api/prescriptions';
import {
  DoctorAppointmentView,
  PatientHistoryGroup,
  PatientHistoryRow,
  PrescriptionDoctorView,
} from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useDoctorDashboard() {
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
  }, [isAuthenticated, roles, router]);

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
  }, [patientHistories, prescriptions, patientQuery]);

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

  return {
    user,
    loading,
    rangeDays,
    setRangeDays,
    patientQuery,
    setPatientQuery,
    stats,
    upcomingAppointments,
    appointmentsByClinic,
    patientHistoryGroups,
    loadDashboardData,
    createModalVisible,
    setCreateModalVisible,
    targetPatient,
    selectedClinicId,
    setSelectedClinicId,
    prescriptionText,
    setPrescriptionText,
    savingPrescription,
    handleOpenCreateModal,
    handleSavePrescription,
    editModalVisible,
    setEditModalVisible,
    editingPrescriptionId,
    editPrescriptionText,
    setEditPrescriptionText,
    updatingPrescription,
    handleOpenEditModal,
    handleSaveEditPrescription,
    handleDeletePrescription,
  };
}
