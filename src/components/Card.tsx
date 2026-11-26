import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ClayPressable, ClaySurface } from './ClaySurface';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, onPress }) => {
  if (onPress) {
    return (
      <ClayPressable
        onPress={onPress}
        depth="surface"
        className={`border border-med-border-light p-4 my-1.5 active:bg-med-surface active:opacity-90 ${className}`}
        style={style}
      >
        {children}
      </ClayPressable>
    );
  }

  return (
    <ClaySurface
      className={`border border-med-border-light p-4 my-1.5 ${className}`}
      style={style}
    >
      {children}
    </ClaySurface>
  );
};

export default Card;
