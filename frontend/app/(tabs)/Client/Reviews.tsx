// ReviewScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MyButton from '@/components/MyButton';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';

interface ReviewParams {
  rideId?: string;
  driverId?: string;
}

const getParamAsString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

const ReviewScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const rideId = getParamAsString(params.rideId);
  const driverId = getParamAsString(params.driverId);
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    fetchUserId();
  }, []);
  
  const fetchUserId = async (): Promise<void> => {
    setLoading(true);
    try {
      // Get user information from user-type endpoint
      const userResponse = await api.get('/user-type/');
      if (userResponse.data.is_client && userResponse.data.user_id) {
        setUserId(userResponse.data.user_id);
      }
    } catch (error) {
      console.error('Error fetching user information:', error);
      Alert.alert('Error', 'Failed to get user information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getClientProfile = async () => {
    try {
      const response = await api.get('/client-profile/');
      return response.data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      throw error;
    }
  };
  
  const handleRating = (value: number): void => {
    setRating(value);
  };
  
  const handleSubmitReview = async (): Promise<void> => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }
    
    if (userId === null) {
      Alert.alert('Error', 'Unable to determine user information. Please try again.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get client profile
      const clientProfile = await getClientProfile();
      
      // First, let's check if a review already exists for this ride
      try {
        const existingReviewResponse = await api.get(`/reviews/?ride=${rideId}`);
        if (existingReviewResponse.data.length > 0) {
          Alert.alert('Review Exists', 'You have already submitted a review for this ride.');
          setSubmitting(false);
          return;
        }
      } catch (error) {
        console.log('No existing review found or error checking:', error);
      }
      
      const reviewData = {
        ride: parseInt(rideId),
        driver: parseInt(driverId),
        client: clientProfile.id,
        rating: rating,
        comment: comment || '', // Ensure comment is not null
      };
      
      console.log('Submitting review data:', JSON.stringify(reviewData, null, 2));
      
      const response = await api.post('/reviews/', reviewData);
      console.log('Review submission response:', response.data);
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      let errorMessage = 'Failed to submit your review';
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        const errorData = error.response.data;
        const errorMessages: string[] = [];
        
        if (typeof errorData === 'object') {
          for (const [field, message] of Object.entries(errorData)) {
            if (Array.isArray(message)) {
              errorMessages.push(`${field}: ${message.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${message}`);
            }
          }
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  const closeSuccessModal = (): void => {
    setShowSuccessModal(false);
    // Reset form for potential future use
    setRating(0);
    setComment('');
    
    // Navigate back to home or ride history
    router.replace('/(tabs)/GrantLocation');
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Rate Your Ride</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How was your ride?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : '#CCC'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Tap a star to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
          </Text>
        </View>
        
        <View style={styles.commentContainer}>
          <Text style={styles.commentTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            multiline
            value={comment}
            onChangeText={setComment}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          {submitting ? (
            <View style={styles.submittingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.submittingText}>Submitting review...</Text>
            </View>
          ) : (
            <MyButton
              title="Submit Review"
              onPress={handleSubmitReview}
            />
          )}
        </View>
      </View>
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Thank You!</Text>
            <Text style={styles.modalMessage}>
              Your review has been submitted successfully and saved in our database.
            </Text>
            <MyButton
              title="OK"
              onPress={closeSuccessModal}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
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
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  ratingContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  starButton: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  commentContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 10,
  },
  submittingContainer: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submittingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
  },
});

export default ReviewScreen;