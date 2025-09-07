import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';
import api from '@/constants/apiConfig';

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clientProfile, setClientProfile] = useState<any>(null);

  // Fetch client profile first
  const fetchClientProfile = async () => {
    try {
      const response = await api.get('/user-profile/');
      setClientProfile(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching client profile:', err);
      setError('Failed to fetch client profile');
      return null;
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async (clientId: string) => {
    try {
      // First try to get payments filtered by client
      const response = await api.get(`/payments/?client=${clientId}`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      
      // If no payments found, try to get client ride history and extract payments
      const rideHistoryResponse = await api.get('/client-ride-history/');
      let rides = rideHistoryResponse.data;
      
      // Ensure rides is an array
      if (!Array.isArray(rides)) {
        console.log('Ride history response is not an array:', rides);
        return [];
      }
      
      // Extract payments from rides
      const paymentsFromRides = rides
        .filter((ride: any) => 
          ride && 
          ride.payments && 
          Array.isArray(ride.payments) && 
          ride.payments.length > 0
        )
        .map((ride: any) => ride.payments[0]); // Get the first payment for each ride
      
      return paymentsFromRides;
    } catch (err) {
      console.error('Error fetching payment history:', err);
      throw err;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profile = await fetchClientProfile();
      if (profile) {
        const paymentData = await fetchPaymentHistory(profile.id);
        setPayments(Array.isArray(paymentData) ? paymentData : []);
      }
    } catch (err) {
      setError('Failed to load payment history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentAmount}>${item.amount?.toFixed(2) || '0.00'}</Text>
        <View style={[
          styles.statusContainer,
          item.status === 'paid' ? styles.paidStatus : 
          item.status === 'pending' ? styles.pendingStatus : 
          styles.failedStatus
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'paid' ? styles.paidText : 
            item.status === 'pending' ? styles.pendingText : 
            styles.failedText
          ]}>
            {item.status || 'Unknown'}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.method || 'Unknown method'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Ride ID: {item.ride || 'Unknown'}
          </Text>
        </View>
      </View>
      
      {item.ride_details && (
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.ride_details.pickup_location || 'Pickup location'}
            </Text>
          </View>
          <View style={styles.routePoint}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.ride_details.dropoff_location || 'Dropoff location'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment History</Text>
        <Text style={styles.headerSubtitle}>Your past ride payments</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No payment history</Text>
          <Text style={styles.emptySubtext}>Your payments will appear here after you complete rides</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default PaymentHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    padding: 20,
  },
  paymentItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  paidStatus: {
    backgroundColor: '#e6f7e6',
  },
  pendingStatus: {
    backgroundColor: '#fff3cd',
  },
  failedStatus: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paidText: {
    color: '#4caf50',
  },
  pendingText: {
    color: '#856404',
  },
  failedText: {
    color: '#721c24',
  },
  paymentDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  routeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});