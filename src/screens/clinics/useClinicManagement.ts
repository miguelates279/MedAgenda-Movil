import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import adminApi from '../../api/admin';
import apiClient from '../../api/client';
import clinicsApi from '../../api/clinics';
import type {
  ClinicManagement,
  ClinicMember,
  Specialty,
  UpdateClinicMemberDto,
  UpdateClinicOwnerProviderDto,
} from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useFocusedRefresh } from '../../hooks/useFocusedRefresh';
import { appAlerts } from '../../utils/appAlerts';
import {
  canManageClinicMember,
  clinicChanges,
  clinicEditorValues,
  clinicMemberEmail,
  clinicMemberName,
  newClinicValues,
} from './clinicManagement';
import type { ClinicEditorValues } from './clinicManagement';

export function useClinicManagement() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);
  const { isAuthenticated, activeMode, user, adminClinics, refreshRoleAccess } =
    useAuth();
  const session = apiClient.getSessionId();
  const scope = `${session}:${clinicId}:${activeMode}`;
  const liveScope = useRef(scope);
  liveScope.current = scope;
  const active = useRef(false);
  const generation = useRef(0);
  const busy = useRef(false);
  const [clinic, setClinic] = useState<ClinicManagement | null>(null);
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ClinicMember | null>(
    null,
  );
  const form = useForm<ClinicEditorValues>({
    defaultValues: newClinicValues(),
  });
  const dirty = useRef(false);
  dirty.current = form.formState.isDirty;
  const editingBase = useRef<ClinicManagement | null>(null);
  const loadedScope = useRef<string | null>(null);
  const current = useCallback(
    () =>
      active.current &&
      liveScope.current === scope &&
      apiClient.getSessionId() === session,
    [scope, session],
  );

  const load = useCallback(
    async (quiet = false, resetEditor = false) => {
      if (!current() || !isAuthenticated || activeMode !== 'admin') return;
      if (!Number.isInteger(clinicId) || clinicId <= 0) {
        setError('No se pudo identificar la clínica.');
        setLoading(false);
        return;
      }
      const revision = ++generation.current;
      const valid = () => current() && revision === generation.current;
      if (!quiet) setLoading(true);
      try {
        const [details, people, options] = await Promise.all([
          clinicsApi.getManagement(clinicId),
          adminApi.getClinicMembers(clinicId),
          clinicsApi.getAllSpecialties(),
        ]);
        if (!valid()) return;
        if (
          details.clinic_id !== clinicId ||
          !['Owner', 'Admin'].includes(details.role_within_clinic)
        )
          throw new Error('No se pudo comprobar el acceso a esta clínica.');
        loadedScope.current = scope;
        setClinic(details);
        setMembers(people);
        setSpecialties(options);
        if (resetEditor || !dirty.current) {
          editingBase.current = details;
          form.reset(clinicEditorValues(details));
        }
        if (!quiet) setError(null);
      } catch (cause: any) {
        if (valid()) {
          setError(
            cause?.message ||
              'No se pudo cargar la administración de esta clínica.',
          );
          loadedScope.current = null;
          setClinic(null);
          setMembers([]);
        }
      } finally {
        if (valid()) setLoading(false);
      }
    },
    [current, isAuthenticated, activeMode, clinicId, form.reset, scope],
  );

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      busy.current = false;
      setSaving(false);
      setClinic(null);
      setMembers([]);
      setSelectedMember(null);
      setFeedback(null);
      setError(null);
      editingBase.current = null;
      loadedScope.current = null;
      form.reset(newClinicValues());
      void load();
      return () => {
        active.current = false;
        ++generation.current;
      };
    }, [load, scope, form.reset]),
  );
  useFocusedRefresh(
    () => (busy.current ? Promise.resolve() : load(true)),
    !!clinic && !saving,
  );

  const mutate = async (
    command: () => Promise<unknown>,
    success: string,
    resetEditor = false,
    clearMember = false,
  ) => {
    if (!current() || loadedScope.current !== scope || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await command();
      if (!current()) return;
      setFeedback(success);
      appAlerts.alert('Cambios guardados', success, undefined, {
        variant: 'success',
      });
      if (clearMember) setSelectedMember(null);
      await load(true, resetEditor);
      if (current()) {
        try {
          await refreshRoleAccess();
        } catch {
          if (current())
            setError(
              'El cambio se guardó, pero falta actualizar los permisos. Actualiza la pantalla; no repitas la operación.',
            );
        }
      }
    } catch (cause: any) {
      if (current()) {
        const message = cause?.message || 'No se pudo guardar el cambio.';
        setError(message);
        appAlerts.alert('No se pudo guardar el cambio', message, undefined, {
          variant: 'error',
        });
      }
    } finally {
      if (current()) {
        busy.current = false;
        setSaving(false);
      }
    }
  };

  const saveClinic = (values: ClinicEditorValues) => {
    if (
      !clinic ||
      clinic.clinic_id !== clinicId ||
      !current() ||
      loadedScope.current !== scope ||
      busy.current
    )
      return;
    try {
      const changes = clinicChanges(values, editingBase.current);
      if (!Object.keys(changes).length) {
        setFeedback('No hay cambios pendientes.');
        return;
      }
      appAlerts.alert(
        'Guardar clínica',
        `¿Deseas guardar los datos y horarios de ${clinic.clinic_name}? Las citas existentes conservan su horario y duración.`,
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: 'Guardar',
            onPress: () =>
              mutate(
                () => clinicsApi.updateClinic(clinicId, changes),
                'Los datos y horarios de la clínica se guardaron.',
                true,
              ),
          },
        ],
        { variant: 'primary' },
      );
    } catch (cause: any) {
      const message = cause?.message || 'Revisa los datos de la clínica.';
      setError(message);
      appAlerts.alert('Revisa los datos de la clínica', message, undefined, {
        variant: 'warning',
      });
    }
  };

  const findMember = async (email: string) => {
    if (!current() || loadedScope.current !== scope || busy.current) return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Escribe el correo completo de la cuenta.');
      return;
    }
    busy.current = true;
    setSaving(true);
    setError(null);
    setFeedback(null);
    setSelectedMember(null);
    try {
      const result = await adminApi.findUser(clinicId, value);
      if (current()) setSelectedMember(result);
    } catch (cause: any) {
      if (current()) {
        const message = cause?.message || 'No se encontró la cuenta.';
        setError(message);
        appAlerts.alert('No se encontró la cuenta', message, undefined, {
          variant: 'error',
        });
      }
    } finally {
      if (current()) {
        busy.current = false;
        setSaving(false);
      }
    }
  };

  const saveMember = (
    member: ClinicMember,
    data: Omit<UpdateClinicMemberDto, 'clinic_id' | 'email'>,
  ) => {
    if (
      !clinic ||
      clinic.clinic_id !== clinicId ||
      loadedScope.current !== scope ||
      !current() ||
      busy.current ||
      !canManageClinicMember(
        clinic.role_within_clinic,
        user?.user_id ?? 0,
        member,
      )
    )
      return;
    if (data.isAdmin && clinic.role_within_clinic !== 'Owner') {
      setError('Solo el propietario puede asignar administradores.');
      return;
    }
    if (
      data.isDoctor &&
      !clinic.specialty_ids.includes(data.specialty_id ?? 0)
    ) {
      setError('Selecciona una especialidad ofrecida por esta clínica.');
      return;
    }
    const email = clinicMemberEmail(member);
    appAlerts.alert(
      member.is_member ? 'Cambiar miembro' : 'Agregar miembro',
      `¿Deseas guardar los permisos de ${clinicMemberName(member)} (${email}) en ${clinic.clinic_name}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Guardar miembro',
          onPress: () =>
            mutate(
              () =>
                adminApi.saveMember({ ...data, clinic_id: clinicId, email }),
              'El equipo de la clínica se actualizó.',
              false,
              true,
            ),
        },
      ],
      { variant: 'primary' },
    );
  };

  const removeMember = (member: ClinicMember) => {
    if (
      !clinic ||
      clinic.clinic_id !== clinicId ||
      loadedScope.current !== scope ||
      !current() ||
      busy.current ||
      !canManageClinicMember(
        clinic.role_within_clinic,
        user?.user_id ?? 0,
        member,
      )
    )
      return;
    appAlerts.alert(
      'Retirar miembro',
      `¿Deseas retirar a ${clinicMemberName(member)} de ${clinic.clinic_name}? Su cuenta y sus otras membresías se conservan. Si tiene citas pendientes, primero debes gestionarlas en la agenda.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Retirar de la clínica',
          style: 'destructive',
          onPress: () =>
            mutate(
              () => adminApi.removeMember(clinicId, member.user_id),
              'El miembro fue retirado de esta clínica.',
              false,
              true,
            ),
        },
      ],
      { variant: 'warning' },
    );
  };

  const selectClinic = (nextId: number) => {
    if (busy.current || nextId === clinicId) return;
    const navigate = () => {
      if (current()) router.replace(`/clinics/manage/${nextId}` as any);
    };
    if (form.formState.isDirty)
      appAlerts.alert(
        'Cambiar de clínica',
        'Hay cambios sin guardar en este formulario. ¿Deseas descartarlos y abrir la otra clínica?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar y cambiar',
            style: 'destructive',
            onPress: navigate,
          },
        ],
        { variant: 'warning' },
      );
    else navigate();
  };

  const saveOwnerProvider = (data: UpdateClinicOwnerProviderDto) => {
    if (
      !clinic ||
      clinic.clinic_id !== clinicId ||
      clinic.role_within_clinic !== 'Owner' ||
      !current() ||
      loadedScope.current !== scope ||
      busy.current
    )
      return;
    if (
      data.isDoctor &&
      !clinic.specialty_ids.includes(data.specialty_id ?? 0)
    ) {
      const message = 'Selecciona una especialidad ofrecida por esta clínica.';
      setError(message);
      appAlerts.alert('Configura tu atención', message, undefined, {
        variant: 'warning',
      });
      return;
    }
    appAlerts.alert(
      'Configurar mi atención',
      `${data.isDoctor ? '¿Deseas atender consultas' : '¿Deseas dejar de atender consultas'} en ${clinic.clinic_name}? Tus permisos de propietario se conservan.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Guardar mi atención',
          onPress: () =>
            mutate(
              () =>
                clinicsApi.updateOwnerProvider(clinicId, {
                  isDoctor: data.isDoctor,
                  ...(data.isDoctor ? { specialty_id: data.specialty_id } : {}),
                }),
              'Tu atención en esta clínica se actualizó.',
            ),
        },
      ],
      { variant: 'primary' },
    );
  };

  return {
    router,
    clinicId,
    isAuthenticated,
    activeMode,
    actorId: user?.user_id ?? 0,
    adminClinics,
    clinic: loadedScope.current === scope ? clinic : null,
    members,
    specialties,
    form,
    loading,
    saving,
    error,
    feedback,
    selectedMember,
    setSelectedMember: (member: ClinicMember | null) => {
      if (current() && loadedScope.current === scope && !busy.current)
        setSelectedMember(member);
    },
    load,
    saveClinic,
    findMember,
    saveMember,
    removeMember,
    selectClinic,
    saveOwnerProvider,
  };
}
