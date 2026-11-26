import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  ClayPressable,
  KeyboardAwareScrollView,
  ScreenHeader,
  SelectModal,
} from '../../components';
import { tokens } from '../../theme/tokens';
import { useClinicManagement } from './useClinicManagement';
import { ClinicEditorFields } from './components/ClinicEditorFields';
import { ClinicTeam } from './components/ClinicTeam';

export function ClinicManagementScreen() {
  const state = useClinicManagement();
  const [section, setSection] = useState<'details' | 'team'>('details');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { clinic, form, loading, saving } = state;
  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title="Gestionar clínica" />
      <KeyboardAwareScrollView
        className="min-w-0 max-w-full flex-1"
        contentContainerClassName="p-4 pb-16"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (!saving) void state.load();
            }}
            tintColor={tokens.colors.primary}
          />
        }
      >
        {!state.isAuthenticated || state.activeMode !== 'admin' ? (
          <Card>
            <Text className="text-sm text-med-text-main mb-3">
              Inicia sesión en modo Administrador para gestionar tus clínicas.
            </Text>
            <Button
              text="Volver al inicio"
              onPress={() => state.router.replace('/' as any)}
            />
          </Card>
        ) : (
          <>
            <ClayPressable
              onPress={() => setSelectorOpen(true)}
              disabled={saving || !state.adminClinics.length}
              accessibilityRole="button"
              accessibilityLabel="Cambiar clínica de administración"
              className="min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3 mb-4"
            >
              <Text className="text-xs text-med-text-muted">
                Clínica seleccionada
              </Text>
              <Text className="text-base font-bold text-med-primary mt-1">
                {clinic?.clinic_name ||
                  state.adminClinics.find(
                    (item) => item.clinic_id === state.clinicId,
                  )?.clinic_name ||
                (loading ? 'Cargando clínica...' : 'Clínica no disponible')}
              </Text>
            </ClayPressable>
            {state.error && (
              <Card className="mb-4 bg-med-error-bg border-med-error-border">
                <Text className="text-sm text-med-error-text mb-3">
                  {state.error}
                </Text>
                <Button
                  text="Actualizar administración"
                  variant="secondary"
                  disabled={saving}
                  onPress={() => void state.load()}
                />
              </Card>
            )}
            {state.feedback && (
              <Card className="mb-4 bg-med-success-bg border-med-success-border">
                <Text className="text-sm text-med-success-text">
                  {state.feedback}
                </Text>
              </Card>
            )}
            {loading && !clinic && (
              <ActivityIndicator
                color={tokens.colors.primary}
                size={tokens.indicator.lg}
              />
            )}
            {clinic && (
              <>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  <Badge
                    text={
                      clinic.role_within_clinic === 'Owner'
                        ? 'Propietario'
                        : 'Administrador'
                    }
                    variant="primary"
                  />
                  <Badge
                    text={clinic.is_open ? 'Abierta' : 'Cerrada'}
                    variant={clinic.is_open ? 'success' : 'neutral'}
                  />
                </View>
                <View className="gap-2 mb-4">
                  {(
                    [
                      { key: 'details', label: 'Datos y horarios' },
                      { key: 'team', label: 'Equipo de la clínica' },
                    ] as const
                  ).map((item) => (
                    <ClayPressable
                      key={item.key}
                      onPress={() => setSection(item.key)}
                      disabled={saving}
                      accessibilityRole="tab"
                      accessibilityLabel={item.label}
                      accessibilityState={{
                        selected: section === item.key,
                        disabled: saving,
                      }}
                      className={`min-h-touch max-w-full rounded-control border p-3 ${section === item.key ? 'bg-med-primary-surface border-med-primary' : 'bg-med-bg border-med-border'}`}
                    >
                      <Text className="text-sm font-semibold text-med-text-main">
                        {item.label}
                      </Text>
                    </ClayPressable>
                  ))}
                </View>
                {section === 'details' ? (
                  <>
                    <ClinicEditorFields
                      form={form}
                      specialties={state.specialties}
                      disabled={saving}
                      initialLocation={clinic}
                    />
                    <Button
                      text="Guardar datos y horarios"
                      onPress={form.handleSubmit(state.saveClinic)}
                      disabled={saving || loading || !form.formState.isDirty}
                      loading={saving}
                    />
                  </>
                ) : (
                  <ClinicTeam
                    key={state.clinicId}
                    clinic={clinic}
                    actorId={state.actorId}
                    members={state.members}
                    specialties={state.specialties}
                    selected={state.selectedMember}
                    saving={saving}
                    onSelect={state.setSelectedMember}
                    onSearch={state.findMember}
                    onSave={state.saveMember}
                    onRemove={state.removeMember}
                    onSaveOwner={state.saveOwnerProvider}
                  />
                )}
              </>
            )}
          </>
        )}
      </KeyboardAwareScrollView>
      <SelectModal
        title="Clínica de administración"
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        selectedValue={state.clinicId}
        items={state.adminClinics.map((item) => ({
          value: item.clinic_id,
          label: `${item.clinic_name} · ${item.role_within_clinic === 'Owner' ? 'Propietario' : 'Administrador'}`,
        }))}
        onSelect={state.selectClinic}
      />
    </View>
  );
}

export default ClinicManagementScreen;
