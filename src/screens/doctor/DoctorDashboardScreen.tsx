import React from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge, Button, Card } from '../../components';
import { useDoctorDashboard } from './useDoctorDashboard';

export function DoctorDashboardScreen() {
  const {
    user,
    loading,
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
  } = useDoctorDashboard();

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
    </SafeAreaView>
  );
}

export default DoctorDashboardScreen;
