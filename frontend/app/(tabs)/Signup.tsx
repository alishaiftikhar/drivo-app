import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundOne from '../../components/BackgroundDesign';
import InputButton from '@/components/Inputbutton';
import MyButton from '@/components/MyButton';
import Colors from '@/constants/Color';
import { useRouter } from 'expo-router';
import api from '@/constants/apiConfig'; // axios instance here
import axios, { AxiosError, isAxiosError } from 'axios';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '@/components/Validation';

const Signup = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    const emailError = validateEmail(trimmedEmail);
    const passwordError = validatePassword(trimmedPassword);
    const confirmPasswordError = validateConfirmPassword(trimmedPassword, trimmedConfirmPassword);

    if (emailError) return Alert.alert('Validation Error', emailError);
    if (passwordError) return Alert.alert('Validation Error', passwordError);
    if (confirmPasswordError) return Alert.alert('Validation Error', confirmPasswordError);

    try {
      const response = await api.post('/signup/', {
        email: trimmedEmail,
        password: trimmedPassword,
        is_driver: false,
        is_client: true,
      });

      if (response.status === 201) {
        await AsyncStorage.setItem('signup_email', trimmedEmail);

        await api.post('/send-otp/', { email: trimmedEmail });

        router.push(`/OTP?email=${encodeURIComponent(trimmedEmail)}&from=signup`);
      } else {
        Alert.alert('Signup Failed', 'Unexpected response from server.');
      }
    } catch (error: unknown) {
      let message = 'Something went wrong.';
      if (isAxiosError(error)) {
        const axiosErr = error as AxiosError<{ message?: string; error?: string }>;
        message =
          axiosErr.response?.data?.message ||
          axiosErr.response?.data?.error ||
          axiosErr.message ||
          'Network error. Please check your connection.';
      }
      Alert.alert('Error', message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <BackgroundOne text="Signup">
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <InputButton
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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
            <InputButton
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              showToggle
              isSecure={!showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            <View style={styles.buttonWrapper}>
              <MyButton title="Sign Up" onPress={handleSignUp} />
            </View>
            <TouchableOpacity onPress={() => router.push('/Login')}>
              <Text style={styles.signupText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </BackgroundOne>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Signup;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 200,
    gap: 15,
  },
  buttonWrapper: {
    marginTop: 15,
    width: '100%',
  },
  signupText: {
    marginTop: 25,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});