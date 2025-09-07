import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const BottomIcons = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity style={styles.iconWrapper} onPress={() => router.push('/(tabs)/Driver/WaitForJob')}>
        <Ionicons name="home" size={28} color="#2c3e50" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>
      
      {/* Tracking */}
      <TouchableOpacity style={styles.iconWrapper} onPress={() => router.push('/(tabs)/Driver/ActiveRide')}>
        <Ionicons name="navigate-circle-outline" size={28} color="#2c3e50" />
        <Text style={styles.label}>Tracking</Text>
      </TouchableOpacity>
      
      {/* Emergency */}
      <TouchableOpacity style={styles.iconWrapper} onPress={() => router.push('/(tabs)/Driver/Emergency')}>
        <Ionicons name="alert-circle" size={28} color="red" />
        <Text style={styles.label}>Emergency</Text>
      </TouchableOpacity>
      
      {/* Profile */}
      <TouchableOpacity style={styles.iconWrapper} onPress={() => router.push('/(tabs)/Driver/Profile')}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-circle-outline" size={28} color="#2c3e50" />
          <View style={styles.profileBadge} />
        </View>
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomIcons;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fdfdfd',
  },
  iconWrapper: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    color: '#2c3e50',
  },
  profileBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
});