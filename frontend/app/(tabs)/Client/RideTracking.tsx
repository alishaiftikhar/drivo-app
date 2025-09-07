// RideTracking.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import MyButton from '@/components/MyButton';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface Driver {
  id: number;
  full_name: string;
  vehicle_model?: string;
  license_plate?: string;
}

interface Ride {
  id: number;
  status: string;
  driver?: number;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
}

const getParamAsString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

const RideTracking = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const rideId = getParamAsString(params.rideId);
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [rideStatus, setRideStatus] = useState<string>('accepted');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  // Fixed: Use number type instead of NodeJS.Timeout
  const [simulationInterval, setSimulationInterval] = useState<number | null>(null);
  
  useEffect(() => {
    fetchRideDetails();
    
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [rideId]);
  
  const fetchRideDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      const rideResponse = await api.get(`/rides/${rideId}/`);
      setRide(rideResponse.data);
      setRideStatus(rideResponse.data.status);
      
      // Fetch driver details if available
      if (rideResponse.data.driver) {
        const driverResponse = await api.get(`/drivers/${rideResponse.data.driver}/`);
        setDriver(driverResponse.data);
        
        // Set initial driver location to pickup location
        if (rideResponse.data.pickup_latitude && rideResponse.data.pickup_longitude) {
          setDriverLocation({
            latitude: rideResponse.data.pickup_latitude,
            longitude: rideResponse.data.pickup_longitude
          });
        }
      }
      
      // Fetch route coordinates
      if (rideResponse.data.pickup_latitude && rideResponse.data.pickup_longitude &&
          rideResponse.data.dropoff_latitude && rideResponse.data.dropoff_longitude) {
        await fetchRouteCoordinates(
          rideResponse.data.pickup_latitude,
          rideResponse.data.pickup_longitude,
          rideResponse.data.dropoff_latitude,
          rideResponse.data.dropoff_longitude
        );
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRouteCoordinates = async (
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number
  ): Promise<void> => {
    try {
      const url = new URL('https://router.project-osrm.org/route/v1/driving/' + 
        `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}`);
      
      url.searchParams.append('overview', 'full');
      url.searchParams.append('geometries', 'geojson');
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(([lng, lat]: number[]) => ({
          latitude: lat,
          longitude: lng
        }));
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error('Error fetching route coordinates:', error);
      // Create a simple straight line route as fallback
      setRouteCoordinates([
        { latitude: pickupLat, longitude: pickupLng },
        { latitude: dropoffLat, longitude: dropoffLng }
      ]);
    }
  };
  
  const calculateDistance = (
    point1: Location,
    point2: Location
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const startRideSimulation = (): void => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
    
    if (!ride || !driverLocation || !routeCoordinates.length) {
      return;
    }
    
    // Find the starting point in the route coordinates
    let startIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < routeCoordinates.length; i++) {
      const distance = calculateDistance(driverLocation, routeCoordinates[i]);
      if (distance < minDistance) {
        minDistance = distance;
        startIndex = i;
      }
    }
    
    let currentIndex = startIndex;
    
    // Fixed: Remove type annotation as setInterval returns number in React Native
    const interval = setInterval(() => {
      if (currentIndex < routeCoordinates.length - 1) {
        currentIndex += 1;
        setDriverLocation(routeCoordinates[currentIndex]);
        
        // Check if driver has reached destination
        if (ride.dropoff_latitude && ride.dropoff_longitude) {
          const distance = calculateDistance(
            routeCoordinates[currentIndex],
            { latitude: ride.dropoff_latitude, longitude: ride.dropoff_longitude }
          );
          
          if (distance < 0.1) { // If within 100 meters
            clearInterval(interval);
            completeRide();
          }
        }
      } else {
        clearInterval(interval);
        completeRide();
      }
    }, 1000);
    
    setSimulationInterval(interval);
  };
  
  const startRide = async (): Promise<void> => {
    setUpdating(true);
    try {
      await api.patch(`/rides/${rideId}/`, { status: 'started' });
      setRideStatus('started');
      Alert.alert('Ride Started', 'Your ride has started');
      
      // Start the ride simulation
      startRideSimulation();
    } catch (error) {
      console.error('Error starting ride:', error);
      Alert.alert('Error', 'Failed to start ride');
    } finally {
      setUpdating(false);
    }
  };
  
  const completeRide = async (): Promise<void> => {
    setUpdating(true);
    try {
      await api.patch(`/rides/${rideId}/`, { status: 'completed' });
      
      // Update payment status
      const paymentResponse = await api.get(`/payments/?ride=${rideId}`);
      if (paymentResponse.data.count > 0) {
        const payment = paymentResponse.data.results[0];
        await api.patch(`/payments/${payment.id}/`, { status: 'completed' });
      }
      
      setRideStatus('completed');
      Alert.alert(
        'Ride Completed',
        'Your ride has been completed successfully',
        [
          { 
            text: 'Rate Ride', 
            onPress: () => {
              // Navigate to review screen
              router.push({
                pathname: '/(tabs)/Client/Reviews' as any,
                params: { 
                  rideId, 
                  driverId: driver?.id?.toString() 
                }
              });
            }
          },
          {
            text: 'Home',
            onPress: () => {
              router.push('/(tabs)' as any);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride');
    } finally {
      setUpdating(false);
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
    }
  };
  
  const fitMapToMarkers = (): void => {
    if (mapRef.current && ride) {
      const coordinates = [];
      
      if (ride.pickup_latitude && ride.pickup_longitude) {
        coordinates.push({ latitude: ride.pickup_latitude, longitude: ride.pickup_longitude });
      }
      
      if (ride.dropoff_latitude && ride.dropoff_longitude) {
        coordinates.push({ latitude: ride.dropoff_latitude, longitude: ride.dropoff_longitude });
      }
      
      if (driverLocation) {
        coordinates.push(driverLocation);
      }
      
      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      }
    }
  };
  
  useEffect(() => {
    if (!loading) {
      fitMapToMarkers();
    }
  }, [loading, driverLocation]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ride details...</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Ride Tracking</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{rideStatus}</Text>
        </View>
      </View>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: ride.pickup_latitude || 0,
          longitude: ride.pickup_longitude || 0,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {/* Pickup Marker */}
        {ride.pickup_latitude && ride.pickup_longitude && (
          <Marker
            coordinate={{ latitude: ride.pickup_latitude, longitude: ride.pickup_longitude }}
            title={ride.pickup_location || "Pickup Location"}
            pinColor={Colors.primary}
          />
        )}
        
        {/* Destination Marker */}
        {ride.dropoff_latitude && ride.dropoff_longitude && (
          <Marker
            coordinate={{ latitude: ride.dropoff_latitude, longitude: ride.dropoff_longitude }}
            title={ride.dropoff_location || "Dropoff Location"}
            pinColor="#4CAF50"
          />
        )}
        
        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={driver?.full_name || "Your driver"}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={24} color="white" />
            </View>
          </Marker>
        )}
        
        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoValue}>{ride.pickup_location || 'Pickup Location'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>To</Text>
            <Text style={styles.infoValue}>{ride.dropoff_location || 'Dropoff Location'}</Text>
          </View>
        </View>
        
        {driver && (
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.full_name}</Text>
            <Text style={styles.driverVehicle}>{driver.vehicle_model || 'Vehicle'}</Text>
            <Text style={styles.driverLicense}>{driver.license_plate || 'License'}</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          {rideStatus === 'accepted' && (
            <MyButton title="Start Ride" onPress={startRide} disabled={updating} />
          )}
          {rideStatus === 'started' && (
            <MyButton title="Complete Ride" onPress={completeRide} disabled={updating} />
          )}
          {rideStatus === 'completed' && (
            <Text style={styles.completedText}>Ride completed</Text>
          )}
        </View>
      </View>
      
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.updatingText}>Updating...</Text>
        </View>
      )}
      
      {/* Sidebar + Tabs */}
      <MenuNavigation visible={false} toggleSidebar={() => {}} />
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  map: {
    width: width,
    height: height * 0.6,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  driverInfo: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 15,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  driverLicense: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 10,
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  driverMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updatingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
});

export default RideTracking;