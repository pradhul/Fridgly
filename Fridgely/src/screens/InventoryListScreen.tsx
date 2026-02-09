import React, { useState } from 'react';
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
import { useAppContext } from '../context/AppContext';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { saveFeedback } from '../services/DatabaseService';
import type { InventoryItem } from '../data/mockInventory';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryList'>;

function logFeedback(
  item: InventoryItem,
  correctedTo: string,
  correct: boolean,
): void {
  const detectedAs = item.detectedAs ?? item.name;
  const confidence = item.confidence ?? 0;
  saveFeedback({
    detected_as: detectedAs,
    corrected_to: correctedTo,
    confidence,
    correct,
  }).catch((e) => console.warn('Save feedback failed', e));
}

export const InventoryListScreen: React.FC<Props> = ({ navigation }) => {
  const { inventory, setInventory } = useAppContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const toggleConfirm = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    const nextConfirmed = item ? !item.confirmed : true;
    if (item && nextConfirmed && (item.source === 'scan' || item.detectedAs)) {
      logFeedback(item, item.name, true);
    }
    setInventory(
      inventory.map((i) =>
        i.id === id ? { ...i, confirmed: nextConfirmed } : i,
      ),
    );
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const applyEditing = () => {
    if (!editingId) return;
    const name = editingValue.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    const item = inventory.find((i) => i.id === editingId);
    if (item && (item.source === 'scan' || item.detectedAs) && name !== (item.detectedAs ?? item.name)) {
      logFeedback(item, name, false);
    }
    setInventory(
      inventory.map((i) =>
        i.id === editingId ? { ...i, name } : i,
      ),
    );
    setEditingId(null);
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
                <View style={{ flex: 1 }}>
                  {editingId === item.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editingValue}
                        onChangeText={setEditingValue}
                        placeholder="What is it?"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                        onSubmitEditing={applyEditing}
                      />
                      <IconButton name="check" onPress={applyEditing} />
                    </View>
                  ) : (
                    <>
                      <Text
                        style={styles.itemName}
                        onLongPress={() => startEditing(item.id, item.name)}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        {item.source === 'scan' ? 'Detected from scan' : 'Added manually'}
                        {typeof item.confidence === 'number'
                          ? ` · ${(item.confidence * 100).toFixed(0)}% match`
                          : ''}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <PrimaryButton
                label={item.confirmed ? 'Confirmed' : 'Add'}
                onPress={() => toggleConfirm(item.id)}
                style={item.confirmed ? styles.cardButtonConfirmed : styles.cardButton}
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
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 8,
  },
  cardButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cardButtonConfirmed: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#dcfce7',
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});

