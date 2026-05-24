import { View, Text } from "react-native";
import MainLayout from "../../../shared/components/MainLayout";

export default function Favorites() {
  return (
    <MainLayout active="Favorites">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Pantalla Favoritos</Text>
      </View>
    </MainLayout>
  );
}