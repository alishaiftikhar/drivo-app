import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Reschedule = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reschedule Ride</Text>
      <Text style={styles.text}>
        Your ride has been successfully rescheduled.{"\n"}
        New Pickup Time: 2:00 PM
      </Text>
    </View>
  );
};

export default Reschedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaeaea',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0066cc',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});
