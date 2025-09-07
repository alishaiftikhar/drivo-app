import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MyButton from '@/components/MyButton';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Driver/Icons/Bottomicons';
import MenuNavigation from '../Driver/MenuOptions/MenuNavigation';
import api from '@/constants/apiConfig'; // Import your API config

type Coords = {
  latitude: number;
  longitude: number;
};

const WaitForJob = () => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const router = useRouter();
  
  // Since we can't get params directly, we'll use a default or get it from storage
  const [driverId, setDriverId] = useState<string>('');
  
  const mapRef = useRef<MapView>(null);
  
  // Function to update location to the server
  const updateLocationToServer = async (coords: Coords) => {
    if (!token) return;
    
    try {
      setUpdatingLocation(true);
      await api.patch(
        '/driver/update-location/', // Fixed URL path
        {
          current_latitude: coords.latitude,
          current_longitude: coords.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setUpdatingLocation(false);
    }
  };
  
  useEffect(() => {
    (async () => {
      try {
        // Get authentication token
        const storedToken = await SecureStore.getItemAsync('access_token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
          router.replace('/OTP');
          return;
        }
        setToken(storedToken);
        
        // Try to get driverId from storage or use a default value
        const storedDriverId = await SecureStore.getItemAsync('driver_id');
        if (storedDriverId) {
          setDriverId(storedDriverId);
        } else {
          // If no driverId in storage, use a default or handle accordingly
          console.log('No driverId found in storage');
        }
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access location was denied');
          setLoading(false);
          return;
        }
        
        // Get current location
        const {
          coords: { latitude, longitude },
        } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = { latitude, longitude };
        setLocation(coords);
        
        // Update location to server
        await updateLocationToServer(coords);
        
        // Set up location tracking
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 50, // Or every 50 meters
          },
          (newLocation) => {
            const updatedCoords = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };
            setLocation(updatedCoords);
            updateLocationToServer(updatedCoords);
            
            // Center map on updated location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: updatedCoords.latitude,
                longitude: updatedCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000);
            }
          }
        );
        
        setLoading(false);
        
        // Clean up on unmount
        return () => {
          if (locationSubscription) {
            locationSubscription.remove();
          }
        };
      } catch (error) {
        console.error('Error setting up location:', error);
        Alert.alert('Error', 'Failed to get your location. Please check your location settings.');
        setLoading(false);
      }
    })();
  }, [router, token]);
  
  const viewRideRequests = () => {
    // Navigate to the screen where driver can see client requests with profiles
    router.push({
      pathname: '/(tabs)/Client/RideRequests', // Update this path to your actual ride requests screen
      params: {
        driverId: driverId,
      },
    });
  };
  
  const goOffline = () => {
    Alert.alert(
      'Go Offline',
      'Are you sure you want to go offline? You will not receive new ride requests.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Go Offline',
          onPress: () => {
            router.replace('/(tabs)/GrantLocation');
          },
        },
      ],
      { cancelable: false }
    );
  };
  
  const refreshLocation = async () => {
    if (!token) return;
    
    try {
      setUpdatingLocation(true);
      const {
        coords: { latitude, longitude },
      } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = { latitude, longitude };
      setLocation(coords);
      await updateLocationToServer(coords);
      
      // Center map on updated location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      
      Alert.alert('Success', 'Location updated successfully');
    } catch (error) {
      console.error('Error refreshing location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setUpdatingLocation(false);
    }
  };
  
  if (loading || !location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#010156ff" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Driver Dashboard</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color="#010156ff" />
        </TouchableOpacity>
      </View>
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker 
          coordinate={location} 
          title="You are here"
          description={updatingLocation ? "Updating location..." : "Location updated"}
        >
          <View style={[styles.marker, updatingLocation && styles.updatingMarker]}>
            <Ionicons name="location" size={20} color="white" />
          </View>
        </Marker>
      </MapView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <MyButton 
          title="View Request" 
          onPress={viewRideRequests}
          disabled={updatingLocation}
        />
        <TouchableOpacity 
          style={[styles.refreshButton, updatingLocation && styles.disabledButton]} 
          onPress={refreshLocation}
          disabled={updatingLocation}
        >
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Sidebar + Tabs */}
      <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
      <BottomTabs />
    </View>
  );
};

export default WaitForJob;

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
    color: '#333',
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  marker: {
    backgroundColor: '#010156ff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  updatingMarker: {
    backgroundColor: '#FFA500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshButton: {
    backgroundColor: '#010156ff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});