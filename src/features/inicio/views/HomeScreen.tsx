import { ScrollView, StyleSheet, View, Platform } from "react-native";
import HeaderHome from "../../../shared/components/HeaderHome";
import CategoryScroll from "../../../shared/components/CategoryScroll";
import SectionList from "../../../shared/components/SectionList";
import MainLayout from "../../../shared/components/MainLayout";

import SearchResultsList from "../../../shared/components/SearchResultsList";

import { useHomeController } from '../controllers/useHomeController';
import { useAppBadges } from '../../../shared/hooks/useAppBadges';

export default function HomeScreen() {
  const vm = useHomeController();
  const badges = useAppBadges();

  const searchTitle = vm.searchQuery.trim() !== ''
    ? `Resultados para "${vm.searchQuery.trim()}"`
    : `Categoría: ${vm.selectedCategory}`;

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
            {vm.isSearching ? (
              <SearchResultsList 
                title={searchTitle} 
                data={vm.searchResults} 
                loading={vm.loading} 
              />
            ) : (
              <>
                <SectionList title="Más solicitados" data={vm.masSolicitados} loading={vm.loading} />
                <SectionList title="Novedades" data={vm.novedades} loading={vm.loading} />
                <SectionList title="Cerca de ti" data={vm.masSolicitados} loading={vm.loading} />
              </>
            )}
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
  },
  contentSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.OS === 'web' ? 16 : 10,
    paddingTop: 4,
    paddingBottom: 20,
  }
});