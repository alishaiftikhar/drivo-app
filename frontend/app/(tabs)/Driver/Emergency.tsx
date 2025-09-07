import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import BottomIcons from '../Client/Icons/BottomIcons';

const Emergency = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const emergencyContacts = [
    { name: 'Police', number: '15', icon: 'shield-checkmark' },
    { name: 'Rescue 1122', number: '1122', icon: 'medkit' },
    { name: 'Family', number: '', icon: 'people' },
  ];

  const handleCall = (number: string) => {
    if (number) {
      Linking.openURL(`tel:${number}`);
    } else {
      Alert.alert('Select Contact', 'Please select a family member to call');
    }
  };

  const handleSendSMS = async (number: string) => {
    if (!number) {
      Alert.alert('Select Contact', 'Please select a family member to send SMS');
      return;
    }

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(
          number,
          'I am in an emergency situation. Please help me!'
        );
        if (result === 'sent') {
          Alert.alert('Success', 'Emergency SMS sent successfully');
        } else {
          Alert.alert('Error', 'Failed to send SMS');
        }
      } else {
        Alert.alert('Error', 'SMS service is not available on this device');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to send SMS');
    }
  };

  const handleShareLocation = async () => {
    try {
      await Share.share({
        message: 'I need help! This is my current location.',
        title: 'Emergency Alert',
      });
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Tap on any contact to get immediate help</Text>
      </View>

      <View style={styles.contactsContainer}>
        {emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Ionicons name={contact.icon as any} size={30} color="#4CAF50" />
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>{contact.number || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]} 
                onPress={() => handleCall(contact.number)}
              >
                <Ionicons name="call" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.smsButton]} 
                onPress={() => handleSendSMS(contact.number)}
              >
                <Ionicons name="mail" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.additionalActions}>
        <TouchableOpacity style={styles.actionCard} onPress={handleShareLocation}>
          <Ionicons name="share-social" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>Share Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => Linking.openURL('tel:15')}>
          <Ionicons name="alert-circle" size={24} color="#F44336" />
          <Text style={styles.actionText}>Call Police</Text>
        </TouchableOpacity>
      </View>

      <BottomIcons />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  contactsContainer: {
    padding: 20,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactDetails: {
    marginLeft: 15,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  smsButton: {
    backgroundColor: '#2196F3',
  },
  additionalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
});

export default Emergency;