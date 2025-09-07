import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CancelWrite = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cancel Ride</Text>
      <Text style={styles.text}>
        You have successfully cancelled your ride. We hope to serve you better next time.
      </Text>
    </View>
  );
};

export default CancelWrite;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#cc0000',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});
