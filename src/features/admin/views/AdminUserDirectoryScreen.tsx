import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { AdminUser } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { supabase } from "../../../services/supabase";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

export default function AdminUserDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isLargeScreen } = useResponsive();

  const [users, setUsers] = useState<AdminUser[]>(route?.params?.users || []);
  const [loading, setLoading] = useState<boolean>(!route?.params?.users || route.params.users.length === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "cliente" | "profesional" | "suspendido">("all");

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: rawUsers, error: usersErr } = await supabase
        .from("usuarios")
        .select(`
          id,
          nombre,
          apellidos,
          correo,
          telefono,
          ciudad,
          rol,
          onboarding_completado,
          fecha_creacion,
          foto_perfil,
          perfiles_profesionales (
            id,
            profesion,
            categoria,
            descripcion,
            zona,
            esta_activo
          )
        `)
        .order("fecha_creacion", { ascending: false });

      if (usersErr) throw usersErr;

      const userList: AdminUser[] = (rawUsers || [])
        .filter((u) => u.rol !== "admin" && u.rol !== "administrador")
        .map((u: any) => ({
          ...u,
          onboarding_completado: !!u.onboarding_completado,
          esta_activo: u.rol !== "suspendido",
        }));

      setUsers(userList);
    } catch (err: any) {
      console.error("Error fetching users directory:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.nombre || ""} ${u.apellidos || ""}`.toLowerCase();
    const email = (u.correo || "").toLowerCase();
    const phone = (u.telefono || "").toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || fullName.includes(query) || email.includes(query) || phone.includes(query);
    if (!matchesSearch) return false;

    const isPro = (u.perfiles_profesionales && u.perfiles_profesionales.length > 0) || u.rol === "profesional";
    const isSuspended = u.rol === "suspendido" || u.esta_activo === false;

    if (filterRole === "profesional") return isPro && !isSuspended;
    if (filterRole === "cliente") return !isPro && !isSuspended;
    if (filterRole === "suspendido") return isSuspended;

    return true;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
        {/* Header con botón atrás nativo */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.select({
              web: 14,
              android: (insets.top || 24) + 6,
              ios: insets.top > 0 ? insets.top : 12,
              default: 14,
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("HomeAdmin");
            }
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Volver al panel administrativo"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Control de Usuarios</Text>
          <Text style={styles.headerSubtitle}>Total de Usuarios registrados</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, correo o teléfono..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chips de filtro */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        <TouchableOpacity
          style={[styles.chip, filterRole === "all" && styles.chipActive]}
          onPress={() => setFilterRole("all")}
        >
          <Text style={[styles.chipText, filterRole === "all" && styles.chipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterRole === "cliente" && styles.chipActive]}
          onPress={() => setFilterRole("cliente")}
        >
          <Text style={[styles.chipText, filterRole === "cliente" && styles.chipTextActive]}>
            Clientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterRole === "profesional" && styles.chipActive]}
          onPress={() => setFilterRole("profesional")}
        >
          <Text style={[styles.chipText, filterRole === "profesional" && styles.chipTextActive]}>
            Profesionales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterRole === "suspendido" && styles.chipActiveDanger]}
          onPress={() => setFilterRole("suspendido")}
        >
          <Text style={[styles.chipText, filterRole === "suspendido" && styles.chipTextActiveDanger]}>
            Suspendidos
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Lista de usuarios con Scroll y Refresh */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Cargando directorio de usuarios...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers(true)}
              colors={[PURPLE]}
              tintColor={PURPLE}
            />
          }
        >
          {/* Contador previo */}
          <View style={styles.listCountHeader}>
            <Text style={styles.listCountText}>Total de Usuarios: {filteredUsers.length}</Text>
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search-outline" size={54} color="#BBB" />
              <Text style={styles.emptyTitle}>
                {search.trim().length > 0
                  ? `No se encontraron usuarios para "${search.trim()}"`
                  : filterRole === "cliente"
                  ? "No se encontraron usuarios clientes"
                  : filterRole === "profesional"
                  ? "No se encontraron usuarios profesionales"
                  : filterRole === "suspendido"
                  ? "No se encontraron usuarios suspendidos"
                  : "No se encontraron usuarios"}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const fullName = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || "Usuario sin nombre";
              const isPro = user.perfiles_profesionales && user.perfiles_profesionales.length > 0;
              const isSuspended = user.rol === "suspendido" || user.esta_activo === false;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userCard, isSuspended && styles.userCardSuspended]}
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate("AdminUserDetail", { user });
                  }}
                  accessibilityLabel={`Ver ficha de ${fullName}`}
                >
                  <View style={styles.avatarWrap}>
                    {user.foto_perfil ? (
                      <Image source={{ uri: user.foto_perfil }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <MaterialCommunityIcons name="account" size={24} color="#888" />
                      </View>
                    )}
                    {isSuspended && (
                      <View style={styles.suspendedDot}>
                        <MaterialCommunityIcons name="pause" size={10} color="white" />
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {fullName}
                      </Text>
                      {isPro && (
                        <View style={styles.badgeProPill}>
                          <Text style={styles.badgeProText}>PRO</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.correo || "Sin correo"}
                    </Text>

                    <View style={styles.userMetaRow}>
                      {!!user.telefono && (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="phone-outline" size={12} color="#777" />
                          <Text style={styles.metaText}>{user.telefono}</Text>
                        </View>
                      )}
                      {!!user.ciudad && (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#777" />
                          <Text style={styles.metaText}>{user.ciudad}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={22} color="#BBB" />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  listCountHeader: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  listCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "white",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#222",
  },
  chipsScroll: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F2F3F7",
    flexShrink: 0,
    ...Platform.select({
      web: { cursor: "pointer", whiteSpace: "nowrap" } as any,
    }),
  },
  chipActive: {
    backgroundColor: PURPLE,
  },
  chipActiveDanger: {
    backgroundColor: "#FF3B30",
  },
  chipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  chipTextActiveDanger: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  userCardSuspended: {
    backgroundColor: "#FFF9F9",
    borderColor: "#FFDADA",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    backgroundColor: "#EBEBF0",
    justifyContent: "center",
    alignItems: "center",
  },
  suspendedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    maxWidth: "70%",
  },
  badgeProPill: {
    backgroundColor: "#EBF3FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeProText: {
    color: "#007AFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#777",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 12,
  },
});
