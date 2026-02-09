import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'FridgeScanner'>;

export const FridgeScannerScreen: React.FC<Props> = ({ navigation }) => {
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
          <Text style={styles.scanTitle}>Point at your fridge</Text>
          <Text style={styles.scanSubtitle}>
            This is a mock scanner. In a later version, we will show a live camera feed here.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Confirm items"
            onPress={() => navigation.navigate('InventoryList')}
          />
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
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
  footer: {
    paddingTop: spacing.lg,
  },
});

