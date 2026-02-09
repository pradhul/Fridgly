import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';
import { RecipeCard } from '../components/RecipeCard';
import { useAppContext } from '../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export const HomeDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { recipes } = useAppContext();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingLabel}>Good evening,</Text>
            <Text style={styles.greetingName}>Fridgely Chef</Text>
          </View>
          <View style={styles.headerIcons}>
            <View style={styles.avatar} />
            <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Scan your fridge</Text>
            <Text style={styles.heroSubtitle}>
              Let Fridgely find recipes that match what you already have.
            </Text>
          </View>
          <PrimaryButton
            label="Scan Fridge"
            onPress={() => navigation.navigate('FridgeScanner')}
          />
        </View>

        <View style={styles.manualRow}>
          <View style={styles.manualInputWrapper}>
            <MaterialIcons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              placeholder="Add ingredient manually..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>
          <PrimaryButton label="Add" onPress={() => {}} style={styles.addButton} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Healthy picks</Text>
          <Text style={styles.sectionLink}>View all</Text>
        </View>

        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          renderItem={({ item }) => (
            <View style={{ width: 260, marginRight: spacing.lg }}>
              <RecipeCard
                title={item.title}
                time={item.time}
                difficulty={item.difficulty}
                matchPercent={item.matchPercent}
                onPress={() =>
                  navigation.navigate('RecipeDetails', { recipeId: item.id })
                }
              />
            </View>
          )}
        />

        <View style={styles.statsRow}>
          <StatCard label="Recipes cooked" value="24" />
          <View style={{ width: spacing.sm }} />
          <StatCard label="Eco score" value="A+" accentColor="#22c55e" />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#d1fae5',
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  manualInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  input: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  carousel: {
    paddingBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});

