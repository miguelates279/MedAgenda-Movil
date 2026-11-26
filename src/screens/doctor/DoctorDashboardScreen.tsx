import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../../components/AppModal';
import { Badge, Button, Card } from '../../components';
import { useDoctorDashboard } from './useDoctorDashboard';
import { TodayAgendaSection } from './components/TodayAgendaSection';
import { ModalViewport } from '../../components/ModalViewport';
import { clayClasses } from '../../theme/clay';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';
import { PrescriptionPdfActions } from '../../components/PrescriptionPdfActions';

export function DoctorDashboardScreen() {
  const {
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
    pdfPending,
    requestPdfExport,
  } = useDoctorDashboard();

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <TodayAgendaSection
        todayAppointments={todayAppointments}
        todayFormattedDate={todayFormattedDate}
        loading={loading}
        error={appointmentsError}
        onRetry={() => {
          void loadDashboardData();
        }}
        pending={pending}
        onAction={requestAction}
        onPrescribe={handlePrescribeAppointment}
        header={
          <>
            <ClaySurface className="flex-row flex-wrap gap-3 justify-between items-center mb-5 bg-med-bg p-4 rounded-clay border border-med-border-light">
              <View
                className="grow min-w-header max-w-full"
                style={{ flexBasis: tokens.layout.cardMinWidth }}
              >
                <Text className="text-xs font-bold text-med-primary uppercase tracking-wide">
                  Panel Médico
                </Text>
                <Text className="text-xl font-extrabold text-med-text-main mt-0.5">
                  Bienvenido, Dr(a). {user?.first_name || 'Médico'}
                </Text>
              </View>
              <ClayPressable
                onPress={() => {
                  void loadDashboardData();
                }}
                className="min-h-touch max-w-full bg-med-primary-surface border border-med-primary-border-strong px-3 py-1.5 rounded-full flex-row items-center"
                style={{ minHeight: tokens.layout.touch }}
              >
                <Ionicons
                  name="refresh-outline"
                  size={tokens.iconSize[14]}
                  color={tokens.colors.primary}
                />
                <Text className="min-w-0 max-w-full shrink text-med-primary font-bold text-xs ml-1">
                  Recargar
                </Text>
              </ClayPressable>
            </ClaySurface>
          </>
        }
        footer={
          <>
            <ClaySurface className="mb-5 bg-med-bg p-4 rounded-clay border border-med-border-light">
              <Text className="text-xs font-bold text-med-primary uppercase tracking-wider mb-1">
                Rango de Tiempo
              </Text>
              <Text className="text-base font-bold text-med-text-main mb-2">
                Filtra tus próximas citas
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <ClayPressable
                  onPress={() => setRangeDays(7)}
                  className={`max-w-full min-h-touch flex-1 min-w-control py-2 px-2 rounded-control items-center border ${
                    rangeDays === 7
                      ? 'bg-med-primary border-med-primary'
                      : 'bg-med-surface border-med-border-light'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${rangeDays === 7 ? 'text-med-on-primary' : 'text-med-text-strong'}`}
                  >
                    7 Días
                  </Text>
                </ClayPressable>

                <ClayPressable
                  onPress={() => setRangeDays(14)}
                  className={`max-w-full min-h-touch flex-1 min-w-control py-2 px-2 rounded-control items-center border ${
                    rangeDays === 14
                      ? 'bg-med-primary border-med-primary'
                      : 'bg-med-surface border-med-border-light'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${rangeDays === 14 ? 'text-med-on-primary' : 'text-med-text-strong'}`}
                  >
                    14 Días
                  </Text>
                </ClayPressable>

                <ClayPressable
                  onPress={() => setRangeDays(30)}
                  className={`max-w-full min-h-touch flex-1 min-w-control py-2 px-2 rounded-control items-center border ${
                    rangeDays === 30
                      ? 'bg-med-primary border-med-primary'
                      : 'bg-med-surface border-med-border-light'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${rangeDays === 30 ? 'text-med-on-primary' : 'text-med-text-strong'}`}
                  >
                    30 Días
                  </Text>
                </ClayPressable>

                <ClayPressable
                  onPress={() => setRangeDays(0)}
                  className={`max-w-full min-h-touch flex-1 min-w-control py-2 px-2 rounded-control items-center border ${
                    rangeDays === 0
                      ? 'bg-med-primary border-med-primary'
                      : 'bg-med-surface border-med-border-light'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${rangeDays === 0 ? 'text-med-on-primary' : 'text-med-text-strong'}`}
                  >
                    Todas
                  </Text>
                </ClayPressable>
              </View>
            </ClaySurface>

            <View className="flex-row flex-wrap gap-3 mb-5">
              <ClaySurface className="max-w-full flex-1 min-w-action-sm bg-med-bg p-4 rounded-clay border border-med-border-light flex-row items-center">
                <ClaySurface
                  depth="badge"
                  className="w-10 h-10 rounded-full bg-med-primary-surface items-center justify-center mr-3"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={tokens.iconSize[22]}
                    color={tokens.colors.primary}
                  />
                </ClaySurface>
                <View className="min-w-0 max-w-full flex-1">
                  <Text className="text-xs font-bold text-med-text-soft uppercase">
                    Citas en rango
                  </Text>
                  <Text className="text-2xl font-black text-med-text-main">
                    {stats.totalUpcoming}
                  </Text>
                </View>
              </ClaySurface>

              <ClaySurface className="max-w-full flex-1 min-w-action-sm bg-med-bg p-4 rounded-clay border border-med-border-light flex-row items-center">
                <ClaySurface
                  depth="badge"
                  className="w-10 h-10 rounded-full bg-med-primary-surface items-center justify-center mr-3"
                >
                  <Ionicons
                    name="people-outline"
                    size={tokens.iconSize[22]}
                    color={tokens.colors.primary}
                  />
                </ClaySurface>
                <View className="min-w-0 max-w-full flex-1">
                  <Text className="text-xs font-bold text-med-text-soft uppercase">
                    Pacientes
                  </Text>
                  <Text className="text-2xl font-black text-med-text-main">
                    {stats.totalPatients}
                  </Text>
                </View>
              </ClaySurface>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <ClaySurface
                  depth="badge"
                  className="w-7 h-7 rounded-full bg-med-primary-surface items-center justify-center mr-2"
                >
                  <Ionicons
                    name="business-outline"
                    size={tokens.iconSize[15]}
                    color={tokens.colors.primary}
                  />
                </ClaySurface>
                <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main flex-1">
                  Próximas Citas por Clínica
                </Text>
              </View>

              {loading && appointmentsByClinic.length === 0 ? (
                <Card className="p-5 items-center justify-center">
                  <ActivityIndicator
                    size={tokens.indicator.sm}
                    color={tokens.colors.primary}
                  />
                  <Text className="text-xs text-med-text-soft mt-2">
                    Cargando citas...
                  </Text>
                </Card>
              ) : appointmentsByClinic.length === 0 ? (
                <Card className="p-5 items-center justify-center">
                  <Text className="text-xs text-med-text-soft">
                    No hay citas en el rango de fechas seleccionado.
                  </Text>
                </Card>
              ) : (
                appointmentsByClinic.map((clinic) => (
                  <Card
                    key={clinic.clinicId}
                    className="mb-3 p-0 overflow-hidden"
                  >
                    <ClaySurface className="bg-med-primary-surface border-b border-med-primary-border p-3 flex-row flex-wrap gap-2 justify-between items-center rounded-none">
                      <View
                        className="flex-row items-center"
                        style={{
                          flexGrow: 1,
                          flexBasis: tokens.layout.cardMinWidth,
                          minWidth: 0,
                        }}
                      >
                        <Ionicons
                          name="business-outline"
                          size={tokens.iconSize[16]}
                          color={tokens.colors.primary}
                          className="mr-2"
                        />
                        <Text className="min-w-0 max-w-full shrink font-bold text-sm text-med-text-main flex-1">
                          {clinic.clinicName}
                        </Text>
                      </View>
                      <Badge
                        text={`${clinic.appointments.length} cita(s)`}
                        variant="primary"
                      />
                    </ClaySurface>

                    <View className="p-3">
                      {clinic.appointments.map((appt) => {
                        const startStr = new Date(
                          appt.start_date_time,
                        ).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const pName = [
                          appt.first_name,
                          appt.second_name,
                          appt.first_last_name,
                          appt.second_last_name,
                        ]
                          .filter(Boolean)
                          .join(' ');

                        return (
                          <View
                            key={appt.appointment_id}
                            className="py-2.5 border-b border-med-border-light last:border-b-0 flex-row items-start"
                          >
                            <ClaySurface
                              depth="badge"
                              className="w-7 h-7 rounded-full bg-med-surface-muted items-center justify-center mr-2.5 mt-0.5"
                            >
                              <Ionicons
                                name="person-outline"
                                size={tokens.iconSize[14]}
                                color={tokens.colors.textMuted}
                              />
                            </ClaySurface>
                            <View className="min-w-0 max-w-full flex-1">
                              <Text className="text-sm font-bold text-med-text-main">
                                {pName || 'Paciente'}
                              </Text>
                              <View className="flex-row items-center mt-0.5">
                                <Ionicons
                                  name="time-outline"
                                  size={tokens.iconSize[12]}
                                  color={tokens.colors.primary}
                                />
                                <Text className="min-w-0 max-w-full shrink text-xs text-med-primary font-medium ml-1 flex-1">
                                  {startStr}
                                </Text>
                              </View>
                              {appt.appointment_description && (
                                <Text className="text-xs text-med-text-muted mt-1 bg-med-surface p-2 rounded">
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
                <View className="min-w-0 max-w-full flex-row items-center flex-1">
                  <ClaySurface
                    depth="badge"
                    className="w-7 h-7 rounded-full bg-med-primary-surface items-center justify-center mr-2"
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={tokens.iconSize[15]}
                      color={tokens.colors.primary}
                    />
                  </ClaySurface>
                  <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main flex-1">
                    Historial y Fórmulas Médicas
                  </Text>
                </View>
              </View>

              <View className="mb-3">
                <TextInput
                  placeholder="Buscar por nombre de paciente..."
                  value={patientQuery}
                  onChangeText={setPatientQuery}
                  className={`${clayClasses.inset} bg-med-bg border border-med-border-light rounded-input px-4 py-2.5 text-sm text-med-text-main`}
                  placeholderTextColor={tokens.colors.textLight}
                />
              </View>

              {loading && patientHistoryGroups.length === 0 ? (
                <Card className="p-5 items-center justify-center">
                  <ActivityIndicator
                    size={tokens.indicator.sm}
                    color={tokens.colors.primary}
                  />
                  <Text className="text-xs text-med-text-soft mt-2">
                    Cargando pacientes e historial...
                  </Text>
                </Card>
              ) : patientHistoryGroups.length === 0 ? (
                <Card className="p-5 items-center justify-center">
                  <Text className="text-xs text-med-text-soft">
                    No se encontraron pacientes con ese nombre o historial.
                  </Text>
                </Card>
              ) : (
                patientHistoryGroups.map((group) => (
                  <Card key={group.patientId} className="mb-4 p-4">
                    <View className="mb-3 gap-3">
                      <View>
                        <Text className="text-base font-bold text-med-text-main">
                          {group.patientName}
                        </Text>
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {group.clinics.map((c) => (
                            <ClaySurface
                              depth="badge"
                              key={c.clinicId}
                              className="bg-med-surface-muted px-2.5 py-0.5 rounded-full max-w-full"
                            >
                              <Text className="text-xs font-medium text-med-text-strong">
                                {c.clinicName}
                              </Text>
                            </ClaySurface>
                          ))}
                        </View>
                      </View>

                      <ClayPressable
                        onPress={() => handleOpenCreateModal(group)}
                        className="min-h-touch max-w-full bg-med-primary px-3 py-1.5 rounded-control flex-row items-center self-start"
                        style={{
                          minHeight: tokens.layout.touch,
                          maxWidth: tokens.layout.full,
                        }}
                        accessibilityRole="button"
                      >
                        <Text
                          className="min-w-0 max-w-full shrink text-med-on-primary text-xs font-bold"
                          style={{ flexShrink: 1 }}
                        >
                          + Asignar Receta
                        </Text>
                      </ClayPressable>
                    </View>

                    <View className="mt-2 border-t border-med-border-light pt-3">
                      <Text className="text-xs font-bold text-med-text-soft uppercase mb-2">
                        Fórmulas Médicas ({group.prescriptions.length})
                      </Text>
                      {group.prescriptions.length === 0 ? (
                        <Text className="text-xs text-med-text-light italic mb-2">
                          Sin recetas registradas para este paciente.
                        </Text>
                      ) : (
                        group.prescriptions.map((pres, idx) => (
                          <ClaySurface
                            key={
                              pres.prescriptionId
                                ? `pres-${pres.prescriptionId}`
                                : `pres-idx-${idx}`
                            }
                            className="bg-med-primary-surface/50 border border-med-primary-border rounded-clay p-3 mb-2"
                          >
                            <View className="mb-1 gap-2">
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="calendar-outline"
                                  size={tokens.iconSize[12]}
                                  color={tokens.colors.primaryDark}
                                />
                                <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary-dark ml-1 flex-1">
                                  {pres.displayDate}
                                </Text>
                              </View>
                              <View className="flex-row flex-wrap gap-2">
                                {pres.prescriptionId && (
                                  <>
                                    <ClayPressable
                                      disabled={pdfPending !== null}
                                      onPress={() =>
                                        handleOpenEditModal(
                                          pres.prescriptionId,
                                          pres.description,
                                        )
                                      }
                                      className="min-h-touch max-w-full bg-med-bg border border-med-border-light px-2 py-1 rounded-control"
                                      style={{
                                        minHeight: tokens.layout.touch,
                                        maxWidth: tokens.layout.full,
                                        justifyContent: 'center',
                                      }}
                                      accessibilityRole="button"
                                    >
                                      <View className="flex-row items-center gap-1">
                                        <Ionicons
                                          name="pencil-outline"
                                          size={tokens.iconSize[12]}
                                          color={tokens.colors.primary}
                                        />
                                        <Text
                                          className="min-w-0 max-w-full shrink text-xs font-semibold text-med-primary"
                                          style={{ flexShrink: 1 }}
                                        >
                                          Editar
                                        </Text>
                                      </View>
                                    </ClayPressable>
                                    <ClayPressable
                                      disabled={pdfPending !== null}
                                      onPress={() =>
                                        handleDeletePrescription(
                                          pres.prescriptionId,
                                        )
                                      }
                                      className="min-h-touch max-w-full bg-med-bg border border-med-error-border px-2 py-1 rounded-control"
                                      style={{
                                        minHeight: tokens.layout.touch,
                                        maxWidth: tokens.layout.full,
                                        justifyContent: 'center',
                                      }}
                                      accessibilityRole="button"
                                    >
                                      <View className="flex-row items-center gap-1">
                                        <Ionicons
                                          name="trash-outline"
                                          size={tokens.iconSize[12]}
                                          color={tokens.colors.error.accent}
                                        />
                                        <Text
                                          className="min-w-0 max-w-full shrink text-xs font-semibold text-med-error-accent"
                                          style={{ flexShrink: 1 }}
                                        >
                                          Eliminar
                                        </Text>
                                      </View>
                                    </ClayPressable>
                                  </>
                                )}
                              </View>
                            </View>
                            <PrescriptionPdfActions
                              prescriptionId={pres.prescriptionId}
                              pending={pdfPending}
                              onExport={requestPdfExport}
                              disabled={
                                savingPrescription || updatingPrescription
                              }
                            />
                            <Text className="text-xs text-med-text-main leading-relaxed font-medium mt-3">
                              {pres.description}
                            </Text>
                          </ClaySurface>
                        ))
                      )}
                    </View>

                    {group.records.length > 0 && (
                      <View className="mt-2 border-t border-med-border-light pt-3">
                        <Text className="text-xs font-bold text-med-text-soft uppercase mb-2">
                          Historial de Citas ({group.records.length})
                        </Text>
                        {group.records.slice(0, 3).map((rec, rIdx) => (
                          <View key={rIdx} className="py-1 gap-1">
                            <View className="flex-row items-center">
                              <Ionicons
                                name="calendar-outline"
                                size={tokens.iconSize[12]}
                                color={tokens.colors.textMuted}
                              />
                              <Text className="min-w-0 max-w-full shrink text-xs text-med-text-muted font-medium ml-1 flex-1">
                                {rec.displayDate}
                              </Text>
                            </View>
                            <Text className="text-xs text-med-text-soft font-medium">
                              {rec.clinicName}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          </>
        }
      />

      <AppModal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingPrescription) setCreateModalVisible(false);
        }}
      >
        <ModalViewport style={{ backgroundColor: tokens.colors.overlay }}>
          <View style={{ flex: 1, minHeight: 0, justifyContent: 'flex-end' }}>
            <ClaySurface
              depth="dialog"
              className="bg-med-bg rounded-t-dialog"
              style={{
                height: tokens.layout.selectHeight,
                maxHeight: tokens.layout.full,
                minHeight: 0,
                flexShrink: 1,
              }}
            >
              <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                  padding: tokens.spacing.md + tokens.spacing.xxs,
                  paddingBottom: tokens.spacing.lg,
                }}
              >
                <View className="flex-row justify-between items-center mb-4 border-b border-med-border-light pb-3">
                  <View className="min-w-0 max-w-full flex-1 mr-2">
                    <Text className="text-xs font-bold text-med-primary uppercase">
                      Nueva Fórmula Médica
                    </Text>
                    <Text className="text-lg font-bold text-med-text-main">
                      {targetPatient?.patientName}
                    </Text>
                  </View>
                  <ClayPressable
                    onPress={() => setCreateModalVisible(false)}
                    disabled={savingPrescription}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar nueva receta"
                    style={{
                      minWidth: tokens.layout.touch,
                      minHeight: tokens.layout.touch,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="min-h-touch max-w-full rounded-full bg-med-surface-muted active:bg-med-border-light"
                  >
                    <Ionicons
                      name="close"
                      size={tokens.iconSize[18]}
                      color={tokens.colors.textSoft}
                    />
                  </ClayPressable>
                </View>

                <Text className="text-xs font-bold text-med-text-main mb-1.5">
                  Clínica
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {targetPatient?.clinics.map((c) => (
                    <ClayPressable
                      key={c.clinicId}
                      onPress={() => setSelectedClinicId(c.clinicId)}
                      disabled={savingPrescription}
                      className={`min-h-touch max-w-full px-3 py-2 rounded-control border ${
                        selectedClinicId === c.clinicId
                          ? 'bg-med-primary border-med-primary'
                          : 'bg-med-surface border-med-border-light'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedClinicId === c.clinicId
                            ? 'text-med-on-primary'
                            : 'text-med-text-strong'
                        }`}
                      >
                        {c.clinicName}
                      </Text>
                    </ClayPressable>
                  ))}
                </View>

                <Text className="text-xs font-bold text-med-text-main mb-1.5">
                  Descripción / Indicaciones de la Receta
                </Text>
                <TextInput
                  multiline
                  numberOfLines={5}
                  placeholder="Escribe los medicamentos, dosis e indicaciones para el paciente..."
                  value={prescriptionText}
                  editable={!savingPrescription}
                  onChangeText={setPrescriptionText}
                  className={`${clayClasses.inset} bg-med-surface border border-med-border-light rounded-input p-3 text-sm text-med-text-main mb-5 min-h-field`}
                  placeholderTextColor={tokens.colors.textLight}
                  textAlignVertical="top"
                />

                <View className="flex-row flex-wrap gap-3">
                  <Button
                    text="Cancelar"
                    variant="outline"
                    onPress={() => setCreateModalVisible(false)}
                    disabled={savingPrescription}
                    className="max-w-full flex-1 min-w-action-sm"
                  />
                  <Button
                    text={
                      savingPrescription ? 'Guardando...' : 'Asignar Receta'
                    }
                    onPress={handleSavePrescription}
                    loading={savingPrescription}
                    disabled={savingPrescription || !prescriptionText.trim()}
                    className="max-w-full flex-1 min-w-action-sm"
                  />
                </View>
              </ScrollView>
            </ClaySurface>
          </View>
        </ModalViewport>
      </AppModal>

      <AppModal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!updatingPrescription) setEditModalVisible(false);
        }}
      >
        <ModalViewport style={{ backgroundColor: tokens.colors.overlay }}>
          <View style={{ flex: 1, minHeight: 0, justifyContent: 'flex-end' }}>
            <ClaySurface
              depth="dialog"
              className="bg-med-bg rounded-t-dialog"
              style={{
                height: tokens.layout.selectHeight,
                maxHeight: tokens.layout.full,
                minHeight: 0,
                flexShrink: 1,
              }}
            >
              <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                  padding: tokens.spacing.md + tokens.spacing.xxs,
                  paddingBottom: tokens.spacing.lg,
                }}
              >
                <View className="flex-row justify-between items-center mb-4 border-b border-med-border-light pb-3">
                  <View className="min-w-0 max-w-full flex-1 mr-2">
                    <Text className="text-xs font-bold text-med-primary uppercase">
                      Editar Fórmula Médica
                    </Text>
                    <Text className="text-base font-bold text-med-text-main">
                      ID #{editingPrescriptionId}
                    </Text>
                  </View>
                  <ClayPressable
                    onPress={() => setEditModalVisible(false)}
                    disabled={updatingPrescription}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar edición de receta"
                    style={{
                      minWidth: tokens.layout.touch,
                      minHeight: tokens.layout.touch,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="min-h-touch max-w-full rounded-full bg-med-surface-muted active:bg-med-border-light"
                  >
                    <Ionicons
                      name="close"
                      size={tokens.iconSize[18]}
                      color={tokens.colors.textSoft}
                    />
                  </ClayPressable>
                </View>

                <Text className="text-xs font-bold text-med-text-main mb-1.5">
                  Descripción / Indicaciones
                </Text>
                <TextInput
                  multiline
                  numberOfLines={5}
                  placeholder="Modifica los medicamentos, dosis e indicaciones..."
                  value={editPrescriptionText}
                  editable={!updatingPrescription}
                  onChangeText={setEditPrescriptionText}
                  className={`${clayClasses.inset} bg-med-surface border border-med-border-light rounded-input p-3 text-sm text-med-text-main mb-5 min-h-field`}
                  placeholderTextColor={tokens.colors.textLight}
                  textAlignVertical="top"
                />

                <View className="flex-row flex-wrap gap-3">
                  <Button
                    text="Cancelar"
                    variant="outline"
                    onPress={() => setEditModalVisible(false)}
                    disabled={updatingPrescription}
                    className="max-w-full flex-1 min-w-action-sm"
                  />
                  <Button
                    text={
                      updatingPrescription
                        ? 'Actualizando...'
                        : 'Guardar Cambios'
                    }
                    onPress={handleSaveEditPrescription}
                    loading={updatingPrescription}
                    disabled={
                      updatingPrescription || !editPrescriptionText.trim()
                    }
                    className="max-w-full flex-1 min-w-action-sm"
                  />
                </View>
              </ScrollView>
            </ClaySurface>
          </View>
        </ModalViewport>
      </AppModal>
    </View>
  );
}

export default DoctorDashboardScreen;
