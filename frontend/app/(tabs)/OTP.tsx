import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import api from '@/constants/apiConfig';
import BackgroundOne from '../../components/BackgroundDesign';
import MyButton from '@/components/MyButton';
import Colors from '@/constants/Color';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const OTP: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const from = (params.from as string) || 'signup';
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [error, setError] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (timer <= 0) return;
    
    const intervalId = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [timer]);

  // Ensure email is available
  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Email is missing. Please go back and try again.');
      router.back();
    }
  }, [email, router]);

  const handleChange = (text: string, index: number) => {
    if (text && !/^\d$/.test(text)) return; // only digits allowed
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError(null); // Clear error when user types
    
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    } else if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    if (!email) {
      setError('Email is missing. Please go back and try again.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending OTP verification:', { email, otp: otpCode });
      const response = await api.post('/verify-otp/', { 
        email, 
        otp: otpCode 
      });
      
      console.log('OTP verification response:', response.data);
      
      if (response.data.success) {
        Alert.alert('Success', 'OTP verified successfully!');
        const token: string = response.data.access;
        
        // Store tokens securely
        await SecureStore.setItemAsync('access_token', token);
        if (response.data.refresh) {
          await SecureStore.setItemAsync('refresh_token', response.data.refresh);
        }
        
        if (from === 'signup') {
          router.push({ pathname: '/TypeSelector', params: { token } });
        } else {
          router.push('/NewPassword');
        }
      } else {
        setError(response.data.message || 'Invalid OTP.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      // More specific error handling
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid or expired OTP.');
      } else if (err.response?.status === 404) {
        setError('No OTP found for this email. Please request a new one.');
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Email is missing. Please go back and try again.');
      return;
    }
    if (timer > 0) {
      setError(`Please wait ${Math.ceil(timer/60)} minute(s) before resending.`);
      return;
    }
    setIsResending(true);
    setError(null);
    
    try {
      const response = await api.post('/send-otp/', { email });
      if (response.data.success) {
        Alert.alert('Success', 'OTP resent successfully!');
        setOtp(['', '', '', '', '', '']);
        setTimer(300); // Reset timer to 5 minutes
        inputs.current[0]?.focus();
      } else {
        setError(response.data.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  // Format timer to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <BackgroundOne text="Verify OTP">
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>
            Enter the 6-digit OTP sent to your email: {email}
          </Text>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <View style={styles.otpContainer}>
            {otp.map((value, index) => (
              <TextInput
                key={index}
                style={[styles.otpInput, error && styles.errorInput]}
                keyboardType="number-pad"
                maxLength={1}
                value={value}
                onChangeText={(text) => handleChange(text, index)}
                ref={(ref) => (inputs.current[index] = ref)}
                textAlign="center"
                importantForAutofill="no"
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="done"
              />
            ))}
          </View>
          
          <View style={styles.buttonWrapper}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <MyButton title="Verify OTP" onPress={handleVerifyOtp} />
            )}
          </View>
          
          <View style={styles.resendContainer}>
            <Text style={styles.timerText}>
              {timer > 0 ? `Expires in: ${formatTime(timer)}` : 'OTP expired'}
            </Text>
            
            <TouchableOpacity 
              onPress={handleResendOtp} 
              disabled={isResending || timer > 0}
            >
              <Text style={[
                styles.resendText, 
                (isResending || timer > 0) && styles.disabledText
              ]}>
                {isResending ? 'Sending...' : timer > 0 ? 'Resend OTP' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BackgroundOne>
    </KeyboardAvoidingView>
  );
};

export default OTP;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 200,
    gap: 15,
  },
  infoText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    width: '13%',
    color: Colors.primary,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 2,
  },
  buttonWrapper: {
    marginTop: 10,
    width: '100%',
    height: 50,
    justifyContent: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resendText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
});