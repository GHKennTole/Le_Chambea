import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CircularDeleteButtonProps {
  onPress: () => void;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}

export default function CircularDeleteButton({
  onPress,
  size = 26,
  iconSize = 16,
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
    >
      <MaterialCommunityIcons name="close" size={iconSize} color="#C53030" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
});
