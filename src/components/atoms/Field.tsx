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
            <Text className="text-sm font-medium mb-1 text-gray-700">{label}</Text>
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
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            className={`border rounded-md px-3 py-2 text-sm bg-white text-neutral-900 ${
              isFocused ? 'border-primary' : 'border-gray-300'
            } ${fieldState.error ? 'border-red-300 bg-red-50' : ''} ${
              !editable ? 'bg-gray-100 text-gray-400' : ''
            }`}
            style={inputStyle}
          />

          {fieldState.error ? (
            <Text className="mt-1 text-xs text-red-700">{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

export default Field;
