import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIES_WITH_ICONS } from "../constants/categories";

interface CategoryScrollProps {
  selectedCategory: string | null;
  onSelectCategory: (categoria: string | null) => void;
}

const isWeb = Platform.OS === 'web';

export default function CategoryScroll({ selectedCategory, onSelectCategory }: CategoryScrollProps) {
  const hasActiveFilter = selectedCategory !== null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={isWeb ? true : false}>
        {/* Botón de Filtros / Eliminar filtros */}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={hasActiveFilter ? 0.8 : 1}
          onPress={() => {
            if (hasActiveFilter) {
              onSelectCategory(null);
            }
          }}
        >
          <View style={[styles.iconCircle, hasActiveFilter && styles.iconCircleRed]}>
            <MaterialCommunityIcons
              name={hasActiveFilter ? "close" : "tune-variant"}
              size={24}
              color={hasActiveFilter ? "white" : "#6B35A8"}
            />
          </View>
          <Text style={[styles.text, hasActiveFilter && styles.textRed]}>
            {hasActiveFilter ? "Quitar categoría" : "Categorías"}
          </Text>
        </TouchableOpacity>

        {/* Lista de categorías */}
        {CATEGORIES_WITH_ICONS.map((cat, i) => (
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
    paddingHorizontal: Platform.OS === 'web' ? 16 : 10,
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
  },
  iconCircleRed: {
    backgroundColor: "#DC2626",
  },
  textRed: {
    color: "#DC2626",
    fontWeight: "bold",
  }
});
