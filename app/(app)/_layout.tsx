// In app/(app)/_layout.tsx
import { router, Stack } from 'expo-router';
import React from 'react';
import { Button } from 'react-native';

export default function AppLayout() {
  const handleLogout = () => {
    // Add your logout logic here (e.g., clear user token)
    router.replace('/login');
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerRight: () => <Button onPress={handleLogout} title="Logout" />,
        }}
      />
    </Stack>
  );
}