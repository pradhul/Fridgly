import React from 'react';
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
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryList'>;

export const InventoryListScreen: React.FC<Props> = ({ navigation }) => {
  const { inventory, setInventory } = useAppContext();

  const toggleConfirm = (id: string) => {
    setInventory(
      inventory.map((item) =>
        item.id === id ? { ...item, confirmed: !item.confirmed } : item,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <IconButton name="arrow-back-ios-new" onPress={() => navigation.goBack()} />
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>Confirm ingredients</Text>
            <Text style={styles.headerSubtitle}>
              Check everything we detected from your scan.
            </Text>
          </View>
        </View>

        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle}>Detected from scan</Text>
                </View>
              </View>
              <PrimaryButton
                label={item.confirmed ? 'Confirmed' : 'Add'}
                onPress={() => toggleConfirm(item.id)}
                style={[
                  styles.cardButton,
                  item.confirmed && { backgroundColor: '#dcfce7' },
                ]}
              />
            </View>
          )}
        />

        <View style={styles.footer}>
          <PrimaryButton
            label="Find recipes"
            onPress={() => navigation.navigate('Tabs', { screen: 'Recipes' } as never)}
          />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTextWrapper: {
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 28,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});

