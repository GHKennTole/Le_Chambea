import { ScrollView, StyleSheet, View, Platform } from "react-native";
import HeaderHome from "../../../shared/components/HeaderHome";
import CategoryScroll from "../../../shared/components/CategoryScroll";
import SectionList from "../../../shared/components/SectionList";
import MainLayout from "../../../shared/components/MainLayout";

import { useHomeController } from '../controllers/useHomeController';
import { useAppBadges } from '../../../shared/hooks/useAppBadges';

export default function HomeScreen() {
  const vm = useHomeController();
  const badges = useAppBadges();

  return (
    <MainLayout active="Home">
      <View style={styles.container}>
        {/* Parte superior fija */}
        <View style={styles.headerSection}>
          <HeaderHome 
            searchQuery={vm.searchQuery} 
            onSearchChange={vm.setSearchQuery}
            unreadNotificationsCount={badges.unreadNotificationsCount}
            notifications={badges.notifications}
            markAllNotificationsAsRead={badges.markAllNotificationsAsRead}
            deleteNotification={badges.deleteNotification}
            deleteAllNotifications={badges.deleteAllNotifications}
          />
          <CategoryScroll 
            selectedCategory={vm.selectedCategory} 
            onSelectCategory={vm.setSelectedCategory} 
          />
        </View>
        
        {/* Contenido desplazable en el medio */}
        <View style={styles.contentSection}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <SectionList title="Más solicitados" data={vm.masSolicitados} loading={vm.loading} />
            <SectionList title="Novedades" data={vm.novedades} loading={vm.loading} />
            <SectionList title="Cerca de ti" data={vm.masSolicitados} loading={vm.loading} />
          </ScrollView>
        </View>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerSection: {
    backgroundColor: 'white',
    zIndex: 10,
    paddingBottom: 5,
    ...Platform.select({
      web: { boxShadow: '0px 2px 3px rgba(0,0,0,0.1)' } as any,
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }
    }),
  },
  contentSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 100, // Espacio para el BottomNav en móvil
    paddingTop: 1, 
  }
});