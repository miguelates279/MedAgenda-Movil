import { AppModal } from './AppModal';
import React, { useState } from 'react';
import {
  FlatList,
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from './Button';
import { ModalViewport } from './ModalViewport';
import { ClayPressable, ClaySurface } from './ClaySurface';
import { tokens } from '../theme/tokens';
import { clayClasses } from '../theme/clay';

export interface SelectOption {
  label: string;
  value: number | string;
}

export interface SelectModalProps {
  title: string;
  items: SelectOption[];
  selectedValue?: number | string | (number | string)[] | null;
  multiple?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: any) => void;
  placeholder?: string;
  loading?: boolean;
  embedded?: boolean;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  title,
  items,
  selectedValue,
  multiple = false,
  isOpen,
  onClose,
  onSelect,
  placeholder = 'Buscar...',
  loading = false,
  embedded = false,
}) => {
  const [search, setSearch] = useState('');
  const [tempMultiSelected, setTempMultiSelected] = useState<
    (number | string)[]
  >(Array.isArray(selectedValue) ? selectedValue : []);

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      if (multiple) {
        setTempMultiSelected(Array.isArray(selectedValue) ? selectedValue : []);
      }
    }
  }, [isOpen, selectedValue, multiple]);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const isSelected = (value: number | string) => {
    if (multiple) {
      return tempMultiSelected.includes(value);
    }
    return selectedValue === value;
  };

  const handleItemPress = (value: number | string) => {
    if (multiple) {
      setTempMultiSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
    } else {
      onSelect(value);
      onClose();
    }
  };

  const handleConfirmMulti = () => {
    onSelect(tempMultiSelected);
    onClose();
  };

  const content = (
    <ClaySurface
      depth="dialog"
      className="flex-1 min-h-0 overflow-hidden bg-med-bg rounded-t-dialog"
    >
      <FlatList
        className="flex-1 min-h-0"
        data={loading ? [] : filteredItems}
        extraData={multiple ? tempMultiSelected : selectedValue}
        keyExtractor={(item) => String(item.value)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        contentContainerClassName="pb-2"
        ListHeaderComponent={
          <View>
            <View className="flex-row justify-between items-center px-4 pt-2 pb-2 border-b border-med-border-light">
              <Text
                className="text-base font-bold text-med-text-main flex-1 min-w-0 mr-2"
                accessibilityRole="header"
              >
                {title}
              </Text>
              <ClayPressable
                onPress={onClose}
                className="min-w-touch min-h-touch items-center justify-center rounded-control bg-med-bg"
                accessibilityRole="button"
                accessibilityLabel={`Cerrar ${title}`}
              >
                <Text className="text-lg text-med-text-muted font-semibold">
                  ✕
                </Text>
              </ClayPressable>
            </View>
            <View className="px-4 py-2.5 border-b border-med-border-light">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={placeholder}
                placeholderTextColor={tokens.colors.textLight}
                accessibilityLabel={`Buscar en ${title}`}
                className={`${clayClasses.inset} min-h-search bg-med-surface border border-med-border rounded-input px-3 py-2 text-sm text-med-text-main`}

                clearButtonMode="while-editing"
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const checked = isSelected(item.value);
          return (
            <ClayPressable
              depth={checked ? 'inset' : 'control'}
              onPress={() => handleItemPress(item.value)}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked }}
              accessibilityLabel={item.label}
              className={`min-h-touch flex-row justify-between items-center px-4 py-3 rounded-control border-b border-med-border-light active:bg-med-surface-muted ${checked ? 'bg-med-primary-light' : 'bg-med-bg'}`}
            >
              <Text
                className={`text-sm flex-1 min-w-0 mr-3 ${checked ? 'text-med-primary font-semibold' : 'text-med-text-main'}`}
              >
                {item.label}
              </Text>
              {checked && (
                <Text className="text-med-primary text-base font-bold">✓</Text>
              )}
            </ClayPressable>
          );
        }}
        ListEmptyComponent={
          <View className="p-6 items-center">
            {loading && (
              <ActivityIndicator
                color={tokens.colors.primary}
                size={tokens.indicator.sm}
              />
            )}
            <Text className="text-sm text-med-text-muted">
              {loading
                ? 'Cargando opciones...'
                : 'No se encontraron resultados'}
            </Text>
          </View>
        }
        ListFooterComponent={
          multiple ? (
            <View className="p-4 border-t border-med-border-light">
              <Button
                text={`Confirmar (${tempMultiSelected.length})`}
                onPress={handleConfirmMulti}
                variant="primary"
                disabled={loading}
              />
            </View>
          ) : null
        }
      />
    </ClaySurface>
  );

  if (embedded) return isOpen ? content : null;

  return (
    <AppModal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ModalViewport style={{ backgroundColor: tokens.colors.overlaySoft }}>
        <View className="flex-1 min-h-0 justify-end">
          <View className="h-select max-h-full min-h-0 shrink">{content}</View>
        </View>
      </ModalViewport>
    </AppModal>
  );
};

export default SelectModal;
