import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Clinic } from '../api/types';
import Card from './Card';
import Badge from './Badge';

export interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
  onPress?: () => void;
  footer?: React.ReactNode;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  className = '',
  onPress,
  footer,
}) => {
  const clinicContent = (
    <>
      <View className="flex-row flex-wrap gap-2 justify-between items-start mb-1.5">
        <Text className="text-base font-bold text-med-text-main flex-1 min-w-0">
          {clinic.clinic_name}
        </Text>
        <Badge
          text={clinic.is_open ? 'Abierta' : 'Cerrada'}
          variant={clinic.is_open ? 'success' : 'error'}
        />
      </View>

      <Text className="text-sm text-med-text-muted mb-0.5">{clinic.clinic_address}</Text>
      <Text className="text-sm text-med-text-muted mb-1">{clinic.clinic_phone_number}</Text>

      {clinic.clinic_description ? (
        <Text className="text-xs text-med-text-light mt-1" numberOfLines={2}>
          {clinic.clinic_description}
        </Text>
      ) : null}
    </>
  );

  return (
    <Card onPress={footer ? undefined : onPress} className={`mb-3 ${className}`}>
      {footer && onPress ? (
        <Pressable onPress={onPress} className="active:opacity-90">
          {clinicContent}
        </Pressable>
      ) : (
        clinicContent
      )}

      <View className="mt-2.5 pt-2 border-t border-med-border-light items-end">
        {footer || <Text className="text-xs font-semibold text-med-primary">Ver doctores y horarios</Text>}
      </View>
    </Card>
  );
};

export default ClinicCard;
