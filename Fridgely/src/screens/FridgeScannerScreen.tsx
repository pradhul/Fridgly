import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { scanPhotosForIngredients } from '../services/scanner';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'FridgeScanner'>;

export const FridgeScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { applyScanResults } = useAppContext();

  useEffect(() => {
    if (!permission) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (result?.uri) {
        setPhotos((prev) => [
          ...prev,
          { id: `${Date.now()}-${prev.length}`, uri: result.uri },
        ]);
      }
    } catch (error) {
      console.warn('Failed to capture photo', error);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const uris = photos.map((p) => p.uri);
      const detected = await scanPhotosForIngredients(uris);
      applyScanResults(detected);
      navigation.navigate('InventoryList');
    } catch (error) {
      console.warn('Failed to analyze photos', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={styles.scanTitle}>Camera access needed</Text>
          <Text style={styles.scanSubtitle}>
            Please allow camera access so Fridgely can scan your fridge.
          </Text>
          <View style={styles.footer}>
            <PrimaryButton label="Grant permission" onPress={() => requestPermission()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <IconButton name="close" onPress={() => navigation.goBack()} />
          <View style={styles.aiBadge}>
            <View style={styles.aiDot} />
            <Text style={styles.aiText}>AI scan active</Text>
          </View>
          <IconButton name="flash-on" onPress={() => {}} />
        </View>

        <View style={styles.scanFrame}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          <View style={styles.scanOverlay}>
            <Text style={styles.scanTitle}>Point at your fridge</Text>
            <Text style={styles.scanSubtitle}>
              Capture multiple angles for better ingredient detection.
            </Text>
          </View>
        </View>

        {photos.length > 0 && (
          <View style={styles.thumbnailStrip}>
            <FlatList
              data={photos}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.thumbnailWrapper}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <IconButton
                    name="close"
                    onPress={() => handleRemovePhoto(item.id)}
                    style={styles.thumbnailRemove}
                  />
                </View>
              )}
            />
            <Text style={styles.photoCounter}>
              {photos.length} photo{photos.length === 1 ? '' : 's'} selected
            </Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <IconButton name="photo-camera" onPress={handleCapture} />
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <PrimaryButton
              label={isAnalyzing ? 'Analyzing…' : 'Analyze items'}
              onPress={handleAnalyze}
              style={!photos.length || isAnalyzing ? styles.analyzeDisabled : undefined}
            />
            {isAnalyzing && (
              <Text style={styles.analyzingSubtext}>Running on-device detection (3–5 s)</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  permissionContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  footer: {
    marginTop: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  aiText: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  scanFrame: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  scanOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  scanSubtitle: {
    color: '#cbd5f5',
    fontSize: 13,
    textAlign: 'center',
  },
  thumbnailStrip: {
    marginTop: spacing.lg,
  },
  thumbnailWrapper: {
    marginRight: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  photoCounter: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  analyzeDisabled: {
    opacity: 0.5,
  },
  analyzingSubtext: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

