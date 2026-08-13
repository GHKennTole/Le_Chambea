import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MainLayout from "../../../shared/components/MainLayout";
import { useFavoritesController, FavoriteItem } from "../controllers/useFavoritesController";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

const FAVORITOS_EMPTY_IMG = require("../../../assets/images/favoritos.png");

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useFavoritesController();

  // Refetch when screen comes into focus (e.g., after toggling favorite from PublicProfile)
  useFocusEffect(
    useCallback(() => {
      vm.refetch();
    }, [])
  );

  const renderItem = useCallback(
    ({ item }: { item: FavoriteItem }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("PublicProfile", { id: item.profesionalId })
        }
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.foto_perfil ? (
            <Image source={{ uri: item.foto_perfil }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={32} color="#999" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre} {item.apellidos}
          </Text>

          {item.profesiones.length > 0 && (
            <View style={styles.skillsRow}>
              {item.profesiones.slice(0, 2).map((prof, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{prof}</Text>
                </View>
              ))}
              {item.profesiones.length > 2 && (
                <Text style={styles.moreSkills}>
                  +{item.profesiones.length - 2}
                </Text>
              )}
            </View>
          )}

          <View style={styles.bottomRow}>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={14} color={STAR_COLOR} />
              <Text style={styles.ratingText}>
                {item.calificacion > 0
                  ? item.calificacion.toFixed(1)
                  : "Nuevo"}
              </Text>
            </View>

            {item.ciudad && (
              <View style={styles.locationContainer}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={13}
                  color="#888"
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.ciudad}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Star button to remove */}
        <TouchableOpacity
          style={styles.starButton}
          onPress={() => vm.removeFavorite(item.favoritoId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="star" size={26} color={STAR_COLOR} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [vm, navigation]
  );

  return (
    <MainLayout active="Favorites">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="star" size={26} color={STAR_COLOR} />
            <Text style={styles.headerTitle}>Favoritos</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {vm.favorites.length}{" "}
            {vm.favorites.length === 1 ? "profesional" : "profesionales"}
          </Text>
        </View>

        {/* Content */}
        {vm.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
          </View>
        ) : vm.favorites.length === 0 ? (
          <View style={styles.centerContainer}>
            <Image source={FAVORITOS_EMPTY_IMG} style={styles.emptyImage} />
            <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
            <Text style={styles.emptyText}>
              Agrega profesionales a tus favoritos tocando la ⭐ en sus perfiles
              para encontrarlos fácilmente aquí.
            </Text>
          </View>
        ) : (
          <FlatList
            data={vm.favorites}
            keyExtractor={(item) => item.favoritoId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Toast */}
        {vm.toastMessage && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{vm.toastMessage}</Text>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  header: {
    height: 70,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECF1",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#333" },
  headerSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },

  listContent: { paddingBottom: 20, paddingTop: 4 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
    resizeMode: "contain",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  // Card styles
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0,0,0,0.06)" } as any,
      default: {
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  avatarContainer: { marginRight: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#F3ECFA",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },

  cardInfo: { flex: 1 },
  cardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },
  skillTag: {
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 11,
    color: PURPLE,
    fontWeight: "600",
  },
  moreSkills: {
    fontSize: 11,
    color: "#888",
    alignSelf: "center",
    marginLeft: 2,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: "#888",
  },

  starButton: {
    padding: 6,
    marginLeft: 8,
  },

  // Toast
  toast: {
    position: "absolute",
    bottom: 130,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});