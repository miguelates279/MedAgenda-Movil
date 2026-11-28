import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { appAlerts } from '../../utils/appAlerts';
import apiClient from '../../api/client';
import { useAppointmentAction } from '../../hooks/useAppointmentAction';
import { usePrescriptionExport } from '../../hooks/usePrescriptionExport';
import { useFocusedRefresh } from '../../hooks/useFocusedRefresh';
import {
  isAppointmentActive,
  appointmentPatientName,
} from '../../utils/appointmentStatus';
import {
  CLINIC_TIME_ZONE,
  formatDateParam,
} from '../../utils/appointmentAvailability';

export function useDoctorDashboard() {
  const router = useRouter();
  const { user, activeMode, isAuthenticated } = useAuth();
  const { pdfPending, requestPdfExport } = usePrescriptionExport();

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(
    null,
  );
  const [patientHistories, setPatientHistories] = useState<PatientHistoryRow[]>(
    [],
  );
  const [prescriptions, setPrescriptions] = useState<PrescriptionDoctorView[]>(
    [],
  );
  const [doctorClinics, setDoctorClinics] = useState<
    { clinicId: number; clinicName: string }[]
  >([]);

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
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<
    number | null
  >(null);
  const [editPrescriptionText, setEditPrescriptionText] = useState('');
  const [updatingPrescription, setUpdatingPrescription] = useState(false);

  // Fecha de referencia local para cálculos de agenda de hoy y filtros por rango
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Refs para control de ciclo de vida, prevención de peticiones duplicadas y soporte de medianoche
  const isFocusedRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const lastFetchDayStringRef = useRef<string>(new Date().toDateString());
  const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dashboardRequest = useRef(0);
  const agendaRequest = useRef(0);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated || activeMode !== 'doctor') {
      return;
    }
    const sessionId = apiClient.getSessionId();
    const request = ++dashboardRequest.current;
    const agendaGeneration = ++agendaRequest.current;
    const current = () =>
      isFocusedRef.current &&
      sessionId === apiClient.getSessionId() &&
      request === dashboardRequest.current;
    const now = new Date();
    setCurrentDate(now);
    lastFetchTimeRef.current = Date.now();
    lastFetchDayStringRef.current = now.toDateString();

    setLoading(true);
    setAppointmentsError(null);
    try {
      let apptsData: DoctorAppointmentView[] = [];
      let apptsErr: string | null = null;
      try {
        apptsData = await doctorsApi.getDoctorAppointments();
      } catch (err: any) {
        apptsErr =
          err?.message || 'No se pudieron cargar las citas del médico.';
      }

      const [historiesData, doctorPrescriptionsData, userClinicsData] =
        await Promise.all([
          doctorsApi.getDoctorPatientHistories().catch(() => []),
          prescriptionsApi.getDoctorPrescriptions().catch(() => []),
          clinicsApi.getUserClinics().catch(() => []),
        ]);

      if (!current()) return;
      if (agendaGeneration === agendaRequest.current) {
        setAppointments(apptsData || []);
        setAppointmentsError(apptsErr);
      }
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
            .map((c) => [c.clinicId, c]),
        ).values(),
      );

      setDoctorClinics(extractedClinics);
    } catch (err: any) {
      if (!current()) return;
      appAlerts.alert(
        'Error',
        err?.message || 'No se pudieron cargar los datos del doctor.',
        undefined,
        { variant: 'error' },
      );
    } finally {
      if (current()) setLoading(false);
    }
  }, [isAuthenticated, activeMode]);

  const refreshAgenda = useCallback(async () => {
    const sessionId = apiClient.getSessionId();
    if (!isAuthenticated || activeMode !== 'doctor' || !isFocusedRef.current)
      return;
    const request = ++agendaRequest.current;
    try {
      const data = await doctorsApi.getDoctorAppointments();
      if (
        isFocusedRef.current &&
        sessionId === apiClient.getSessionId() &&
        request === agendaRequest.current
      ) {
        setAppointments(data || []);
        setCurrentDate(new Date());
        setAppointmentsError(null);
      }
    } catch (cause: any) {
      if (
        isFocusedRef.current &&
        sessionId === apiClient.getSessionId() &&
        request === agendaRequest.current
      )
        setAppointmentsError(
          cause?.message || 'No se pudo actualizar la agenda.',
        );
    }
  }, [isAuthenticated, activeMode]);
  useFocusedRefresh(refreshAgenda, isAuthenticated && activeMode === 'doctor');
  const { pending, requestAction } = useAppointmentAction(async (state) => {
    setAppointments((previous) =>
      previous.map((appointment) =>
        appointment.appointment_id === state.appointment_id
          ? { ...appointment, ...state }
          : appointment,
      ),
    );
    if (state.appointment_status === 'completed') await loadDashboardData();
    else await refreshAgenda();
  });

  /**
   * Programa una única verificación al ocurrir la medianoche local para refrescar la fecha y la agenda
   * cuando la aplicación permanece abierta continuamente en primer plano sin polling recurrente.
   */
  const scheduleMidnightCheck = useCallback(() => {
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current);
      midnightTimerRef.current = null;
    }

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1,
    );
    const msUntilMidnight = Math.max(
      1000,
      nextMidnight.getTime() - now.getTime(),
    );

    midnightTimerRef.current = setTimeout(() => {
      if (isFocusedRef.current && isAuthenticated && activeMode === 'doctor') {
        const rolloverDate = new Date();
        setCurrentDate(rolloverDate);
        loadDashboardData();
        scheduleMidnightCheck();
      }
    }, msUntilMidnight);
  }, [isAuthenticated, activeMode, loadDashboardData]);

  /**
   * Ciclo de vida extendido de la pantalla de Médico (Carryover A):
   * - Recalcula la fecha local y actualiza citas al enfocar la pantalla.
   * - Detecta reactivación desde segundo plano (AppState) y refresca la agenda si el día cambió o expiró el umbral.
   * - Evita peticiones duplicadas entre eventos simultáneos de enfoque y retorno a primer plano.
   * - Limpia temporizadores y suscripciones al desenfocar o desmontar la pantalla.
   */
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      const now = new Date();
      setCurrentDate(now);

      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      const dayChanged = now.toDateString() !== lastFetchDayStringRef.current;

      // Cargar inmediatamente si han pasado más de 2500ms o si cambió el día calendario local
      if (timeSinceLastFetch > 2500 || dayChanged) {
        loadDashboardData();
      }

      scheduleMidnightCheck();

      // Suscripción al ciclo de vida de primer plano (AppState)
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          const resumeDate = new Date();
          setCurrentDate(resumeDate);

          const resumeElapsed = Date.now() - lastFetchTimeRef.current;
          const resumeDayChanged =
            resumeDate.toDateString() !== lastFetchDayStringRef.current;

          // Solo recargar si hubo transición significativa de tiempo o rollover de día local
          if (resumeElapsed > 2500 || resumeDayChanged) {
            loadDashboardData();
          }
          scheduleMidnightCheck();
        }
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

      return () => {
        isFocusedRef.current = false;
        subscription.remove();
        if (midnightTimerRef.current) {
          clearTimeout(midnightTimerRef.current);
          midnightTimerRef.current = null;
        }
      };
    }, [loadDashboardData, scheduleMidnightCheck]),
  );

  const todayFormattedDate = useMemo(() => {
    const formatted = currentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      timeZone: CLINIC_TIME_ZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentDate]);

  const todayAppointments = useMemo(() => {
    const today = formatDateParam(currentDate);

    return (Array.isArray(appointments) ? appointments : [])
      .filter((a) => {
        const start = new Date(a.start_date_time);
        if (isNaN(start.getTime())) return false;
        return (
          formatDateParam(start) === today ||
          a.appointment_status === 'in_progress'
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_date_time).getTime() -
          new Date(b.start_date_time).getTime(),
      );
  }, [appointments, currentDate]);

  const upcomingAppointments = useMemo(() => {
    const now = currentDate;
    const maxDate = new Date(now.getTime());
    maxDate.setDate(maxDate.getDate() + rangeDays);

    return appointments
      .filter((a) => {
        const start = new Date(a.start_date_time);
        if (isNaN(start.getTime()) || !isAppointmentActive(a)) return false;
        if (rangeDays === 0) return start >= now;
        return start >= now && start <= maxDate;
      })
      .sort(
        (a, b) =>
          new Date(a.start_date_time).getTime() -
          new Date(b.start_date_time).getTime(),
      );
  }, [appointments, rangeDays, currentDate]);

  const appointmentsByClinic = useMemo(() => {
    const grouped: Record<
      number,
      {
        clinicId: number;
        clinicName: string;
        appointments: DoctorAppointmentView[];
      }
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

    return Object.values(grouped).sort((a, b) =>
      a.clinicName.localeCompare(b.clinicName, 'es'),
    );
  }, [upcomingAppointments]);

  const patientHistoryGroups = useMemo<PatientHistoryGroup[]>(() => {
    const query = patientQuery.trim().toLowerCase();
    const grouped: Record<number, PatientHistoryGroup> = {};

    const formatHistoryName = (h: PatientHistoryRow) =>
      [h.first_name, h.second_name, h.first_last_name, h.second_last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

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

      const displayDate = new Date(h.appointment_date).toLocaleDateString(
        'es-ES',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );

      group.records.push({
        appointmentDate: h.appointment_date,
        displayDate: isNaN(new Date(h.appointment_date).getTime())
          ? h.appointment_date
          : displayDate,
        description: h.appointment_description,
        clinicId: h.clinic_id,
        clinicName: h.clinic_name,
      });
    });

    prescriptions.forEach((p) => {
      const group = ensureGroup(
        p.patient_id,
        grouped[p.patient_id]?.patientName || `Paciente #${p.patient_id}`,
      );

      if (
        p.clinic_id &&
        !group.clinics.some((c) => c.clinicId === p.clinic_id)
      ) {
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
        displayDate: isNaN(new Date(p.date_emitted).getTime())
          ? p.date_emitted
          : displayDate,
        description: p.prescription_description,
        clinicId: p.clinic_id,
      });
    });

    let result = Object.values(grouped).map((group) => ({
      ...group,
      clinics: group.clinics.sort((a, b) =>
        a.clinicName.localeCompare(b.clinicName, 'es'),
      ),
      records: [...group.records].sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() -
          new Date(a.appointmentDate).getTime(),
      ),
      prescriptions: [...group.prescriptions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }));

    if (query) {
      result = result.filter((g) =>
        g.patientName.toLowerCase().includes(query),
      );
    }

    return result.sort((a, b) =>
      a.patientName.localeCompare(b.patientName, 'es'),
    );
  }, [patientHistories, prescriptions, patientQuery]);

  const targetPatientPrescriptions = useMemo(() => {
    if (!targetPatient) return [];
    return prescriptions
      .filter((p) => p.patient_id === targetPatient.patientId)
      .sort(
        (a, b) =>
          new Date(b.date_emitted).getTime() -
          new Date(a.date_emitted).getTime(),
      )
      .slice(0, 5)
      .map((p) => {
        const date = new Date(p.date_emitted);
        return {
          key: p.prescription_id ?? `${p.date_emitted}-${p.clinic_id}`,
          displayDate: isNaN(date.getTime())
            ? p.date_emitted
            : date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: CLINIC_TIME_ZONE,
              }),
          description: p.prescription_description,
        };
      });
  }, [prescriptions, targetPatient]);

  const stats = useMemo(
    () => ({
      totalUpcoming: upcomingAppointments.length,
      totalPatients: patientHistoryGroups.length,
    }),
    [upcomingAppointments, patientHistoryGroups],
  );

  const handleOpenCreateModal = (patient: PatientHistoryGroup) => {
    const matchingClinics = doctorClinics.filter((dc) =>
      patient.clinics.some((pc) => pc.clinicId === dc.clinicId),
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

  const handlePrescribeAppointment = (appointment: DoctorAppointmentView) => {
    if (
      !appointment.patient_id ||
      !appointment.clinic_id ||
      appointment.appointment_status !== 'in_progress'
    )
      return;
    setTargetPatient({
      patientId: appointment.patient_id,
      patientName: appointmentPatientName(appointment),
      clinics: [
        {
          clinicId: appointment.clinic_id,
          clinicName: appointment.clinic_name,
        },
      ],
    });
    setSelectedClinicId(appointment.clinic_id);
    setPrescriptionText('');
    setCreateModalVisible(true);
  };

  const handleSavePrescription = async () => {
    if (!targetPatient || !selectedClinicId || !prescriptionText.trim()) {
      appAlerts.alert(
        'Campos incompletos',
        'Por favor ingresa la descripción de la fórmula y selecciona una clínica.',
        undefined,
        { variant: 'warning' },
      );
      return;
    }

    setSavingPrescription(true);
    try {
      await prescriptionsApi.assignPrescription({
        patient_id: targetPatient.patientId,
        clinic_id: selectedClinicId,
        prescription_description: prescriptionText.trim(),
      });
      appAlerts.alert(
        'Éxito',
        'Fórmula médica asignada correctamente.',
        undefined,
        {
          variant: 'success',
        },
      );
      setCreateModalVisible(false);
      setPrescriptionText('');
      await loadDashboardData();
    } catch (err: any) {
      appAlerts.alert(
        'Error',
        err?.message || 'No se pudo crear la receta médica.',
        undefined,
        { variant: 'error' },
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleOpenEditModal = (
    prescriptionId?: number,
    currentText?: string,
  ) => {
    if (!prescriptionId) {
      appAlerts.alert(
        'Aviso',
        'No se puede editar esta fórmula porque no tiene un ID asociado.',
        undefined,
        { variant: 'warning' },
      );
      return;
    }
    setEditingPrescriptionId(prescriptionId);
    setEditPrescriptionText(currentText || '');
    setEditModalVisible(true);
  };

  const handleSaveEditPrescription = async () => {
    if (!editingPrescriptionId || !editPrescriptionText.trim()) {
      appAlerts.alert(
        'Campo requerido',
        'Por favor ingresa el contenido de la fórmula médica.',
        undefined,
        { variant: 'warning' },
      );
      return;
    }

    setUpdatingPrescription(true);
    try {
      await prescriptionsApi.updatePrescription(editingPrescriptionId, {
        prescription_description: editPrescriptionText.trim(),
      });
      appAlerts.alert(
        'Éxito',
        'Fórmula médica actualizada correctamente.',
        undefined,
        { variant: 'success' },
      );
      setEditModalVisible(false);
      await loadDashboardData();
    } catch (err: any) {
      appAlerts.alert(
        'Error',
        err?.message || 'No se pudo actualizar la fórmula médica.',
        undefined,
        { variant: 'error' },
      );
    } finally {
      setUpdatingPrescription(false);
    }
  };

  const handleDeletePrescription = (prescriptionId?: number) => {
    if (!prescriptionId) {
      appAlerts.alert(
        'Aviso',
        'No se puede eliminar esta fórmula porque no tiene un ID asociado.',
        undefined,
        { variant: 'warning' },
      );
      return;
    }

    appAlerts.alert(
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
              appAlerts.alert(
                'Eliminada',
                'La fórmula médica ha sido eliminada.',
                undefined,
                { variant: 'success' },
              );
              await loadDashboardData();
            } catch (err: any) {
              appAlerts.alert(
                'Error',
                err?.message || 'No se pudo eliminar la fórmula médica.',
                undefined,
                { variant: 'error' },
              );
            }
          },
        },
      ],
      { variant: 'danger' },
    );
  };

  return {
    user,
    loading,
    appointmentsError,
    todayAppointments,
    todayFormattedDate,
    pending,
    requestAction,
    handlePrescribeAppointment,
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
    targetPatientPrescriptions,
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
    pdfPending,
    requestPdfExport,
  };
}

export default useDoctorDashboard;
