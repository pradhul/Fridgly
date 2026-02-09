import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type StatCardProps = {
  label: string;
  value: string;
  accentColor?: string;
  style?: ViewStyle;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, accentColor = colors.primary, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.pill, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
  },
  pill: {
    width: 32,
    height: 6,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

