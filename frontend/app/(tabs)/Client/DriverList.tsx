import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';
import { Ionicons } from '@expo/vector-icons';
import { Driver } from '../types';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';

interface RideDetails {
  sourceLat?: string;
  sourceLng?: string;
  destLat?: string;
  destLng?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  fuelType?: string;
  vehicleType?: string;
  tripType?: string;
  time?: string;
  estimatedPrice?: string;
  distance?: string;
  duration?: string;
  rideId?: string;
  driverPayment?: string;
}

const DriverList: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  // Extract ride details from params with proper field mapping
  const rideDetails: RideDetails = {
    sourceLat: params.sourceLat as string || params.pickup_latitude as string,
    sourceLng: params.sourceLng as string || params.pickup_longitude as string,
    destLat: params.destLat as string || params.dropoff_latitude as string,
    destLng: params.destLng as string || params.dropoff_longitude as string,
    pickupLocation: params.pickupLocation as string || params.pickup_location as string || params.from as string || 'Selected Pickup Location',
    dropoffLocation: params.dropoffLocation as string || params.dropoff_location as string || params.to as string || 'Selected Dropoff Location',
    fuelType: params.fuelType as string || params.fuel_type as string || 'petrol',
    vehicleType: params.vehicleType as string || params.vehicle_type as string || 'car',
    tripType: params.tripType as string || params.trip_type as string || 'one_way',
    time: params.time as string,
    estimatedPrice: params.estimatedPrice as string || params.fare as string,
    distance: params.distance as string,
    duration: params.duration as string,
    rideId: params.rideId as string,
    driverPayment: params.driverPayment as string,
  };
  
  const fetchDrivers = async (): Promise<void> => {
    try {
      const response = await api.get('/available-drivers/');
      if (response.data && response.data.drivers) {
        setDrivers(response.data.drivers);
      } else {
        setDrivers([]);
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to fetch drivers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchDrivers();
  }, []);
  
  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchDrivers();
  };
  
  const handleDriverSelect = (driver: Driver): void => {
    const navigationParams = {
      driverId: driver.id.toString(),
      ...rideDetails,
      ...params,
    };
    
    if (!rideDetails.pickupLocation || !rideDetails.dropoffLocation || !rideDetails.vehicleType) {
      Alert.alert(
        'Missing Information',
        'Some ride details are missing. Please go back and complete your booking.',
        [
          { text: 'Go Back', onPress: () => router.back() },
          { text: 'Continue Anyway', onPress: () => navigateToDriverDetails(navigationParams) }
        ]
      );
      return;
    }
    
    navigateToDriverDetails(navigationParams);
  };
  
  const navigateToDriverDetails = (navigationParams: Record<string, any>): void => {
    router.push({
      pathname: '/(tabs)/Driver/DriverDetails',
      params: navigationParams,
    });
  };
  
  const renderDriverItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverHeader}>
        {item.dp_url ? (
          <Image source={{ uri: item.dp_url }} style={styles.driverImage} />
        ) : (
          <View style={[styles.placeholderImage, { borderColor: '#00008B', borderWidth: 2 }]}>
            <Text style={styles.placeholderText}>👤</Text>
          </View>
        )}
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{item.full_name || 'Unnamed Driver'}</Text>
          <Text style={styles.driverContact}>{item.phone_number || 'No phone number'}</Text>
          <Text style={styles.driverLocation}>{item.city || 'Unknown location'}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.availableButton}
        onPress={() => handleDriverSelect(item)}
      >
        <Text style={styles.availableButtonText}>Select</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading drivers...</Text>
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
          <Text style={styles.title}>Available Drivers</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="menu" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Driver List */}
        {drivers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No drivers available at the moment</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={drivers}
            renderItem={renderDriverItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}
        
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100, // Space for bottom tabs
    paddingTop: 10,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 4,
    borderColor: '#03035fff',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 28,
  },
  driverDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  driverContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  driverLocation: {
    fontSize: 12,
    color: '#888',
  },
  availableButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  availableButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DriverList;