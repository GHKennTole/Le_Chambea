import React from "react";
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SectionList({ title, data, loading }: { title: string; data?: any[]; loading?: boolean }) {
  const navigation = useNavigation<any>();
  const isMasSolicitados = title.toLowerCase().includes("solicit");
  const isNovedades = title.toLowerCase().includes("noved");

  if (loading) {
    return (
      <View style={{ marginTop: 18, height: 160, justifyContent: 'center' }}>
        <Text style={[styles.title, (isMasSolicitados || isNovedades) && styles.titleOrange]}>
          {title}
        </Text>
        <ActivityIndicator size="small" color="#5A2D82" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null; // O mostrar un mensaje de vacío
  }

  return (
    <View style={{ marginTop: 18 }}>
      <Text style={[styles.title, (isMasSolicitados || isNovedades) && styles.titleOrange]}>
        {title}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data.map((p) => (
          <TouchableOpacity 
            key={p.id} 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("PublicProfile", { id: p.usuario_id, professionalProfileId: p.id })}
          >
            <Image source={{ uri: p.foto }} style={styles.image} />
            
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>{p.calificacion > 0 ? p.calificacion.toFixed(1) : 'Nuevo'}</Text>
            </View>

            <Text style={styles.proName} numberOfLines={1}>
              {p.nombre}
            </Text>
            <Text style={styles.proJob} numberOfLines={1}>
              {p.profesion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    color: "#222",
  },
  titleOrange: {
    color: "#F59E0B",
  },
  card: {
    width: 140,
    marginRight: 12,
    position: 'relative'
  },
  image: {
    width: 140,
    height: 105,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  proName: {
    marginTop: 6,
    fontWeight: "900",
    color: "#222",
  },
  proJob: {
    marginTop: 1,
    fontWeight: "700",
    color: "#666",
  },
});
