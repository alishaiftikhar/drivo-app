import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/constants/apiConfig';

// Type for location coordinates
type Coordinates = {
  latitude: number;
  longitude: number;
};

type RideDetails = {
  id: number;
  pickup_location: string;
  dropoff_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  status: 'requested' | 'in_progress' | 'completed' | 'confirmed';
  driver?: {
    id: number;
    full_name: string;
    current_latitude?: number;
    current_longitude?: number;
  };
};

type RideRequestDetails = {
  id: number;
  pickup_location: string;
  dropoff_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  status: 'requested' | 'confirmed' | 'completed';  // Added 'completed' status
  driver?: {
    id: number;
    full_name: string;
    current_latitude?: number;
    current_longitude?: number;
  };
};

const RideTracking = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [region, setRegion] = useState<Region | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [rideRequestDetails, setRideRequestDetails] = useState<RideRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rideStarted, setRideStarted] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRideRequest, setIsRideRequest] = useState(false);
  
  // Extract parameters with validation
  const rideId = params.rideId as string;
  const rideRequestId = params.rideRequestId as string;
  const sourceLat = params.sourceLat as string;
  const sourceLng = params.sourceLng as string;
  const destLat = params.destLat as string;
  const destLng = params.destLng as string;
  const sourceName = params.sourceName as string;
  const destName = params.destName as string;
  
  // Initialize locations and ride details
  useEffect(() => {
    // Validate required parameters
    if ((!rideId || rideId === "undefined") && (!rideRequestId || rideRequestId === "undefined")) {
      setError("No ride ID or ride request ID provided. Please try again.");
      setLoading(false);
      return;
    }
    
    if (!sourceLat || !sourceLng || !destLat || !destLng) {
      setError("Missing location information. Please try again.");
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for ride tracking');
          return;
        }
        
        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLng = location.coords.longitude;
        
        // Set initial map region
        setRegion({
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        
        // Check if we have a ride ID or ride request ID
        if (rideId && rideId !== "undefined") {
          // Fetch ride details from API
          console.log(`Fetching ride details for ID: ${rideId}`);
          const response = await api.get(`/rides/${rideId}/`);
          const rideData = response.data;
          
          setRideDetails(rideData);
          setIsRideRequest(false);
          
          // Set driver location if available
          if (rideData.driver && rideData.driver.current_latitude && rideData.driver.current_longitude) {
            setDriverLocation({
              latitude: rideData.driver.current_latitude,
              longitude: rideData.driver.current_longitude,
            });
            
            // Initialize route coordinates with driver's current location
            setRouteCoordinates([{
              latitude: rideData.driver.current_latitude,
              longitude: rideData.driver.current_longitude,
            }]);
            
            // Check if ride is in progress
            setRideStarted(rideData.status === 'in_progress');
          } else {
            // If no driver assigned yet, use pickup location as starting point
            setDriverLocation({
              latitude: parseFloat(sourceLat),
              longitude: parseFloat(sourceLng),
            });
            
            setRouteCoordinates([{
              latitude: parseFloat(sourceLat),
              longitude: parseFloat(sourceLng),
            }]);
          }
        } else if (rideRequestId && rideRequestId !== "undefined") {
          // Fetch ride request details from API
          console.log(`Fetching ride request details for ID: ${rideRequestId}`);
          const response = await api.get(`/client/ride-request/${rideRequestId}/`);
          const rideRequestData = response.data;
          
          setRideRequestDetails(rideRequestData);
          setIsRideRequest(true);
          
          // Use pickup location as starting point
          setDriverLocation({
            latitude: parseFloat(sourceLat),
            longitude: parseFloat(sourceLng),
          });
          
          setRouteCoordinates([{
            latitude: parseFloat(sourceLat),
            longitude: parseFloat(sourceLng),
          }]);
          
          // Check if ride request is confirmed
          setRideStarted(rideRequestData.status === 'confirmed');
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error initializing ride tracking:', error);
        
        if (error.response && error.response.status === 404) {
          setError("Ride or ride request not found. Please check the ID and try again.");
        } else {
          setError("Failed to initialize ride tracking. Please try again later.");
        }
        
        setLoading(false);
      }
    })();
  }, [rideId, rideRequestId, sourceLat, sourceLng]);
  
  // Simulate ride progress when ride is started
  useEffect(() => {
    if (!rideStarted) return;
    
    const simulateRideProgress = setInterval(() => {
      setDriverLocation(prev => {
        if (!prev) return prev;
        
        // Get destination coordinates
        const destLat = isRideRequest 
          ? rideRequestDetails?.dropoff_latitude 
          : rideDetails?.dropoff_latitude;
        const destLng = isRideRequest 
          ? rideRequestDetails?.dropoff_longitude 
          : rideDetails?.dropoff_longitude;
        
        if (!destLat || !destLng) return prev;
        
        // Calculate direction vector from current position to destination
        const dx = destLat - prev.latitude;
        const dy = destLng - prev.longitude;
        
        // Calculate distance to destination
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If close to destination, stop simulation
        if (distance < 0.001) {
          clearInterval(simulateRideProgress);
          return prev;
        }
        
        // Move driver closer to destination (simulate movement)
        const stepSize = 0.001; // Adjust for speed
        const newLat = prev.latitude + (dx / distance) * stepSize;
        const newLng = prev.longitude + (dy / distance) * stepSize;
        
        // Update route coordinates to draw the path
        setRouteCoordinates(prevRoute => [...prevRoute, { latitude: newLat, longitude: newLng }]);
        
        return { latitude: newLat, longitude: newLng };
      });
    }, 1000); // Update every second
    
    return () => clearInterval(simulateRideProgress);
  }, [rideStarted, rideDetails, rideRequestDetails, isRideRequest]);
  
  const handleStartRide = async () => {
    try {
      if (isRideRequest && rideRequestId) {
        // Update ride request status to confirmed
        await api.patch(`/client/ride-request/${rideRequestId}/status/`, { status: 'confirmed' });
        setRideStarted(true);
        if (rideRequestDetails) {
          setRideRequestDetails(prev => prev ? { ...prev, status: 'confirmed' } : null);
        }
      } else if (rideDetails) {
        // Update ride status to in_progress
        await api.patch(`/rides/${rideId}/`, { status: 'in_progress' });
        setRideStarted(true);
        setRideDetails(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }
      
      Alert.alert('Ride Started', 'Your ride has started. Tracking your journey.');
    } catch (error) {
      console.error('Error starting ride:', error);
      Alert.alert('Error', 'Failed to start ride');
    }
  };
  
  const handleEndRide = async () => {
    try {
      if (isRideRequest && rideRequestId) {
        // Update ride request status to completed
        await api.patch(`/client/ride-request/${rideRequestId}/status/`, { status: 'completed' });
        setRideStarted(false);
        if (rideRequestDetails) {
          setRideRequestDetails(prev => prev ? { ...prev, status: 'completed' } : null);
        }
      } else if (rideDetails) {
        // Update ride status to completed
        await api.patch(`/rides/${rideId}/`, { status: 'completed' });
        setRideStarted(false);
        if (rideDetails) {
          setRideDetails(prev => prev ? { ...prev, status: 'completed' } : null);
        }
      }
      
      Alert.alert('Ride Completed', 'Your ride has been completed successfully.');
      
      // Navigate back to home or ride history
      router.push('/(tabs)/Client/LocatioPicker');
    } catch (error) {
      console.error('Error ending ride:', error);
      Alert.alert('Error', 'Failed to end ride');
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4B7BEC" />
        <Text style={{ marginTop: 10 }}>Loading Ride Tracking...</Text>
      </View>
    );
  }
  
  if (error || !region || (!rideDetails && !rideRequestDetails)) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Failed to load ride details"}</Text>
        <Button title="Go Back" onPress={handleGoBack} />
      </View>
    );
  }
  
  // Get the current ride/ride request details
  const currentDetails = isRideRequest ? rideRequestDetails : rideDetails;
  
  if (!currentDetails) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load ride details</Text>
        <Button title="Go Back" onPress={handleGoBack} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Ride Status and Controls */}
      <View style={styles.controlPanel}>
        <Text style={styles.statusText}>
          Ride Status: <Text style={styles.statusTextValue}>{currentDetails.status}</Text>
        </Text>
        
        {currentDetails.driver && (
          <Text style={styles.driverText}>
            Driver: <Text style={styles.driverName}>{currentDetails.driver.full_name}</Text>
          </Text>
        )}
        
        {!rideStarted ? (
          <Button 
            title="Start Ride" 
            onPress={handleStartRide} 
            color="#4CAF50"
            disabled={!currentDetails.driver}
          />
        ) : (
          <Button 
            title="End Ride" 
            onPress={handleEndRide} 
            color="#F44336"
          />
        )}
      </View>
      
      {/* Map View */}
      <MapView style={styles.map} initialRegion={region}>
        {/* Source Marker (Pickup Location) */}
        <Marker 
          coordinate={{
            latitude: currentDetails.pickup_latitude,
            longitude: currentDetails.pickup_longitude,
          }} 
          title={currentDetails.pickup_location} 
          pinColor="green"
        />
        
        {/* Destination Marker (Dropoff Location) */}
        <Marker 
          coordinate={{
            latitude: currentDetails.dropoff_latitude,
            longitude: currentDetails.dropoff_longitude,
          }} 
          title={currentDetails.dropoff_location} 
          pinColor="red"
        />
        
        {/* Driver Current Location Marker */}
        {driverLocation && (
          <Marker 
            coordinate={driverLocation} 
            title="Current Location" 
            pinColor="blue"
          />
        )}
        
        {/* Route Path */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4B7BEC"
            strokeWidth={3}
          />
        )}
      </MapView>
      
      {/* Location Information */}
      <View style={styles.infoPanel}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Source:</Text>
          <Text style={styles.infoValue}>{currentDetails.pickup_location}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Destination:</Text>
          <Text style={styles.infoValue}>{currentDetails.dropoff_location}</Text>
        </View>
        
        {driverLocation && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current Location:</Text>
            <Text style={styles.infoValue}>
              {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RideTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlPanel: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  statusTextValue: {
    fontWeight: 'bold',
    color: '#4B7BEC',
  },
  driverText: {
    fontSize: 16,
    marginBottom: 10,
  },
  driverName: {
    fontWeight: 'bold',
    color: '#4B7BEC',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoItem: {
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
});