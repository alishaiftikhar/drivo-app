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
  const [viewMode, setViewMode] = useState<'summary' | 'full' | 'edit'>('summary');
  
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
    const cleanText = text.replace(/[-\s]/g, '').toUpperCase();
    if (cleanText.length > 10) {
      const truncated = cleanText.slice(0, 10);
      return formatLicenseNumber(truncated);
    }
    
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
        setViewMode('summary'); // Return to summary view after saving
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

  // Summary View
  if (viewMode === 'summary') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Driver Profile</Text>
        </View>
        
        <View style={styles.summaryContainer}>
          <View style={styles.profileImageContainer}>
            <View style={styles.glowCircle}>
              <View style={styles.circle}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                  <Text style={styles.circleText}>No Photo</Text>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{fullName || 'Not provided'}</Text>
            <Text style={styles.summaryPhone}>{phone || 'Not provided'}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.summaryButtons}>
            <View style={styles.summaryButtonContainer}>
              <MyButton 
                title="Full View" 
                onPress={() => setViewMode('full')}
              />
            </View>
            <View style={styles.summaryButtonContainer}>
              <MyButton 
                title="Edit" 
                onPress={() => setViewMode('edit')}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Full View and Edit View
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('summary')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#001F54" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {viewMode === 'full' ? 'Profile Details' : 'Edit Profile'}
          </Text>
        </View>
        
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          {viewMode === 'edit' ? (
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
          ) : (
            <View style={styles.glowCircle}>
              <View style={styles.circle}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                  <Text style={styles.circleText}>No Photo</Text>
                )}
              </View>
            </View>
          )}
        </View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              {viewMode === 'edit' ? (
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    validateField('fullName', text);
                  }}
                  onBlur={() => validateField('fullName', fullName)}
                />
              ) : (
                <Text style={styles.fieldValue}>{fullName || 'Not provided'}</Text>
              )}
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CNIC</Text>
              {viewMode === 'edit' ? (
                <TextInput
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
              ) : (
                <Text style={styles.fieldValue}>{cnic || 'Not provided'}</Text>
              )}
              {errors.cnic ? <Text style={styles.errorText}>{errors.cnic}</Text> : null}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Age</Text>
              {viewMode === 'edit' ? (
                <TextInput
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
              ) : (
                <Text style={styles.fieldValue}>{age || 'Not provided'}</Text>
              )}
              {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {viewMode === 'edit' ? (
                <TextInput
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
              ) : (
                <Text style={styles.fieldValue}>{phone || 'Not provided'}</Text>
              )}
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              {viewMode === 'edit' ? (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    validateField('address', text);
                  }}
                  onBlur={() => validateField('address', address)}
                  multiline
                />
              ) : (
                <Text style={styles.fieldValue}>{address || 'Not provided'}</Text>
              )}
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>
          </View>
          
          {/* License Section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => viewMode === 'edit' && setShowLicense(!showLicense)}
              disabled={viewMode !== 'edit'}
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
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>License Number</Text>
                  {viewMode === 'edit' ? (
                    <TextInput
                      style={styles.input}
                      value={licenseNumber}
                      onChangeText={(text) => {
                        setLicenseNumber(formatLicenseNumber(text));
                        validateField('licenseNumber', formatLicenseNumber(text));
                      }}
                      onBlur={() => validateField('licenseNumber', licenseNumber)}
                      autoCapitalize="characters"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{licenseNumber || 'Not provided'}</Text>
                  )}
                  {errors.licenseNumber ? <Text style={styles.errorText}>{errors.licenseNumber}</Text> : null}
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>License Expiry</Text>
                  {viewMode === 'edit' ? (
                    <TouchableOpacity onPress={showDatepicker}>
                      <TextInput
                        style={styles.input}
                        value={licenseExpiry}
                        editable={false}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fieldValue}>{licenseExpiry || 'Not provided'}</Text>
                  )}
                  {errors.licenseExpiry ? <Text style={styles.errorText}>{errors.licenseExpiry}</Text> : null}
                  
                  {viewMode === 'edit' && showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={onChangeDate}
                      minimumDate={new Date()}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Bank Account Section */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => viewMode === 'edit' && setShowAccount(!showAccount)}
              disabled={viewMode !== 'edit'}
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
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Account Type</Text>
                  {viewMode === 'edit' ? (
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
                  ) : (
                    <Text style={styles.fieldValue}>
                      {accountType === 'bank_account' ? 'Bank Account' : 
                       accountType === 'jazzcash' ? 'JazzCash' : 
                       accountType === 'easypaisa' ? 'EasyPaisa' : 'PayPal'}
                    </Text>
                  )}
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    {accountType === 'paypal' ? 'PayPal Email' : 
                     accountType === 'jazzcash' || accountType === 'easypaisa'
                     ? 'Mobile Number' : 'Account Number'}
                  </Text>
                  {viewMode === 'edit' ? (
                    <TextInput
                      style={styles.input}
                      value={accountNumber}
                      onChangeText={(text) => {
                        setAccountNumber(text);
                        validateField('accountNumber', text);
                      }}
                      onBlur={() => validateField('accountNumber', accountNumber)}
                      keyboardType={accountType === 'paypal' ? 'email-address' : 'number-pad'}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{accountNumber || 'Not provided'}</Text>
                  )}
                  {errors.accountNumber ? <Text style={styles.errorText}>{errors.accountNumber}</Text> : null}
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  {viewMode === 'edit' ? (
                    <TextInput
                      style={styles.input}
                      value={accountHolder}
                      onChangeText={(text) => {
                        setAccountHolder(text);
                        validateField('accountHolder', text);
                      }}
                      onBlur={() => validateField('accountHolder', accountHolder)}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{accountHolder || 'Not provided'}</Text>
                  )}
                  {errors.accountHolder ? <Text style={styles.errorText}>{errors.accountHolder}</Text> : null}
                </View>
                
                {accountType === 'bank_account' && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Bank Name</Text>
                    {viewMode === 'edit' ? (
                      <TextInput
                        style={styles.input}
                        value={bankName}
                        onChangeText={(text) => {
                          setBankName(text);
                          validateField('bankName', text);
                        }}
                        onBlur={() => validateField('bankName', bankName)}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{bankName || 'Not provided'}</Text>
                    )}
                    {errors.bankName ? <Text style={styles.errorText}>{errors.bankName}</Text> : null}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Save Button (only in edit mode) */}
        {viewMode === 'edit' && (
          <View style={styles.buttonContainer}>
            <MyButton 
              title={saving ? "Saving..." : "Save Profile"} 
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    elevation: 3,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#001F54',
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingBottom: 20,
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
  summaryInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  summaryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001F54',
    marginBottom: 5,
  },
  summaryPhone: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  summaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 40,
  },
  summaryButtonContainer: {
    width: '45%',
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
    marginBottom: 20,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001F54',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
    borderColor: '#001F54',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
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
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginTop: 5,
  },
  sectionContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
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
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
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