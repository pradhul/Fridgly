import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type IconButtonProps = {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  size?: number;
  color?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 22,
  color = colors.textPrimary,
  onPress,
  style,
}) => {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed, style]} onPress={onPress}>
      <MaterialIcons name={name} size={size} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});

