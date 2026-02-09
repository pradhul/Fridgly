import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppContext } from '../context/AppContext';
import { IconButton } from '../components/IconButton';
import { StatCard } from '../components/StatCard';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetails'>;

const INGREDIENTS = [
  '4 eggs',
  '1 cup chopped broccoli',
  '1 red bell pepper, sliced',
  '1/2 cup feta cheese',
  'Olive oil, salt & pepper',
];

const STEPS = [
  'Preheat your oven to 190°C (375°F).',
  'Whisk eggs in a large bowl, season with salt and pepper.',
  'Sauté broccoli and peppers in a pan until slightly softened.',
  'Pour eggs over veggies, sprinkle with feta and cook on low for 3–4 min.',
  'Transfer pan to oven and bake until set, about 10–12 min.',
];

export const RecipeDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedRecipe } = useAppContext();
  const title = selectedRecipe?.title ?? 'Fridgely recipe';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <IconButton name="arrow-back-ios-new" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <IconButton name="favorite-border" onPress={() => {}} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>
              High-protein, veggie-forward and ready in under 30 minutes.
            </Text>
          </View>

          <View style={styles.nutritionRow}>
            <StatCard label="Calories" value="420 kcal" />
            <View style={{ width: spacing.sm }} />
            <StatCard label="Protein" value="24 g" accentColor="#38bdf8" />
          </View>
          <View style={styles.nutritionRow}>
            <StatCard label="Carbs" value="32 g" accentColor="#f97316" />
            <View style={{ width: spacing.sm }} />
            <StatCard label="Fats" value="18 g" accentColor="#a855f7" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {INGREDIENTS.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {STEPS.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIndexWrapper}>
                  <Text style={styles.stepIndex}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Start cooking mode" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  bulletText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepIndexWrapper: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

