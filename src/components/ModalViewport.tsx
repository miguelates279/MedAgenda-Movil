import React from 'react';
import { KeyboardAvoidingView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppAlertBoundary } from './AppAlertBoundary';

export interface ModalViewportProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  alertHost?: boolean;
}

export function ModalViewport({
  children,
  style,
  keyboardAvoiding = true,
  alertHost = true,
}: ModalViewportProps) {
  return (
    <SafeAreaProvider style={[{ flex: 1, minHeight: 0 }, style]}>
      <SafeAreaView
        style={{ flex: 1, minHeight: 0 }}
        edges={['top', 'right', 'bottom', 'left']}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, minHeight: 0 }}
          enabled={keyboardAvoiding}
          behavior="padding"
        >
          {alertHost ? (
            <AppAlertBoundary>{children}</AppAlertBoundary>
          ) : (
            <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
