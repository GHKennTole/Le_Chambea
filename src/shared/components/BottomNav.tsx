import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../core/navigation/types";
import { useAppBadges } from "../hooks/useAppBadges";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BottomNav({ active }: { active: keyof RootStackParamList }) {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { unreadChatsCount } = useAppBadges();

  return (
    <View style={[styles.wrapper, { marginBottom: insets.bottom > 0 ? insets.bottom : 37 }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => nav.navigate("Home")}>
          <MaterialCommunityIcons name="home" size={28} color={active === "Home" ? "#5A2D82" : "gray"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate("ChatList")} style={styles.iconContainer}>
          <MaterialCommunityIcons name="chat" size={28} color={active === "ChatList" ? "#5A2D82" : "gray"} />
          {unreadChatsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadChatsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerBtn} onPress={() => nav.navigate("AI")}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate("Favorites")}>
          <MaterialCommunityIcons name="star" size={28} color={active === "Favorites" ? "#5A2D82" : "gray"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate("Menu")}>
          <MaterialCommunityIcons name="menu" size={28} color={active === "Menu" ? "#5A2D82" : "gray"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: "white" },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  centerBtn: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 50,
    marginTop: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 50, height: 50 },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ff3b30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
