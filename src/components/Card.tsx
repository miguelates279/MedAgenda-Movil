import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, onPress }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`bg-med-bg border border-med-border-light rounded-med-lg p-4 my-1.5 shadow-med-sm active:bg-med-surface active:opacity-90 ${className}`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`bg-med-bg border border-med-border-light rounded-med-lg p-4 my-1.5 shadow-med-sm ${className}`}
      style={style}
    >
      {children}
    </View>
  );
};

export default Card;
