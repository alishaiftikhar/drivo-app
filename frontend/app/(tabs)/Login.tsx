import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import BackgroundOne from '../../components/BackgroundDesign';
import InputButton from '@/components/Inputbutton';
import MyButton from '@/components/MyButton';
import Colors from '@/constants/Color';
import { useRouter } from 'expo-router';
import { validateEmail, validatePassword } from '@/components/Validation';
import api from '@/constants/apiConfig'; // Import the apiConfig instead of axios
import * as SecureStore from 'expo-secure-store';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) return Alert.alert('Error', emailError);
    if (passwordError) return Alert.alert('Error', passwordError);
    
    setLoading(true);
    
    try {
      // Use the imported api instance instead of axios directly
      const response = await api.post(
        '/login/', // No need for API_BASE_URL as it's already configured in apiConfig
        { email, password }, // Using email instead of username
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      console.log('Login response:', response.data);
      
      if (response.status === 200) {
        // Save tokens securely
        await SecureStore.setItemAsync('access_token', response.data.access);
        await SecureStore.setItemAsync('refresh_token', response.data.refresh);
        
        // Save user info
        await SecureStore.setItemAsync('user_email', email);
        await SecureStore.setItemAsync('user_id', response.data.user_id?.toString() || '');
        
        // Get user type and profile information
        try {
          const userResponse = await api.get('/user-type/', {
            headers: {
              Authorization: `Bearer ${response.data.access}`
            }
          });
          
          const userType = userResponse.data.is_driver ? 'driver' : 'client';
          await SecureStore.setItemAsync('userType', userType);
          
          Alert.alert('Success', 'Login successful');
          
          // Navigate to the appropriate screen based on user type
          if (userType === 'driver') {
            router.push('/(tabs)/Driver/WaitForJob');
          } else {
            router.push('/(tabs)/GrantLocation');
          }
        } catch (userTypeError) {
          console.error('Error getting user type:', userTypeError);
          // If we can't get user type, default to GrantLocation
          router.push('/(tabs)/GrantLocation');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.log('Login error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else {
        const message = err.response?.data?.message || 'Something went wrong during login';
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <BackgroundOne text="Login">
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InputButton
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InputButton
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secure
              showToggle
              isSecure={!showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <TouchableOpacity onPress={() => router.push('/EnterEmail')}>
              <Text style={styles.forgetText}>Forget Password?</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 40 }}>
              <MyButton 
                title={loading ? "Logging in..." : "Login"} 
                onPress={handleLogin} 
                disabled={loading}
              />
            </View>
            <TouchableOpacity onPress={() => router.push('/Signup')}>
              <Text style={styles.signupText}>Create New Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </BackgroundOne>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 200,
    gap: 2,
  },
  forgetText: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginRight: -140,
    color: Colors.primary,
    fontSize: 20,
    textDecorationLine: 'underline',
  },
  signupText: {
    marginTop: 25,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});