import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Color';

const HelpScreen = () => {
  const router = useRouter();

  const helpTopics = [
    {
      title: "Getting Started",
      description: "Learn how to set up your driver profile and start accepting rides.",
      icon: "rocket-outline"
    },
    {
      title: "Accepting Rides",
      description: "Understand how to receive, accept, and manage ride requests.",
      icon: "car-outline"
    },
    {
      title: "Navigation",
      description: "Tips for using the in-app navigation to reach your passengers efficiently.",
      icon: "navigate-outline"
    },
    {
      title: "Payment Process",
      description: "How payments are processed and transferred to your account.",
      icon: "cash-outline"
    },
    {
      title: "Safety Guidelines",
      description: "Important safety measures to protect yourself and your passengers.",
      icon: "shield-checkmark-outline"
    },
    {
      title: "Rating System",
      description: "How the rating system works and how to maintain a good rating.",
      icon: "star-outline"
    },
    {
      title: "Troubleshooting",
      description: "Solutions to common issues you might encounter while using the app.",
      icon: "construct-outline"
    },
    {
      title: "Contact Support",
      description: "How to reach our support team when you need assistance.",
      icon: "headset-outline"
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Help Center</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.introText}>
          Welcome to our Help Center! Here you'll find everything you need to know about using our driver app effectively.
        </Text>

        {helpTopics.map((topic, index) => (
          <View key={index} style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Ionicons name={topic.icon} size={28} color={Colors.primary} style={styles.topicIcon} />
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </View>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is available 24/7 to assist you with any questions or issues you may have.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpScreen;

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
  },
  topicCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicIcon: {
    marginRight: 15,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});