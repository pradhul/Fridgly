import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { FridgeScannerScreen } from '../screens/FridgeScannerScreen';
import { InventoryListScreen } from '../screens/InventoryListScreen';
import type { DetectedItem } from '../services/scanner';
import { RecipeDetailsScreen } from '../screens/RecipeDetailsScreen';

export type RootStackParamList = {
  Tabs: undefined;
  FridgeScanner: undefined;
  InventoryList: { scanResults: DetectedItem[] } | undefined;
  RecipeDetails: { recipeId: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={BottomTabs} />
        <Stack.Screen name="FridgeScanner" component={FridgeScannerScreen} />
        <Stack.Screen name="InventoryList" component={InventoryListScreen} />
        <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

