import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Color';

const FeatureScreen = () => {
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client');

  const renderClientFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Core Features</Text>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="map" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Real-time Tracking</Text>
          <Text style={styles.featureDescription}>
            Track your ride in real-time on the map and share your trip status with friends or family.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="card" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Multiple Payment Options</Text>
          <Text style={styles.featureDescription}>
            Pay with credit/debit cards, digital wallets, or cash (in select cities). No need to carry cash.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="calendar" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Ride Scheduling</Text>
          <Text style={styles.featureDescription}>
            Book your ride in advance and get notified when your driver is on the way.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="star" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Driver Ratings</Text>
          <Text style={styles.featureDescription}>
            Rate your driver after each trip and help us maintain high-quality service.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="pricetag" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Fare Estimates</Text>
          <Text style={styles.featureDescription}>
            Get upfront pricing before you book. No surprises or hidden fees.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="receipt" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Ride History</Text>
          <Text style={styles.featureDescription}>
            Access your complete ride history and download receipts for expense reporting.
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Safety Features</Text>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Emergency Assistance</Text>
          <Text style={styles.featureDescription}>
            Connect to emergency services directly through the app with one tap.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="share-social" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Share Trip Status</Text>
          <Text style={styles.featureDescription}>
            Share your live trip status with trusted contacts so they can track your journey.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="call" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Anonymized Communication</Text>
          <Text style={styles.featureDescription}>
            Contact your driver through an anonymized number to protect your privacy.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDriverFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Core Features</Text>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="time" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Flexible Work Hours</Text>
          <Text style={styles.featureDescription}>
            Work whenever you want. Be your own boss and set your own schedule.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="notifications" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Real-time Trip Requests</Text>
          <Text style={styles.featureDescription}>
            Receive ride requests instantly and see all trip details before accepting.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="wallet" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Earnings Tracking</Text>
          <Text style={styles.featureDescription}>
            Track your earnings in real-time and see detailed breakdowns of your income.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="flame" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Heat Map</Text>
          <Text style={styles.featureDescription}>
            View high-demand areas on the map to maximize your earnings potential.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="navigate" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>In-app Navigation</Text>
          <Text style={styles.featureDescription}>
            Get turn-by-turn directions to pickup locations and destinations.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="cash" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Instant Cash Out</Text>
          <Text style={styles.featureDescription}>
            Transfer your earnings to your bank account instantly (small fee applies).
          </Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Support Features</Text>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="school" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Driver Resources</Text>
          <Text style={styles.featureDescription}>
            Access training materials, tips, and best practices to improve your service.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="chatbubble" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>24/7 Support</Text>
          <Text style={styles.featureDescription}>
            Get help whenever you need it with our dedicated driver support team.
          </Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          <Ionicons name="document-text" size={24} color={Colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Weekly Reports</Text>
          <Text style={styles.featureDescription}>
            Receive detailed weekly reports about your earnings, trips, and performance.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Features</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'client' && styles.activeTab]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={[styles.tabText, activeTab === 'client' && styles.activeTabText]}>Client Features</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
          onPress={() => setActiveTab('driver')}
        >
          <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>Driver Features</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'client' ? renderClientFeatures() : renderDriverFeatures()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeatureScreen;

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
  featuresSection: {
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
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});