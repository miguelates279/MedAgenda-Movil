import React from 'react';
import { Text, View } from 'react-native';
import { Clinic } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

export interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
  onPress?: () => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, className = '', onPress }) => {
  return (
    <Card onPress={onPress} className={`mb-3 ${className}`}>
      <View className="flex-row justify-between items-start mb-1.5">
        <Text className="text-base font-bold text-neutral-900 flex-1 mr-2">
          {clinic.clinic_name}
        </Text>
        <Badge
          text={clinic.is_open ? 'Abierta' : 'Cerrada'}
          variant={clinic.is_open ? 'success' : 'error'}
        />
      </View>

      <Text className="text-sm text-gray-600 mb-0.5">📍 {clinic.clinic_address}</Text>
      <Text className="text-sm text-gray-600 mb-1">📞 {clinic.clinic_phone_number}</Text>

      {clinic.clinic_description ? (
        <Text className="text-xs text-gray-400 mt-1" numberOfLines={2}>
          {clinic.clinic_description}
        </Text>
      ) : null}

      <View className="mt-2.5 pt-2 border-t border-gray-100 items-end">
        <Text className="text-xs font-semibold text-primary">Ver doctores y horarios →</Text>
      </View>
    </Card>
  );
};

export default ClinicCard;
