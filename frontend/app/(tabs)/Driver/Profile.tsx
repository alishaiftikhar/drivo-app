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
  ScrollView,
  Modal
} from 'react-native';
import MyButton from '@/components/MyButton';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '@/constants/apiConfig';

const { width } = Dimensions.get('window');
const circleSize = 150;

const DriverProfile = () => {
  const [image, setImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // License details
  const [showLicense, setShowLicense] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
  // Bank account details
  const [showAccount, setShowAccount] = useState(false);
  const [accountType, setAccountType] = useState('bank_account');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Error states
  const [errors, setErrors] = useState({
    fullName: '',
    cnic: '',
    age: '',
    phone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    accountNumber: '',
    accountHolder: '',
    bankName: ''
  });
  
  const router = useRouter();

  // Load existing profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('access_token');
        
        if (!token) {
          Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
          router.replace('/Login');
          return;
        }
        
        const response = await api.get('/driver-profile/', {
          headers: { Authorization: `Bearer ${token}` }
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
          
          if (profileData.driving_license) {
            setLicenseNumber(profileData.driving_license);
            setShowLicense(true);
          }
          
          if (profileData.license_expiry) {
            setLicenseExpiry(profileData.license_expiry);
          }
          
          if (profileData.bank_account_type) {
            setAccountType(profileData.bank_account_type);
            setAccountNumber(profileData.bank_account_number || '');
            setAccountHolder(profileData.bank_account_holder || '');
            setBankName(profileData.bank_name || '');
            setShowAccount(true);
          }
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, []);

  // Image picker functions
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

  // Formatting functions
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

  const formatLicenseNumber = (text: string): string => {
    // Remove any existing dashes and spaces
    const cleanText = text.replace(/[-\s]/g, '').toUpperCase();
    
    // Limit to 10 characters (3 letters + 6 digits + 1 digit/letter)
    if (cleanText.length > 10) {
      // Truncate to 10 characters instead of returning undefined
      const truncated = cleanText.slice(0, 10);
      return formatLicenseNumber(truncated);
    }
    
    // Format as user types
    if (cleanText.length <= 3) {
      return cleanText;
    } else if (cleanText.length <= 9) {
      return cleanText.slice(0, 3) + '-' + cleanText.slice(3);
    } else {
      return cleanText.slice(0, 3) + '-' + cleanText.slice(3, 9) + '-' + cleanText.slice(9);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      // Format the date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setLicenseExpiry(formattedDate);
      validateField('licenseExpiry', formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Validation functions
  const validateField = (field: string, value: string) => {
    let errorMessage = '';
    
    switch (field) {
      case 'fullName':
        if (!value) errorMessage = 'Full name is required';
        else if (!/^[A-Za-z ]+$/.test(value)) errorMessage = 'Only letters and spaces allowed';
        else if (value.length < 3) errorMessage = 'At least 3 characters required';
        break;
        
      case 'cnic':
        if (!value) errorMessage = 'CNIC is required';
        else {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length !== 13) errorMessage = 'CNIC must be 13 digits';
        }
        break;
        
      case 'age':
        if (!value) errorMessage = 'Age is required';
        else {
          const ageNum = parseInt(value);
          if (isNaN(ageNum)) errorMessage = 'Age must be a number';
          else if (ageNum < 18) errorMessage = 'Must be at least 18 years old';
          else if (ageNum > 65) errorMessage = 'Must be younger than 65 years';
        }
        break;
        
      case 'phone':
        if (!value) errorMessage = 'Phone number is required';
        else {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length < 10 || cleaned.length > 15) errorMessage = 'Invalid phone number';
        }
        break;
        
      case 'address':
        if (!value) errorMessage = 'Address is required';
        else if (value.length < 5) errorMessage = 'Address too short';
        break;
        
      case 'licenseNumber':
        if (showLicense && !value) errorMessage = 'License number is required';
        else if (showLicense && !/^[A-Z]{3}-\d{6}-\d{1}$/.test(value)) {
          errorMessage = 'Format: ABC-123456-7';
        }
        break;
        
      case 'licenseExpiry':
        if (showLicense && !value) errorMessage = 'Expiry date is required';
        else if (showLicense) {
          const pattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!pattern.test(value)) errorMessage = 'Format: YYYY-MM-DD';
          else {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date <= today) errorMessage = 'Date must be in the future';
          }
        }
        break;
        
      case 'accountNumber':
        if (showAccount && !value) errorMessage = 'Account number is required';
        break;
        
      case 'accountHolder':
        if (showAccount && !value) errorMessage = 'Account holder name is required';
        break;
        
      case 'bankName':
        if (showAccount && accountType === 'bank_account' && !value) {
          errorMessage = 'Bank name is required';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    return !errorMessage;
  };

  const validateForm = () => {
    const isFullNameValid = validateField('fullName', fullName);
    const isCnicValid = validateField('cnic', cnic);
    const isAgeValid = validateField('age', age);
    const isPhoneValid = validateField('phone', phone);
    const isAddressValid = validateField('address', address);
    const isLicenseNumberValid = validateField('licenseNumber', licenseNumber);
    const isLicenseExpiryValid = validateField('licenseExpiry', licenseExpiry);
    const isAccountNumberValid = validateField('accountNumber', accountNumber);
    const isAccountHolderValid = validateField('accountHolder', accountHolder);
    const isBankNameValid = validateField('bankName', bankName);
    
    return (
      isFullNameValid &&
      isCnicValid &&
      isAgeValid &&
      isPhoneValid &&
      isAddressValid &&
      isLicenseNumberValid &&
      isLicenseExpiryValid &&
      isAccountNumberValid &&
      isAccountHolderValid &&
      isBankNameValid
    );
  };

  // Save profile
  const handleSave = async () => {
    if (!image) {
      Alert.alert('Error', 'Please capture your profile image.');
      return;
    }
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
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
      formData.append('full_name', fullName);
      formData.append('cnic', formatCNIC(cnic));
      formData.append('age', age);
      formData.append('phone_number', formatPhoneNumber(phone));
      formData.append('address', address);
      
      if (showLicense) {
        formData.append('driving_license', licenseNumber);
        formData.append('license_expiry', licenseExpiry);
      }
      
      if (showAccount) {
        formData.append('bank_account_type', accountType);
        formData.append('bank_account_number', accountNumber);
        formData.append('bank_account_holder', accountHolder);
        if (accountType === 'bank_account') {
          formData.append('bank_name', bankName);
        }
      }
      
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
      
      const response = await api.post('/driver-profile/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Driver Profile Saved Successfully!');
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
        Alert.alert('Error', 'Failed to save profile. Please try again.');
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
        {/* Static Profile Image */}
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
        
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                validateField('fullName', text);
              }}
              onBlur={() => validateField('fullName', fullName)}
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            
            <TextInput
              placeholder="CNIC"
              placeholderTextColor="#999"
              style={styles.input}
              value={cnic}
              onChangeText={(text) => {
                setCnic(formatCNIC(text));
                validateField('cnic', formatCNIC(text));
              }}
              onBlur={() => validateField('cnic', cnic)}
              keyboardType="number-pad"
              maxLength={15}
            />
            {errors.cnic ? <Text style={styles.errorText}>{errors.cnic}</Text> : null}
            
            <TextInput
              placeholder="Age"
              placeholderTextColor="#999"
              style={styles.input}
              value={age}
              onChangeText={(text) => {
                setAge(text);
                validateField('age', text);
              }}
              onBlur={() => validateField('age', age)}
              keyboardType="number-pad"
              maxLength={3}
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
            
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#999"
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(formatPhoneNumber(text));
                validateField('phone', formatPhoneNumber(text));
              }}
              onBlur={() => validateField('phone', phone)}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            
            <TextInput
              placeholder="Address"
              placeholderTextColor="#999"
              style={styles.input}
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                validateField('address', text);
              }}
              onBlur={() => validateField('address', address)}
              multiline
            />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>
          
          {/* License Section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => setShowLicense(!showLicense)}
            >
              <Text style={styles.sectionTitle}>Driving License</Text>
              <Ionicons 
                name={showLicense ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#001F54" 
              />
            </TouchableOpacity>
            
            {showLicense && (
              <View style={styles.sectionContent}>
                <TextInput
                  placeholder="License Number (ABC-123456-7)"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={licenseNumber}
                  onChangeText={(text) => {
                    setLicenseNumber(formatLicenseNumber(text));
                    validateField('licenseNumber', formatLicenseNumber(text));
                  }}
                  onBlur={() => validateField('licenseNumber', licenseNumber)}
                  autoCapitalize="characters"
                />
                {errors.licenseNumber ? <Text style={styles.errorText}>{errors.licenseNumber}</Text> : null}
                
                <TouchableOpacity onPress={showDatepicker}>
                  <TextInput
                    placeholder="License Expiry (YYYY-MM-DD)"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={licenseExpiry}
                    editable={false}
                  />
                </TouchableOpacity>
                {errors.licenseExpiry ? <Text style={styles.errorText}>{errors.licenseExpiry}</Text> : null}
                
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                    minimumDate={new Date()}
                  />
                )}
              </View>
            )}
          </View>
          
          {/* Bank Account Section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => setShowAccount(!showAccount)}
            >
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <Ionicons 
                name={showAccount ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#001F54" 
              />
            </TouchableOpacity>
            
            {showAccount && (
              <View style={styles.sectionContent}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Account Type</Text>
                  <View style={styles.pickerOptions}>
                    {['bank_account', 'jazzcash', 'easypaisa', 'paypal'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          accountType === type && styles.selectedPickerOption
                        ]}
                        onPress={() => setAccountType(type)}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          accountType === type && styles.selectedPickerOptionText
                        ]}>
                          {type === 'bank_account' ? 'Bank Account' : 
                           type === 'jazzcash' ? 'JazzCash' : 
                           type === 'easypaisa' ? 'EasyPaisa' : 'PayPal'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  placeholder={
                    accountType === 'paypal' 
                      ? 'PayPal Email' 
                      : accountType === 'jazzcash' || accountType === 'easypaisa'
                      ? 'Mobile Number'
                      : 'Account Number'
                  }
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={(text) => {
                    setAccountNumber(text);
                    validateField('accountNumber', text);
                  }}
                  onBlur={() => validateField('accountNumber', accountNumber)}
                  keyboardType={accountType === 'paypal' ? 'email-address' : 'number-pad'}
                />
                {errors.accountNumber ? <Text style={styles.errorText}>{errors.accountNumber}</Text> : null}
                
                <TextInput
                  placeholder="Account Holder Name"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={accountHolder}
                  onChangeText={(text) => {
                    setAccountHolder(text);
                    validateField('accountHolder', text);
                  }}
                  onBlur={() => validateField('accountHolder', accountHolder)}
                />
                {errors.accountHolder ? <Text style={styles.errorText}>{errors.accountHolder}</Text> : null}
                
                {accountType === 'bank_account' && (
                  <>
                    <TextInput
                      placeholder="Bank Name"
                      placeholderTextColor="#999"
                      style={styles.input}
                      value={bankName}
                      onChangeText={(text) => {
                        setBankName(text);
                        validateField('bankName', text);
                      }}
                      onBlur={() => validateField('bankName', bankName)}
                    />
                    {errors.bankName ? <Text style={styles.errorText}>{errors.bankName}</Text> : null}
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Static Save Button */}
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

export default DriverProfile;

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
  profileImageContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#D3D3D3',
    zIndex: 1,
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
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 100,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginBottom: 5,
  },
  sectionContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 3,
    borderColor: '#001F54',
    width: 300,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001F54',
  },
  sectionContent: {
    marginTop: 10,
    alignItems: 'center',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#001F54',
    marginBottom: 5,
    marginLeft: 5,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerOption: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    borderWidth: 2,
    borderColor: '#001F54',
  },
  selectedPickerOption: {
    backgroundColor: '#001F54',
  },
  pickerOptionText: {
    color: '#001F54',
    fontWeight: '500',
  },
  selectedPickerOptionText: {
    color: 'white',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
});