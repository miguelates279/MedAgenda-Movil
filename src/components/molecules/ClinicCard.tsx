import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clinic } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

export interface ClinicCardProps {
  clinic: Clinic;
  onPress?: () => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onPress }) => {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
        <Badge
          text={clinic.is_open ? 'Abierta' : 'Cerrada'}
          variant={clinic.is_open ? 'success' : 'error'}
        />
      </View>

      <Text style={styles.clinicAddress}>📍 {clinic.clinic_address}</Text>
      <Text style={styles.clinicPhone}>📞 {clinic.clinic_phone_number}</Text>

      {clinic.clinic_description ? (
        <Text style={styles.clinicDesc} numberOfLines={2}>
          {clinic.clinic_description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Ver doctores y horarios →</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    flex: 1,
    marginRight: 8,
  },
  clinicAddress: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  clinicPhone: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  clinicDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#259487',
  },
});

export default ClinicCard;
