import React, { useState, useCallback } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Colors from '@/constants/Color';
import MyButton from '@/components/MyButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/constants/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from '../Icons/BottomIcons';
import MenuNavigation from '../MenuOptions/Manunavigation';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

// Define types for our data
interface ClientProfile {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
}
interface Coordinates {
  latitude: number;
  longitude: number;
}
interface LocationData {
  latitude: number;
  longitude: number;
  country?: string;
  address: string;
}

// Updated fuel options without Hybrid
const fuelOptions = ['Petrol', 'CNG', 'Diesel', 'Electric'];
// Updated ride options with only 1-Way and 2-Way
const rideOptions = ['1-Way', '2-Way'];

const shortenAddress = (fullAddress: string): string => {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',');
  return parts.length > 0 ? parts[0].trim() : fullAddress;
};

const RideDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('');
  const [rideType, setRideType] = useState<string>('');
  const [fuelOptionsVisible, setFuelOptionsVisible] = useState<boolean>(false);
  const [rideOptionsVisible, setRideOptionsVisible] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (params.source && typeof params.source === 'string') {
        const shortSrc = shortenAddress(params.source);
        setSource(shortSrc);
      }
      if (params.destination && typeof params.destination === 'string') {
        const shortDest = shortenAddress(params.destination);
        setDestination(shortDest);
      }
      if (params.date && typeof params.date === 'string') setDate(params.date);
      if (params.time && typeof params.time === 'string') setTime(params.time);
      
      // Fetch client profile when component mounts
      fetchClientProfile();
    }, [params])
  );

  const fetchClientProfile = async (): Promise<void> => {
    try {
      const response = await api.get('/client/profile/');
      setClientProfile(response.data);
    } catch (error) {
      console.error('Error fetching client profile:', error);
      Alert.alert('Error', 'Failed to load your profile. Please try again.');
    }
  };

  const isValidDate = (inputDate: string): boolean => {
    const [day, month, year] = inputDate.split('-').map(Number);
    if (!day || !month || !year) return false;
    const today = new Date();
    const input = new Date(year, month - 1, day);
    input.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return input >= today;
  };

  const isValidTime = (inputTime: string): boolean => {
    const timeRegex = /^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)$/i;
    return timeRegex.test(inputTime);
  };

  const onSelectLocation = (type: 'source' | 'destination'): void => {
    router.push({
      pathname: '/(tabs)/Client/Ride/MapSelectScreen',
      params: {
        type,
        source,
        destination,
      },
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setDate(`${day}-${month}-${year}`);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      let hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    }
  };

  // Function to get location data including country
  const getLocationData = async (place: string): Promise<LocationData | null> => {
    try {
      const res = await api.get('/geocode/', {
        params: { q: place, format: 'json', limit: 1, addressdetails: 1 },
      });
      
      if (!res.data || res.data.length === 0) return null;
      
      const loc = res.data[0];
      const address = loc.display_name;
      
      // Extract country from address details if available
      let country = '';
      if (loc.address && loc.address.country) {
        country = loc.address.country;
      }
      
      return {
        latitude: parseFloat(loc.lat),
        longitude: parseFloat(loc.lon),
        country,
        address
      };
    } catch (err) {
      console.error('Geocode error:', err);
      return null;
    }
  };

  const getCoordinates = async (place: string): Promise<Coordinates | null> => {
    try {
      const res = await api.get('/geocode/', {
        params: { q: place, format: 'json', limit: 1 },
      });
      if (!res.data || res.data.length === 0) return null;
      const loc = res.data[0];
      return { latitude: parseFloat(loc.lat), longitude: parseFloat(loc.lon) };
    } catch (err) {
      console.error('Geocode error:', err);
      return null;
    }
  };

  // Function to convert 12-hour time format to 24-hour format for Django
  const convertTo24HourFormat = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (hours === 12) {
      hours = 0;
    }
    
    if (modifier === 'PM') {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSave = async (): Promise<void> => {
    if (!source || !destination) {
      return Alert.alert('Error', 'Please enter source and destination.');
    }
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return Alert.alert('Error', 'Source and destination must be different.');
    }
    if (!isValidDate(date)) {
      return Alert.alert('Invalid Date', 'Please select a date that is today or in the future.');
    }
    if (!isValidTime(time)) {
      return Alert.alert('Invalid Time', 'Use format HH:MM AM/PM.');
    }
    if (!vehicleType) {
      return Alert.alert('Missing Info', 'Please enter a vehicle type.');
    }
    if (!fuelType || !rideType) {
      return Alert.alert('Missing Info', 'Please fill all fields.');
    }
    
    setLoading(true);
    
    try {
      // Get location data for source and destination (including country)
      const [sourceLocationData, destLocationData] = await Promise.all([
        getLocationData(source),
        getLocationData(destination),
      ]);
      
      if (!sourceLocationData || !destLocationData) {
        setLoading(false);
        return Alert.alert('Error', 'Could not fetch location data for the provided locations.');
      }
      
      // Check if source and destination are in the same country
      if (sourceLocationData.country && destLocationData.country && 
          sourceLocationData.country !== destLocationData.country) {
        setLoading(false);
        return Alert.alert(
          'Invalid Route', 
          'Source and destination must be in the same country. Please select locations within the same country.'
        );
      }
      
      // Get coordinates for source and destination
      const [sourceCoords, destCoords] = await Promise.all([
        getCoordinates(source),
        getCoordinates(destination),
      ]);
      
      if (!sourceCoords || !destCoords) {
        setLoading(false);
        throw new Error('Could not fetch coordinates for the provided locations.');
      }
      
      // Format date and time for backend
      const formattedDate = date.split('-').reverse().join('-'); // Convert DD-MM-YYYY to YYYY-MM-DD
      const formattedTime = convertTo24HourFormat(time); // Convert "5:20 PM" to "17:20"
      
      // Prepare ride data for backend
      const rideData = {
        client: clientProfile?.id, // Use client profile ID
        pickup_location: source,
        dropoff_location: destination,
        pickup_latitude: sourceCoords.latitude,
        pickup_longitude: sourceCoords.longitude,
        dropoff_latitude: destCoords.latitude,
        dropoff_longitude: destCoords.longitude,
        scheduled_datetime: `${formattedDate} ${formattedTime}`,
        vehicle_type: vehicleType,
        fuel_type: fuelType,
        trip_type: rideType.toLowerCase().replace('-', '_'), // Convert "1-Way" to "1_way"
        status: 'requested',
      };
      
      console.log('Sending ride data:', rideData);
      
      // Create ride request in backend
      const response = await api.post('/client/ride-request/', rideData);
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Ride details saved successfully!');
        
        // FIXED: Access the ride ID from the correct location in the response
        const rideRequestId = response.data.ride_request?.id;
        
        if (rideRequestId) {
          // Navigate to MapDistanceScreen with ride request ID and coordinates
          router.push({
            pathname: '/(tabs)/Client/MapDistanceScreen',
            params: {
              rideRequestId: rideRequestId.toString(),
              sourceLat: sourceCoords.latitude.toString(),
              sourceLng: sourceCoords.longitude.toString(),
              destLat: destCoords.latitude.toString(),
              destLng: destCoords.longitude.toString(),
              date,
              time,
              vehicleType,
              fuelType,
              rideType,
            },
          });
        } else {
          Alert.alert('Error', 'Could not get ride request ID from response.');
        }
      } else {
        Alert.alert('Error', 'Failed to save ride details.');
      }
    } catch (err: any) {
      console.error('Save ride error:', err);
      
      // Show more detailed error if available
      let errorMessage = 'An error occurred during saving.';
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        
        if (err.response.data) {
          const errorData = err.response.data;
          const errorMessages: string[] = [];
          
          if (typeof errorData === 'object') {
            for (const [field, message] of Object.entries(errorData)) {
              if (Array.isArray(message)) {
                errorMessages.push(`${field}: ${message.join(', ')}`);
              } else {
                errorMessages.push(`${field}: ${message}`);
              }
            }
          }
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        if (menuOpen) setMenuOpen(false);
        setFuelOptionsVisible(false);
        setRideOptionsVisible(false);
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Ride Details</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Ionicons name="menu" size={30} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Form */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity onPress={() => onSelectLocation('source')} style={styles.roundInput}>
            <Text style={source ? styles.dropdownText : styles.dropdownPlaceholder}>
              {source || 'Select Source'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => onSelectLocation('destination')} style={styles.roundInput}>
            <Text style={destination ? styles.dropdownText : styles.dropdownPlaceholder}>
              {destination || 'Select Destination'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.roundInput}>
            <Text style={date ? styles.dropdownText : styles.dropdownPlaceholder}>
              {date || 'Select Date'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.roundInput}>
            <Text style={time ? styles.dropdownText : styles.dropdownPlaceholder}>
              {time || 'Select Time'}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            placeholder=" Enter Vehicle Type"
            value={vehicleType}
            onChangeText={setVehicleType}
            style={styles.roundInput}
            placeholderTextColor="gray"
            autoCapitalize="words"
            autoCorrect={false}
          />
          
          {/* Fuel Dropdown */}
          <TouchableOpacity onPress={() => setFuelOptionsVisible(!fuelOptionsVisible)} style={styles.roundInput}>
            <Text style={fuelType ? styles.dropdownText : styles.dropdownPlaceholder}>
              {fuelType || 'Select Fuel Type'}
            </Text>
          </TouchableOpacity>
          {fuelOptionsVisible &&
            fuelOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setFuelType(opt);
                  setFuelOptionsVisible(false);
                }}
                style={styles.optionContainer}
              >
                <Text style={styles.option}>{opt}</Text>
              </TouchableOpacity>
            ))}
          
          {/* Ride Dropdown */}
          <TouchableOpacity onPress={() => setRideOptionsVisible(!rideOptionsVisible)} style={styles.roundInput}>
            <Text style={rideType ? styles.dropdownText : styles.dropdownPlaceholder}>
              {rideType || 'Select Ride Type'}
            </Text>
          </TouchableOpacity>
          {rideOptionsVisible &&
            rideOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setRideType(opt);
                  setRideOptionsVisible(false);
                }}
                style={styles.optionContainer}
              >
                <Text style={styles.option}>{opt}</Text>
              </TouchableOpacity>
            ))}
          
          {/* Save Button */}
          <View style={styles.buttonWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loadingText}>Saving...</Text>
              </View>
            ) : (
              <MyButton title="Save Ride Details" onPress={handleSave} />
            )}
          </View>
        </ScrollView>
        
        {/* Date & Time Pickers */}
        {showDatePicker && (
          <DateTimePicker 
            value={new Date()} 
            mode="date" 
            display="default" 
            onChange={onDateChange} 
            minimumDate={new Date()}
          />
        )}
        {showTimePicker && (
          <DateTimePicker 
            value={new Date()} 
            mode="time" 
            display="default" 
            onChange={onTimeChange} 
          />
        )}
        
        {/* Sidebar + Tabs */}
        <MenuNavigation visible={menuOpen} toggleSidebar={() => setMenuOpen(false)} />
        <BottomTabs />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 80,
    paddingBottom: 100,
  },
  roundInput: {
    backgroundColor: Colors.text,
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    color: 'black',
    width: '85%',
    alignSelf: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.primary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: 'gray',
  },
  optionContainer: {
    width: '85%',
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  option: {
    alignSelf: 'center',
    fontSize: 15,
    color: '#333',
  },
  buttonWrapper: {
    marginTop: 40,
    marginBottom: 100,
    alignSelf: 'center',
    width: '85%',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 30,
    width: '85%',
    alignSelf: 'center',
  },
  loadingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default RideDetails;