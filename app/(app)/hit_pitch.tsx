import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { PitchDetector } from 'react-native-pitch-detector';



const HitPitch: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [note, setNote] = useState<string>('');
// No need for pitchDetectorRef, use static API
  const recordingRef = React.useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Cleanup function to stop pitch detection and recording when the component unmounts
    return () => {
      PitchDetector.stop();
      PitchDetector.removeListener();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // Start or stop recording
  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

  // Start recording and detect pitch
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Start the recording
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);

      // Start pitch detection and listen for pitch events
      await PitchDetector.start();
      PitchDetector.addListener((result: { frequency: number; tone: string }) => {
        setNote(result.tone || String(result.frequency));
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (isRecording) {
      await PitchDetector.stop();
      PitchDetector.removeListener();
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      setIsRecording(false);
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
