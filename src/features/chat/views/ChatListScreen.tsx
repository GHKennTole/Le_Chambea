import React, { useState, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  TextInput,
  Platform 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../../shared/components/MainLayout";
import { useChatListController, ChatPreview } from "../controllers/useChatListController";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CircularDeleteButton from "../../../shared/components/CircularDeleteButton";
import { formatChatListDate } from "../../../shared/utils/dateUtils";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";

const AVATAR_PALETTE = [
  { bg: "#EDE7F6", text: "#5A2D82" }, // Púrpura suave
  { bg: "#E0F2F1", text: "#00695C" }, // Verde azulado
  { bg: "#E3F2FD", text: "#1565C0" }, // Azul
  { bg: "#FFF3E0", text: "#E65100" }, // Naranja
  { bg: "#FCE4EC", text: "#C2185B" }, // Rosa
  { bg: "#E8F5E9", text: "#2E7D32" }, // Verde
];

function getAvatarColors(name: string) {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

function getInitials(name: string): string {
  if (!name || name === "Usuario Desconocido") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useChatListController();
  const { isLargeScreen } = useResponsive();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "active">("all");

  const formatTime = useCallback((isoString: string) => {
    return formatChatListDate(isoString);
  }, []);

  const unreadCountTotal = useMemo(() => vm.chats.filter(c => c.isUnread).length, [vm.chats]);
  const activeJobsTotal = useMemo(() => vm.chats.filter(c => c.jobStatus === "accepted").length, [vm.chats]);

  const filteredChats = useMemo(() => {
    return vm.chats.filter((c) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.otherUserName.toLowerCase().includes(query) ||
        (c.requestedService && c.requestedService.toLowerCase().includes(query)) ||
        c.lastMessage.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (activeFilter === "unread") return c.isUnread;
      if (activeFilter === "active") return c.jobStatus === "accepted";
      return true;
    });
  }, [vm.chats, search, activeFilter]);

  const renderItem = useCallback(({ item }: { item: ChatPreview }) => {
    const avatarColor = getAvatarColors(item.otherUserName);
    const initials = getInitials(item.otherUserName);

    return (
      <View style={[styles.chatCard, item.isUnread && styles.chatCardUnread]}>
        <TouchableOpacity 
          style={styles.chatItemContent}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Chat", { chatId: item.id, otherUserId: item.otherUserId })}
        >
          {/* Avatar con insignia de rol/servicio */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate("PublicProfile", { id: item.otherUserId, fromChat: true })}
            activeOpacity={0.8}
          >
            {item.otherUserPhoto ? (
              <Image source={{ uri: item.otherUserPhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor.bg }]}>
                <Text style={[styles.avatarInitials, { color: avatarColor.text }]}>{initials}</Text>
              </View>
            )}
            {item.requestedService && (
              <View style={[styles.avatarBadge, item.isClient ? styles.avatarBadgeClient : styles.avatarBadgePro]}>
                <MaterialCommunityIcons 
                  name={item.isClient ? "briefcase-check" : "hammer-wrench"} 
                  size={10} 
                  color="white" 
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Información del chat */}
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={[styles.chatName, item.isUnread && styles.chatNameUnread]} numberOfLines={1}>
                {item.otherUserName}
              </Text>
              <Text style={[styles.chatTime, item.isUnread && styles.chatTimeUnread]}>
                {formatTime(item.lastMessageTime)}
              </Text>
            </View>

            {/* Píldoras de servicio / estado de trabajo */}
            <View style={styles.tagsRow}>
              {item.requestedService && (
                item.isClient ? (
                  <View style={styles.hiringTag}>
                    <MaterialCommunityIcons name="briefcase-outline" size={11} color="#00695C" />
                    <Text style={styles.hiringTagText} numberOfLines={1}>Contratando: {item.requestedService}</Text>
                  </View>
                ) : (
                  <View style={styles.serviceTag}>
                    <MaterialCommunityIcons name="hammer-wrench" size={10} color={PURPLE} />
                    <Text style={styles.serviceTagText} numberOfLines={1}>{item.requestedService}</Text>
                  </View>
                )
              )}
              {item.jobStatus === 'accepted' && (
                <View style={styles.activeJobTag}>
                  <MaterialCommunityIcons name="progress-wrench" size={10} color="#155724" />
                  <Text style={styles.activeJobTagText}>En curso</Text>
                </View>
              )}
            </View>

            {/* Último mensaje con icono de confirmación y badge no leído */}
            <View style={styles.messagePreviewRow}>
              <View style={styles.messageTextWrapper}>
                {item.isLastMessageFromMe && (
                  <MaterialCommunityIcons 
                    name="check-all" 
                    size={15} 
                    color={item.isUnread ? "#9CA3AF" : PURPLE} 
                    style={styles.checkIcon} 
                  />
                )}
                <Text 
                  style={[styles.chatMessage, item.isUnread && styles.chatMessageUnread]} 
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              </View>

              {item.isUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount > 99 ? '99+' : (item.unreadCount || '1')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.deleteActionContainer}>
          <CircularDeleteButton
            onPress={() => vm.deleteChat(item.id)}
            size={30}
            iconSize={16}
            iconName="trash-can-outline"
          />
        </View>
      </View>
    );
  }, [vm, navigation, formatTime]);

  return (
    <MainLayout active="ChatList">
      <View style={styles.container}>
        {/* Header Morado Superior que termina justo en el buscador */}
        <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerSection}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="forum-outline" size={24} color="white" />
              <Text style={styles.headerTitle}>Mensajes</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Conversaciones con clientes y profesionales
            </Text>
          </View>

          {/* Barra de Búsqueda Compacta */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o servicio..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={search}
              onChangeText={setSearch}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              keyboardType="default"
              inputMode="search"
              {...(Platform.OS === 'web' ? ({
                'data-autocomplete': 'off',
                'data-form-type': 'other',
                'data-lpignore': 'true',
                'data-1p-ignore': 'true',
                name: 'chat_list_search_query_mobile',
                id: 'chat_list_search_query_mobile',
              } as any) : {})}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros Rápidos debajo de la cabecera morada */}
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
            onPress={() => setActiveFilter("all")}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === "all" && styles.filterChipTextActive]}>
              Todos ({vm.chats.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === "unread" && styles.filterChipActive]}
            onPress={() => setActiveFilter("unread")}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === "unread" && styles.filterChipTextActive]}>
              No leídos {unreadCountTotal > 0 ? `(${unreadCountTotal})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === "active" && styles.filterChipActive]}
            onPress={() => setActiveFilter("active")}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === "active" && styles.filterChipTextActive]}>
              En curso {activeJobsTotal > 0 ? `(${activeJobsTotal})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {vm.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>Cargando conversaciones...</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons 
                name={search ? "account-search-outline" : "chat-processing-outline"} 
                size={44} 
                color={PURPLE} 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {search 
                ? "Sin resultados para tu búsqueda" 
                : activeFilter === "unread" 
                ? "No tienes mensajes sin leer" 
                : activeFilter === "active" 
                ? "No tienes trabajos en curso" 
                : "No tienes conversaciones activas"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search 
                ? "Prueba buscando con otro nombre o tipo de servicio." 
                : "Inicia un chat desde el perfil de cualquier profesional."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 14,
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
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "white",
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "left",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 13.5,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },

  filterSection: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "white",
    fontWeight: "800",
  },

  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: 8,
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 30 
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EDE7F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#222", 
    textAlign: "center", 
    marginBottom: 4 
  },
  emptySubtitle: { 
    fontSize: 13, 
    color: "#777", 
    textAlign: "center", 
    lineHeight: 18 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#777",
  },
  
  chatCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 18,
    alignItems: "center",
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.03)' } as any,
      default: {
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
    }),
  },
  chatCardUnread: {
    backgroundColor: "#FCFAFF",
    borderColor: "#E3D5F5",
  },
  chatItemContent: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    paddingRight: 6,
    alignItems: "center",
  },
  deleteActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  avatarContainer: { 
    position: "relative",
    marginRight: 12,
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    borderWidth: 1.5, 
    borderColor: "#EAEAEA" 
  },
  avatarPlaceholder: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "900",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "white",
  },
  avatarBadgePro: {
    backgroundColor: PURPLE,
  },
  avatarBadgeClient: {
    backgroundColor: "#00695C",
  },
  
  chatInfo: { flex: 1 },
  chatHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 2 
  },
  chatName: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#222", 
    flex: 1, 
    marginRight: 8 
  },
  chatNameUnread: {
    fontWeight: "900",
    color: "#111",
  },
  chatTime: { 
    fontSize: 11.5, 
    color: "#888",
    fontWeight: "500",
  },
  chatTimeUnread: {
    color: PURPLE,
    fontWeight: "700",
  },

  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    flexWrap: "wrap",
  },
  serviceTag: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F3ECFA", 
    paddingHorizontal: 7, 
    paddingVertical: 2, 
    borderRadius: 6, 
    gap: 3 
  },
  serviceTagText: { 
    color: PURPLE, 
    fontWeight: "700", 
    fontSize: 10 
  },
  hiringTag: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#E0F2F1", 
    paddingHorizontal: 7, 
    paddingVertical: 2, 
    borderRadius: 6, 
    gap: 3 
  },
  hiringTagText: { 
    color: "#00695C", 
    fontWeight: "700", 
    fontSize: 10 
  },
  activeJobTag: {
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#D4EDDA", 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6, 
    gap: 3 
  },
  activeJobTagText: {
    color: "#155724", 
    fontWeight: "700", 
    fontSize: 9.5 
  },

  messagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  messageTextWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    marginRight: 4,
  },
  chatMessage: { 
    fontSize: 13, 
    color: "#6B7280", 
    flex: 1 
  },
  chatMessageUnread: { 
    color: "#1F2937", 
    fontWeight: "700" 
  },
  
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 10.5,
    fontWeight: "900",
  },
});
