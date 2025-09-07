import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MyButton from '@/components/MyButton';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';

interface Ride {
  id: string;
  source_lat?: string;
  source_lng?: string;
  dest_lat?: string;
  dest_lng?: string;
  fuel_type?: string;
  vehicle_type?: string;
  time?: string;
  estimated_price?: string;
  distance?: string;
  duration?: string;
  driver_id?: string;
  status?: string;
  pickup_location?: string;
  dropoff_location?: string;
}

const Payment = () => {
  const { 
    rideId, 
    estimatedPrice, 
    driverId, 
    driverPayment, 
    sourceLat, 
    sourceLng, 
    destLat, 
    destLng, 
    fuelType, 
    vehicleType, 
    time, 
    distance, 
    duration 
  } = useLocalSearchParams();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('jazzcash');
  const [processing, setProcessing] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [existingPayment, setExistingPayment] = useState<any>(null);
  const router = useRouter();
  
  // Check if this is a temporary ride (from direct navigation)
  const isTempRide = rideId?.toString().startsWith('temp_');
  
  // Payment options with display names and backend values
  const paymentOptions = [
    { label: 'JazzCash', value: 'jazzcash' },
    { label: 'EasyPaisa', value: 'easypaisa' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Cash', value: 'cash' },
    { label: 'Card', value: 'card' },
    { label: 'Wallet', value: 'wallet' }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Only fetch ride details if it's not a temporary ride
        if (!isTempRide && rideId) {
          const response = await api.get(`/rides/${rideId}/`);
          setRide(response.data);
          
          // Check if payment already exists for this ride
          await checkExistingPayment(rideId as string);
        } else if (isTempRide) {
          // Create a ride object from the parameters for temporary rides
          setRide({
            id: rideId as string,
            source_lat: sourceLat as string,
            source_lng: sourceLng as string,
            dest_lat: destLat as string,
            dest_lng: destLng as string,
            fuel_type: fuelType as string,
            vehicle_type: vehicleType as string,
            time: time as string,
            estimated_price: estimatedPrice as string,
            distance: distance as string,
            duration: duration as string,
            driver_id: driverId as string,
            status: 'requested',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show alert for temporary rides
        if (!isTempRide) {
          Alert.alert('Error', 'Failed to load ride details');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [rideId, isTempRide, sourceLat, sourceLng, destLat, destLng, fuelType, vehicleType, time, estimatedPrice, distance, duration, driverId]);
  
  const getClientProfile = async () => {
    try {
      const response = await api.get('/client-profile/');
      return response.data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      throw error;
    }
  };
  
  const checkExistingPayment = async (rideId: string) => {
    try {
      const response = await api.get(`/payments/?ride=${rideId}`);
      if (response.data.count > 0) {
        setExistingPayment(response.data.results[0]);
        return response.data.results[0];
      }
      setExistingPayment(null);
      return null;
    } catch (error) {
      console.error('Error checking existing payment:', error);
      setExistingPayment(null);
      return null;
    }
  };
  
  const createPaymentRecord = async (paymentId: string) => {
    try {
      const clientProfile = await getClientProfile();
      
      const paymentData = {
        ride: parseInt(rideId as string),
        client: clientProfile.id,
        amount: parseFloat(driverPayment as string || estimatedPrice as string),
        method: paymentMethod,
        status: 'pending',
      };
      
      console.log('Creating payment record:', paymentData);
      const response = await api.post('/payments/', paymentData);
      console.log('Payment record created:', response.data);
      
      return response.data.id;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  };
  
  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const response = await api.patch(`/payments/${paymentId}/`, {
        status: status
      });
      console.log('Payment status updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  };
  
  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      if (existingPayment) {
        // Update existing payment
        await updatePaymentStatus(existingPayment.id, 'completed');
        
        Alert.alert('Success', 'Payment processed successfully!');
        
        // Navigate back or to ride details
        router.push({
          pathname: '/(tabs)/Client/RideTracking',
          params: { 
            rideId: rideId as string,
          }
        });
      } else {
        // Create new payment
        const paymentId = `pay_${Date.now()}`;
        const paymentRecordId = await createPaymentRecord(paymentId);
        
        // Get the selected payment option label for display
        const selectedOption = paymentOptions.find(option => option.value === paymentMethod);
        const paymentMethodLabel = selectedOption ? selectedOption.label : paymentMethod;
        
        // Navigate to PaymentDetails screen
        router.push({
          pathname: '/(tabs)/Client/PaymentDetails',
          params: { 
            rideId: rideId as string,
            driverId: driverId as string,
            estimatedPrice: estimatedPrice as string,
            driverPayment: driverPayment as string,
            paymentMethod: paymentMethodLabel,
            paymentId: paymentRecordId.toString(),
            sourceLat: sourceLat as string,
            sourceLng: sourceLng as string,
            destLat: destLat as string,
            destLng: destLng as string,
            pickupLocation: ride?.pickup_location,
            dropoffLocation: ride?.dropoff_location,
            distance: distance as string,
            duration: duration as string,
          }
        });
      }
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Show detailed error message
      let errorMessage = 'Payment failed';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        const errorData = error.response.data;
        const errorMessages: string[] = [];
        
        if (typeof errorData === 'object') {
          for (const [field, message] of Object.entries(errorData)) {
            if (Array.isArray(message)) {
              errorMessages.push(`${field}: ${message.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${message}`);
            }
          }
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  const handlePaymentMethodSelect = (value: string) => {
    setPaymentMethod(value);
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }
  
  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load ride details</Text>
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
          <Text style={styles.headerText}>Payment</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="menu" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Show existing payment info if available */}
        {existingPayment && (
          <View style={styles.existingPaymentContainer}>
            <Text style={styles.existingPaymentText}>
              You have an existing {existingPayment.method} payment of Rs. {existingPayment.amount}
            </Text>
            <Text style={styles.existingPaymentStatus}>
              Status: {existingPayment.status}
            </Text>
          </View>
        )}
        
        <View style={styles.rideDetailsContainer}>
          <Text style={styles.rideDetailText}>Ride ID: {ride.id}</Text>
          <Text style={styles.rideDetailText}>Driver ID: {driverId}</Text>
          <Text style={styles.driverPaymentText}>Driver Payment: Rs. {driverPayment || estimatedPrice}</Text>
        </View>
        
        {!existingPayment && (
          <View style={styles.paymentMethodContainer}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentOptions}>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.paymentOption,
                    paymentMethod === option.value && styles.selectedPaymentOption
                  ]}
                  onPress={() => handlePaymentMethodSelect(option.value)}
                >
                  <Text style={[
                    styles.paymentOptionText,
                    paymentMethod === option.value && styles.selectedPaymentOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <MyButton 
            title={processing ? "Processing..." : existingPayment ? "Complete Payment" : `Pay Rs. ${driverPayment || estimatedPrice}`} 
            onPress={handlePayment} 
            disabled={processing}
          />
        </View>
        
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  existingPaymentContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  existingPaymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1976d2',
    marginBottom: 5,
  },
  existingPaymentStatus: {
    fontSize: 14,
    color: '#666',
  },
  rideDetailsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  rideDetailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  driverPaymentText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#4CAF50',
    textAlign: 'center',
  },
  paymentMethodContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  paymentOptions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  paymentOption: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedPaymentOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPaymentOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default Payment;