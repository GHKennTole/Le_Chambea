import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeProCard } from "../../features/inicio/controllers/useHomeController";
import { useResponsive } from "../hooks/useResponsive";

interface SearchResultsListProps {
  data: HomeProCard[];
  loading?: boolean;
  title: string;
}

export default function SearchResultsList({ data, loading, title }: SearchResultsListProps) {
  const navigation = useNavigation<any>();
  const { isLargeScreen } = useResponsive();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A2D82" />
        <Text style={styles.loadingText}>Buscando profesionales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {data.length} {data.length === 1 ? "resultado encontrado" : "resultados encontrados"}
        </Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptyText}>
            No se encontraron profesionales que coincidan con tu búsqueda. Intenta con otra palabra clave o categoría.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {data.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.horizontalCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("PublicProfile", { id: p.usuario_id, professionalProfileId: p.id })}
            >
              <View style={styles.avatarWrapper}>
                {p.foto ? (
                  <Image source={{ uri: p.foto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account" size={32} color="#999" />
                  </View>
                )}
              </View>

              <View style={styles.infoWrapper}>
                <Text style={styles.proName} numberOfLines={1}>
                  {p.nombre}
                </Text>
                <Text style={styles.proJob} numberOfLines={1}>
                  {p.profesion}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <MaterialCommunityIcons name="star" size={13} color="#FFB800" />
                    <Text style={styles.ratingText}>
                      {p.calificacion > 0 ? p.calificacion.toFixed(1) : 'Nuevo'}
                    </Text>
                  </View>
                  {p.categoria ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText} numberOfLines={1}>{p.categoria}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionWrapper}>
                <View style={styles.profileButton}>
                  <Text style={styles.profileButtonText}>Ver Perfil</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingBottom: 20,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#222",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    fontWeight: "600",
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },
  listContainer: {
    width: '100%',
    flexDirection: 'column',
  },
  horizontalCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEF',
    padding: 12,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      }
    })
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEE",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  proName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222",
    marginBottom: 2,
  },
  proJob: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 140,
  },
  categoryBadgeText: {
    color: '#5A2D82',
    fontSize: 11,
    fontWeight: '600',
  },
  actionWrapper: {
    marginLeft: 10,
  },
  profileButton: {
    backgroundColor: '#5A2D82',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
