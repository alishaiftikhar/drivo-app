import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Color';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MenuNavigation = ({ visible, toggleSidebar }: { visible: boolean, toggleSidebar: () => void }) => {
  const router = useRouter();
  
  const menuOptions = [
    { label: 'Profile', path: '/(tabs)/Driver/MenuOptions/Profile/DriverProfile' },
    { label: 'Help', path: '/(tabs)/Driver/MenuOptions/Help/Help' },
    { label: 'Requirement', path: '/(tabs)/Driver/MenuOptions/Requirements/Requirement' },
    { label: 'Feature', path: '/(tabs)/Driver/MenuOptions/Features/Features' },
    { label: 'Type Selector', path: '/(tabs)/TypeSelector' },
    { label: 'Earning History', path: '/(tabs)/Driver/MenuOptions/Earnings History/EarningsScreen' },
    { label: 'Ride Details', path: '/(tabs)/Driver/MenuOptions/RideDetail' },
    { label: 'Share', path: 'share' },
    { label: 'Logout', path: 'logout' }
  ];
  
  const sidebarAnim = useRef(new Animated.Value(visible ? 0 : -SCREEN_WIDTH * 0.7)).current;

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: visible ? 0 : -SCREEN_WIDTH * 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: () => {
            toggleSidebar();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Check out this amazing ride-sharing app! Download it now: https://example.com/download',
        title: 'Share this App',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type: ', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sharing the app');
      console.error('Error sharing:', error);
    }
  };

  const handlePress = (item: { label: string; path: string }) => {
    toggleSidebar();
    
    if (item.path === 'logout') {
      handleLogout();
    } else if (item.path === 'share') {
      handleShare();
    } else if (item.label === 'Ride Details') {
      router.push({
        pathname: item.path,
        params: { showActions: 'true' }
      } as any);
    } else {
      router.push(item.path as any);
    }
  };

  // Render menu items with proper icon handling
  const renderMenuItems = () => {
    return menuOptions.map((item, index) => {
      // Determine the icon name
      const iconName = item.label === 'Share' ? "share-social-outline" : "chevron-forward-outline";
      
      return (
        <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handlePress(item)}>
          <Ionicons 
            name={iconName as any} // Type assertion to bypass type checking
            size={20} 
            color={Colors.primary} 
            style={{ marginRight: 10 }} 
          />
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <Animated.View style={[styles.sidebar, { right: sidebarAnim }]}>
      {renderMenuItems()}
    </Animated.View>
  );
};

export default MenuNavigation;

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: 'white',
    paddingTop: 70,
    paddingHorizontal: 20,
    elevation: 15,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 18,
    color: Colors.primary,
  },
});