import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, ScreenHeader } from '../../components';
import { usePrescriptionsScreen } from './usePrescriptionsScreen';

export function PrescriptionsScreen() {
  const {
    prescriptions,
    loading,
    groups,
    loadPrescriptions,
  } = usePrescriptionsScreen();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader
        title="Mis Fórmulas Médicas"
        rightAction={
          <Pressable
            onPress={loadPrescriptions}
            className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 active:bg-gray-100"
            accessibilityRole="button"
            accessibilityLabel="Recargar fórmulas médicas"
          >
            <Ionicons name="reload-outline" size={18} color="#259487" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadPrescriptions}
            tintColor="#259487"
            colors={['#259487']}
          />
        }
      >
        <View className="mb-4 bg-teal-50 border border-teal-100 p-4 rounded-xl">
          <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
            Recetas e Indicaciones
          </Text>
          <Text className="text-xs text-teal-900 leading-relaxed">
            Aquí puedes consultar todas las prescripciones y fórmulas emitidas por tus médicos en cada clínica.
          </Text>
        </View>

        {loading && prescriptions.length === 0 ? (
          <Card className="p-8 items-center justify-center">
            <ActivityIndicator size="small" color="#259487" />
            <Text className="text-xs text-gray-500 mt-2">Cargando fórmulas médicas...</Text>
          </Card>
        ) : groups.length === 0 ? (
          <Card className="p-8 items-center justify-center">
            <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="document-text-outline" size={28} color="#9ca3af" />
            </View>
            <Text className="text-sm font-bold text-neutral-800 mb-1">Sin Fórmulas Médicas</Text>
            <Text className="text-xs text-gray-500 text-center">
              Aún no tienes fórmulas ni recetas registradas por tus médicos.
            </Text>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.clinicId} className="mb-4 p-0 overflow-hidden">
              <View className="bg-teal-50 border-b border-teal-100 p-3.5 flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-2.5 shadow-xs">
                    <Ionicons name="business" size={16} color="#259487" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                      Clínica
                    </Text>
                    <Text className="font-bold text-sm text-neutral-900" numberOfLines={1}>
                      {group.clinicName}
                    </Text>
                  </View>
                </View>
                <Badge
                  text={`${group.items.length} fórmula${group.items.length === 1 ? '' : 's'}`}
                  variant="primary"
                />
              </View>

              <View className="p-3.5">
                {group.items.map((item, idx) => {
                  const doctorName = [item.doctor_first_name, item.doctor_second_name, item.doctor_last_name]
                    .filter(Boolean)
                    .join(' ');

                  const formattedDate = new Date(item.date_emitted).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View
                      key={item.prescription_id || idx}
                      className={`py-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <View className="flex-row justify-between items-center mb-1.5">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={13} color="#259487" />
                          <Text className="text-xs font-bold text-primary ml-1">
                            {formattedDate}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-gray-500 font-medium">
                          Dr(a). {doctorName}
                        </Text>
                      </View>
                      <View className="bg-gray-50 border border-gray-100 rounded-lg p-3 mt-1">
                        <Text className="text-xs text-gray-800 leading-relaxed font-medium">
                          {item.prescription_description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default PrescriptionsScreen;
