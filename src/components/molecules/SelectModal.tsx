import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../atoms/Button';

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
}) => {
  const [search, setSearch] = useState('');
  const [tempMultiSelected, setTempMultiSelected] = useState<(number | string)[]>(
    Array.isArray(selectedValue) ? selectedValue : []
  );

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      if (multiple) {
        setTempMultiSelected(Array.isArray(selectedValue) ? selectedValue : []);
      }
    }
  }, [isOpen, selectedValue, multiple]);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
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
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
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

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <SafeAreaView className="bg-white rounded-t-2xl max-h-[85%] min-h-[50%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-base font-bold text-neutral-900">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1" activeOpacity={0.7}>
              <Text className="text-lg text-gray-600 font-semibold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="px-4 py-2.5 border-b border-gray-100">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-neutral-900"
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          {loading ? (
            <View className="p-8 items-center">
              <Text className="text-sm text-gray-600">Cargando opciones...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => String(item.value)}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const checked = isSelected(item.value);
                return (
                  <Pressable
                    onPress={() => handleItemPress(item.value)}
                    className={`flex-row justify-between items-center px-4 py-3 border-b border-gray-100 active:bg-gray-100 ${
                      checked ? 'bg-[#e6f4f2]' : ''
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        checked ? 'text-primary font-semibold' : 'text-neutral-900'
                      }`}
                    >
                      {item.label}
                    </Text>
                    {checked && <Text className="text-primary text-base font-bold">✓</Text>}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View className="p-6 items-center">
                  <Text className="text-sm text-gray-400">No se encontraron resultados</Text>
                </View>
              }
            />
          )}

          {/* Multi-Select Action Footer */}
          {multiple && (
            <View className="p-4 border-t border-gray-200">
              <Button
                text={`Confirmar (${tempMultiSelected.length})`}
                onPress={handleConfirmMulti}
                variant="primary"
              />
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default SelectModal;
