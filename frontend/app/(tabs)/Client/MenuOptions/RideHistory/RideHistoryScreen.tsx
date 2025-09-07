import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';

// Mock API function to fetch ride history
const fetchRideHistory = async (userId: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in a real app, this would come from your API
  return [
    {
      id: '1',
      date: '2023-05-15',
      time: '14:30',
      pickup: '123 Main St, Downtown',
      destination: '456 Park Ave, Uptown',
      driverName: 'John Smith',
      driverRating: 4.8,
      fare: 25.50,
      distance: '5.2 km',
      duration: '15 min',
      status: 'Completed',
      rideId: 'RIDE12345',
    },
    {
      id: '2',
      date: '2023-05-10',
      time: '09:15',
      pickup: '789 Oak St, Westside',
      destination: '321 Elm St, Eastside',
      driverName: 'Sarah Johnson',
      driverRating: 4.9,
      fare: 18.75,
      distance: '3.8 km',
      duration: '12 min',
      status: 'Completed',
      rideId: 'RIDE12346',
    },
    {
      id: '3',
      date: '2023-05-05',
      time: '18:45',
      pickup: '555 Pine St, Northend',
      destination: '777 Maple Ave, Southend',
      driverName: 'Michael Brown',
      driverRating: 4.5,
      fare: 32.00,
      distance: '7.5 km',
      duration: '22 min',
      status: 'Completed',
      rideId: 'RIDE12347',
    },
    {
      id: '4',
      date: '2023-05-01',
      time: '11:20',
      pickup: '999 Cedar St, Hillside',
      destination: '111 Birch Rd, Riverside',
      driverName: 'Emily Davis',
      driverRating: 5.0,
      fare: 15.25,
      distance: '2.9 km',
      duration: '10 min',
      status: 'Completed',
      rideId: 'RIDE12348',
    },
  ];
};

// Mock API function to cancel a ride
const cancelRide = async (rideId: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would call your API to cancel the ride
  console.log(`Cancelling ride ${rideId}`);
  
  // Simulate successful cancellation
  return { success: true };
};

// Mock function to get current user
const getCurrentUser = () => {
  return { id: 'user123', name: 'John Doe' };
};

const RideDetailHistoryScreen = ({ navigation }: any) => {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  useEffect(() => {
    const loadRides = async () => {
      try {
        const user = getCurrentUser();
        const rideData = await fetchRideHistory(user.id);
        setRides(rideData);
      } catch (err) {
        setError('Failed to load ride history. Please try again later.');
        console.error('Error fetching rides:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();
  }, []);

  const handleCancelRide = async (rideId: string) => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            setCancellingRideId(rideId);
            try {
              const result = await cancelRide(rideId);
              
              if (result.success) {
                // Update the ride status in the local state
                setRides(prevRides => 
                  prevRides.map(ride => 
                    ride.id === rideId ? { ...ride, status: 'Cancelled' } : ride
                  )
                );
                Alert.alert("Success", "Ride has been cancelled successfully");
              } else {
                Alert.alert("Error", "Failed to cancel the ride. Please try again.");
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred. Please try again.");
              console.error('Error cancelling ride:', error);
            } finally {
              setCancellingRideId(null);
            }
          }
        }
      ]
    );
  };

  const handleEditRide = (ride: any) => {
    // In a real app, this would navigate to an edit ride screen
    Alert.alert("Edit Ride", `Editing ride ${ride.rideId}`);
    // navigation.navigate('EditRide', { rideId: ride.id });
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={14}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />
      );
    }
    return stars;
  };

  const renderRideItem = ({ item }: { item: any }) => (
    <View style={styles.rideItem}>
      <View style={styles.rideHeader}>
        <View>
          <Text style={styles.rideDate}>{item.date}</Text>
          <Text style={styles.rideTime}>{item.time}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText, 
            item.status === 'Completed' && styles.completedStatus,
            item.status === 'Cancelled' && styles.cancelledStatus
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup}</Text>
        </View>
        <View style={styles.routePoint}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.routeText} numberOfLines={1}>{item.destination}</Text>
        </View>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.detailText}>Driver: {item.driverName}</Text>
          <View style={styles.ratingContainer}>
            {renderRatingStars(item.driverRating)}
            <Text style={styles.ratingText}>{item.driverRating}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Fare: ${item.fare.toFixed(2)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="map-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance} • {item.duration}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Ride ID: {item.rideId}</Text>
        </View>
      </View>
      
      {item.status !== 'Cancelled' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditRide(item)}
          >
            <Ionicons name="create-outline" size={16} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelRide(item.id)}
            disabled={cancellingRideId === item.id}
          >
            {cancellingRideId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color="white" />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ride history...</Text>
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
            onPress={() => {
              setIsLoading(true);
              setError(null);
              // Retry loading
              const user = getCurrentUser();
              fetchRideHistory(user.id)
                .then(data => {
                  setRides(data);
                  setIsLoading(false);
                })
                .catch(err => {
                  setError('Failed to load ride history. Please try again later.');
                  setIsLoading(false);
                });
            }}
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
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>Your past ride details</Text>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No ride history</Text>
          <Text style={styles.emptySubtext}>Your rides will appear here after you complete trips</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default RideDetailHistoryScreen;

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
  rideItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rideTime: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedStatus: {
    backgroundColor: '#e6f7e6',
    color: '#4caf50',
  },
  cancelledStatus: {
    backgroundColor: '#ffebee',
    color: '#f44336',
  },
  routeContainer: {
    marginBottom: 15,
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
  rideDetails: {
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    width: '48%',
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 5,
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