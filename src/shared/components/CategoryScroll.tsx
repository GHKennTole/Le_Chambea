import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Category = {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const categories: Category[] = [
  { name: "Electricista", icon: "flash" },
  { name: "Carpintero", icon: "hammer" },
  { name: "Mecánico", icon: "wrench" },
  { name: "Mandadito", icon: "motorbike" },
  { name: "Dentista", icon: "tooth" },
  { name: "Plomero", icon: "pipe" },
  { name: "Jardinería", icon: "flower" },
  { name: "Limpieza", icon: "broom" },
];

interface CategoryScrollProps {
  selectedCategory: string | null;
  onSelectCategory: (categoria: string | null) => void;
}

export default function CategoryScroll({ selectedCategory, onSelectCategory }: CategoryScrollProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.item} 
            activeOpacity={0.8}
            onPress={() => onSelectCategory(selectedCategory === cat.name ? null : cat.name)}
          >
            
            {/* Círculo gris o morado si está seleccionado */}
            <View style={[styles.iconCircle, selectedCategory === cat.name && styles.iconCircleActive]}>
              <MaterialCommunityIcons
                name={cat.icon}
                size={24}
                color={selectedCategory === cat.name ? "white" : "#6B35A8"}
              />
            </View>

            <Text style={[styles.text, selectedCategory === cat.name && styles.textActive]}>{cat.name}</Text>

          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  item: {
    alignItems: "center",
    marginRight: 16,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  iconCircleActive: {
    backgroundColor: "#6B35A8",
  },
  textActive: {
    color: "#6B35A8",
    fontWeight: "bold",
  }
});
