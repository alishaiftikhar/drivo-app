import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import MyButton from '@/components/MyButton';
import { useRouter } from 'expo-router';

const Index = () => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    router.push('/Signup');  
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.drivoText}>Drivo</Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <MyButton title="Let's Start" onPress={handlePress} />
      </View>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e6e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#001F54',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  drivoText: {
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  buttonContainer: {
    marginTop: 60,
  },
});
