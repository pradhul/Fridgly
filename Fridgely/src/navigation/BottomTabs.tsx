import React from 'react';
import {
  createBottomTabNavigator,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { HomeDashboardScreen } from '../screens/HomeDashboardScreen';
import { RecipeSuggestionsScreen } from '../screens/RecipeSuggestionsScreen';
import { View } from 'react-native';

export type TabParamList = {
  Home: undefined;
  Recipes: undefined;
  Grocery: undefined;
  Saved: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type TabScreenComponent<T extends keyof TabParamList> = React.ComponentType<
  BottomTabScreenProps<TabParamList, T>
>;

export const BottomTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#ffffff' },
        tabBarIcon: ({ color, size }) => {
          const iconName: React.ComponentProps<typeof MaterialIcons>['name'] =
            route.name === 'Home'
              ? 'home-filled'
              : route.name === 'Recipes'
              ? 'restaurant-menu'
              : route.name === 'Grocery'
              ? 'shopping-basket'
              : route.name === 'Saved'
              ? 'bookmark-border'
              : 'settings';

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeDashboardScreen as unknown as TabScreenComponent<'Home'>}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipeSuggestionsScreen as unknown as TabScreenComponent<'Recipes'>}
      />
      <Tab.Screen
        name="Grocery"
        component={PlaceholderScreen}
        options={{ title: 'Grocery' }}
      />
      <Tab.Screen
        name="Saved"
        component={PlaceholderScreen}
        options={{ title: 'Saved' }}
      />
      <Tab.Screen
        name="Settings"
        component={PlaceholderScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const PlaceholderScreen: React.FC = () => <View />;

