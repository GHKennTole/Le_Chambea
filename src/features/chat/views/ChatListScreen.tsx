import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../../shared/components/MainLayout";
import { useChatListController, ChatPreview } from "../controllers/useChatListController";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CircularDeleteButton from "../../../shared/components/CircularDeleteButton";

const PURPLE = "#5A2D82";

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useChatListController();

  const formatTime = useCallback((isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const renderItem = useCallback(({ item }: { item: ChatPreview }) => (
    <View style={styles.chatItemRow}>
      <TouchableOpacity 
        style={styles.chatItemContent}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Chat", { chatId: item.id, otherUserId: item.otherUserId })}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate("PublicProfile", { id: item.otherUserId, fromChat: true })}
        >
          {item.otherUserPhoto ? (
            <Image source={{ uri: item.otherUserPhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={30} color="#999" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{item.otherUserName}</Text>
            <Text style={styles.chatTime}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          {item.requestedService && (
            item.isClient ? (
              <View style={styles.hiringTag}>
                <MaterialCommunityIcons name="account-search-outline" size={12} color="#00695C" />
                <Text style={styles.hiringTagText}>Contratando: {item.requestedService}</Text>
              </View>
            ) : (
              <View style={styles.serviceTag}>
                <MaterialCommunityIcons name="hammer-wrench" size={11} color={PURPLE} />
                <Text style={styles.serviceTagText}>Mi Servicio: {item.requestedService}</Text>
              </View>
            )
          )}
          <Text 
            style={[styles.chatMessage, item.isUnread && styles.chatMessageUnread]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        {item.isUnread && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
      
      <View style={styles.deleteActionContainer}>
        <CircularDeleteButton
          onPress={() => vm.deleteChat(item.id)}
        />
      </View>
    </View>
  ), [vm, navigation, formatTime]);

  return (
    <MainLayout active="ChatList">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="forum-outline" size={26} color={PURPLE} />
            <Text style={styles.headerTitle}>Mensajes</Text>
          </View>
        </View>

      {vm.loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : vm.chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="chat-outline" size={64} color="#DDD" />
          <Text style={styles.emptyText}>No tienes conversaciones activas</Text>
        </View>
      ) : (
        <FlatList
          data={vm.chats}
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
  header: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECF1"
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#333" },
  listContent: { paddingBottom: 20 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  emptyText: { marginTop: 12, fontSize: 16, color: "#888", textAlign: "center" },
  
  chatItemRow: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center",
    paddingRight: 16,
  },
  chatItemContent: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    paddingRight: 8,
    alignItems: "center",
  },
  deleteActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#EAEAEA", justifyContent: "center", alignItems: "center" },
  
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  chatName: { fontSize: 16, fontWeight: "bold", color: "#222", flex: 1, marginRight: 8 },
  chatTime: { fontSize: 12, color: "#888" },
  serviceTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0E6FA", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4, gap: 4 },
  serviceTagText: { color: PURPLE, fontWeight: "bold", fontSize: 10 },
  hiringTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#E0F2F1", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4, gap: 4 },
  hiringTagText: { color: "#00695C", fontWeight: "bold", fontSize: 10 },
  chatMessage: { fontSize: 14, color: "#666" },
  chatMessageUnread: { color: "#222", fontWeight: "600" },
  
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
    marginLeft: 10
  },
  bottomSection: { position: "absolute", bottom: 0, left: 0, right: 0 }
});
