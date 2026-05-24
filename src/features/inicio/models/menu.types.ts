import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MenuItemProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  rightText?: string;
  danger?: boolean;
  onPress: () => void;
};
