import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from './Button';

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
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando opciones...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => String(item.value)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const checked = isSelected(item.value);
                return (
                  <Pressable
                    onPress={() => handleItemPress(item.value)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      checked && styles.itemRowSelected,
                      pressed && styles.itemRowPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        checked && styles.itemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron resultados</Text>
                </View>
              }
            />
          )}

          {/* Multi-Select Action Footer */}
          {multiple && (
            <View style={styles.footer}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#4b5563',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#171717',
  },
  listContent: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemRowSelected: {
    backgroundColor: '#e6f4f2',
  },
  itemRowPressed: {
    backgroundColor: '#f3f4f6',
  },
  itemText: {
    fontSize: 14,
    color: '#171717',
  },
  itemTextSelected: {
    color: '#259487',
    fontWeight: '600',
  },
  checkmark: {
    color: '#259487',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#4b5563',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default SelectModal;
