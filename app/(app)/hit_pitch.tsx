import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Text, View } from 'react-native';
import { PitchDetector } from 'react-native-pitch-detector';

const HitPitch: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [note, setNote] = useState<string>(''); // Holds the detected note
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    // Request recording permissions on component mount
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();

    // Cleanup function to stop pitch detection when the component unmounts
    return () => {
      PitchDetector.stop(); // Stop pitch detection
      PitchDetector.removeListener(); // Remove the pitch detection listener
    };
  }, []);

  // Start or stop recording
  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording(); // Start recording
    } else {
      await stopRecording(); // Stop recording
    }
  };

  // Start recording and detect pitch
  const startRecording = async () => {
    try {
      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true); // Set recording state to true

      // Start pitch detection and listen for pitch events
      await PitchDetector.start();
      PitchDetector.addListener((result: { frequency: number; tone: string }) => {
        setNote(result.tone || String(result.frequency)); // Update the detected note
      });
    } catch (error) {
      console.error('Error starting recording:', error); // Handle errors
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (isRecording) {
      // Stop pitch detection and remove listener
      await PitchDetector.stop();
      PitchDetector.removeListener();

      // Stop the recording
      await audioRecorder.stop();
      setIsRecording(false); // Set recording state to false
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={toggleRecording}
      />
      <Text style={{ marginTop: 20 }}>
        {isRecording ? `Recording... Detected note: ${note}` : 'Press to start recording'}
      </Text>
    </View>
  );
};

export default HitPitch;
