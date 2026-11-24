import React, { useState } from 'react';
import {
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from './Button';
import { ModalViewport } from './ModalViewport';

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
    <View
      className="bg-white rounded-t-2xl"
      style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <FlatList
        style={{ flex: 1, minHeight: 0 }}
        data={loading ? [] : filteredItems}
        extraData={multiple ? tempMultiSelected : selectedValue}
        keyExtractor={(item) => String(item.value)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row justify-between items-center px-4 pt-2 pb-2 border-b border-gray-200">
              <Text
                className="text-base font-bold text-neutral-900 flex-1 mr-2"
                accessibilityRole="header"
              >
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Cerrar ${title}`}
              >
                <Text className="text-lg text-gray-600 font-semibold">✕</Text>
              </Pressable>
            </View>
            <View className="px-4 py-2.5 border-b border-gray-100">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                accessibilityLabel={`Buscar en ${title}`}
                className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-neutral-900"
                style={{ minHeight: 44 }}
                clearButtonMode="while-editing"
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const checked = isSelected(item.value);
          return (
            <Pressable
              onPress={() => handleItemPress(item.value)}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked }}
              accessibilityLabel={item.label}
              style={{ minHeight: 48 }}
              className={`flex-row justify-between items-center px-4 py-3 border-b border-gray-100 active:bg-gray-100 ${checked ? 'bg-[#e6f4f2]' : ''}`}
            >
              <Text
                className={`text-sm flex-1 mr-3 ${checked ? 'text-primary font-semibold' : 'text-neutral-900'}`}
              >
                {item.label}
              </Text>
              {checked && (
                <Text className="text-primary text-base font-bold">✓</Text>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="p-6 items-center">
            {loading && <ActivityIndicator color="#259487" />}
            <Text className="text-sm text-gray-600">
              {loading
                ? 'Cargando opciones...'
                : 'No se encontraron resultados'}
            </Text>
          </View>
        }
        ListFooterComponent={
          multiple ? (
            <View className="p-4 border-t border-gray-200">
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
    </View>
  );

  if (embedded) return isOpen ? content : null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ModalViewport style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ flex: 1, minHeight: 0, justifyContent: 'flex-end' }}>
          <View
            style={{
              height: '85%',
              maxHeight: '100%',
              minHeight: 0,
              flexShrink: 1,
            }}
          >
            {content}
          </View>
        </View>
      </ModalViewport>
    </Modal>
  );
};

export default SelectModal;
