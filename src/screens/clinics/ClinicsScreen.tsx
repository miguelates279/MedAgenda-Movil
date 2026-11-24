import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ClinicCard } from '../../components';
import { ClinicFiltersModal } from './components/ClinicFiltersModal';
import { useClinicsScreen } from './useClinicsScreen';

export function ClinicsScreen() {
  const screen = useClinicsScreen();
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-2">
        <Text
          className="text-xl font-bold text-neutral-900 flex-1"
          accessibilityRole="header"
        >
          Clínicas
        </Text>
        {screen.isAuthenticated && (
          <Button
            text="+ Nueva"
            onPress={screen.openCreateClinic}
            className="py-1.5 px-3"
          />
        )}
        <Pressable
          onPress={screen.openProfile}
          className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 items-center justify-center active:bg-gray-200"
          accessibilityRole="button"
          accessibilityLabel="Ver perfil"
        >
          <Ionicons name="person" size={18} color="#4b5563" />
        </Pressable>
      </View>
      <View className="flex-row items-center bg-white px-4 py-3 border-b border-gray-200 gap-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">
            {screen.hasSearched
              ? 'Última búsqueda'
              : 'Ubicación y especialidades'}
          </Text>
          <Text
            className="text-sm font-medium text-neutral-900"
            numberOfLines={2}
          >
            {screen.summary}
          </Text>
          {screen.hasPendingFilters && (
            <Text
              className="text-xs text-amber-800 mt-1"
              accessibilityLiveRegion="polite"
            >
              Hay filtros sin aplicar
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => screen.openFilters()}
          className="min-h-11 flex-row items-center gap-2 px-3 py-2.5 border border-primary rounded-md bg-teal-50 active:bg-teal-100"
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros de clínicas"
        >
          <Ionicons name="options-outline" size={20} color="#1d756b" />
          <Text className="text-sm font-semibold text-teal-800">
            Filtros{screen.filterCount ? ` (${screen.filterCount})` : ''}
          </Text>
        </Pressable>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={screen.loadingClinics ? [] : screen.clinics}
        keyExtractor={(item) => String(item.clinic_id)}
        renderItem={({ item }) => (
          <ClinicCard
            clinic={item}
            onPress={() => screen.openClinic(item.clinic_id)}
            className="mb-3"
          />
        )}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={screen.loadingClinics}
            onRefresh={screen.refresh}
            tintColor="#259487"
            colors={['#259487']}
          />
        }
        ListHeaderComponent={
          <>
            {screen.error && (
              <View
                className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md"
                accessibilityLiveRegion="polite"
              >
                <Text className="text-red-700 text-sm">{screen.error}</Text>
              </View>
            )}
            {screen.hasSearched && !screen.loadingClinics && (
              <Text className="text-sm text-gray-600 mb-3">
                {screen.clinics.length} clínica
                {screen.clinics.length === 1 ? '' : 's'} encontrada
                {screen.clinics.length === 1 ? '' : 's'}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-3 py-8">
            {screen.loadingClinics ? (
              <>
                <ActivityIndicator size="large" color="#259487" />
                <Text className="text-sm text-gray-600 mt-3">
                  Buscando clínicas...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={
                    screen.hasSearched ? 'search-outline' : 'business-outline'
                  }
                  size={36}
                  color="#259487"
                />
                <Text className="text-base font-bold text-neutral-900 text-center mt-3 mb-2">
                  {screen.hasSearched
                    ? 'No se encontraron clínicas'
                    : 'Encuentra tu clínica'}
                </Text>
                <Text className="text-sm text-gray-600 text-center mb-4">
                  {screen.hasSearched
                    ? 'Cambia la ubicación o las especialidades para ampliar tu búsqueda.'
                    : 'Elige un país y, si quieres, filtra por ciudad o especialidad.'}
                </Text>
                <Button
                  text={
                    screen.hasSearched ? 'Cambiar filtros' : 'Elegir ubicación'
                  }
                  onPress={() =>
                    screen.openFilters(
                      screen.hasSearched ? 'filters' : 'country',
                    )
                  }
                />
              </>
            )}
          </View>
        }
      />
      <ClinicFiltersModal filters={screen.filters} />
    </View>
  );
}

export default ClinicsScreen;
