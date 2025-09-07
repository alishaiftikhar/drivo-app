import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Easing, Text } from 'react-native';
import Colors from '@/constants/Color';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef } from 'react';

const GrantLocation = () => {
  const router = useRouter();
  const [userType, setUserType] = React.useState<string | null>(null);
  
  // Animation value for the button
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    const getUserType = async () => {
      const type = await SecureStore.getItemAsync('userType');
      setUserType(type);
    };
    getUserType();
  }, []);
  
  // Start animations when component mounts
  useEffect(() => {
    // Float animation for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Pulse animation for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseAnim]);
  
  const handleEnableLocation = () => {
    if (userType === 'client') {
      // Navigate to client location screen
      router.push('/(tabs)/LiveLocation');
    } else if (userType === 'driver') {
      // Navigate to driver wait for job screen
      router.push('/(tabs)/Driver/WaitForJob');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Full background image */}
      <Image
        source={{ uri: 'https://st2.depositphotos.com/5000011/42985/v/450/depositphotos_429856290-stock-illustration-abstract-city-map-banner-navigator.jpg' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content overlay */}
      <View style={styles.overlay}>
        {/* Main content */}
        <View style={styles.content}>
          {/* Enable location button with float and pulse effect */}
          <Animated.View style={[
            styles.buttonContainer,
            {
              transform: [
                { translateY: floatAnim },
                { scale: pulseAnim }
              ]
            }
          ]}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleEnableLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Enable Location</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default GrantLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(245, 244, 247, 0.24)', // Semi-transparent overlay to make text more readable
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 600,
  },
  buttonContainer: {
    marginBottom: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    width: 220,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(253, 237, 237, 0.5)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});