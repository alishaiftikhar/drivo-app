import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const ViewDetail = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Details</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/Client/MenuOptions/RideDetails/Reschedule')}>
        <Text style={styles.buttonText}>Reschedule Ride</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/Client/MenuOptions/RideDetails/CancelRide')}>
        <Text style={styles.buttonText}>Cancel Ride</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/Client/MenuOptions/RideDetails/NewRideDetail')}>
        <Text style={styles.buttonText}>New Ride Detail</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ViewDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#005A9C',
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
