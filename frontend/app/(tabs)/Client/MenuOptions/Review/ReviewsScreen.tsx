import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';

// Mock API function to fetch review history
const fetchReviewHistory = async (userId: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in a real app, this would come from your API
  return [
    {
      id: '1',
      driverName: 'John Smith',
      rating: 5,
      comment: 'Excellent driver, very polite and arrived quickly.',
      date: '2023-05-15',
      rideId: 'RIDE12345',
    },
    {
      id: '2',
      driverName: 'Sarah Johnson',
      rating: 4,
      comment: 'Good experience, car was clean and comfortable.',
      date: '2023-05-10',
      rideId: 'RIDE12346',
    },
    {
      id: '3',
      driverName: 'Michael Brown',
      rating: 3,
      comment: 'Driver was okay but took a longer route than necessary.',
      date: '2023-05-05',
      rideId: 'RIDE12347',
    },
    {
      id: '4',
      driverName: 'Emily Davis',
      rating: 5,
      comment: 'Perfect ride! Will definitely book again.',
      date: '2023-05-01',
      rideId: 'RIDE12348',
    },
  ];
};

// Mock function to get current user
const getCurrentUser = () => {
  return { id: 'user123', name: 'John Doe' };
};

const ReviewHistoryScreen = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const user = getCurrentUser();
        const reviewData = await fetchReviewHistory(user.id);
        setReviews(reviewData);
      } catch (err) {
        setError('Failed to load review history. Please try again later.');
        console.error('Error fetching reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />
      );
    }
    return stars;
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.driverName}>{item.driverName}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating}.0</Text>
        </View>
      </View>
      <Text style={styles.reviewDate}>{item.date}</Text>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <View style={styles.reviewFooter}>
        <Text style={styles.rideIdText}>Ride ID: {item.rideId}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading review history...</Text>
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
              fetchReviewHistory(user.id)
                .then(data => {
                  setReviews(data);
                  setIsLoading(false);
                })
                .catch(err => {
                  setError('Failed to load review history. Please try again later.');
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
        <Text style={styles.headerTitle}>Review History</Text>
        <Text style={styles.headerSubtitle}>Your past driver reviews</Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>Your reviews will appear here after you complete rides</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ReviewHistoryScreen;

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
  reviewItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  reviewComment: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  rideIdText: {
    fontSize: 14,
    color: '#666',
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