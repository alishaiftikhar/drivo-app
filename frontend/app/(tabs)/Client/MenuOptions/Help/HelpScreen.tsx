import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';

const HelpScreen = () => {
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client');

  const renderClientHelp = () => (
    <View style={styles.helpSection}>
      <Text style={styles.sectionTitle}>Getting Started</Text>
      <Text style={styles.helpText}>
        1. Download and install the app from your device's app store.
      </Text>
      <Text style={styles.helpText}>
        2. Create an account using your email address and phone number.
      </Text>
      <Text style={styles.helpText}>
        3. Add a payment method to your account.
      </Text>
      <Text style={styles.helpText}>
        4. You're ready to book your first ride!
      </Text>

      <Text style={styles.sectionTitle}>Booking a Ride</Text>
      <Text style={styles.helpText}>
        1. Open the app and enter your destination in the "Where to?" field.
      </Text>
      <Text style={styles.helpText}>
        2. Select your ride type (economy, premium, etc.).
      </Text>
      <Text style={styles.helpText}>
        3. Confirm your pickup location and request a ride.
      </Text>
      <Text style={styles.helpText}>
        4. Track your driver's arrival in real-time.
      </Text>

      <Text style={styles.sectionTitle}>Payment Options</Text>
      <Text style={styles.helpText}>
        • Credit/Debit Cards
      </Text>
      <Text style={styles.helpText}>
        • Digital Wallets (Apple Pay, Google Pay)
      </Text>
      <Text style={styles.helpText}>
        • Cash (in select cities)
      </Text>
      <Text style={styles.helpText}>
        • App Balance
      </Text>

      <Text style={styles.sectionTitle}>Safety Features</Text>
      <Text style={styles.helpText}>
        • Share your trip status with friends or family
      </Text>
      <Text style={styles.helpText}>
        • Emergency assistance button
      </Text>
      <Text style={styles.helpText}>
        • Anonymized phone number to contact your driver
      </Text>
      <Text style={styles.helpText}>
        • GPS tracking throughout your journey
      </Text>

      <Text style={styles.sectionTitle}>Common Issues</Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Driver is late:</Text> Your app will show the driver's estimated time of arrival. If they're significantly delayed, you can cancel without charge.
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Wrong pickup location:</Text> Contact your driver through the app to update your pickup location.
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Lost item:</Text> Use the "Lost Item" feature in your ride history to contact your driver.
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Fare dispute:</Text> You can dispute a fare within 24 hours of your trip through the app.
      </Text>

      <Text style={styles.sectionTitle}>Contact Support</Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Email:</Text> client-support@example.com
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Phone:</Text> (123) 456-7890
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Live Chat:</Text> Available 24/7 in the app
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Help Center:</Text> Visit help.example.com
      </Text>
    </View>
  );

  const renderDriverHelp = () => (
    <View style={styles.helpSection}>
      <Text style={styles.sectionTitle}>Becoming a Driver</Text>
      <Text style={styles.helpText}>
        1. Download the driver app and create an account.
      </Text>
      <Text style={styles.helpText}>
        2. Complete the registration process with your personal information.
      </Text>
      <Text style={styles.helpText}>
        3. Submit required documents (driver's license, vehicle registration, insurance).
      </Text>
      <Text style={styles.helpText}>
        4. Pass a background check and vehicle inspection.
      </Text>
      <Text style={styles.helpText}>
        5. Once approved, you can start accepting ride requests.
      </Text>

      <Text style={styles.sectionTitle}>Using the Driver App</Text>
      <Text style={styles.helpText}>
        1. Go online to start receiving ride requests.
      </Text>
      <Text style={styles.helpText}>
        2. Review request details including destination and estimated fare.
      </Text>
      <Text style={styles.helpText}>
        3. Accept or decline the request within 15 seconds.
      </Text>
      <Text style={styles.helpText}>
        4. Navigate to the pickup location using the in-app GPS.
      </Text>
      <Text style={styles.helpText}>
        5. Confirm rider identity and begin the trip.
      </Text>
      <Text style={styles.helpText}>
        6. Follow the GPS to the destination and complete the trip.
      </Text>

      <Text style={styles.sectionTitle}>Earnings & Payments</Text>
      <Text style={styles.helpText}>
        • Fares are calculated based on time and distance
      </Text>
      <Text style={styles.helpText}>
        • You receive 80% of the total fare
      </Text>
      <Text style={styles.helpText}>
        • Weekly direct deposits to your bank account
      </Text>
      <Text style={styles.helpText}>
        • Instant cash out option available (small fee applies)
      </Text>
      <Text style={styles.helpText}>
        • Detailed earnings reports in the driver portal
      </Text>

      <Text style={styles.sectionTitle}>Vehicle Requirements</Text>
      <Text style={styles.helpText}>
        • 4-door vehicle in good condition
      </Text>
      <Text style={styles.helpText}>
        • Model year 2010 or newer
      </Text>
      <Text style={styles.helpText}>
        • Valid registration and insurance
      </Text>
      <Text style={styles.helpText}>
        • Pass vehicle inspection every 12 months
      </Text>
      <Text style={styles.helpText}>
        • No commercial branding
      </Text>

      <Text style={styles.sectionTitle}>Rating System</Text>
      <Text style={styles.helpText}>
        • Riders rate each trip from 1 to 5 stars
      </Text>
      <Text style={styles.helpText}>
        • Maintain an average rating of 4.7 or higher
      </Text>
      <Text style={styles.helpText}>
        • Low ratings may result in deactivation
      </Text>
      <Text style={styles.helpText}>
        • You can rate riders after each trip
      </Text>

      <Text style={styles.sectionTitle}>Safety Guidelines</Text>
      <Text style={styles.helpText}>
        • Verify rider identity before starting trip
      </Text>
      <Text style={styles.helpText}>
        • Follow all traffic laws and regulations
      </Text>
      <Text style={styles.helpText}>
        • Take breaks when needed to avoid fatigue
      </Text>
      <Text style={styles.helpText}>
        • Use the in-app emergency button if needed
      </Text>
      <Text style={styles.helpText}>
        • Report any safety incidents immediately
      </Text>

      <Text style={styles.sectionTitle}>Contact Support</Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Email:</Text> driver-support@example.com
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Phone:</Text> (123) 456-7891
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>Driver Portal:</Text> drivers.example.com
      </Text>
      <Text style={styles.helpText}>
        <Text style={styles.boldText}>24/7 Support:</Text> Available in the driver app
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'client' && styles.activeTab]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={[styles.tabText, activeTab === 'client' && styles.activeTabText]}>Client Help</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
          onPress={() => setActiveTab('driver')}
        >
          <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>Driver Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'client' ? renderClientHelp() : renderDriverHelp()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  activeTabText: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  helpSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 15,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
  },
});