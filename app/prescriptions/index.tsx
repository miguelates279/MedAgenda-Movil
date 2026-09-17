import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import prescriptionsApi from '../../src/api/prescriptions';
import { PrescriptionUserView } from '../../src/api/types';
import { Badge, Button, Card, NavBar } from '../../src/components';

interface PrescriptionGroup {
  clinicId: number;
  clinicName: string;
  items: PrescriptionUserView[];
}

export default function PatientPrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionUserView[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await prescriptionsApi.getUserPrescriptions();
      setPrescriptions(data || []);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudieron cargar tus fórmulas médicas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const groups = useMemo<PrescriptionGroup[]>(() => {
    const grouped: Record<number, PrescriptionGroup> = {};

    prescriptions.forEach((p) => {
      const cid = Number(p.clinic_id);
      if (!grouped[cid]) {
        grouped[cid] = {
          clinicId: cid,
          clinicName: p.clinic_name || `Clínica #${cid}`,
          items: [],
        };
      }
      grouped[cid].items.push(p);
    });

    return Object.values(grouped)
      .map((g) => ({
        ...g,
        items: g.items.sort(
          (a, b) => new Date(b.date_emitted).getTime() - new Date(a.date_emitted).getTime()
        ),
      }))
      .sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'es'));
  }, [prescriptions]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="bg-gray-50"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPrescriptions} tintColor="#259487" />
        }
      >
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-sm font-semibold text-neutral-700">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900">Mis Fórmulas Médicas</Text>
          <TouchableOpacity
            onPress={loadPrescriptions}
            activeOpacity={0.7}
            className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-sm font-semibold text-primary">🔄</Text>
          </TouchableOpacity>
        </View>

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
            <Text className="text-3xl mb-2">📄</Text>
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
                  <Text className="text-lg mr-2">🏥</Text>
                  <View className="flex-1">
                    <Text className="text-xs text-teal-700 font-bold uppercase">Clínica</Text>
                    <Text className="font-bold text-sm text-neutral-900">{group.clinicName}</Text>
                  </View>
                </View>
                <Badge
                  text={`${group.items.length} fórmula${group.items.length === 1 ? '' : 's'}`}
                  variant="primary"
                />
              </View>

              <View className="p-3.5 divide-y divide-gray-100">
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
                    <View key={item.prescription_id || idx} className="py-3 first:pt-0 last:pb-0">
                      <View className="flex-row justify-between items-center mb-1.5">
                        <Text className="text-xs font-bold text-primary">
                          🗓️ {formattedDate}
                        </Text>
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

      <NavBar active="home" />
    </SafeAreaView>
  );
}
