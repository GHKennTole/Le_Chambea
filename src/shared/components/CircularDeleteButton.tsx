import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CircularDeleteButtonProps {
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}

export default function CircularDeleteButton({
  onPress,
  size = 30,
  iconSize = 16,
  iconName = "trash-can-outline",
  style,
  activeOpacity = 0.7,
}: CircularDeleteButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      activeOpacity={activeOpacity}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons name={iconName} size={iconSize} color="#DC2626" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
});
