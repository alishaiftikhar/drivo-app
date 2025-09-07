import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // Replace WebView with MapView
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MyButton from '@/components/MyButton';
import * as SecureStore from 'expo-secure-store';
import api from '@/constants/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import MenuNavigation from './Client/MenuOptions/Manunavigation';
import BottomTabs from './Client/Icons/BottomIcons';

type Coords = {
  latitude: number;
  longitude: number;
};

const LiveLocation = () => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('access_token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'You are not logged in. Please login again.');
          router.replace('/Login');
          return;
        }
        setToken(storedToken);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access location was denied');
          return;
        }
        
        const {
          coords: { latitude, longitude },
        } = await Location.getCurrentPositionAsync({});
        setLocation({ latitude, longitude });
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your current location');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const saveLocationToDB = async () => {
    if (!token || !location) {
      Alert.alert('Error', 'Location or token missing.');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('Saving location:', location);
      console.log('API endpoint:', '/save-location/');
      
      const response = await api.post(
        '/save-location/',
        {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        await SecureStore.setItemAsync('last_latitude', location.latitude.toString());
        await SecureStore.setItemAsync('last_longitude', location.longitude.toString());
        
        console.log('Location saved successfully');
        
        Alert.alert('Success', 'Location saved successfully', [
          { text: 'OK', onPress: () => navigateToRideDetails() }
        ]);
      } else {
        console.error('Unexpected response status:', response.status);
        Alert.alert('Error', `Unexpected response from server: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.', [
            { text: 'OK', onPress: () => router.replace('/Login') }
          ]);
        } else if (error.response.status === 404) {
          Alert.alert('Error', 'API endpoint not found. Please contact support.');
        } else {
          const errorMsg = error.response.data?.error || error.response.data?.message || 'Failed to save location';
          Alert.alert('Error', errorMsg);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        Alert.alert('Error', 'No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        Alert.alert('Error', `Failed to save location: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const navigateToRideDetails = () => {
    console.log('Navigating to RideDetails...');
    try {
      router.push('/(tabs)/Client/Ride/RideDetails');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not navigate to the next screen');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#001F54" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }
  
  // No location state
  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to get your location</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Location</Text>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons name="menu" size={30} color="#001F54" />
        </TouchableOpacity>
      </View>
      
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            description="You are here"
          />
        </MapView>
      </View>
      
      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <MyButton 
          title={saving ? "Saving..." : "Save Location"} 
          onPress={saveLocationToDB}
          disabled={saving}
        />
      </View>
      
      {/* Menu Navigation */}
      <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
      
      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
};

export default LiveLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3D3D3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#001F54',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#001F54',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 5,
  },
});