import { Platform } from 'react-native';
import { tokens } from './tokens';

export type ClayDepth = keyof typeof tokens.boxShadow;
const nativeClasses: Record<ClayDepth, string> = {
  surface: 'clay-surface',
  control: 'clay-control',
  inset: 'clay-inset',
  dialog: 'clay-dialog',
  badge: 'clay-badge',
  pressed: 'clay-pressed',
};
const webClasses: Record<ClayDepth, string> = {
  surface: 'shadow-clay-surface',
  control: 'shadow-clay-control',
  inset: 'shadow-clay-inset',
  dialog: 'shadow-clay-dialog',
  badge: 'shadow-clay-badge',
  pressed: 'shadow-clay-pressed',
};
const legacyClasses: Record<ClayDepth, string> = {
  surface: 'shadow-med-md',
  control: 'shadow-med-md',
  inset: 'shadow-med-sm',
  dialog: 'shadow-xl',
  badge: 'shadow-med-sm',
  pressed: 'shadow-none',
};
const supportsNativeBoxShadow =
  Platform.OS !== 'android' ||
  Number(Platform.Version) >= tokens.layout.androidBoxShadowApi;
export const clayClasses =
  Platform.OS === 'web'
    ? webClasses
    : supportsNativeBoxShadow
      ? nativeClasses
      : legacyClasses;
export const clayPressedClass =
  Platform.OS === 'web'
    ? 'active:shadow-clay-pressed'
    : supportsNativeBoxShadow
      ? 'active:clay-pressed'
      : 'active:shadow-none';
