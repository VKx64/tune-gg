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
  if (!frequency || frequency <= 0 || isNaN(frequency)) {
    return { note: '--', octave: 0, cents: 0 };
  }

  // A4 = 440 Hz
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 frequency

  if (frequency < 20 || frequency > 20000) {
    return { note: '--', octave: 0, cents: 0 };
  }

  try {
    const h = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(h / 12);
    const n = h % 12;
    const note = NOTE_NAMES[n >= 0 && n < NOTE_NAMES.length ? n : 0] || '--';

    // Calculate cents deviation from exact pitch
    const exactFreq = C0 * Math.pow(2, h / 12);
    const cents = Math.round(1200 * Math.log2(frequency / exactFreq));

    return {
      note: note || '--',
      octave: isNaN(octave) ? 0 : octave,
      cents: isNaN(cents) ? 0 : cents
    };
  } catch (error) {
    return { note: '--', octave: 0, cents: 0 };
  }
};

interface PitchDisplayProps {
  frequency: number;
  confidence?: number;
}

const PitchDisplay: React.FC<PitchDisplayProps> = ({ frequency, confidence = 0 }) => {
  let note = '--', octave = 0, cents = 0;
  
  // Only calculate note if we have a valid frequency
  if (typeof frequency === 'number' && !isNaN(frequency) && frequency > 0) {
    const result = frequencyToNote(frequency);
    note = result.note;
    octave = result.octave;
    cents = result.cents;
  }

  // Ensure all values are valid and defined
  const safeFrequency = (typeof frequency === 'number' && !isNaN(frequency) && frequency > 0) ? frequency : 0;
  const safeConfidence = Number(confidence) || 0;
  const safeCents = Number(cents) || 0;
  const safeNote = note || '--';
  const safeOctave = octave || 0;

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
        <Text style={styles.noteText}>{safeNote}</Text>
        <Text style={styles.octaveText}>{safeOctave}</Text>
      </View>

      <Text style={styles.frequencyText}>
        {safeFrequency > 0 ? `${safeFrequency.toFixed(1)} Hz` : 'No pitch detected'}
      </Text>

      {safeCents !== 0 && safeFrequency > 0 && (
        <View style={[styles.centsContainer, { backgroundColor: getCentsColor(safeCents) }]}>
          <Text style={styles.centsText}>
            {safeCents > 0 ? '+' : ''}{String(safeCents)} cents
          </Text>
        </View>
      )}

      <View style={[styles.confidenceBar, { backgroundColor: getConfidenceColor(safeConfidence) }]}>
        <Text style={styles.confidenceText}>
          Confidence: {(safeConfidence * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

interface AudioFeaturesDisplayProps {
  features: AudioFeatures | null;
}

const AudioFeaturesDisplay: React.FC<AudioFeaturesDisplayProps> = ({ features }) => {
  return (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>Audio Analysis</Text>

      <View style={styles.featureRow}>
        <Text style={styles.featureLabel}>Pitch:</Text>
        <Text style={styles.featureValue}>
          {features?.pitch && typeof features.pitch === 'number' ? `${features.pitch.toFixed(1)} Hz` : 'No data'}
        </Text>
      </View>

      <View style={styles.featureRow}>
        <Text style={styles.featureLabel}>Volume (RMS):</Text>
        <Text style={styles.featureValue}>
          {features?.rms && typeof features.rms === 'number' ? features.rms.toFixed(4) : 'No data'}
        </Text>
      </View>

      <View style={styles.featureRow}>
        <Text style={styles.featureLabel}>Energy:</Text>
        <Text style={styles.featureValue}>
          {features?.energy && typeof features.energy === 'number' ? features.energy.toFixed(4) : 'No data'}
        </Text>
      </View>

      <View style={styles.featureRow}>
        <Text style={styles.featureLabel}>Brightness:</Text>
        <Text style={styles.featureValue}>
          {features?.spectralCentroid && typeof features.spectralCentroid === 'number' ? `${features.spectralCentroid.toFixed(1)} Hz` : 'No data'}
        </Text>
      </View>

      <View style={styles.featureRow}>
        <Text style={styles.featureLabel}>Harmony/Noise:</Text>
        <Text style={styles.featureValue}>
          {features?.hnr && typeof features.hnr === 'number' ? features.hnr.toFixed(2) : 'No data'}
        </Text>
      </View>
    </View>
  );
};

export default function HitPitchScreen() {
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [pitchConfidence, setPitchConfidence] = useState<number>(0);
  const [realtimeFeatures, setRealtimeFeatures] = useState<AudioFeatures | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0); // Add audio level indicator

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
    if (analysisData && analysisData.dataPoints && analysisData.dataPoints.length > 0) {
      const latestPoint = analysisData.dataPoints[analysisData.dataPoints.length - 1];
      if (latestPoint && latestPoint.features) {
        setRealtimeFeatures(latestPoint.features);

        // Update audio level indicator
        const rmsLevel = latestPoint.features.rms || 0;
        setAudioLevel(Math.min(rmsLevel * 1000, 1)); // Scale RMS for visualization

        // Debug: Log all received features
        console.log('🎤 Audio Features:', {
          pitch: latestPoint.features.pitch,
          rms: latestPoint.features.rms,
          energy: latestPoint.features.energy,
          hnr: latestPoint.features.hnr,
          spectralCentroid: latestPoint.features.spectralCentroid
        });

        // Check if we have significant audio activity
        const hasAudioActivity = (latestPoint.features.rms || 0) > 0.05 || (latestPoint.features.energy || 0) > 3;
        console.log(`🎵 Audio Activity Check: RMS=${(latestPoint.features.rms || 0).toFixed(4)}, Energy=${(latestPoint.features.energy || 0).toFixed(2)}, HasActivity=${hasAudioActivity}`);

        if (latestPoint.features.pitch && typeof latestPoint.features.pitch === 'number' && latestPoint.features.pitch > 0) {
          // Use actual detected pitch
          setCurrentPitch(latestPoint.features.pitch);
          setPitchConfidence(0.9); // High confidence when pitch is detected
          
          const { note, octave, cents } = frequencyToNote(latestPoint.features.pitch);
          console.log(`🎵 Detected Note: ${note}${octave} | Frequency: ${latestPoint.features.pitch.toFixed(1)}Hz | Cents: ${cents > 0 ? '+' : ''}${cents} | Confidence: 90%`);
        } else if (hasAudioActivity) {
          // Try to estimate pitch from spectral centroid for piano
          const spectralCentroid = latestPoint.features.spectralCentroid || 0;
          const energy = latestPoint.features.energy || 0;
          
          // Very rough estimation: spectral centroid often correlates with fundamental for piano
          // This is experimental and may need adjustment
          if (spectralCentroid > 4000 && spectralCentroid < 15000 && energy > 3) {
            // Rough conversion from spectral centroid to potential fundamental
            const estimatedPitch = spectralCentroid * 0.12; // Reduced factor for high spectral centroid
            
            if (estimatedPitch >= 80 && estimatedPitch <= 2000) { // Piano range roughly
              setCurrentPitch(estimatedPitch);
              setPitchConfidence(0.3); // Lower confidence for estimated pitch
              
              const { note, octave, cents } = frequencyToNote(estimatedPitch);
              console.log(`� Estimated Note (from spectral): ${note}${octave} | Est. Frequency: ${estimatedPitch.toFixed(1)}Hz | Spectral Centroid: ${spectralCentroid.toFixed(1)}Hz`);
            } else {
              setCurrentPitch(0);
              setPitchConfidence(0);
            }
          } else {
            setCurrentPitch(0);
            setPitchConfidence(0);
          }
        } else {
          setCurrentPitch(0);
          setPitchConfidence(0);
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
        interval: 200, // Slower updates for more stable pitch detection (200ms)
        intervalAnalysis: 200, // Match interval for consistency

        // Enable specific features for pitch detection - focus on piano
        features: {
          pitch: true, // Enable pitch detection
          rms: true, // Volume level
          energy: true, // Energy level
          spectralCentroid: true, // Brightness
        },

        // Handle real-time audio analysis
        onAudioAnalysis: async (analysisEvent) => {
          // The analysisEvent contains data points with features
          if (analysisEvent.dataPoints && analysisEvent.dataPoints.length > 0) {
            const latestPoint = analysisEvent.dataPoints[analysisEvent.dataPoints.length - 1];

            if (latestPoint.features) {
              setRealtimeFeatures(latestPoint.features);

              if (latestPoint.features.pitch && latestPoint.features.pitch > 0) {
                // Use actual detected pitch
                setCurrentPitch(latestPoint.features.pitch);
                setPitchConfidence(0.9);
              } else {
                // Try spectral centroid estimation for piano
                const hasAudioActivity = (latestPoint.features.rms || 0) > 0.05 || (latestPoint.features.energy || 0) > 10;
                
                if (hasAudioActivity) {
                  const spectralCentroid = latestPoint.features.spectralCentroid || 0;
                  const energy = latestPoint.features.energy || 0;
                  
                  if (spectralCentroid > 4000 && spectralCentroid < 15000 && energy > 3) {
                    const estimatedPitch = spectralCentroid * 0.12;
                    
                    if (estimatedPitch >= 80 && estimatedPitch <= 2000) {
                      setCurrentPitch(estimatedPitch);
                      setPitchConfidence(0.3);
                    } else {
                      setCurrentPitch(0);
                      setPitchConfidence(0);
                    }
                  } else {
                    setCurrentPitch(0);
                    setPitchConfidence(0);
                  }
                } else {
                  setCurrentPitch(0);
                  setPitchConfidence(0);
                }
              }
            }
          }
        },

        // Optional: Handle raw audio stream
        onAudioStream: async (audioData) => {
          // Could be used for additional real-time processing
          // console.log('Audio stream data received');
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
      setAudioLevel(0);
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
            {/* Audio level indicator */}
            <View style={styles.audioLevelContainer}>
              <Text style={styles.audioLevelLabel}>Audio Level:</Text>
              <View style={styles.audioLevelBar}>
                <View 
                  style={[
                    styles.audioLevelFill, 
                    { 
                      width: `${Math.max(audioLevel * 100, 2)}%`,
                      backgroundColor: audioLevel > 0.1 ? '#4CAF50' : '#F44336'
                    }
                  ]} 
                />
              </View>
            </View>
            <Pressable
              style={[styles.button, styles.stopButton]}
              onPress={handleStopPitchDetection}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Always show Pitch Display */}
      <PitchDisplay
        frequency={currentPitch}
        confidence={pitchConfidence}
      />

      {/* Always show Audio Features */}
      <AudioFeaturesDisplay features={realtimeFeatures} />
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
  audioLevelContainer: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  audioLevelLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  audioLevelBar: {
    width: 200,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  audioLevelFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  pitchDisplay: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  noteText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2196F3',
    textShadowColor: '#cccccc',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  octaveText: {
    fontSize: 36,
    color: '#2196F3',
    marginLeft: 8,
    fontWeight: 'bold',
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
});