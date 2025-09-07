import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BackgroundOne from '../../components/BackgroundDesign';
import InputButton from '@/components/Inputbutton';
import MyButton from '@/components/MyButton';
import Colors from '@/constants/Color';
import { useRouter } from 'expo-router';
import { validateEmail } from '@/components/Validation';
import api from '@/constants/apiConfig';

const EnterEmail = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const emailError = validateEmail(email);
    if (emailError) return Alert.alert('Error', emailError);
    
    setLoading(true);
    
    try {
      const response = await api.post('/send-otp/', { email });
      if (response.data.success) {
        Alert.alert('Success', 'OTP sent to your email!');
        // Navigate to OTP screen with 'from' parameter set to 'forgot'
        router.push({
          pathname: '/OTP',
          params: { email, from: 'forgot' }
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      Alert.alert('Error', message);
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
        <BackgroundOne text=" Email ">
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.infoText}>
              Enter your email address and we'll send you an OTP to reset your password.
            </Text>
            <InputButton
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={styles.buttonArea}>
              <MyButton 
                title={loading ? "Sending..." : "Send OTP"} 
                onPress={handleSendOTP} 
                disabled={loading}
              />
            </View>
          </ScrollView>
        </BackgroundOne>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default EnterEmail;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 160,
    gap: 20,
  },
  infoText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonArea: {
    marginTop: 20,
    width: '100%',
  },
});