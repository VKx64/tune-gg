import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import pb from '../../lib/pocketbase';

// Define the type for a single instrument
interface Instrument {
  id: string;
  name: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  useEffect(() => {
    // Get user data from PocketBase authStore
    if (pb.authStore.isValid && pb.authStore.record) {
      setUserData(pb.authStore.record);
    }

    // Load selected instrument from AsyncStorage
    loadSelectedInstrument();
  }, []);

  // Reload selected instrument when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSelectedInstrument();
    }, [])
  );

  const loadSelectedInstrument = async () => {
    try {
      const storedInstrument = await AsyncStorage.getItem('selectedInstrument');
      if (storedInstrument) {
        setSelectedInstrument(JSON.parse(storedInstrument));
      }
    } catch (error) {
      console.error('Error loading selected instrument:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>You are now logged in.</Text>

      {userData && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>User Information:</Text>
          <Text style={styles.userInfoText}>Email: {userData.email}</Text>
          <Text style={styles.userInfoText}>Username: {userData.name || 'Not set'}</Text>
          <Text style={styles.userInfoText}>ID: {userData.id}</Text>
          <Text style={styles.userInfoText}>Verified: {userData.verified ? 'Yes' : 'No'}</Text>
          <Text style={styles.userInfoText}>
            Created: {new Date(userData.created).toLocaleDateString()}
          </Text>
        </View>
      )}

      {selectedInstrument && (
        <View style={styles.instrumentContainer}>
          <Text style={styles.instrumentTitle}>Selected Instrument:</Text>
          <Text style={styles.instrumentText}>{selectedInstrument.name}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(app)/select')}
      >
        <Text style={styles.buttonText}>Select Instrument</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.playButton]}
        onPress={() => router.push('/(app)/play')}
      >
        <Text style={styles.buttonText}>Play</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // A standard white background
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 20,
  },
  userInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  userInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  instrumentContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  instrumentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d2e',
  },
  instrumentText: {
    fontSize: 16,
    color: '#2e7d2e',
    fontWeight: '600',
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  playButton: {
    backgroundColor: '#28a745',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});