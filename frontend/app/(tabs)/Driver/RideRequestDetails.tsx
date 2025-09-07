// RideRequestDetails.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import BottomTabs from '../Driver/Icons/Bottomicons';
import MenuNavigation from '../Driver/MenuOptions/MenuNavigation';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

const RideRequestDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<RouteCoordinate[]>([]);
  
  const rideRequestId = params.rideRequestId as string;
  const driverId = params.driverId as string;
  const clientName = params.clientName as string;
  const clientPhone = params.clientPhone as string;
  const clientDpUrl = params.clientDpUrl as string;
  const pickupLocation = params.pickupLocation as string;
  const dropoffLocation = params.dropoffLocation as string;
  const scheduledTime = params.scheduledTime as string;
  const status = params.status as string;
  
  // Parse coordinates from params
  const pickupLatitude = parseFloat(params.pickupLatitude as string) || 0;
  const pickupLongitude = parseFloat(params.pickupLongitude as string) || 0;
  const dropoffLatitude = parseFloat(params.dropoffLatitude as string) || 0;
  const dropoffLongitude = parseFloat(params.dropoffLongitude as string) || 0;

  const source: Coordinates = {
    latitude: pickupLatitude,
    longitude: pickupLongitude,
  };
  
  const destination: Coordinates = {
    latitude: dropoffLatitude,
    longitude: dropoffLongitude,
  };

  // Calculate price based on time (300 per hour)
  const calculatePrice = (hours: number): number => {
    const baseRate = 300; // 300 per hour
    return Math.round(hours * baseRate);
  };

  const fetchRoute = async (): Promise<void> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
          },
        }
      );
      
      const data = await response.json();
      const routes = data.routes;
      
      if (!routes || routes.length === 0) {
        throw new Error('No routes found');
      }
      
      const route = routes[0];
      const km = route.distance / 1000;
      const min = route.duration / 60;
      const hours = min / 60; // Convert minutes to hours
      
      setDistanceKm(km);
      setDurationMin(min);
      setEstimatedPrice(calculatePrice(hours));
      setRouteCoords(
        route.geometry.coordinates.map(([lng, lat]: number[]): RouteCoordinate => ({
          latitude: lat,
          longitude: lng,
        }))
      );
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback to straight line distance if OSRM fails
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
      };

      const deg2rad = (deg: number) => {
        return deg * (Math.PI/180);
      };

      const distance = calculateDistance(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude);
      const duration = (distance / 40) * 60; // Assuming 40 km/h average speed
      const hours = duration / 60;
      
      setDistanceKm(distance);
      setDurationMin(duration);
      setEstimatedPrice(calculatePrice(hours));
      
      // Create a simple straight line route
      setRouteCoords([
        { latitude: pickupLatitude, longitude: pickupLongitude },
        { latitude: dropoffLatitude, longitude: dropoffLongitude }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const makeCall = () => {
    if (clientPhone && clientPhone !== 'No phone number') {
      Linking.openURL(`tel:${clientPhone}`);
    } else {
      Alert.alert('Error', 'No phone number available for this client');
    }
  };

  const acceptRide = async () => {
    try {
      setUpdating(true);
      
      // Update the ride status to accepted
      await api.patch(`/rides/${rideRequestId}/`, { 
        status: 'accepted',
        driver_id: driverId
      });
      
      Alert.alert(
        'Success',
        'Ride request accepted!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/(tabs)/Driver/WaitForJob',
                params: { driverId }
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride request');
    } finally {
      setUpdating(false);
    }
  };

  const rejectRide = async () => {
    try {
      setUpdating(true);
      
      // Update the ride status to rejected
      await api.patch(`/rides/${rideRequestId}/`, { 
        status: 'rejected'
      });
      
      Alert.alert(
        'Success',
        'Ride request rejected!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/(tabs)/Driver/WaitForJob',
                params: { driverId }
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Alert.alert('Error', 'Failed to reject ride request');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h}h ${m}m`;
  };

  // Calculate region for the map
  const region = {
    latitude: (pickupLatitude + dropoffLatitude) / 2,
    longitude: (pickupLongitude + dropoffLongitude) / 2,
    latitudeDelta: Math.abs(pickupLatitude - dropoffLatitude) * 1.5,
    longitudeDelta: Math.abs(pickupLongitude - dropoffLongitude) * 1.5,
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading route details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Ride Request Details</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
      >
        <Marker
          coordinate={{ latitude: pickupLatitude, longitude: pickupLongitude }}
          title="Pickup Location"
          pinColor="green"
        />
        <Marker
          coordinate={{ latitude: dropoffLatitude, longitude: dropoffLongitude }}
          title="Dropoff Location"
          pinColor="red"
        />
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
      
      {/* Details Box */}
      <View style={styles.detailsBox}>
        <Text style={styles.detailText}>📏 Distance: {distanceKm?.toFixed(2)} KM</Text>
        <Text style={styles.detailText}>⏱ Duration: {durationMin ? formatDuration(durationMin) : 'N/A'}</Text>
        <Text style={styles.detailText}>💰 Fare: Rs. {estimatedPrice}</Text>
        <Text style={styles.detailText}>📅 Time: {formatDate(scheduledTime)}</Text>
        {updating && (
          <Text style={styles.updatingText}>Updating ride status...</Text>
        )}
      </View>
      
      <ScrollView style={styles.infoContainer}>
        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.clientCard}>
            {clientDpUrl ? (
              <Image source={{ uri: clientDpUrl }} style={styles.clientImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>👤</Text>
              </View>
            )}
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.clientPhone}>{clientPhone}</Text>
              <TouchableOpacity 
                style={[styles.callButton, !clientPhone || clientPhone === 'No phone number' ? styles.disabledButton : {}]} 
                onPress={makeCall}
                disabled={!clientPhone || clientPhone === 'No phone number'}
              >
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.callButtonText}>Call Client</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Ride Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Pickup:</Text>
              <Text style={styles.infoText}>{pickupLocation}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flag" size={20} color="#666" />
              <Text style={styles.infoLabel}>Dropoff:</Text>
              <Text style={styles.infoText}>{dropoffLocation}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#666" />
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoText, { color: status === 'requested' ? '#FF9800' : '#4CAF50' }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.rejectButton, updating && styles.disabledButton]} 
          onPress={rejectRide}
          disabled={updating}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.acceptButton, updating && styles.disabledButton]} 
          onPress={acceptRide}
          disabled={updating}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sidebar + Tabs */}
      <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
      <BottomTabs />
    </View>
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
    height: 300,
  },
  detailsBox: {
    position: 'absolute',
    top: 120,
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
    zIndex: 1,
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
  infoContainer: {
    flex: 1,
    marginTop: 180,
    paddingHorizontal: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderText: {
    fontSize: 36,
  },
  clientDetails: {
    marginLeft: 16,
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  infoCard: {
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
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 10,
    width: 80,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
  },
});

export default RideRequestDetails;