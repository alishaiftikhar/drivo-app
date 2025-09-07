// RideRequests.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/constants/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Driver/Icons/Bottomicons';
import MenuNavigation from '../Driver/MenuOptions/MenuNavigation';

interface RideRequest {
  id: string;
  client: {
    id: string;
    full_name: string;
    phone_number: string;
    dp_url?: string;
  };
  pickup_location: string;
  dropoff_location: string;
  scheduled_datetime: string;
  estimated_fare: number | null;
  status: string;
}

const RideRequests = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const driverId = params.driverId as string;
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    console.log('Driver ID from params:', driverId);
    fetchRideRequests();
  }, []);

  const fetchRideRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching ride requests from database');
      
      // Use the correct endpoint for driver ride requests
      const response = await api.get('/driver/ride-requests/');
      console.log('Ride requests response:', response.data);
      
      // Handle the response data structure
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data.ride_requests && Array.isArray(response.data.ride_requests)) {
        data = response.data.ride_requests;
      }
      
      if (data.length > 0) {
        console.log(`Found ${data.length} ride requests`);
        setRideRequests(data);
      } else {
        console.log('No ride requests found');
        setRideRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching ride requests:', error.message);
      setError('Failed to fetch ride requests. Please try again.');
      setRideRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const viewClientDetails = (rideRequest: RideRequest) => {
    router.push({
      pathname: '/(tabs)/Driver/ClientDetails',
      params: {
        rideRequestId: rideRequest.id,
        driverId: driverId,
        clientId: rideRequest.client.id,
        clientName: rideRequest.client.full_name || 'Unknown Client',
        clientPhone: rideRequest.client.phone_number || 'No phone number',
        clientDpUrl: rideRequest.client.dp_url || '',
        pickupLocation: rideRequest.pickup_location || 'No pickup location',
        dropoffLocation: rideRequest.dropoff_location || 'No dropoff location',
        scheduledTime: rideRequest.scheduled_datetime || '',
        estimatedFare: rideRequest.estimated_fare ? rideRequest.estimated_fare.toString() : '0.00',
        status: rideRequest.status || 'unknown',
      }
    });
  };

  const renderRideRequest = ({ item }: { item: RideRequest }) => (
    <View style={styles.rideRequestCard}>
      <View style={styles.clientHeader}>
        {item.client.dp_url ? (
          <Image source={{ uri: item.client.dp_url }} style={styles.clientImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>👤</Text>
          </View>
        )}
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{item.client?.full_name || 'Unknown Client'}</Text>
          <Text style={styles.clientPhone}>{item.client?.phone_number || 'No phone number'}</Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: item.status === 'requested' ? '#FF9800' : '#4CAF50' }]}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => viewClientDetails(item)}
      >
        <Text style={styles.requestButtonText}>View Client Details</Text>
      </TouchableOpacity>
    </View>
  );

  const refreshRequests = () => {
    fetchRideRequests();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#010156ff" />
        <Text style={styles.loadingText}>Loading ride requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ride Requests</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color="#010156ff" />
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshRequests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rideRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No ride requests available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshRequests}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rideRequests}
          renderItem={renderRideRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={refreshRequests}
          showsVerticalScrollIndicator={false}
        />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#010156ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100, // Space for bottom tabs
    paddingTop: 10,
  },
  rideRequestCard: {
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
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientImage: {
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
    borderWidth: 4,
    borderColor: '#03035fff',
  },
  placeholderText: {
    fontSize: 28,
  },
  clientDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  requestButton: {
    backgroundColor: '#010156ff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  requestButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default RideRequests;