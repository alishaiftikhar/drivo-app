import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';

interface RideDetail {
  id: string;
  ride_id: string;
  pickup_location: string;
  dropoff_location: string;
  ride_date: string;
  ride_status: 'completed' | 'cancelled' | 'in_progress';
  fare: number;
  distance: number;
  duration: number;
  driver_rating?: number;
  driver_review?: string;
  client_name: string;
  client_phone: string;
}

const RideDetails = () => {
  const router = useRouter();
  const [rideDetails, setRideDetails] = useState<RideDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverId, setDriverId] = useState<string>('');

  // Fetch ride details from API
  const fetchRideDetails = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
        router.replace('/Login');
        return;
      }

      // Get driver ID from storage
      const storedDriverId = await SecureStore.getItemAsync('driver_id');
      if (!storedDriverId) {
        Alert.alert('Error', 'Driver information not found. Please login again.');
        router.replace('/Login');
        return;
      }
      setDriverId(storedDriverId);

      const response = await api.get(`/driver/ride-details/?driver_id=${storedDriverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setRideDetails(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch ride details');
      }
    } catch (error: any) {
      console.error('Error fetching ride details:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again');
        router.replace('/Login');
      } else {
        Alert.alert('Error', 'Failed to fetch ride details. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRideDetails();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRideDetails();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Render each ride detail item
  const renderRideItem = ({ item }: { item: RideDetail }) => (
    <TouchableOpacity 
      style={styles.rideCard}
      onPress={() => {
        // Navigate to detailed ride view if needed
        router.push({
          pathname: '/(tabs)/Driver/RideDetail',
          params: { rideId: item.ride_id }
        } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <Text style={styles.rideId}>{item.ride_id}</Text>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: item.ride_status === 'completed' ? '#4CAF50' : 
                               item.ride_status === 'in_progress' ? '#2196F3' : '#F44336' 
            }
          ]}>
            <Text style={styles.statusText}>{item.ride_status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.ride_date)}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>{item.pickup_location}</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-down-outline" size={16} color="#666" />
        </View>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>{item.dropoff_location}</Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatCurrency(item.fare)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance} km</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>
      
      <View style={styles.clientInfo}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.clientText}>{item.client_name}</Text>
        <Text style={styles.clientPhone}>{item.client_phone}</Text>
      </View>
      
      {item.driver_rating && (
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFC107" />
          <Text style={styles.ratingText}>{item.driver_rating.toFixed(1)}</Text>
        </View>
      )}
      
      {item.driver_review && (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewText}>"{item.driver_review}"</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No rides found</Text>
      <Text style={styles.emptyText}>
        You haven't completed any rides yet.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Ride History</Text>
      </View>

      <FlatList
        data={rideDetails}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

export default RideDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  cardContent: {
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  clientText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    fontWeight: '500',
  },
  clientPhone: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    fontWeight: '500',
  },
  reviewContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
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
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 30,
  },
});