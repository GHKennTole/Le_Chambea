import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../core/theme/colors";

interface FloatingBackButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  hideOnMobile?: boolean;
}

export default function FloatingBackButton({
  onPress,
  style,
  position = "top-right",
  backgroundColor = COLORS.purple,
  iconColor = "white",
  iconSize = 24,
  hideOnMobile = false,
}: FloatingBackButtonProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // On mobile devices (smartphones native & web mobile < 768px), hide if hideOnMobile is true
  const isLargeScreen = width >= 768;
  if (hideOnMobile && !isLargeScreen) {
    return null;
  }

  const positionStyles = {
    "top-left": { top: insets.top + 16, left: insets.left + 16 },
    "top-right": { top: insets.top + 16, right: insets.right + 16 },
    "bottom-left": { bottom: insets.bottom + 30, left: insets.left + 16 },
    "bottom-right": { bottom: insets.bottom + 30, right: insets.right + 16 },
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) onPress(event);
    else navigation.goBack();
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, positionStyles[position], style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    ...Platform.select({
      web: { boxShadow: '0px 3px 5px rgba(0,0,0,0.3)' } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      }
    }),
  },
});
