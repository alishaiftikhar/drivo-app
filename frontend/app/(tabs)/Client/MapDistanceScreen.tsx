import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import MyButton from '@/components/MyButton';
import Colors from '@/constants/Color';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/apiConfig';
// Import the icons and menu options files
import BottomTabs from '../Client/Icons/BottomIcons';
import MenuNavigation from '../Client/MenuOptions/Manunavigation';

interface Coordinates {
  latitude: number;
  longitude: number;
}
interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

const MapDistanceScreen = () => {
  const router = useRouter();
  const {
    sourceLat,
    sourceLng,
    destLat,
    destLng,
    fuelType,
    vehicleType,
    time,
    rideType,
    rideRequestId
  } = useLocalSearchParams();
  
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [driverPayment, setDriverPayment] = useState<number | null>(null);
  const [shortestRouteCoords, setShortestRouteCoords] = useState<RouteCoordinate[]>([]);
  const [longestRouteCoords, setLongestRouteCoords] = useState<RouteCoordinate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [converting, setConverting] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  const source: Coordinates = {
    latitude: parseFloat(sourceLat as string),
    longitude: parseFloat(sourceLng as string),
  };
  const destination: Coordinates = {
    latitude: parseFloat(destLat as string),
    longitude: parseFloat(destLng as string),
  };
  
  const timeStr = Array.isArray(time) ? time[0] : time || '';
  const rideTypeStr = Array.isArray(rideType) ? rideType[0] : rideType || '1-Way';
  const isNight =
    timeStr.toLowerCase().includes('pm') ||
    Number(timeStr.split(':')[0]) >= 21;
  const isTwoWay = rideTypeStr.toLowerCase().includes('2');
  
  // Calculate price based on time (300 per hour)
  const calculatePrice = (hours: number): number => {
    const baseRate = 300; // 300 per hour
    const nightFactor = isNight ? 1.25 : 1;
    const twoWayFactor = isTwoWay ? 2 : 1;
    return Math.round(hours * baseRate * nightFactor * twoWayFactor);
  };
  
  const updateRideRequestWithRouteDetails = async (): Promise<void> => {
    if (!rideRequestId || distanceKm === null || durationMin === null || estimatedPrice === null) {
      return;
    }
    
    setUpdating(true);
    
    try {
      const updateData = {
        distance: distanceKm,
        duration: durationMin,
        fare: estimatedPrice,
      };
      
      console.log('Updating ride request with route details:', updateData);
      await api.patch(`/client/ride-request/${rideRequestId}/`, updateData);
      console.log('Ride request updated successfully with route details');
    } catch (error) {
      console.error('Error updating ride request with route details:', error);
      // Don't show alert to user as this is not critical for the flow
    } finally {
      setUpdating(false);
    }
  };
  
  const convertRideRequestToRide = async (): Promise<void> => {
    if (!rideRequestId) {
      return;
    }
    
    setConverting(true);
    
    try {
      console.log('Converting ride request to ride...');
      const response = await api.post(`/client/ride-request/${rideRequestId}/convert/`);
      const ride = response.data;
      
      console.log('Ride created successfully:', ride);
      
      // Navigate to the ride tracking screen
      router.push({
        pathname: '/Client/RideTracking',
        params: {
          rideId: ride.id.toString(),
          sourceLat: sourceLat as string,
          sourceLng: sourceLng as string,
          destLat: destLat as string,
          destLng: destLng as string,
          sourceName: 'Source',
          destName: 'Destination',
        },
      });
      
    } catch (error: any) {
      console.error('Error converting ride request to ride:', error);
      
      // Show detailed error information
      let errorMessage = 'Failed to create ride. Please try again.';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          { 
            text: 'Try Again', 
            onPress: () => convertRideRequestToRide() 
          },
          { 
            text: 'Continue with Ride Request', 
            onPress: () => {
              // Navigate to ride tracking with ride request ID instead
              router.push({
                pathname: '/Client/RideTracking',
                params: {
                  rideRequestId: rideRequestId?.toString(),
                  sourceLat: sourceLat as string,
                  sourceLng: sourceLng as string,
                  destLat: destLat as string,
                  destLng: destLng as string,
                  sourceName: 'Source',
                  destName: 'Destination',
                },
              });
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setConverting(false);
    }
  };
  
  const fetchRoutes = async (): Promise<void> => {
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}`,
        {
          params: {
            overview: 'full',
            alternatives: true,
            geometries: 'geojson',
          },
        }
      );
      
      const routes = response.data.routes;
      if (!routes || routes.length === 0) {
        throw new Error('No routes found');
      }
      
      const sortedRoutes = [...routes].sort((a, b) => a.distance - b.distance);
      const shortest = sortedRoutes[0];
      const longest = sortedRoutes[sortedRoutes.length - 1];
      const km = shortest.distance / 1000;
      const min = shortest.duration / 60;
      const hours = min / 60; // Convert minutes to hours
      
      setDistanceKm(km);
      setDurationMin(min);
      setEstimatedPrice(calculatePrice(hours));
      setDriverPayment(calculatePrice(hours)); // Driver payment is the same as estimated price
      setShortestRouteCoords(
        shortest.geometry.coordinates.map(([lng, lat]: number[]): RouteCoordinate => ({
          latitude: lat,
          longitude: lng,
        }))
      );
      setLongestRouteCoords(
        longest.geometry.coordinates.map(([lng, lat]: number[]): RouteCoordinate => ({
          latitude: lat,
          longitude: lng,
        }))
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load route. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRoutes();
  }, []);
  
  // Update ride request with route details when they are available
  useEffect(() => {
    if (distanceKm !== null && durationMin !== null && estimatedPrice !== null && !loading) {
      updateRideRequestWithRouteDetails();
    }
  }, [distanceKm, durationMin, estimatedPrice, loading]);
  
  const handleDone = async (): Promise<void> => {
    // Try to convert the ride request to a ride
    await convertRideRequestToRide();
  };
  
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 16, color: Colors.primary }}>
          Finding the best route...
        </Text>
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
          <Text style={styles.headerText}>Route Details</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="menu" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Map */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: source.latitude,
            longitude: source.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          <Marker coordinate={source} title="Source" pinColor="green" />
          <Marker coordinate={destination} title="Destination" pinColor="red" />
          {longestRouteCoords.length > 0 && (
            <Polyline coordinates={longestRouteCoords} strokeColor="green" strokeWidth={3} />
          )}
          {shortestRouteCoords.length > 0 && (
            <Polyline coordinates={shortestRouteCoords} strokeColor="red" strokeWidth={4} />
          )}
        </MapView>
        
        {/* Details Box */}
        <View style={styles.detailsBox}>
          <Text style={styles.detailText}>📏 Distance: {distanceKm?.toFixed(2)} KM</Text>
          <Text style={styles.detailText}>⏱ Duration: {durationMin?.toFixed(0)} min</Text>
          <Text style={styles.detailText}>🚗 Driver Payment: Rs. {driverPayment}</Text>
          {updating && (
            <Text style={styles.updatingText}>Updating ride details...</Text>
          )}
          {converting && (
            <Text style={styles.updatingText}>Creating your ride...</Text>
          )}
        </View>
        
        {/* Button Box */}
        <View style={styles.buttonBox}>
          <MyButton 
            title="Done" 
            onPress={handleDone} 
            disabled={updating || converting} 
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
    backgroundColor: '#f4f4f4',
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
  map: {
    flex: 1,
  },
  detailsBox: {
    position: 'absolute',
    bottom: 150, // Increased from 80 to make room for the button
    left: 15,
    right: 15,
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.primary,
  },
  updatingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  buttonBox: {
    position: 'absolute',
    bottom: 80, // Increased from 20 to ensure it's visible
    left: 15,
    right: 15,
    zIndex: 10, // Add zIndex to ensure it's above other elements
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapDistanceScreen;