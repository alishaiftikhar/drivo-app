import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';
import MyButton from '@/components/MyButton';
import api from '@/constants/apiConfig';

// Define API endpoints locally since the import is failing
const API_ENDPOINTS = {
  DRIVER: {
    RESPOND_RIDE: (requestId: string) => `/driver/respond-ride/${requestId}/`,
  }
};

const ClientDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Extract parameters from the route
  const rideRequestId = params.rideRequestId as string;
  const driverId = params.driverId as string;
  const clientId = params.clientId as string;
  const clientName = params.clientName as string;
  const clientPhone = params.clientPhone as string;
  const clientDpUrl = params.clientDpUrl as string;
  const pickupLocation = params.pickupLocation as string;
  const dropoffLocation = params.dropoffLocation as string;
  const scheduledTime = params.scheduledTime as string;
  const driverPayment = params.driverPayment as string;
  const status = params.status as string;
  
  // Extract coordinates if available
  const pickupLat = params.pickupLat ? parseFloat(params.pickupLat as string) : null;
  const pickupLng = params.pickupLng ? parseFloat(params.pickupLng as string) : null;
  const dropoffLat = params.dropoffLat ? parseFloat(params.dropoffLat as string) : null;
  const dropoffLng = params.dropoffLng ? parseFloat(params.dropoffLng as string) : null;

  const handleCallClient = () => {
    if (clientPhone && clientPhone !== 'No phone number') {
      Linking.openURL(`tel:${clientPhone}`);
    } else {
      Alert.alert('No Phone Number', 'This client has not provided a phone number.');
    }
  };

  const handleAcceptRide = async () => {
    try {
      setLoading(true);
      console.log('Accepting ride with ID:', rideRequestId);
      
      const response = await api.post(API_ENDPOINTS.DRIVER.RESPOND_RIDE(rideRequestId), {
        action: 'accept'
      });
      
      if (response.status === 200) {
        Alert.alert('Success', 'You have accepted this ride request.');
        
        // Extract ride ID from response if available
        const rideId = response.data.ride_id;
        
        // Navigate to DriverRideMap screen
        router.push({
          pathname: '/(tabs)/Driver/ActiveRide',
          params: {
            rideRequestId,
            rideId: rideId || '',
            driverId,
            clientId,
            clientName,
            clientPhone,
            clientDpUrl,
            pickupLocation,
            dropoffLocation,
            scheduledTime,
            driverPayment,
            // Include coordinates if available
            pickupLat: pickupLat?.toString() || '',
            pickupLng: pickupLng?.toString() || '',
            dropoffLat: dropoffLat?.toString() || '',
            dropoffLng: dropoffLng?.toString() || '',
          }
        });
      } else {
        Alert.alert('Error', 'Failed to accept ride request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Show more specific error message
        if (error.response.data && error.response.data.error) {
          Alert.alert('Error', error.response.data.error);
        } else {
          Alert.alert('Error', 'Failed to accept ride request. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRide = async () => {
    Alert.alert(
      'Reject Ride',
      'Are you sure you want to reject this ride request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Rejecting ride with ID:', rideRequestId);
              
              const response = await api.post(API_ENDPOINTS.DRIVER.RESPOND_RIDE(rideRequestId), {
                action: 'reject'
              });
              
              if (response.status === 200) {
                Alert.alert('Success', 'You have rejected this ride request.');
                router.back();
              } else {
                Alert.alert('Error', 'Failed to reject ride request. Please try again.');
              }
            } catch (error: any) {
              console.error('Error rejecting ride:', error);
              if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                
                // Show more specific error message
                if (error.response.data && error.response.data.error) {
                  Alert.alert('Error', error.response.data.error);
                } else {
                  Alert.alert('Error', 'Failed to reject ride request. Please try again.');
                }
              } else {
                Alert.alert('Error', 'Network error. Please check your connection.');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'Not specified';
    
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={30} color="#010156ff" />
        </TouchableOpacity>
        <Text style={styles.title}>Client Details</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color="#010156ff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.profileContainer}>
            {clientDpUrl && clientDpUrl !== '' ? (
              <Image source={{ uri: clientDpUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>👤</Text>
              </View>
            )}
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{clientName}</Text>
              <Text style={styles.profilePhone}>{clientPhone}</Text>
              <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.callButtonText}>Call Client</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Ride Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Location:</Text>
            <Text style={styles.detailValue}>{pickupLocation}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dropoff Location:</Text>
            <Text style={styles.detailValue}>{dropoffLocation}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Time:</Text>
            <Text style={styles.detailValue}>{formatDateTime(scheduledTime)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Driver Payment:</Text>
            <Text style={styles.detailValue}>${driverPayment}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: status === 'requested' ? '#FF9800' : '#4CAF50' }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAcceptRide}
            disabled={loading}
          >
            <Text style={styles.acceptButtonText}>Accept Ride</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRejectRide}
            disabled={loading}
          >
            <Text style={styles.rejectButtonText}>Reject Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Sidebar + Tabs */}
      <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#03035fff',
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#03035fff',
  },
  placeholderText: {
    fontSize: 36,
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  profilePhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ClientDetails;