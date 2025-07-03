import {
  AudioFeatures,
  ExpoAudioStreamModule,
  useAudioRecorder
} from '@siteed/expo-audio-studio';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Note names for pitch detection
const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Function to convert frequency to note
const frequencyToNote = (frequency: number): { note: string; octave: number; cents: number } => {
  if (!frequency || frequency <= 0) {
    return { note: '--', octave: 0, cents: 0 };
  }

  // A4 = 440 Hz
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 frequency

  if (frequency < 20 || frequency > 20000) {
    return { note: '--', octave: 0, cents: 0 };
  }

  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;
  const note = NOTE_NAMES[n];

  // Calculate cents deviation from exact pitch
  const exactFreq = C0 * Math.pow(2, h / 12);
  const cents = Math.round(1200 * Math.log2(frequency / exactFreq));

  return { note, octave, cents };
};

interface PitchDisplayProps {
  frequency: number;
  confidence?: number;
}

const PitchDisplay: React.FC<PitchDisplayProps> = ({ frequency, confidence = 0 }) => {
  const { note, octave, cents } = frequencyToNote(frequency);

  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return '#4CAF50'; // Green - high confidence
    if (conf > 0.5) return '#FF9800'; // Orange - medium confidence
    return '#F44336'; // Red - low confidence
  };

  const getCentsColor = (cents: number) => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return '#4CAF50'; // Very close to pitch
    if (absCents <= 15) return '#FF9800'; // Somewhat close
    return '#F44336'; // Far from pitch
  };

  return (
    <View style={styles.pitchDisplay}>
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>{note}</Text>
        <Text style={styles.octaveText}>{octave}</Text>
      </View>

      <Text style={styles.frequencyText}>
        {frequency.toFixed(1)} Hz
      </Text>

      {cents !== 0 && (
        <View style={[styles.centsContainer, { backgroundColor: getCentsColor(cents) }]}>
          <Text style={styles.centsText}>
            {cents > 0 ? '+' : ''}{cents} cents
          </Text>
        </View>
      )}

      <View style={[styles.confidenceBar, { backgroundColor: getConfidenceColor(confidence) }]}>
        <Text style={styles.confidenceText}>
          Confidence: {(confidence * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

interface AudioFeaturesDisplayProps {
  features: AudioFeatures;
}

const AudioFeaturesDisplay: React.FC<AudioFeaturesDisplayProps> = ({ features }) => {
  return (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>Audio Analysis</Text>

      {features.pitch && (
        <View style={styles.featureRow}>
          <Text style={styles.featureLabel}>Pitch:</Text>
          <Text style={styles.featureValue}>{features.pitch.toFixed(1)} Hz</Text>
        </View>
      )}

      {features.rms && (
        <View style={styles.featureRow}>
          <Text style={styles.featureLabel}>Volume (RMS):</Text>
          <Text style={styles.featureValue}>{features.rms.toFixed(4)}</Text>
        </View>
      )}

      {features.energy && (
        <View style={styles.featureRow}>
          <Text style={styles.featureLabel}>Energy:</Text>
          <Text style={styles.featureValue}>{features.energy.toFixed(4)}</Text>
        </View>
      )}

      {features.spectralCentroid && (
        <View style={styles.featureRow}>
          <Text style={styles.featureLabel}>Brightness:</Text>
          <Text style={styles.featureValue}>{features.spectralCentroid.toFixed(1)} Hz</Text>
        </View>
      )}

      {features.hnr && (
        <View style={styles.featureRow}>
          <Text style={styles.featureLabel}>Harmony/Noise:</Text>
          <Text style={styles.featureValue}>{features.hnr.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
};

export default function HitPitchScreen() {
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [pitchConfidence, setPitchConfidence] = useState<number>(0);
  const [realtimeFeatures, setRealtimeFeatures] = useState<AudioFeatures | null>(null);

  // Initialize the audio recorder with pitch detection enabled
  const {
    startRecording,
    stopRecording,
    isRecording,
    durationMs,
    analysisData
  } = useAudioRecorder();

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ExpoAudioStreamModule.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required for pitch detection.');
      }
    };

    requestPermissions();
  }, []);

  // Update real-time pitch data when analysis data changes
  useEffect(() => {
    if (analysisData && analysisData.dataPoints.length > 0) {
      const latestPoint = analysisData.dataPoints[analysisData.dataPoints.length - 1];
      if (latestPoint.features) {
        setRealtimeFeatures(latestPoint.features);

        if (latestPoint.features.pitch && latestPoint.features.pitch > 0) {
          setCurrentPitch(latestPoint.features.pitch);
          // Calculate confidence based on HNR and energy
          const confidence = Math.min(
            (latestPoint.features.hnr || 0) / 20, // HNR-based confidence
            (latestPoint.features.energy || 0) * 100 // Energy-based confidence
          );
          setPitchConfidence(Math.max(0, Math.min(1, confidence)));
        }
      }
    }
  }, [analysisData]);

  // Handle starting pitch detection recording
  const handleStartPitchDetection = async () => {
    try {
      await startRecording({
        sampleRate: 44100, // High sample rate for better pitch detection
        channels: 1, // Mono recording
        encoding: 'pcm_16bit',
        enableProcessing: true,
        interval: 50, // Fast updates for real-time feedback (50ms)
        intervalAnalysis: 50, // Fast analysis updates

        // Enable specific features for pitch detection
        features: {
          pitch: true, // Enable pitch detection
          rms: true, // Volume level
          energy: true, // Energy level
          hnr: true, // Harmonics-to-noise ratio for pitch confidence
          spectralCentroid: true, // Brightness
          spectralFlatness: true, // Useful for instrument classification
        },

        // Handle real-time audio analysis
        onAudioAnalysis: async (analysisEvent) => {
          // The analysisEvent contains data points with features
          if (analysisEvent.dataPoints && analysisEvent.dataPoints.length > 0) {
            const latestPoint = analysisEvent.dataPoints[analysisEvent.dataPoints.length - 1];

            if (latestPoint.features) {
              setRealtimeFeatures(latestPoint.features);

              if (latestPoint.features.pitch && latestPoint.features.pitch > 0) {
                setCurrentPitch(latestPoint.features.pitch);

                // Calculate pitch confidence
                const hnrConfidence = Math.min((latestPoint.features.hnr || 0) / 20, 1);
                const energyConfidence = Math.min((latestPoint.features.energy || 0) * 50, 1);
                const confidence = Math.max(0, Math.min(1, (hnrConfidence + energyConfidence) / 2));
                setPitchConfidence(confidence);
              }
            }
          }
        },

        // Optional: Handle raw audio stream
        onAudioStream: async (audioData) => {
          // Could be used for additional real-time processing
          console.log('Audio stream data received');
        },

        // Handle recording interruptions
        onRecordingInterrupted: (event) => {
          console.log('Recording interrupted:', event.reason);
          Alert.alert('Recording Interrupted', `Reason: ${event.reason}`);
        },

        // Auto-resume after interruption
        autoResumeAfterInterruption: true,

        // Keep recording active in background
        keepAwake: true,

        // No file output needed for real-time pitch detection
        output: {
          primary: { enabled: false }
        }
      });
    } catch (error) {
      console.error('Error starting pitch detection:', error);
      Alert.alert('Error', 'Failed to start pitch detection. Please check microphone permissions.');
    }
  };

  // Handle stopping pitch detection
  const handleStopPitchDetection = async () => {
    try {
      await stopRecording();

      // Reset real-time values
      setCurrentPitch(0);
      setPitchConfidence(0);
      setRealtimeFeatures(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pitch Detection</Text>
      <Text style={styles.subtitle}>Detect musical notes and pitches in real-time</Text>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <Pressable
            style={[styles.button, styles.startButton]}
            onPress={handleStartPitchDetection}
          >
            <Text style={styles.buttonText}>Start Pitch Detection</Text>
          </Pressable>
        ) : (
          <View style={styles.recordingContainer}>
            <Text style={styles.recordingText}>
              Listening... {(durationMs / 1000).toFixed(1)}s
            </Text>
            <Pressable
              style={[styles.button, styles.stopButton]}
              onPress={handleStopPitchDetection}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Real-time Pitch Display */}
      {isRecording && currentPitch > 0 && (
        <PitchDisplay
          frequency={currentPitch}
          confidence={pitchConfidence}
        />
      )}

      {/* No pitch detected message */}
      {isRecording && currentPitch === 0 && (
        <View style={styles.noPitchContainer}>
          <Text style={styles.noPitchText}>
            Play an instrument or sing to detect pitch...
          </Text>
        </View>
      )}

      {/* Real-time Audio Features */}
      {isRecording && realtimeFeatures && (
        <AudioFeaturesDisplay features={realtimeFeatures} />
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionText}>
          • Tap &quot;Start Pitch Detection&quot; to begin listening
        </Text>
        <Text style={styles.instructionText}>
          • Play a musical instrument or sing into the microphone
        </Text>
        <Text style={styles.instructionText}>
          • The detected note and frequency will be displayed in real-time
        </Text>
        <Text style={styles.instructionText}>
          • The color indicates how close you are to the exact pitch
        </Text>
        <Text style={styles.instructionText}>
          • Green: Very close, Orange: Somewhat close, Red: Far from pitch
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
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
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  pitchDisplay: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  octaveText: {
    fontSize: 24,
    color: '#666',
    marginLeft: 5,
  },
  frequencyText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 10,
  },
  centsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  centsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confidenceBar: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    width: '100%',
  },
  confidenceText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noPitchContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  noPitchText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  featureValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});