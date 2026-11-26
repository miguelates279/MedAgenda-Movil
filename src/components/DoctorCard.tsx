import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { PublicDoctor } from '../api/types';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import { ClaySurface } from './ClaySurface';
import { tokens } from '../theme/tokens';

export interface DoctorCardProps {
  doctor: PublicDoctor;
  className?: string;
  onBookPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, className = '', onBookPress }) => {
  const { fontScale } = useWindowDimensions();
  const avatarSize = tokens.layout.avatarDoctor * Math.max(1, fontScale);
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
        <ClaySurface
          depth="badge"
          className="shrink-0 rounded-full bg-med-primary-light items-center justify-center mr-3"
          style={{ width: avatarSize, height: avatarSize }}
        >
          <Text className="text-lg font-bold text-med-primary">
            {(doctor.first_name?.[0] || 'D').toUpperCase()}
          </Text>
        </ClaySurface>
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-bold text-med-text-main mb-1">{fullName}</Text>
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
              <Text className="text-xs text-med-text-light">Sin especialidades asignadas</Text>
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
