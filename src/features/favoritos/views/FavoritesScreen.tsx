import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MainLayout from "../../../shared/components/MainLayout";
import { useFavoritesController, FavoriteItem } from "../controllers/useFavoritesController";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

const FAVORITOS_EMPTY_IMG = require("../../../assets/images/favoritos.png");

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useFavoritesController();
  const { isLargeScreen } = useResponsive();

  const [favoriteToRemove, setFavoriteToRemove] = useState<FavoriteItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    if (!favoriteToRemove || isRemoving) return;
    setIsRemoving(true);
    await vm.removeFavorite(favoriteToRemove.favoritoId);
    setIsRemoving(false);
    setFavoriteToRemove(null);
  };

  const handleCancelRemove = () => {
    if (isRemoving) return;
    setFavoriteToRemove(null);
  };

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
          <Text style={styles.cardProfession} numberOfLines={1}>
            {item.profesiones.length > 0 ? item.profesiones.join(" • ") : "Profesional"}
          </Text>

          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre} {item.apellidos}
          </Text>

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
          onPress={() => setFavoriteToRemove(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="star" size={26} color={STAR_COLOR} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [navigation]
  );

  return (
    <MainLayout active="Favorites">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Morado Superior Dinámico */}
        <View style={[styles.purpleHeaderWrapper, { paddingTop: 16 }]}>
          <View style={styles.headerSection}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="star-outline" size={26} color="white" />
              <Text style={styles.headerTitle}>Favoritos</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {vm.favorites.length === 0
                ? "Tus profesionales guardados"
                : `${vm.favorites.length} ${vm.favorites.length === 1 ? "profesional guardado" : "profesionales guardados"}`}
            </Text>
          </View>
        </View>

        {/* Content */}
        {vm.loading && vm.favorites.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={PURPLE} />
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

      {/* Modal Flotante de Confirmación de Eliminación */}
      <Modal
        visible={!!favoriteToRemove}
        transparent
        animationType="fade"
        onRequestClose={handleCancelRemove}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCancelRemove}
          />
          <View style={styles.confirmCard}>
            {/* Icono circular de advertencia */}
            <View style={styles.confirmIconCircle}>
              <MaterialCommunityIcons name="star-remove-outline" size={32} color="#C62828" />
            </View>
            
            <Text style={styles.confirmMessage}>
              ¿Estás seguro de eliminar a{' '}
              <Text style={styles.confirmHighlight}>
                {favoriteToRemove ? `${favoriteToRemove.nombre} ${favoriteToRemove.apellidos}`.trim() : 'este profesional'}
              </Text>
              {' '}de tu lista de favoritos?
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={handleCancelRemove}
                activeOpacity={0.75}
                disabled={isRemoving}
              >
                <Text style={styles.btnCancelText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnConfirm, isRemoving && styles.btnConfirmDisabled]}
                onPress={handleConfirmRemove}
                activeOpacity={0.8}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.btnConfirmText}>Sí</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 18,
    width: "100%",
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.2)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  headerSection: {
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "left",
    lineHeight: 18,
  },

  listContent: {
    paddingVertical: 12,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
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
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" } as any,
      default: {
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
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
  cardProfession: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  cardName: {
    fontSize: 13,
    fontWeight: "normal",
    color: "#666",
    marginBottom: 6,
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

  // Floating Confirmation Dialog Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    padding: 20,
  },
  modalBackdrop: {
    ...(StyleSheet.absoluteFill as any),
  },
  confirmCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 10px 30px rgba(0,0,0,0.25)" } as any,
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
    }),
  },
  confirmIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  confirmMessage: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  confirmHighlight: {
    fontWeight: "700",
    color: "#1F2937",
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  btnConfirmDisabled: {
    backgroundColor: "#81C784",
    opacity: 0.7,
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
  },
});