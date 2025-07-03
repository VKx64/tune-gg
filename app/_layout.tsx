import { Slot } from 'expo-router';
import React from 'react';

// This is the root layout for the entire app.
export default function RootLayout() {
  // Here you would add your logic to check if the user is authenticated.
  // For example, you might check for a token in AsyncStorage.
  //
  // const { user, isLoading } = useAuth();
  //
  // if (isLoading) {
  //   return <SplashScreen />;
  // }
  //
  // if (!user) {
  //   // Redirect to the login page if the user is not authenticated.
  //   return <Redirect href="/login" />;
  // }

  // For now, we render the current child route using <Slot>.
  // Expo Router will automatically direct to (auth) or (app) based on URL.
  // You can set initial route in package.json if needed.
  return <Slot />;
}