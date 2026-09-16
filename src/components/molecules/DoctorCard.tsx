import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PublicDoctor } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

export interface DoctorCardProps {
  doctor: PublicDoctor;
  onBookPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookPress }) => {
  const fullName = [
    doctor.first_name,
    doctor.second_name,
    doctor.first_last_name,
    doctor.second_last_name,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card style={styles.card}>
      <View style={styles.docHeader}>
        <View style={styles.docAvatar}>
          <Text style={styles.docAvatarText}>
            {(doctor.first_name?.[0] || 'D').toUpperCase()}
          </Text>
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName}>{fullName}</Text>
          <View style={styles.specialtiesList}>
            {doctor.specialties && doctor.specialties.length > 0 ? (
              doctor.specialties.map((sp) => (
                <Badge
                  key={sp.specialty_id}
                  text={sp.specialty_name}
                  variant="info"
                  style={styles.specBadge}
                />
              ))
            ) : (
              <Text style={styles.noSpecText}>Sin especialidades asignadas</Text>
            )}
          </View>
        </View>
      </View>

      {onBookPress && (
        <Button
          text="Agendar con este doctor"
          onPress={onBookPress}
          style={styles.bookDoctorBtn}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6f4f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#259487',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 4,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specBadge: {
    marginRight: 4,
    marginTop: 2,
  },
  noSpecText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bookDoctorBtn: {
    marginTop: 4,
  },
});

export default DoctorCard;
