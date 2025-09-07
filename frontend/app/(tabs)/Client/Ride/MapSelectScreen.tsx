import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import Colors from '@/constants/Color';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Define types for our data structures
type LocationSuggestion = {
  place_id?: string;
  lat: string;
  lon: string;
  display_name: string;
};

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

const MapSelectScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 31.4167, // Default latitude (Shikhupura)
    longitude: 73.9767, // Default longitude (Shikhupura)
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  // Create a ref for the MapView
  const mapRef = useRef<MapView>(null);

  // Handle search when user presses the search button
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 5,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'DrivobApp (drivob@example.com)', // Replace with your app's contact info
        },
      });
      
      if (response.data && response.data.length > 0) {
        setSuggestions(response.data);
        // Automatically select the first suggestion
        const firstSuggestion = response.data[0];
        handleSelectSuggestion(firstSuggestion);
      } else {
        setSuggestions([]);
        Alert.alert('No Results', 'No locations found for your search');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to fetch location suggestions');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Handle location selection from suggestions
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const { lat, lon, display_name } = suggestion;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    setSelectedLocation({
      latitude,
      longitude,
      address: display_name,
    });
    
    setRegion(newRegion);
    setSearchQuery(display_name);
    setSuggestions([]);
    
    // Animate the map to the selected location
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500); // 500ms animation
    }
  };

  // Handle map press to select location
  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    const { latitude, longitude } = coordinate;
    
    setLoading(true);
    try {
      // Reverse geocoding using OpenStreetMap Nominatim API
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'DrivobApp (drivob@example.com)', // Replace with your app's contact info
        },
      });
      
      if (response.data && response.data.display_name) {
        const address = response.data.display_name;
        setSelectedLocation({
          latitude,
          longitude,
          address,
        });
        setSearchQuery(address);
      } else {
        setSelectedLocation({
          latitude,
          longitude,
          address: `Selected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
        setSearchQuery(`Selected Location`);
      }
      
      // Update the region to the pressed location
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      
      // Animate the map to the pressed location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500); // 500ms animation
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `Selected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      });
      setSearchQuery(`Selected Location`);
    } finally {
      setLoading(false);
    }
  };

  // Confirm selection and return to RideDetails
  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    
    // Pass the selected location back to RideDetails
    const type = params.type as string; // Cast to string to ensure it's a valid property name
    router.push({
      pathname: '/(tabs)/Client/Ride/RideDetails',
      params: {
        type: type,
        [type]: selectedLocation.address, // Set either source or destination
        // Preserve other parameters
        source: type === 'source' ? selectedLocation.address : params.source,
        destination: type === 'destination' ? selectedLocation.address : params.destination,
        date: params.date,
        time: params.time,
        vehicleType: params.vehicleType,
        fuelType: params.fuelType,
        rideType: params.rideType,
      },
    });
  };

  // Render suggestion item
  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Ionicons name="location-outline" size={20} color={Colors.primary} />
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            onSubmitEditing={handleSearch} // Add this to trigger search when user submits
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.place_id || item.display_name}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef} // Attach the ref to the MapView
          style={styles.map}
          region={region}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={selectedLocation.address}
              pinColor={Colors.primary}
            />
          )}
        </MapView>
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      
      {/* Confirm Button */}
      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton, 
            selectedLocation ? styles.selectedButton : styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>
            {selectedLocation ? 'Confirm Location' : 'Select Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 200,
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  mapContainer: {
    flex: 1,
    marginTop: 80, // Make space for the search header
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 5,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  confirmButton: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedButton: {
    backgroundColor: '#1a237e', // Dark blue when selected
  },
  disabledButton: {
    backgroundColor: '#ccc', // Gray when disabled
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapSelectScreen;