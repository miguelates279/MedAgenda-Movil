import React from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps {
  text: string;
  variant?: any;
  onPress?: () => void;
  disabled?: boolean;
}

const Button = ({ text, variant, onPress, disabled }: ButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={variant || { backgroundColor: '#007AFF', padding: 10, alignItems: 'center', marginVertical: 10 }}
    >
      <Text style={{ color: '#fff' }}>{text}</Text>
    </Pressable>
  );
};

export default Button;