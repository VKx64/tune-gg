import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlayScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Play Screen</Text>
      <Text style={styles.subtitle}>Choose your game mode!</Text>

      <View style={styles.gameModesContainer}>
        <TouchableOpacity
          style={[styles.gameModeButton, styles.rhythmButton]}
          onPress={() => {
            // TODO: Navigate to Rhythm Match game
            console.log('Rhythm Match selected');
          }}
        >
          <Text style={styles.gameModeButtonText}>Rhythm Match</Text>
          <Text style={styles.gameModeDescription}>Match the rhythm patterns</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameModeButton, styles.pitchButton]}
          onPress={() => {
            router.push('/(app)/game_hit' as any);
          }}
        >
          <Text style={styles.gameModeButtonText}>Hit Pitch</Text>
          <Text style={styles.gameModeDescription}>Hit the correct pitch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameModeButton, styles.melodyButton]}
          onPress={() => {
            // TODO: Navigate to Melody Replication game
            console.log('Melody Replication selected');
          }}
        >
          <Text style={styles.gameModeButtonText}>Melody Replication</Text>
          <Text style={styles.gameModeDescription}>Replicate the melody</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  gameModesContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  gameModeButton: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rhythmButton: {
    backgroundColor: '#ff6b6b',
  },
  pitchButton: {
    backgroundColor: '#4ecdc4',
  },
  melodyButton: {
    backgroundColor: '#45b7d1',
  },
  gameModeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameModeDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
