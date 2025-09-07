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
import Colors from '@/constants/Color';
import MyButton from '@/components/MyButton';
import InputButton from '@/components/Inputbutton';
import { useRouter } from 'expo-router';
import {
  validatePassword,
  validateConfirmPassword,
} from '@/components/Validation';
import api from '@/constants/apiConfig';

const NewPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const passwordError = validatePassword(newPassword);
    const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
    
    if (passwordError) return Alert.alert('Error', passwordError);
    if (confirmPasswordError) return Alert.alert('Error', confirmPasswordError);
    
    setLoading(true);
    
    try {
      // Send new password to backend
      const response = await api.post('/reset-password/', {
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Password updated successfully!');
        router.push('/TypeSelector');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update password');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      const message = err.response?.data?.message || err.response?.data?.detail || 'Failed to reset password';
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
        <BackgroundOne text="Password">
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InputButton
              placeholder="Enter New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secure
              showToggle
              isSecure={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <InputButton
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              showToggle
              isSecure={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            <View style={styles.buttonArea}>
              <MyButton 
                title={loading ? "Updating..." : "Submit"} 
                onPress={handleSubmit} 
                disabled={loading}
              />
            </View>
          </ScrollView>
        </BackgroundOne>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default NewPassword;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 160,
    gap: 2,
  },
  buttonArea: {
    marginTop: 10,
  },
});