import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import type {
  ClinicManagement,
  ClinicMember,
  Specialty,
  UpdateClinicMemberDto,
  UpdateClinicOwnerProviderDto,
} from '../../../api/types';
import {
  Badge,
  Button,
  Card,
  ClayPressable,
  Field,
  SelectModal,
} from '../../../components';
import {
  canManageClinicMember,
  clinicMemberEmail,
  clinicMemberName,
  clinicRoleLabel,
} from '../clinicManagement';
import { ClinicOwnerProvider } from './ClinicOwnerProvider';

interface Props {
  clinic: ClinicManagement;
  actorId: number;
  members: ClinicMember[];
  specialties: Specialty[];
  selected: ClinicMember | null;
  saving: boolean;
  onSelect: (member: ClinicMember | null) => void;
  onSearch: (email: string) => Promise<void>;
  onSave: (
    member: ClinicMember,
    dto: Omit<UpdateClinicMemberDto, 'clinic_id' | 'email'>,
  ) => void;
  onRemove: (member: ClinicMember) => void;
  onSaveOwner: (data: UpdateClinicOwnerProviderDto) => void;
}

export function ClinicTeam({
  clinic,
  actorId,
  members,
  specialties,
  selected,
  saving,
  onSelect,
  onSearch,
  onSave,
  onRemove,
  onSaveOwner,
}: Props) {
  const search = useForm<{ email: string }>({ defaultValues: { email: '' } });
  const [role, setRole] = useState<'Admin' | 'Doctor' | 'Employee'>('Employee');
  const [adminDoctor, setAdminDoctor] = useState(false);
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    setRole(
      selected?.role_within_clinic === 'Admin'
        ? 'Admin'
        : selected?.role_within_clinic === 'Doctor'
          ? 'Doctor'
          : 'Employee',
    );
    setAdminDoctor(!!selected?.isDoctor);
    const saved =
      selected?.specialties?.[0]?.specialty_id ??
      selected?.specialty_id ??
      null;
    setSpecialtyId(
      saved && clinic.specialty_ids.includes(saved) ? saved : null,
    );
    setModalOpen(false);
  }, [selected, clinic.clinic_id]);
  const canEdit =
    !!selected &&
    canManageClinicMember(clinic.role_within_clinic, actorId, selected);
  const isDoctor = role === 'Doctor' || (role === 'Admin' && adminDoctor);
  const availableSpecialties = specialties.filter((item) =>
    clinic.specialty_ids.includes(item.specialty_id),
  );
  const roles: ('Admin' | 'Doctor' | 'Employee')[] =
    clinic.role_within_clinic === 'Owner'
      ? ['Employee', 'Doctor', 'Admin']
      : ['Employee', 'Doctor'];
  const owner =
    clinic.role_within_clinic === 'Owner'
      ? members.find(
          (member) =>
            member.user_id === actorId && member.role_within_clinic === 'Owner',
        )
      : null;
  return (
    <>
      {owner && (
        <ClinicOwnerProvider
          key={`${clinic.clinic_id}:${owner.user_id}`}
          owner={owner}
          specialties={availableSpecialties}
          saving={saving}
          onSave={onSaveOwner}
        />
      )}
      <Card className="mb-4">
        <Text className="text-base font-bold text-med-text-main mb-2">
          Buscar una cuenta
        </Text>
        <Text className="text-xs text-med-text-muted mb-3">
          Escribe el correo completo de una cuenta registrada para agregarla o
          revisar su membresía en {clinic.clinic_name}.
        </Text>
        <Field
          control={search.control}
          name="email"
          label="Correo del miembro"
          placeholder="persona@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          rules={{
            required: 'Escribe el correo completo.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Escribe un correo válido.',
            },
          }}
        />
        <Button
          text="Buscar cuenta por correo"
          variant="secondary"
          loading={saving}
          disabled={saving}
          onPress={search.handleSubmit((data) => onSearch(data.email))}
        />
      </Card>
      {selected && (
        <Card className="mb-4 border-med-primary-border bg-med-primary-surface">
          <Text className="text-base font-bold text-med-text-main">
            {clinicMemberName(selected)}
          </Text>
          <Text className="text-sm text-med-text-muted mt-1">
            {clinicMemberEmail(selected)}
          </Text>
          <View className="mt-2 mb-3">
            <Badge
              text={
                selected.is_member
                  ? clinicRoleLabel(selected.role_within_clinic)
                  : 'Sin membresía en esta clínica'
              }
              variant="info"
            />
          </View>
          {canEdit ? (
            <>
              <Text className="text-sm font-bold text-med-text-main mb-2">
                Rol en esta clínica
              </Text>
              <View className="gap-2 mb-3">
                {roles.map((option) => (
                  <ClayPressable
                    key={option}
                    onPress={() => setRole(option)}
                    disabled={saving}
                    accessibilityRole="radio"
                    accessibilityLabel={`Asignar rol ${clinicRoleLabel(option)}`}
                    accessibilityState={{
                      checked: role === option,
                      disabled: saving,
                    }}
                    className={`min-h-touch max-w-full rounded-control border p-3 ${role === option ? 'bg-med-primary-surface border-med-primary' : 'bg-med-bg border-med-border'}`}
                  >
                    <Text className="text-sm text-med-text-main">
                      {clinicRoleLabel(option)}
                    </Text>
                  </ClayPressable>
                ))}
              </View>
              {role === 'Admin' && (
                <ClayPressable
                  onPress={() => setAdminDoctor((value) => !value)}
                  disabled={saving}
                  accessibilityRole="checkbox"
                  accessibilityLabel="El administrador también atiende consultas"
                  accessibilityState={{
                    checked: adminDoctor,
                    disabled: saving,
                  }}
                  className="min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3 mb-3"
                >
                  <Text className="text-sm text-med-text-main">
                    {adminDoctor ? '✓ ' : ''}El administrador también atiende
                    consultas
                  </Text>
                </ClayPressable>
              )}
              {isDoctor && (
                <>
                  <ClayPressable
                    onPress={() => setModalOpen(true)}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar especialidad del médico"
                    className="min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3 mb-3"
                  >
                    <Text className="text-xs font-semibold text-med-text-muted">
                      Especialidad en esta clínica *
                    </Text>
                    <Text className="text-sm text-med-text-main mt-1">
                      {availableSpecialties.find(
                        (item) => item.specialty_id === specialtyId,
                      )?.specialty_name || 'Selecciona una especialidad'}
                    </Text>
                  </ClayPressable>
                  {!availableSpecialties.length && (
                    <Text className="text-xs text-med-warning-text mb-3">
                      Guarda primero las especialidades ofrecidas en Datos y
                      horarios para poder asignar médicos.
                    </Text>
                  )}
                </>
              )}
              <Button
                text={
                  selected.is_member
                    ? 'Guardar permisos del miembro'
                    : 'Agregar a esta clínica'
                }
                loading={saving}
                disabled={saving || (isDoctor && !specialtyId)}
                onPress={() =>
                  onSave(selected, {
                    isAdmin: role === 'Admin',
                    isDoctor,
                    ...(isDoctor && specialtyId
                      ? { specialty_id: specialtyId }
                      : {}),
                  })
                }
              />
              {selected.is_member && (
                <Button
                  text="Retirar de esta clínica"
                  variant="danger"
                  disabled={saving}
                  onPress={() => onRemove(selected)}
                  className="mt-3"
                />
              )}
            </>
          ) : (
            <Text className="text-xs text-med-text-muted">
              La propiedad, tu propia membresía y los administradores de igual
              nivel están protegidos.
            </Text>
          )}
          <Button
            text="Cerrar edición del miembro"
            variant="outline"
            onPress={() => onSelect(null)}
            disabled={saving}
            className="mt-3"
          />
        </Card>
      )}
      <Text className="text-base font-bold text-med-text-main mb-3">
        Equipo de la clínica ({members.length})
      </Text>
      <Text className="text-xs text-med-text-muted mb-3">
        Para retirar o cambiar a un médico con citas pendientes, primero
        gestiona esas citas desde la agenda. Las otras clínicas del miembro
        conservan sus permisos y especialidades.
      </Text>
      {members.map((member) => (
        <Card key={member.user_id} className="mb-3">
          <Text className="text-sm font-bold text-med-text-main">
            {clinicMemberName(member)}
          </Text>
          <Text className="text-xs text-med-text-muted mt-1">
            {clinicMemberEmail(member)}
          </Text>
          <View className="mt-2">
            <Badge
              text={clinicRoleLabel(member.role_within_clinic)}
              variant={
                member.role_within_clinic === 'Owner' ? 'primary' : 'neutral'
              }
            />
          </View>
          {!!member.specialties?.length && (
            <Text className="text-xs text-med-text-muted mt-2">
              {member.specialties.map((item) => item.specialty_name).join(', ')}
            </Text>
          )}
          {canManageClinicMember(
            clinic.role_within_clinic,
            actorId,
            member,
          ) && (
            <Button
              text={`Gestionar a ${member.first_name}`}
              variant="secondary"
              onPress={() => onSelect(member)}
              disabled={saving}
              className="mt-3"
            />
          )}
        </Card>
      ))}
      {!members.length && (
        <Text className="text-sm text-med-text-muted mb-4">
          No hay miembros para mostrar.
        </Text>
      )}
      <SelectModal
        title="Especialidad del médico"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        items={availableSpecialties.map((item) => ({
          value: item.specialty_id,
          label: item.specialty_name,
        }))}
        selectedValue={specialtyId}
        onSelect={(value) => {
          if (!saving) setSpecialtyId(Number(value));
        }}
      />
    </>
  );
}
