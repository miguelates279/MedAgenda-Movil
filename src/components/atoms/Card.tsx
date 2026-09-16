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
        className={`bg-white border border-gray-200 rounded-lg p-4 my-1.5 shadow-sm active:bg-gray-50 active:opacity-90 ${className}`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`bg-white border border-gray-200 rounded-lg p-4 my-1.5 shadow-sm ${className}`}
      style={style}
    >
      {children}
    </View>
  );
};

export default Card;
