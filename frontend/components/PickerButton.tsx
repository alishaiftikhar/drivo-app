// frontend/components/PickerButton.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import Colors from '@/constants/Color';
import { Ionicons } from '@expo/vector-icons';

interface PickerItem<T = string | number> {
  label: string;
  value: T;
}

interface PickerButtonProps<T = string | number> {
  placeholder: string;
  items: PickerItem<T>[];
  selectedValue: T | null;
  onValueChange: (value: T) => void;
}

const PickerButton = <T extends string | number>({
  placeholder,
  items,
  selectedValue,
  onValueChange,
}: PickerButtonProps<T>) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const getSelectedLabel = () => {
    if (selectedValue === null || selectedValue === undefined) return placeholder;
    const selectedItem = items.find(item => item.value === selectedValue);
    return selectedItem ? selectedItem.label : placeholder;
  };

  const renderItem = ({ item }: { item: PickerItem<T> }) => (
    <TouchableOpacity
      style={styles.pickerItem}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
    >
      <Text style={styles.pickerItemText}>{item.label}</Text>
      {selectedValue === item.value && (
        <Ionicons name="checkmark" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerButtonText}>{getSelectedLabel()}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.value.toString()}
              style={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: Colors.primary,
    borderWidth: 3,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PickerButton;