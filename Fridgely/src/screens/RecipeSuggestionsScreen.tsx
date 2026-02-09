import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppContext } from '../context/AppContext';
import { FilterChip } from '../components/FilterChip';
import { RecipeCard } from '../components/RecipeCard';
import { IconButton } from '../components/IconButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

const FILTERS = ['All matches', 'Vegan', 'Low carb', 'Quick meal', 'Keto'];

export const RecipeSuggestionsScreen: React.FC<Props> = ({ navigation }) => {
  const { recipes, setSelectedRecipe } = useAppContext();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Smart matches</Text>
          <IconButton name="search" onPress={() => {}} />
        </View>

        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <FilterChip
              label={item}
              active={item === activeFilter}
              onPress={() => setActiveFilter(item)}
            />
          )}
        />

        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.lg }}>
              <RecipeCard
                title={item.title}
                time={item.time}
                difficulty={item.difficulty}
                matchPercent={item.matchPercent}
                onPress={() => {
                  setSelectedRecipe(item);
                  navigation.navigate('RecipeDetails', { recipeId: item.id });
                }}
              />
            </View>
          )}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filterRow: {
    paddingBottom: spacing.lg,
  },
});

