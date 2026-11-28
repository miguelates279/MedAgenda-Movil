import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../../../components/AppModal';
import { ModalViewport } from '../../../components/ModalViewport';
import { Button } from '../../../components';
import { ClaySurface, ClayPressable } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

export interface DataPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const sections: { title: string; body: string }[] = [
  {
    title: 'Responsable del tratamiento',
    body: 'MedAgenda y las clínicas en las que agendas tus citas son responsables del tratamiento de los datos personales que registras en la aplicación.',
  },
  {
    title: 'Datos que recolectamos',
    body: 'Nombres y apellidos, número de identificación, correo electrónico, teléfono, citas médicas agendadas y fórmulas médicas emitidas por tus médicos.',
  },
  {
    title: 'Datos sensibles',
    body: 'La información relacionada con tu salud (motivos de consulta, historial de citas y fórmulas) es un dato sensible según la Ley 1581 de 2012. No estás obligado a autorizar su tratamiento, pero sin ella no es posible prestar el servicio de agendamiento y prescripción.',
  },
  {
    title: 'Finalidades',
    body: 'Gestionar tu cuenta, agendar, reprogramar y cancelar citas, enviarte recordatorios en este dispositivo, permitir que tu médico consulte tu historial de citas y fórmulas, y emitir tus recetas en PDF.',
  },
  {
    title: 'Tus derechos',
    body: 'Puedes conocer, actualizar y rectificar tus datos, solicitar prueba de esta autorización, ser informado sobre el uso que se les da, revocar la autorización o solicitar la supresión de tus datos cuando no exista un deber legal de conservarlos, y presentar quejas ante la Superintendencia de Industria y Comercio.',
  },
  {
    title: 'Marco legal',
    body: 'Este tratamiento se rige por la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) de la República de Colombia.',
  },
];

export function DataPolicyModal({ visible, onClose }: DataPolicyModalProps) {
  return (
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <ModalViewport style={{ backgroundColor: tokens.colors.overlay }}>
        <View style={{ flex: 1, minHeight: 0, justifyContent: 'flex-end' }}>
          <ClaySurface
            depth="dialog"
            className="bg-med-bg rounded-t-dialog"
            style={{
              height: tokens.layout.selectHeight,
              maxHeight: tokens.layout.full,
              minHeight: 0,
              flexShrink: 1,
            }}
          >
            <View className="flex-row justify-between items-center border-b border-med-border-light px-5 pt-5 pb-3">
              <View className="min-w-0 max-w-full flex-1 mr-2">
                <Text className="text-xs font-bold text-med-primary uppercase">
                  Ley 1581 de 2012
                </Text>
                <Text
                  className="text-lg font-bold text-med-text-main"
                  accessibilityRole="header"
                >
                  Tratamiento de datos personales
                </Text>
              </View>
              <ClayPressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar política de tratamiento de datos"
                style={{
                  minWidth: tokens.layout.touch,
                  minHeight: tokens.layout.touch,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="min-h-touch max-w-full rounded-full bg-med-surface-muted active:bg-med-border-light"
              >
                <Ionicons
                  name="close"
                  size={tokens.iconSize[18]}
                  color={tokens.colors.textSoft}
                />
              </ClayPressable>
            </View>

            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{
                padding: tokens.spacing.md + tokens.spacing.xxs,
                paddingBottom: tokens.spacing.lg,
              }}
            >
              {sections.map((section) => (
                <View key={section.title} className="mb-4">
                  <Text className="text-sm font-bold text-med-text-main mb-1">
                    {section.title}
                  </Text>
                  <Text className="text-sm text-med-text-muted leading-5">
                    {section.body}
                  </Text>
                </View>
              ))}

              <Button text="Entendido" onPress={onClose} className="mt-2" />
            </ScrollView>
          </ClaySurface>
        </View>
      </ModalViewport>
    </AppModal>
  );
}

export default DataPolicyModal;
