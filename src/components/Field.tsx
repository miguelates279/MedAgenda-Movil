import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

export type FieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  rules?: RegisterOptions<TFieldValues, TName>;
  defaultValue?: string;
  className?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

import { tokens } from '../theme/tokens';

export function Field<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  multiline = false,
  numberOfLines,
  rules,
  defaultValue = '',
  className = '',
  containerStyle,
  inputStyle,
}: FieldProps<TFieldValues, TName>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      defaultValue={defaultValue as any}
      render={({ field, fieldState }) => (
        <View className={`w-full mb-3 ${className}`} style={containerStyle}>
          {label ? (
            <Text className="text-sm font-medium mb-1 text-med-text-muted">{label}</Text>
          ) : null}

          <TextInput
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={() => {
              setIsFocused(false);
              field.onBlur();
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.textLight}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            className={`border rounded-med-md px-3 py-2 text-sm bg-med-bg text-med-text-main ${
              isFocused ? 'border-med-primary' : 'border-med-border'
            } ${fieldState.error ? 'border-med-error-border bg-med-error-bg' : ''} ${
              !editable ? 'bg-med-surface-muted text-med-text-light' : ''
            }`}
            style={inputStyle}
          />

          {fieldState.error ? (
            <Text className="mt-1 text-xs text-med-error-text">{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

export default Field;
