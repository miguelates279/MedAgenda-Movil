import React from 'react';
import { Text, View } from 'react-native';
import { PublicDoctor } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

export interface DoctorCardProps {
  doctor: PublicDoctor;
  className?: string;
  onBookPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, className = '', onBookPress }) => {
  const fullName = [
    doctor.first_name,
    doctor.second_name,
    doctor.first_last_name,
    doctor.second_last_name,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className={`mb-3 ${className}`}>
      <View className="flex-row items-center mb-3">
        <View className="w-11 h-11 rounded-full bg-[#e6f4f2] items-center justify-center mr-3">
          <Text className="text-lg font-bold text-primary">
            {(doctor.first_name?.[0] || 'D').toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-neutral-900 mb-1">{fullName}</Text>
          <View className="flex-row flex-wrap gap-1">
            {doctor.specialties && doctor.specialties.length > 0 ? (
              doctor.specialties.map((sp) => (
                <Badge
                  key={sp.specialty_id}
                  text={sp.specialty_name}
                  variant="info"
                  className="mr-1 mt-0.5"
                />
              ))
            ) : (
              <Text className="text-xs text-gray-400">Sin especialidades asignadas</Text>
            )}
          </View>
        </View>
      </View>

      {onBookPress && (
        <Button
          text="Agendar con este doctor"
          onPress={onBookPress}
          className="mt-1"
        />
      )}
    </Card>
  );
};

export default DoctorCard;
