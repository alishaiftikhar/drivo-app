import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewWriteDetail = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Ride Detail</Text>
      <Text style={styles.text}>
        • Pickup: 123 Main Street{"\n"}
        • Destination: 456 Oak Avenue{"\n"}
        • Time: 12:30 PM{"\n"}
        • Driver: Ali Khan
      </Text>
    </View>
  );
};

export default NewWriteDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#005A9C',
  },
  text: {
    fontSize: 18,
    color: '#555',
  },
});
