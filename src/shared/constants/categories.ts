import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface CategoryItem {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const CATEGORIES_WITH_ICONS: CategoryItem[] = [
  { name: "Salud", icon: "stethoscope" },
  { name: "Hogar", icon: "home-variant" },
  { name: "Mecánica", icon: "wrench" },
  { name: "Tecnología", icon: "laptop" },
  { name: "Educación", icon: "school" },
  { name: "Belleza", icon: "content-cut" },
  { name: "Limpieza", icon: "broom" },
  { name: "Legal", icon: "scale-balance" },
  { name: "Transporte", icon: "car" },
  { name: "Eventos", icon: "party-popper" },
  { name: "Mascotas", icon: "paw" },
  { name: "Seguridad", icon: "shield-check" },
  { name: "Otros", icon: "dots-horizontal-circle-outline" },
];

export const CATEGORIES: string[] = CATEGORIES_WITH_ICONS.map((cat) => cat.name);
