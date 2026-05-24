import { View, Text } from "react-native";
import MainLayout from "../../../shared/components/MainLayout";

export default function AI() {
  return (
    <MainLayout active="AI">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Pantalla IA</Text>
      </View>
    </MainLayout>
  );
}