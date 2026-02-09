import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export type RecipeCardProps = {
  title: string;
  time: string;
  difficulty?: string;
  matchPercent?: number;
  imageUrl?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  title,
  time,
  difficulty,
  matchPercent,
  imageUrl,
  onPress,
  style,
}) => {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed, style]} onPress={onPress}>
      <ImageBackground
        source={
          imageUrl
            ? { uri: imageUrl }
            : require('../../assets/splash-icon.png')
        }
        style={styles.image}
        imageStyle={styles.imageInner}
      >
        <View style={styles.topRow}>
          {matchPercent != null && (
            <View style={styles.matchPill}>
              <Text style={styles.matchText}>{matchPercent}% match</Text>
            </View>
          )}
          <View style={styles.iconPill}>
            <MaterialIcons name="favorite-border" size={18} color="#ffffff" />
          </View>
        </View>
      </ImageBackground>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          {difficulty && (
            <View style={styles.metaItem}>
              <MaterialIcons name="whatshot" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{difficulty}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  image: {
    height: 160,
    width: '100%',
    justifyContent: 'space-between',
  },
  imageInner: {
    resizeMode: 'cover',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  matchPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  matchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

