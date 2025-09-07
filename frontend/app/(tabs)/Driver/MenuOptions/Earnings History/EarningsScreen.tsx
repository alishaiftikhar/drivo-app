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

interface EarningsData {
  id: string;
  amount: number;
  ride_id: string;
  ride_date: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'cancelled';
  ride_details?: {
    pickup_location: string;
    dropoff_location: string;
    distance: number;
    duration: number;
  };
}

const EarningsHistory = () => {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  // Fetch earnings data from API
  const fetchEarnings = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
        router.replace('/Login');
        return;
      }

      const response = await api.get(`/driver/earnings/?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        const data = response.data;
        setEarnings(data.earnings || []);
        setTotalEarnings(data.total_earnings || 0);
      } else {
        Alert.alert('Error', 'Failed to fetch earnings data');
      }
    } catch (error: any) {
      console.error('Error fetching earnings:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again');
        router.replace('/Login');
      } else {
        Alert.alert('Error', 'Failed to fetch earnings. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchEarnings();
  }, [filter]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
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

  // Render each earnings item
  const renderEarningsItem = ({ item }: { item: EarningsData }) => (
    <TouchableOpacity 
      style={styles.earningsCard}
      onPress={() => {
        // Navigate to ride details if needed
        router.push({
          pathname: '/(tabs)/Driver/RideDetail',
          params: { rideId: item.ride_id }
        } as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'completed' ? '#4CAF50' : 
                                 item.status === 'pending' ? '#FF9800' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.ride_date)}</Text>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Ride ID: {item.ride_id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.payment_method}</Text>
        </View>
        
        {item.ride_details && (
          <>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.ride_details.pickup_location} to {item.ride_details.dropoff_location}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="speedometer-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {item.ride_details.distance} km • {item.ride_details.duration} min
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cash-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No earnings found</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' 
          ? "You don't have any earnings yet." 
          : `You don't have any earnings for this ${filter}.`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Earnings History</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalEarnings)}</Text>
          <Text style={styles.summaryPeriod}>
            {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
          </Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'week' && styles.activeFilter]}
            onPress={() => setFilter('week')}
          >
            <Text style={[styles.filterText, filter === 'week' && styles.activeFilterText]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'month' && styles.activeFilter]}
            onPress={() => setFilter('month')}
          >
            <Text style={[styles.filterText, filter === 'month' && styles.activeFilterText]}>Month</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={earnings}
        renderItem={renderEarningsItem}
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

export default EarningsHistory;

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
  summaryContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  summaryPeriod: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  earningsCard: {
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 10,
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
  cardDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    flex: 1,
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