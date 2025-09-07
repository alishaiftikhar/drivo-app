// app/(tabs)/types.ts

export interface User {
  id: number;
  email: string;
  is_driver: boolean;
  is_client: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface DriverProfile {
  id: number;
  user: User;
  full_name?: string;
  cnic?: string;
  age?: number;
  driving_license?: string;
  license_expiry?: string;
  phone_number?: string;
  city?: string;
  status: 'pending' | 'approved' | 'rejected' | 'available' | 'offline' | 'on_ride';
  dp?: string;  // Profile picture URL
  dp_url?: string;  // Full profile picture URL
  current_latitude?: number;
  current_longitude?: number;
  last_location_update: string;
}

export interface ClientProfile {
  id: number;
  user: User;
  full_name?: string;
  cnic?: string;
  age?: number;
  phone_number?: string;
  address?: string;
  dp?: string;  // Profile picture URL
  latitude?: number;
  longitude?: number;
  last_location_update: string;
}

export interface Ride {
  id: number;
  client: ClientProfile;
  driver?: DriverProfile;
  pickup_location: string;
  dropoff_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  scheduled_datetime?: string;
  vehicle_type: string;
  fuel_type: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  trip_type: 'one-way' | 'round-trip';
  fare?: number;
  distance?: number;
  duration?: number;
  driver_payment?: number;
  status: 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  ride: Ride;
  client: ClientProfile;
  amount: number;
  method: 'JazzCash' | 'EasyPaisa' | 'Bank Transfer' | 'Cash';
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  ride?: Ride;
  client: ClientProfile;
  driver: DriverProfile;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Driver {
  id: number;
  user: User;
  full_name?: string;
  cnic?: string;
  age?: number;
  driving_license?: string;
  license_expiry?: string;
  phone_number?: string;
  city?: string;
  status: 'pending' | 'approved' | 'rejected' | 'available' | 'offline' | 'on_ride';
  dp?: string;  // Profile picture URL
  dp_url?: string;  // Full profile picture URL
  current_latitude?: number;
  current_longitude?: number;
  last_location_update: string;
  rating: number;
  totalRides: number;
  vehicleType: string;
  location: string;
  // Additional driver-specific fields
  experience?: number; // in years
  carModel?: string;
  carColor?: string;
  carYear?: number;
}