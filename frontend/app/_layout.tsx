import React from 'react';
import { Stack } from 'expo-router';
//import './authenticateUser';




const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="/index" />
      <Stack.Screen name="/Signup" />
    </Stack>
  );
};

export default Layout;
