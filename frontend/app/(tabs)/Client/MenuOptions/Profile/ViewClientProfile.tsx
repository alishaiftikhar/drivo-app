import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/Color';

interface Profile {
  dp?: string;
  full_name?: string;
  phone_number?: string;
  cnic?: string;
  address?: string;
  age?: number;
}

interface UserType {
  is_client: boolean;
  is_driver: boolean;
  email: string;
  user_id: number;
}

const ViewClientProfile = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Run only once at mount to avoid infinite re-renders
  useEffect(() => {
    try {
      if (params.profileData && typeof params.profileData === 'string') {
        setProfile(JSON.parse(params.profileData));
      }
      if (params.userType && typeof params.userType === 'string') {
        setUserType(JSON.parse(params.userType));
      }
    } catch (error) {
      console.error('Error parsing profile data:', error);
    }
  }, []); // empty dependency array here

  const ProfileDetailItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailItem}>
      <Text style={styles.label}>
        <Text style={styles.heading}>{label}: </Text>
        {value || 'Not provided'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileImageContainer}>
          {profile?.dp ? (
            <Image source={{ uri: profile.dp }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.defaultProfile]}>
              <Text style={styles.defaultProfileText}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || 'No Name'}</Text>
        </View>

        <View style={styles.section}>
          <ProfileDetailItem label="Full Name" value={profile?.full_name || ''} />
          <ProfileDetailItem label="CNIC" value={profile?.cnic || ''} />
          <ProfileDetailItem label="Age" value={profile?.age ? `${profile.age} years` : ''} />
          <ProfileDetailItem label="Phone Number" value={profile?.phone_number || ''} />
          <ProfileDetailItem label="Address" value={profile?.address || ''} />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/Client/MenuOptions/Profile/EditProfile',
                params: {
                  profileData: JSON.stringify(profile),
                  userType: JSON.stringify(userType),
                },
              });
            }}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfile: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  defaultProfileText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginBottom: 40,
  },
  detailItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  heading: {
    fontWeight: 'bold',
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ViewClientProfile;