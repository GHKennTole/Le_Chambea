import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View, Platform, BackHandler } from "react-native";
import HeaderHome from "../components/HeaderHome";
import CategoryScroll from "../components/CategoryScroll";
import SectionList from "../components/SectionList";
import SearchResultsList from "../components/SearchResultsList";
import MainLayout from "../../../shared/components/MainLayout";

import { useHomeController } from '../controllers/useHomeController';
import { useAppBadges } from '../../../shared/hooks/useAppBadges';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const vm = useHomeController();
  const badges = useAppBadges();
  const { isLargeScreen } = useResponsive();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      if (vm.isSearching) {
        vm.setSearchQuery("");
        vm.setSelectedCategory(null);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [vm.isSearching]);

  const searchTitle = vm.searchQuery.trim() !== ''
    ? `Resultados para "${vm.searchQuery.trim()}"`
    : `Categoría: ${vm.selectedCategory}`;

  return (
    <MainLayout active="Home">
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isLargeScreen ? 16 : 10 }]}
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
    paddingTop: 4,
    paddingBottom: 20,
  }
});