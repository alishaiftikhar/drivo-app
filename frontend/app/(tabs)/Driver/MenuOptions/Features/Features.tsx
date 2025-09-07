import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Color';

const FeatureScreen = () => {
  const router = useRouter();

  const features = [
    {
      title: "Flexible Schedule",
      description: "Work whenever you want. No fixed hours - you decide when to drive.",
      icon: "time-outline"
    },
    {
      title: "Instant Earnings",
      description: "Get paid instantly after each ride. No waiting for weekly payouts.",
      icon: "cash-outline"
    },
    {
      title: "Ride Requests",
      description: "Receive ride requests based on your location and availability.",
      icon: "notifications-outline"
    },
    {
      title: "In-App Navigation",
      description: "Built-in GPS navigation to help you reach your passengers efficiently.",
      icon: "navigate-outline"
    },
    {
      title: "Passenger Ratings",
      description: "Rate your passengers and maintain a safe driving environment.",
      icon: "star-outline"
    },
    {
      title: "Earnings Tracking",
      description: "Track your daily, weekly, and monthly earnings in real-time.",
      icon: "stats-chart-outline"
    },
    {
      title: "Driver Support",
      description: "24/7 support for any issues or questions you might have.",
      icon: "headset-outline"
    },
    {
      title: "Destination Mode",
      description: "Set your destination and only receive rides going in that direction.",
      icon: "location-outline"
    },
    {
      title: "Ride History",
      description: "Access your complete ride history with all details and earnings.",
      icon: "document-text-outline"
    },
    {
      title: "Driver Community",
      description: "Connect with other drivers, share experiences, and get tips.",
      icon: "people-outline"
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>App Features</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.introText}>
          Discover the powerful features designed to make your driving experience seamless, profitable, and enjoyable.
        </Text>

        <View style={styles.featureGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={32} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to start earning?</Text>
          <Text style={styles.ctaText}>
            Join thousands of drivers who are already enjoying the benefits of our platform.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Sign Up Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FeatureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaSection: {
    marginTop: 10,
    padding: 25,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  ctaText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});