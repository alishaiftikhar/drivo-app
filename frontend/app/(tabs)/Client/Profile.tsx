import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from 'react-native';
import MyButton from '@/components/MyButton';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '@/constants/apiConfig';

const { width } = Dimensions.get('window');
const circleSize = 150;

const ClientProfile = () => {
  const [image, setImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
        router.replace('/Login');
        return;
      }
      
      const response = await api.get('/profile/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 200) {
        const profileData = response.data;
        setFullName(profileData.full_name || '');
        setCnic(profileData.cnic || '');
        setAge(profileData.age ? profileData.age.toString() : '');
        setPhone(profileData.phone_number || '');
        setAddress(profileData.address || '');
        
        if (profileData.dp_url) {
          setImage(profileData.dp_url);
        }
        
        // Store user email for location requests
        if (profileData.user?.email) {
          await SecureStore.setItemAsync('user_email', profileData.user.email);
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const selectImageSource = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const formatCNIC = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+92' + cleaned.substring(1);
    }
    if (cleaned.startsWith('92')) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  const isValidFullName = (name: string) => /^[A-Za-z ]+$/.test(name) && name.length >= 3;
  const isValidCNIC = (cnic: string) => {
    const cleaned = cnic.replace(/\D/g, '');
    return cleaned.length === 13;
  };
  const isValidAge = (age: string) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  };
  const isValidPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSave = async () => {
    // Validate inputs
    if (!image) {
      Alert.alert('Error', 'Please capture your image.');
      return;
    }
    if (!fullName || !isValidFullName(fullName)) {
      Alert.alert('Error', 'Please enter a valid Full Name (letters only, at least 3 characters).');
      return;
    }
    if (!cnic || !isValidCNIC(cnic)) {
      Alert.alert('Error', 'Please enter a valid CNIC (13 digits).');
      return;
    }
    if (!age || !isValidAge(age)) {
      Alert.alert('Error', 'Please enter a valid Age (between 18 and 100).');
      return;
    }
    if (!phone || !isValidPhoneNumber(phone)) {
      Alert.alert('Error', 'Please enter a valid Phone Number (10-15 digits).');
      return;
    }
    if (!address || address.length < 5) {
      Alert.alert('Error', 'Please enter a valid Address (at least 5 characters).');
      return;
    }

    setSaving(true);
    
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
        router.replace('/Login');
        return;
      }
      
      const formData = new FormData();
      
      // Append text fields
      formData.append('full_name', fullName);
      formData.append('cnic', formatCNIC(cnic));
      formData.append('age', age);
      formData.append('phone_number', formatPhoneNumber(phone));
      formData.append('address', address);
      
      // Only append image if it's a new one (not a URL)
      if (image && !image.startsWith('http')) {
        const filename = image.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match?.[1] || 'jpg';
        const type = `image/${ext}`;
        
        formData.append('dp', {
          uri: image,
          name: filename,
          type,
        } as any);
      }
      
      const response = await api.post('/profile/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200 || response.status === 201) {
        const profileData = {
          fullName,
          cnic: formatCNIC(cnic),
          age,
          phone: formatPhoneNumber(phone),
          address,
          image,
        };
        
        await SecureStore.setItemAsync('clientProfile', JSON.stringify(profileData));
        
        Alert.alert('Success', 'Profile Saved Successfully!');
        
        // Navigate to LiveLocation after successful save
        router.push('/(tabs)/GrantLocation');
      } else {
        Alert.alert('Error', 'Failed to save profile to server');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again');
        router.replace('/Login');
      } else {
        // Even if there's an error, save locally and navigate
        const profileData = {
          fullName,
          cnic: formatCNIC(cnic),
          age,
          phone: formatPhoneNumber(phone),
          address,
          image,
        };
        
        await SecureStore.setItemAsync('clientProfile', JSON.stringify(profileData));
        
        Alert.alert('Partial Success', 'Profile saved locally. Will sync when online.');
        router.push('/(tabs)/LiveLocation');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#001F54" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={selectImageSource}>
              <View style={styles.glowCircle}>
                <View style={styles.circle}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.profileImage} />
                  ) : (
                    <Text style={styles.circleText}>Tap to Capture</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
            
            <TextInput
              placeholder="CNIC"
              placeholderTextColor="#999"
              style={styles.input}
              value={cnic}
              onChangeText={(text) => setCnic(formatCNIC(text))}
              keyboardType="number-pad"
              maxLength={15}
            />
            
            <TextInput
              placeholder="Age"
              placeholderTextColor="#999"
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
            
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#999"
              style={styles.input}
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              maxLength={15}
            />
            
            <TextInput
              placeholder="Address"
              placeholderTextColor="#999"
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <MyButton 
            title={saving ? "Saving..." : "Save Profile"} 
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ClientProfile;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#001F54',
  },
  container: {
    flex: 1,
    backgroundColor: '#D3D3D3',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 100,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  glowCircle: {
    width: circleSize + 20,
    height: circleSize + 20,
    borderRadius: (circleSize + 20) / 2,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  circle: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: '#001F54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1100ffff',
  },
  profileImage: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
  },
  circleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#001F54',
    borderWidth: 3,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: 'black',
    width: 300,
    marginVertical: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});