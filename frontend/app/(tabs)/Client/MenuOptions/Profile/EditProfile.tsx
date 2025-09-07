import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import api from '@/constants/apiConfig';
import Colors from '@/constants/Color';
import InputButton from '@/components/Inputbutton';
import MyButton from '@/components/MyButton';

interface Profile {
  dp?: string | null;
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

const EditProfile = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load profile data from navigation params
  useEffect(() => {
    try {
      if (params.profileData && typeof params.profileData === 'string') {
        const profileData: Profile = JSON.parse(params.profileData);
        setProfile(profileData);
        setName(profileData.full_name ?? '');
        setCnic(profileData.cnic ?? '');
        setAge(profileData.age ? profileData.age.toString() : '');
        setPhone(profileData.phone_number ?? '');
        setAddress(profileData.address ?? '');
        setProfileImage(profileData.dp ?? null);
      }

      if (params.userType && typeof params.userType === 'string') {
        setUserType(JSON.parse(params.userType));
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid profile/user data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pick image from gallery
  const pickImage = async () => {
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      Alert.alert('Permission Denied', 'Allow gallery access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Save profile to DB
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // ✅ Use correct token key (same as your apiConfig)
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Error', 'Please login to save profile');
        router.replace('/OTP');
        return;
      }

      const formData = new FormData();
      formData.append('full_name', name);
      formData.append('cnic', cnic);
      formData.append('age', age);
      formData.append('phone_number', phone);
      formData.append('address', address);

      if (profileImage) {
        const filename = profileImage.split('/').pop() ?? 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('dp', {
          uri: profileImage,
          name: filename,
          type,
        } as any);
      }

      await api.put('/user-profile/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={140} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <InputButton placeholder="Full Name" value={name} onChangeText={setName} />
          <InputButton
            placeholder="CNIC"
            value={cnic}
            onChangeText={setCnic}
            keyboardType="numeric"
            maxLength={15}
          />
          <InputButton placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
          <InputButton
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <InputButton placeholder="Address" value={address} onChangeText={setAddress} multiline />

          <View style={styles.saveButtonContainer}>
            <MyButton title="Save Profile" onPress={handleSaveProfile} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { justifyContent: 'center', alignItems: 'center' },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  imagePicker: { marginBottom: 30 },
  profileImage: { width: 140, height: 140, borderRadius: 70 },
  saveButtonContainer: { marginTop: 40, width: '100%' },
});

export default EditProfile;