import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
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
        <View style={[styles.container, containerStyle]}>
          {label ? <Text style={styles.label}>{label}</Text> : null}

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
            style={[
              styles.input,
              isFocused ? styles.inputFocused : null,
              fieldState.error ? styles.inputError : null,
              !editable ? styles.inputDisabled : null,
              inputStyle,
            ]}
          />

          {fieldState.error ? (
            <Text style={styles.error}>{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#4b5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#171717',
  },
  inputFocused: {
    borderColor: '#259487',
  },
  inputError: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#991b1b',
  },
});

export default Field;
