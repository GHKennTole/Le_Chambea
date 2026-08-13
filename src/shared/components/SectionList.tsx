import React from "react";
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SectionList({ title, data, loading }: { title: string; data?: any[]; loading?: boolean }) {
  const navigation = useNavigation<any>();
  const scrollRef = React.useRef<any>(null);

  const isMasSolicitados = title.toLowerCase().includes("solicit");
  const isNovedades = title.toLowerCase().includes("noved");
  const isWeb = Platform.OS === 'web';

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

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: -300, animated: true });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 300, animated: true });
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.title, (isMasSolicitados || isNovedades) && styles.titleOrange]}>
        {title}
      </Text>

      {isWeb ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true} 
          contentContainerStyle={{ paddingRight: 10 }}
        >
          {data.map((p) => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.webCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("PublicProfile", { id: p.usuario_id, professionalProfileId: p.id })}
            >
              <View style={styles.webImageWrapper}>
                <Image source={{ uri: p.foto }} style={styles.webImage} />
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={13} color="#FFB800" />
                  <Text style={styles.ratingText}>{p.calificacion > 0 ? p.calificacion.toFixed(1) : 'Nuevo'}</Text>
                </View>
              </View>
              
              <View style={styles.webCardBody}>
                <Text style={styles.webProName} numberOfLines={1}>
                  {p.nombre}
                </Text>
                <Text style={styles.webProJob} numberOfLines={1}>
                  {p.profesion}
                </Text>

                <View style={styles.webProfileButton}>
                  <Text style={styles.webProfileButtonText}>Ver Perfil</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#222",
  },
  titleOrange: {
    color: "#F59E0B",
  },
  scrollButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3ECFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
  webCard: {
    width: 220,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEF',
    overflow: 'hidden',
    marginRight: 18,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' } as any,
      default: { elevation: 3 }
    })
  },
  webImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  webImage: {
    width: '100%',
    height: 140,
    backgroundColor: "#eee",
  },
  webCardBody: {
    padding: 12,
  },
  webProName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#222",
  },
  webProJob: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  webProfileButton: {
    backgroundColor: '#5A2D82',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webProfileButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
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
