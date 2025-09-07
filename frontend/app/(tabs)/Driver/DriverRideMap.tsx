// DriverRideMap.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';
import MyButton from '@/components/MyButton';

const { width, height } = Dimensions.get('window');

const DriverRideMap = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  
  // Extract parameters
  const rideRequestId = params.rideRequestId as string;
  const driverId = params.driverId as string;
  const pickupLat = parseFloat(params.pickupLat as string);
  const pickupLng = parseFloat(params.pickupLng as string);
  const dropoffLat = parseFloat(params.dropoffLat as string);
  const dropoffLng = parseFloat(params.dropoffLng as string);
  const pickupLocation = params.pickupLocation as string;
  const dropoffLocation = params.dropoffLocation as string;
  const clientName = params.clientName as string;
  const driverPayment = params.driverPayment as string;

  useEffect(() => {
    // Calculate route and get distance/duration
    calculateRoute();
  }, []);

  const calculateRoute = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, we'll simulate route calculation
      // In a real app, you would use a directions API like Google Maps or Mapbox
      
      // Simulated distance and duration calculation
      const simulatedDistance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      const simulatedDuration = Math.round(simulatedDistance * 2); // Rough estimate: 2 min per km
      
      setDistance(`${simulatedDistance.toFixed(2)} km`);
      setDuration(`${simulatedDuration} min`);
      
      // Fit map to show both markers
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: dropoffLat, longitude: dropoffLng }
            ],
            {
              edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
              animated: true
            }
          );
        }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const handleStartRide = () => {
    Alert.alert(
      'Start Ride',
      'Are you sure you want to start this ride?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: () => {
            // Fixed: Changed to the correct route name
            router.push({
              pathname: '/(tabs)/Driver/ActiveRide',
              params: {
                rideRequestId,
                driverId,
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng,
                pickupLocation,
                dropoffLocation,
                clientName,
                driverPayment,
              }
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={30} color="#010156ff" />
        </TouchableOpacity>
        <Text style={styles.title}>Ride Route</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color="#010156ff" />
        </TouchableOpacity>
      </View>
      
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: pickupLat,
          longitude: pickupLng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{ latitude: pickupLat, longitude: pickupLng }}
          title="Pickup Location"
          description={pickupLocation}
          pinColor="#4CAF50"
        />
        
        {/* Dropoff Marker */}
        <Marker
          coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
          title="Dropoff Location"
          description={dropoffLocation}
          pinColor="#F44336"
        />
        
        {/* Route Line */}
        <Polyline
          coordinates={[
            { latitude: pickupLat, longitude: pickupLng },
            { latitude: dropoffLat, longitude: dropoffLng }
          ]}
          strokeColor="#010156ff"
          strokeWidth={4}
        />
      </MapView>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#010156ff" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      )}
      
      {/* Route Info Card */}
      {!loading && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#010156ff" />
            <Text style={styles.infoText}>{clientName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>${driverPayment}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={20} color="#010156ff" />
            <Text style={styles.infoText}>{distance}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#010156ff" />
            <Text style={styles.infoText}>{duration}</Text>
          </View>
          
          <MyButton 
            title="Start Ride" 
            onPress={handleStartRide}
            style={styles.startButton}
          />
        </View>
      )}
      
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  startButton: {
    marginTop: 10,
  },
});

export default DriverRideMap;