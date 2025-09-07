// File: app/(tabs)/Client/LocationPicker.tsx

import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';

const LocationPicker = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = params.type as 'source' | 'destination';

  const [region, setRegion] = useState<any>(null);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to pick points.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const confirm = () => {
    if (!marker) {
      Alert.alert('Select location', 'Tap map to place marker');
      return;
    }
    router.replace({
      pathname: '/(tabs)/Client/Ride/RideDetails',
      params: {
        [type + 'Lat']: marker.latitude.toString(),
        [type + 'Lng']: marker.longitude.toString(),
      },
    });
  };

  if (!region) return <Text style={styles.loading}>Loading map...</Text>;

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={region}
        style={styles.map}
        onPress={(e) => setMarker(e.nativeEvent.coordinate)}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>
      <Button title="Confirm Location" onPress={confirm} />
      <Text style={styles.info}>Tap anywhere to set {type} point.</Text>
    </View>
  );
};

export default LocationPicker;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', textAlign: 'center' },
  info: { textAlign: 'center', padding: 10, fontSize: 16 },
});
