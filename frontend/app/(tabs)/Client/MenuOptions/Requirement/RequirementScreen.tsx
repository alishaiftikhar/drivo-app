import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';

const RequirementScreen = () => {
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client');

  const renderClientRequirements = () => (
    <View style={styles.requirementsSection}>
      <Text style={styles.sectionTitle}>Device Requirements</Text>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="phone-portrait" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Operating System</Text>
          <Text style={styles.requirementDescription}>
            iOS 12.0 or later for Apple devices
          </Text>
          <Text style={styles.requirementDescription}>
            Android 8.0 (Oreo) or later for Android devices
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="wifi" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Internet Connection</Text>
          <Text style={styles.requirementDescription}>
            Stable internet connection (3G, 4G, 5G, or Wi-Fi)
          </Text>
          <Text style={styles.requirementDescription}>
            Required for booking rides, tracking, and payments
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="location" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Location Services</Text>
          <Text style={styles.requirementDescription}>
            GPS must be enabled on your device
          </Text>
          <Text style={styles.requirementDescription}>
            Required for pickup location detection and ride tracking
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Account Requirements</Text>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="mail" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Email Address</Text>
          <Text style={styles.requirementDescription}>
            Valid email address for account creation and notifications
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="call" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Phone Number</Text>
          <Text style={styles.requirementDescription}>
            Active phone number for account verification
          </Text>
          <Text style={styles.requirementDescription}>
            Required for two-factor authentication and driver communication
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="card" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Payment Method</Text>
          <Text style={styles.requirementDescription}>
            Credit/debit card, digital wallet, or other supported payment methods
          </Text>
          <Text style={styles.requirementDescription}>
            Required for booking and paying for rides
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Recommended Specifications</Text>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="hardware-chip" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Device Performance</Text>
          <Text style={styles.requirementDescription}>
            At least 2GB RAM for optimal performance
          </Text>
          <Text style={styles.requirementDescription}>
            Recent device models recommended for best experience
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="storage" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Storage Space</Text>
          <Text style={styles.requirementDescription}>
            At least 200MB of free storage space
          </Text>
          <Text style={styles.requirementDescription}>
            Additional space may be needed for map caching
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDriverRequirements = () => (
    <View style={styles.requirementsSection}>
      <Text style={styles.sectionTitle}>Device Requirements</Text>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="phone-portrait" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Operating System</Text>
          <Text style={styles.requirementDescription}>
            iOS 12.0 or later for Apple devices
          </Text>
          <Text style={styles.requirementDescription}>
            Android 8.0 (Oreo) or later for Android devices
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="wifi" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Internet Connection</Text>
          <Text style={styles.requirementDescription}>
            Reliable internet connection (4G, 5G, or Wi-Fi)
          </Text>
          <Text style={styles.requirementDescription}>
            Required for receiving ride requests and navigation
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="location" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Location Services</Text>
          <Text style={styles.requirementDescription}>
            High-accuracy GPS must be enabled
          </Text>
          <Text style={styles.requirementDescription}>
            Required for precise pickup/dropoff and navigation
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Personal Requirements</Text>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Age Requirement</Text>
          <Text style={styles.requirementDescription}>
            Must be at least 21 years old
          </Text>
        </View>
      </View>
      
      <View style={styles.requirementItem}>
        <View style={styles.requirementIconContainer}>
          <Ionicons name="car" size={24} color={Colors.primary} />
        </View>
        <View style={styles.requirementTextContainer}>
          <Text style={styles.requirementTitle}>Driving License</Text>
          <Text style={styles.requirementDescription}>
            Valid driver's license with at least 1 year of driving experience
          </Text>
          <Text style={styles.requirementDescription}>
            Must be submitted during registration
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Requirements</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'client' && styles.activeTab]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={[styles.tabText, activeTab === 'client' && styles.activeTabText]}>Client Requirements</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
          onPress={() => setActiveTab('driver')}
        >
          <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>Driver Requirements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'client' ? renderClientRequirements() : renderDriverRequirements()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RequirementScreen;

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
  requirementsSection: {
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
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  requirementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  requirementTextContainer: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});