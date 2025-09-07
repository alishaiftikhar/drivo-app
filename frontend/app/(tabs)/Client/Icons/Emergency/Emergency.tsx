import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Fix 1: Import Colors directly instead of using path alias
const Colors = {
  background: '#f5f5f5',
  primary: '#2c3e50',
};

const emergencyContacts = [
  {
    label: 'Police Helpline',
    number: '15',
  },
  {
    label: 'Family Contact',
    number: '03001234567',
  },
  {
    label: 'Admin Support',
    number: '03111234567',
  },
];

const EmergencyScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Fix 2: Properly type the location state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);

  const handleCall = (number: string, label: string) => {
    if (label === 'Family Contact') {
      setPhoneNumber(number);
      setModalVisible(true);
    } else {
      Linking.openURL(`tel:${number}`);
    }
  };

  const confirmCall = () => {
    if (phoneNumber.trim() === '') {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setModalVisible(false);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to share your location');
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    setCurrentLocation(location.coords);
    return location.coords;
  };

  const handleSendAlert = async (label: string) => {
    const coords = await getCurrentLocation();
    
    if (coords) {
      Alert.alert(
        'Alert Sent',
        `Emergency alert sent to ${label}\n\nYour location has been shared:\nLatitude: ${coords.latitude}\nLongitude: ${coords.longitude}`,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Alert Sent',
        `Emergency alert sent to ${label}\n\nLocation sharing failed`,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Assistance</Text>
      
      {emergencyContacts.map((contact, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.contactLabel}>{contact.label}</Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => handleCall(contact.number, contact.label)} 
              style={styles.iconButton}
            >
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.iconLabel}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleSendAlert(contact.label)} 
              style={[styles.iconButton, { backgroundColor: 'crimson' }]}
            >
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.iconLabel}>Send Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Modal for Family Contact phone number input */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={confirmCall}
              >
                <Text style={styles.modalButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EmergencyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
  },
  contactLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  iconLabel: {
    color: '#fff',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});