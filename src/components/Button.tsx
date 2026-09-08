import { Pressable, Text } from 'react-native';
import type { ComponentProps, ComponentType } from 'react';

const StyledPressable = Pressable as ComponentType<
  ComponentProps<typeof Pressable> & { className?: string }
>;

interface Props {
  text: string;
  onPress: () => void;
  /** Se ve apagado y deja de responder. Útil mientras se envía un formulario. */
  disabled?: boolean;
  /** Variante secundaria: borde en vez de fondo lleno. */
  secondary?: boolean;
  className?: string;
}

export default function Button({ text, onPress, disabled, secondary, className }: Props) {
  return (
    <StyledPressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-xl p-4 active:opacity-80 disabled:opacity-50 ${
        secondary ? 'border border-neutral-300' : 'bg-blue-600'
      } ${className ?? ''}`}>
      <Text className={`font-semibold ${secondary ? 'text-neutral-700' : 'text-white'}`}>
        {text}
      </Text>
    </StyledPressable>
  );
}