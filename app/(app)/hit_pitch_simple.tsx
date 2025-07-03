import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HitPitchSimpleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Pitch Detection</Text>
      <Text style={styles.subtitle}>Testing text rendering</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
});
