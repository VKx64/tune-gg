import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import pb from '../../lib/pocketbase'; // Adjust the path to your pocketbase instance

// Define the type for a single instrument based on your schema
interface Instrument {
  id: string;
  name: string;
  // Add other fields if necessary
}

const SelectInstrumentScreen = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const records = await pb.collection('instruments').getFullList<Instrument>();
        setInstruments(records);
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      }
    };

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

    fetchInstruments();
    loadSelectedInstrument();
  }, []);

  const handleSelectInstrument = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    // You can add navigation logic here to proceed to the next screen
    console.log('Selected instrument:', instrument.name);
  };

  const handleConfirm = async () => {
    if (selectedInstrument) {
      try {
        // Save selected instrument to AsyncStorage
        await AsyncStorage.setItem('selectedInstrument', JSON.stringify(selectedInstrument));
        console.log('Instrument saved to storage:', selectedInstrument.name);
        router.back();
      } catch (error) {
        console.error('Error saving instrument to storage:', error);
      }
    }
  };

  const renderItem = ({ item }: { item: Instrument }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        selectedInstrument?.id === item.id && styles.selectedItemContainer,
      ]}
      onPress={() => handleSelectInstrument(item)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Instrument</Text>
      <FlatList
        data={instruments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        extraData={selectedInstrument}
      />
      <Button
        title="Confirm"
        onPress={handleConfirm}
        disabled={!selectedInstrument}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItemContainer: {
    backgroundColor: '#e0f7fa',
  },
  itemText: {
    fontSize: 18,
  },
});

export default SelectInstrumentScreen;
