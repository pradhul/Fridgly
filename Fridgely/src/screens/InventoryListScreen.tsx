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
import { deletePantryItem, saveFeedback } from '../services/DatabaseService';
import { syncFeedbackToBackend } from '../services/SyncService';
import type { DetectedItem } from '../services/scanner';
import type { InventoryItem } from '../data/mockInventory';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryList'>;

function detectedToInventoryItem(d: DetectedItem): InventoryItem {
  const emoji =
    d.category === 'vegetable' ? '🥦'
    : d.category === 'fruit' ? '🍎'
    : d.category === 'dairy' ? '🥛'
    : d.category === 'protein' ? '🍗'
    : d.category === 'grain' ? '🍞'
    : '❓';
  return {
    id: `scan-${d.id}`,
    name: d.name,
    emoji,
    confirmed: d.confidence >= 0.95,
    source: 'scan',
    confidence: d.confidence,
    detectedAs: d.name,
  };
}

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
  })
    .then(() => syncFeedbackToBackend())
    .catch((e) => console.warn('Save feedback failed', e));
}

const DEFAULT_MANUAL_EMOJI = '📦';

export const InventoryListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { inventory, setInventory } = useAppContext();
  const scanResults = route.params?.scanResults;
  const isScanSession = scanResults !== undefined;

  const [localList, setLocalList] = useState<InventoryItem[]>(() =>
    isScanSession ? (scanResults ?? []).map(detectedToInventoryItem) : [],
  );

  const list = isScanSession ? localList : inventory;
  const setList = isScanSession ? setLocalList : setInventory;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualItemName, setManualItemName] = useState('');

  const toggleConfirm = (id: string) => {
    const item = list.find((i) => i.id === id);
    const nextConfirmed = item ? !item.confirmed : true;
    if (item && nextConfirmed && (item.source === 'scan' || item.detectedAs)) {
      logFeedback(item, item.name, true);
    }
    setList(
      list.map((i) =>
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
    const item = list.find((i) => i.id === editingId);
    if (item && (item.source === 'scan' || item.detectedAs) && name !== (item.detectedAs ?? item.name)) {
      logFeedback(item, name, false);
    }
    setList(
      list.map((i) =>
        i.id === editingId ? { ...i, name } : i,
      ),
    );
    setEditingId(null);
  };

  const removeItem = (id: string) => {
    if (!isScanSession) {
      deletePantryItem(id).catch((e) => console.warn('Delete pantry item failed', e));
    }
    setList(list.filter((i) => i.id !== id));
  };

  const addManualItem = () => {
    const name = manualItemName.trim();
    if (!name) return;
    const newItem: InventoryItem = {
      id: `manual-${Date.now()}`,
      name,
      emoji: DEFAULT_MANUAL_EMOJI,
      confirmed: true,
      source: 'manual',
    };
    setList([...list, newItem]);
    setManualItemName('');
    setShowAddManual(false);
  };

  const handleFindRecipes = () => {
    if (isScanSession && localList.length > 0) {
      setInventory((prev) => {
        const byName = (n: string) =>
          prev.find((i) => i.name.trim().toLowerCase() === n.trim().toLowerCase());
        const updated = [...prev];
        for (const item of localList) {
          const existing = byName(item.name);
          if (existing) {
            const idx = updated.findIndex((i) => i.id === existing.id);
            if (idx !== -1) {
              updated[idx] = { ...existing, ...item, id: existing.id };
            }
          } else {
            updated.push(item);
          }
        }
        return updated;
      });
    }
    navigation.navigate('Tabs', { screen: 'Recipes' } as never);
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
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing['2xl'], flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items detected.</Text>
              <Text style={styles.emptyStateSubtext}>Add them below.</Text>
            </View>
          }
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
              <View style={styles.cardActions}>
                <PrimaryButton
                  label={item.confirmed ? 'Confirmed' : 'Add'}
                  onPress={() => toggleConfirm(item.id)}
                  style={item.confirmed ? styles.cardButtonConfirmed : styles.cardButton}
                />
                <IconButton
                  name="delete"
                  onPress={() => removeItem(item.id)}
                  color={colors.danger}
                  style={styles.removeButton}
                />
              </View>
            </View>
          )}
        />

        {showAddManual ? (
          <View style={styles.addManualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualItemName}
              onChangeText={setManualItemName}
              placeholder="e.g. Milk, Eggs"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              onSubmitEditing={addManualItem}
            />
            <IconButton name="check" onPress={addManualItem} />
            <IconButton name="close" onPress={() => { setShowAddManual(false); setManualItemName(''); }} />
          </View>
        ) : (
          <PrimaryButton
            label="Add item not in the list"
            onPress={() => setShowAddManual(true)}
            style={styles.addManualTrigger}
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            label="Find recipes"
            onPress={handleFindRecipes}
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  removeButton: {
    marginLeft: spacing.xs,
  },
  addManualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  manualInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 12,
  },
  emptyState: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addManualTrigger: {
    marginBottom: spacing.md,
    backgroundColor: colors.chipBackground,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});

