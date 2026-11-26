import { Pressable, PressableProps, View, ViewProps } from 'react-native';
import { ClayDepth, clayClasses, clayPressedClass } from '../theme/clay';

interface SurfaceProps {
  className?: string;
  depth?: ClayDepth;
}

const radiusClasses: Record<ClayDepth, string> = {
  surface: 'rounded-clay',
  control: 'rounded-control',
  inset: 'rounded-input',
  dialog: 'rounded-dialog',
  badge: 'rounded-badge',
  pressed: 'rounded-control',
};

const surfaceClasses = (className: string, depth: ClayDepth) =>
  [
    /(?:^|\s)bg-/.test(className) ? '' : 'bg-med-bg',
    /(?:^|\s)rounded/.test(className) ? '' : radiusClasses[depth],
    className,
  ].join(' ');

export function ClaySurface({
  className = '',
  depth = 'surface',
  style,
  ...props
}: ViewProps & SurfaceProps) {
  return (
    <View
      {...props}
      className={`${surfaceClasses(className, depth)} ${clayClasses[depth]}`}
      style={style}
    />
  );
}

export function ClayPressable({
  className = '',
  depth = 'control',
  style,
  ...props
}: PressableProps & SurfaceProps) {
  return (
    <Pressable
      {...props}
      className={`${surfaceClasses(className, depth)} ${clayClasses[depth]} ${clayPressedClass}`}
      style={style}
    />
  );
}
