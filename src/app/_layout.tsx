import { useEffect } from "react";
import { ActivityIndicator, I18nManager, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
  Vazirmatn_900Black,
} from "@expo-google-fonts/vazirmatn";
import { colors } from "@/shared/theme";

// RTL — should be set once; requires full app restart to take effect
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    Vazirmatn_900Black,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
            animation: "slide_from_left", // RTL-friendly (slides in from left)
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="location" />
          <Stack.Screen name="details" />
          <Stack.Screen name="map" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}