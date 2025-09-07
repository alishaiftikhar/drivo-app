import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';

// Define TypeScript interfaces
interface UserType {
  is_client: boolean;
  is_driver: boolean;
  email: string;
  user_id: number;
}

interface Profile {
  dp?: string;
  dp_url?: string;
  full_name?: string;
  phone_number?: string;
  cnic?: string;
  address?: string;
  age?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  driving_license?: string;
  license_expiry?: string;
  status?: string;
  current_latitude?: number;
  current_longitude?: number;
  [key: string]: any;
}

const ProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token missing. Please login again.');
        router.replace('/(tabs)/Login');
        return;
      }
      
      // Get user type
      const userTypeResponse = await api.get('/user-type/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!userTypeResponse.data) {
        throw new Error('Failed to fetch user type');
      }
      
      setUserType(userTypeResponse.data);
      
      // Get profile based on user type
      let profileResponse;
      let profileEndpoint;
      
      if (userTypeResponse.data.is_client) {
        profileEndpoint = '/user-profile/';
      } else if (userTypeResponse.data.is_driver) {
        profileEndpoint = '/driver-profile/';
      } else {
        throw new Error('Invalid user type');
      }
      
      profileResponse = await api.get(profileEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (profileResponse && profileResponse.data) {
        console.log('Profile data:', profileResponse.data);
        setProfile(profileResponse.data);
        setImageError(false); // Reset image error state
      } else {
        // If no profile data exists, create a basic profile structure
        const basicProfile = {
          full_name: userTypeResponse.data.email?.split('@')[0] || 'User',
          phone_number: '',
          address: '',
          city: '',
        };
        
        setProfile(basicProfile);
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/Login') }
        ]);
        return;
      }
      
      // Set a basic profile even if API fails
      setProfile({
        full_name: 'User',
        phone_number: '',
        address: '',
        city: '',
      });
      
      Alert.alert('Error', 'Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileOptions = () => {
    setOptionsModalVisible(true);
  };

  const handleViewProfile = () => {
    setOptionsModalVisible(false);
    router.push({
      pathname: '/(tabs)/Client/MenuOptions/Profile/ViewClientProfile',
      params: {
        profileData: JSON.stringify(profile),
        userType: JSON.stringify(userType)
      }
    });
  };

  const handleEditProfile = () => {
    setOptionsModalVisible(false);
    router.push({
      pathname: '/(tabs)/Client/MenuOptions/Profile/EditProfile',
      params: {
        profileData: JSON.stringify(profile),
        userType: JSON.stringify(userType)
      }
    });
  };

  const handleCancel = () => {
    setOptionsModalVisible(false);
  };

  const getUserStatus = () => {
    if (userType?.is_client) return 'Active Client';
    if (userType?.is_driver) return profile?.status || 'Driver';
    return 'User';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // Get user initials for display if no profile picture
  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      } else if (names.length === 1) {
        return names[0][0].toUpperCase();
      }
    }
    return 'U';
  };

  // Construct profile image URL properly
  const getProfileImageUrl = () => {
    // First try to use dp_url if available (it's the full URL from the server)
    if (profile?.dp_url && !imageError) {
      console.log('Using dp_url:', profile.dp_url);
      return profile.dp_url;
    }
    
    // Fallback to dp field if dp_url is not available
    if (profile?.dp && !imageError) {
      // Check if the URL is already complete or needs base URL
      if (profile.dp.startsWith('http')) {
        console.log('Using full dp URL:', profile.dp);
        return profile.dp;
      } else {
        // Use the base URL without the /api part
        const baseUrl = 'http://192.168.43.20:8000'; // Use your server's base URL
        const fullUrl = `${baseUrl}/media/${profile.dp}`;
        console.log('Constructed dp URL:', fullUrl);
        return fullUrl;
      }
    }
    
    return null;
  };

  const profileImageUrl = getProfileImageUrl();
  console.log('Final profile image URL:', profileImageUrl);
  
  return (
    <View style={styles.container}>
      {/* Three dots menu button */}
      <TouchableOpacity style={styles.menuDotsButton} onPress={handleProfileOptions}>
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </TouchableOpacity>
      
      {/* Profile Image with Circle */}
      <View style={styles.profileImageContainer}>
        <View style={styles.profileCircle}>
          {profileImageUrl ? (
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.profileImage}
              onError={(e) => {
                console.log('Image loading error:', e.nativeEvent.error);
                setImageError(true);
              }}
            />
          ) : (
            <View style={styles.defaultProfileContainer}>
              <Text style={styles.defaultProfileText}>{getUserInitials()}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Profile Information Text */}
      <View style={styles.profileInfoText}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Name: </Text>
          {profile?.full_name || 'Not provided'}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Phone: </Text>
          {profile?.phone_number || 'Not provided'}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Status: </Text>
          {getUserStatus()}
        </Text>
      </View>
      
      {/* Profile Options Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.profileOptionsButton} onPress={handleProfileOptions}>
          <Text style={styles.buttonText}>Profile Options</Text>
        </TouchableOpacity>
      </View>
      
      {/* Options Modal */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Profile Options</Text>
            
            <TouchableOpacity style={styles.optionButton} onPress={handleViewProfile}>
              <Text style={styles.optionText}>View Full Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={handleEditProfile}>
              <Text style={styles.optionText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primary,
    marginTop: 10,
    fontSize: 16,
  },
  menuDotsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginVertical: 2,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  defaultProfileContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  profileInfoText: {
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    color: '#333',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  buttonContainer: {
    width: '90%',
    marginTop: 20,
  },
  profileOptionsButton: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
  },
  optionButton: {
    padding: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '600',
  },
});

export default ProfileScreen;