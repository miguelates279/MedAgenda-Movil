import React from 'react';
import { KeyboardAvoidingView, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export interface ModalViewportProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
}

export function ModalViewport({
  children,
  style,
  keyboardAvoiding = true,
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
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
