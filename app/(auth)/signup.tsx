// In app/signup.tsx
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import pb from '../../lib/pocketbase';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const handleSignUp = async () => {
    try {
      const formData = new FormData();

      formData.append('username', email.split('@')[0]);
      formData.append('email', email);
      formData.append('emailVisibility', 'true');
      formData.append('password', password);
      formData.append('passwordConfirm', password);
      formData.append('name', fullName);

      if (avatar) {
        const file: any = {
          uri: avatar.uri,
          name: avatar.fileName || 'avatar.jpg',
          type: avatar.mimeType || 'image/jpeg',
        };
        formData.append('avatar', file);
      }

      await pb.collection('users').create(formData);

      // After successful sign-up, navigate to the login page
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      {avatar && <Image source={{ uri: avatar.uri }} style={styles.avatar} />}
      <Button title="Pick an avatar from camera roll" onPress={pickImage} />
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
      <Link href="/login" style={styles.link}>
        Already have an account? Login
      </Link>
    </View>
  );
}

// You can reuse the styles from the login screen or create new ones
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: 'blue',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
});