import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Color';

const RequirementScreen = () => {
  const router = useRouter();

  const requirements = [
    {
      title: "Age Requirement",
      description: "You must be at least 21 years old to become a driver with our service.",
      icon: "person-outline"
    },
    {
      title: "Valid Driver's License",
      description: "A valid driver's license with at least 1 year of driving experience is required.",
      icon: "card-outline"
    },
    {
      title: "Vehicle Requirements",
      description: "Your vehicle must be in good condition, insured, and meet our model year requirements.",
      icon: "car-outline"
    },
    {
      title: "Background Check",
      description: "All drivers must pass a comprehensive background check and driving record review.",
      icon: "shield-checkmark-outline"
    },
    {
      title: "Smartphone",
      description: "A smartphone with iOS 12+ or Android 8+ to run the driver app smoothly.",
      icon: "phone-portrait-outline"
    },
    {
      title: "Insurance",
      description: "Valid commercial auto insurance that meets our coverage requirements.",
      icon: "document-text-outline"
    },
    {
      title: "Vehicle Inspection",
      description: "Your vehicle must pass our 19-point inspection to ensure passenger safety.",
      icon: "checkmark-circle-outline"
    },
    {
      title: "Local Knowledge",
      description: "Good knowledge of the local area and ability to navigate efficiently.",
      icon: "map-outline"
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Driver Requirements</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.introText}>
          To ensure the best experience for both drivers and passengers, we have established the following requirements. Please review them carefully before applying.
        </Text>

        {requirements.map((requirement, index) => (
          <View key={index} style={styles.requirementCard}>
            <View style={styles.requirementHeader}>
              <Ionicons name={requirement.icon} size={28} color={Colors.primary} style={styles.requirementIcon} />
              <Text style={styles.requirementTitle}>{requirement.title}</Text>
            </View>
            <Text style={styles.requirementDescription}>{requirement.description}</Text>
          </View>
        ))}

        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.noteTitle}>Important Note</Text>
          </View>
          <Text style={styles.noteText}>
            Meeting these requirements does not guarantee approval. All applications are subject to review and final approval by our team. Requirements may vary by location.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.actionText}>
            Ready to get started? Make sure you meet all the requirements before applying.
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RequirementScreen;

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
  requirementCard: {
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
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementIcon: {
    marginRight: 15,
  },
  requirementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noteSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  actionSection: {
    marginTop: 10,
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
  actionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});