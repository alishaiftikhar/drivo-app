import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Keyboard, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';
import { Driver } from '../types';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';

interface RideDetails {
  pickup_location?: string;
  dropoff_location?: string;
  pickup_latitude?: string;
  pickup_longitude?: string;
  dropoff_latitude?: string;
  dropoff_longitude?: string;
  vehicle_type?: string;
  fuel_type?: string;
  trip_type?: string;
  fare?: string;
  distance?: string;
  duration?: string;
  time?: string;
  rideId?: string;
  driverPayment?: string;
}

const DriverDetails = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'confirmed' | 'rejected'>('calling');
  const [rideRequestId, setRideRequestId] = useState<string>('');
  
  const driverId = params.driverId as string;
  
  // Extract ride details from params
  const rideDetails: RideDetails = {
    pickup_location: params.pickupLocation as string || params.pickup_location as string,
    dropoff_location: params.dropoffLocation as string || params.dropoff_location as string,
    pickup_latitude: params.sourceLat as string || params.pickup_latitude as string,
    pickup_longitude: params.sourceLng as string || params.pickup_longitude as string,
    dropoff_latitude: params.destLat as string || params.dropoff_latitude as string,
    dropoff_longitude: params.destLng as string || params.dropoff_longitude as string,
    vehicle_type: params.vehicleType as string || params.vehicle_type as string,
    fuel_type: params.fuelType as string || params.fuel_type as string,
    trip_type: params.trip_type as string || 'one_way',
    fare: params.estimatedPrice as string || params.fare as string,
    distance: params.distance as string,
    duration: params.duration as string,
    time: params.time as string,
    rideId: params.rideId as string,
    driverPayment: params.driverPayment as string,
  };
  
  // Helper function to safely parse date
  const parseDate = (dateString?: string): string | null => {
    if (!dateString) return null;
    
    try {
      // Handle time-only strings like "6:24 PM"
      if (dateString.includes(':') && dateString.includes(' ') && !dateString.includes('T')) {
        // It's a time-only string, create a date with today's date
        const today = new Date();
        const [time, modifier] = dateString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (modifier === 'PM' && hours < 12) {
          hours += 12;
        } else if (modifier === 'AM' && hours === 12) {
          hours = 0;
        }
        
        today.setHours(hours, minutes, 0, 0);
        return today.toISOString();
      }
      
      // Try to create a date object
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return null;
    }
  };
  
  // Function to simulate making a call to the driver
  const makeDriverCall = () => {
    setCallModalVisible(true);
    setCallStatus('calling');
    
    // Simulate call ending after 5 seconds
    setTimeout(() => {
      if (callStatus === 'calling') {
        setCallStatus('rejected');
      }
    }, 5000);
  };
  
  // Handle ride confirmation after call
  const handleRideConfirmation = (confirmed: boolean) => {
    setCallModalVisible(false);
    
    if (confirmed) {
      // Navigate to payment screen
      router.push({
        pathname: '/(tabs)/Client/Payment',
        params: {
          rideRequestId: rideRequestId,
          driverId: driverId,
          estimatedPrice: rideDetails.fare || '0',
          driverPayment: rideDetails.driverPayment
        }
      });
    } else {
      // Navigate back to driver list
      router.push('/(tabs)/Client/DriverList');
    }
  };
  
  // Improved function to safely create a ride request
  const createRideRequest = async (): Promise<void> => {
    setSendingRequest(true);
    
    try {
      // Validate required fields
      if (!rideDetails.pickup_location || !rideDetails.dropoff_location) {
        throw new Error('Pickup and drop-off locations are required');
      }
      
      // Safely parse the scheduled datetime
      const scheduledDatetime = parseDate(rideDetails.time);
      const finalScheduledDatetime = scheduledDatetime || new Date().toISOString();
      
      // Prepare ride request data with proper defaults
      const requestData = {
        pickup_location: rideDetails.pickup_location || 'Not specified',
        dropoff_location: rideDetails.dropoff_location || 'Not specified',
        pickup_latitude: rideDetails.pickup_latitude ? parseFloat(rideDetails.pickup_latitude) : 0,
        pickup_longitude: rideDetails.pickup_longitude ? parseFloat(rideDetails.pickup_longitude) : 0,
        dropoff_latitude: rideDetails.dropoff_latitude ? parseFloat(rideDetails.dropoff_latitude) : 0,
        dropoff_longitude: rideDetails.dropoff_longitude ? parseFloat(rideDetails.dropoff_longitude) : 0,
        scheduled_datetime: finalScheduledDatetime,
        vehicle_type: rideDetails.vehicle_type || 'Car',
        fuel_type: rideDetails.fuel_type || 'Petrol',
        trip_type: rideDetails.trip_type || 'one_way',
        estimated_fare: rideDetails.fare ? parseFloat(rideDetails.fare) : 0,
      };
      
      console.log('Creating ride request with data:', requestData);
      
      // Create the ride request
      const response = await api.post('/ride-request/', requestData);
      console.log('Full ride request response:', response);
      console.log('Ride request response data:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response: no data received from server');
      }
      
      // Try to find the ID in different possible locations
      let requestId = null;
      
      // Check for direct ID field
      if (response.data.id) {
        requestId = response.data.id;
      }
      // Check for nested ride_request object
      else if (response.data.ride_request && response.data.ride_request.id) {
        requestId = response.data.ride_request.id;
      }
      // Check for other common ID field names
      else if (response.data.ride_request_id) {
        requestId = response.data.ride_request_id;
      }
      else if (response.data.request_id) {
        requestId = response.data.request_id;
      }
      else if (response.data.rideId) {
        requestId = response.data.rideId;
      }
      // If response is just the ID string
      else if (typeof response.data === 'string') {
        requestId = response.data;
      }
      
      // If we still don't have an ID, log the full response and throw an error
      if (!requestId) {
        console.error('Response data structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response: missing ride request ID');
      }
      
      // Convert to string if it's a number
      requestId = requestId.toString();
      setRideRequestId(requestId);
      
      console.log('Extracted ride request ID:', requestId);
      
      // Assign the driver to the ride request
      await assignDriverToRideRequest(requestId);
      
      // Show call modal after successful request
      makeDriverCall();
      
    } catch (error: any) {
      console.error('Error creating ride request:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to create ride request';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSendingRequest(false);
    }
  };
  
  const assignDriverToRideRequest = async (requestId: string): Promise<void> => {
    try {
      console.log(`Assigning driver ${driverId} to ride request ${requestId}`);
      
      const response = await api.patch(`/ride-requests/${requestId}/assign-driver/`, {
        driver_id: parseInt(driverId)
      });
      
      console.log('Driver assigned to ride request:', response.data);
      
    } catch (error: any) {
      console.error('Error assigning driver to ride request:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to assign driver to ride request';
      Alert.alert('Error', errorMessage);
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchDriverDetails = async (): Promise<void> => {
      if (!driverId) {
        setError('No driver ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching driver details for ID: ${driverId}`);
        const response = await api.get(`/drivers/${driverId}/`);
        console.log('Driver details response:', response.data);
        setDriver(response.data);
      } catch (error: any) {
        console.error('Error fetching driver details:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to fetch driver details';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverDetails();
  }, [driverId]);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading driver details...</Text>
      </View>
    );
  }
  
  if (error || !driver) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Driver not found'}</Text>
        <Text style={styles.debugInfo}>Driver ID: {driverId || 'Not provided'}</Text>
      </View>
    );
  }
  
  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      if (menuOpen) setMenuOpen(false);
    }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Driver Details</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="menu" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Driver profile picture */}
          {driver.dp_url ? (
            <Image source={{ uri: driver.dp_url }} style={styles.driverImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>👤</Text>
            </View>
          )}
          
          {/* Driver information */}
          <View style={styles.infoSection}>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{driver.full_name || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{driver.phone_number || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.value}>{driver.city || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>License:</Text>
              <Text style={styles.value}>{driver.driving_license || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>License Expiry:</Text>
              <Text style={styles.value}>
                {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString() : 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{driver.age || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>CNIC:</Text>
              <Text style={styles.value}>{driver.cnic || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[
                styles.value, 
                { color: driver.status === 'available' ? '#4CAF50' : 
                         driver.status === 'offline' ? '#F44336' : '#2196F3' }
              ]}>
                {driver.status || 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{driver.user?.email || 'Not provided'}</Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Request Ride Button */}
        <View style={styles.buttonContainer}>
          {sendingRequest ? (
            <View style={styles.requestingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.requestingText}>Creating Request...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.requestButton} 
              onPress={createRideRequest}
            >
              <Text style={styles.requestButtonText}>🚗 Request Ride</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Call Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={callModalVisible}
          onRequestClose={() => {
            setCallModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.callIconContainer}>
                <Ionicons name="call" size={60} color={callStatus === 'calling' ? Colors.primary : 
                                                         callStatus === 'confirmed' ? '#4CAF50' : '#F44336'} />
              </View>
              
              <Text style={styles.modalTitle}>
                {callStatus === 'calling' ? 'Calling Driver...' : 
                 callStatus === 'confirmed' ? 'Ride Confirmed!' : 'Ride Rejected'}
              </Text>
              
              <Text style={styles.modalMessage}>
                {callStatus === 'calling' ? `Please wait while we connect you to ${driver.full_name || 'the driver'}` : 
                 callStatus === 'confirmed' ? 'Your ride has been confirmed. Proceed to payment.' : 
                 'The driver was not available. Please try another driver.'}
              </Text>
              
              {callStatus === 'calling' ? (
                <View style={styles.callButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.callButton, styles.rejectButton]} 
                    onPress={() => handleRideConfirmation(false)}
                  >
                    <Ionicons name="call" size={24} color="white" />
                    <Text style={styles.callButtonText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.callButton, styles.confirmButton]} 
                    onPress={() => handleRideConfirmation(true)}
                  >
                    <Ionicons name="checkmark" size={24} color="white" />
                    <Text style={styles.callButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => handleRideConfirmation(callStatus === 'confirmed')}
                >
                  <Text style={styles.modalCloseButtonText}>
                    {callStatus === 'confirmed' ? 'Proceed to Payment' : 'Find Another Driver'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Sidebar + Tabs */}
        <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
        <BottomTabs />
      </View>
    </TouchableWithoutFeedback>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.primary,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  debugInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  driverImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderText: {
    fontSize: 40,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontWeight: 'bold',
    width: 120,
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#555',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  requestButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestingContainer: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  requestingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  callIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666',
  },
  callButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalCloseButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverDetails;