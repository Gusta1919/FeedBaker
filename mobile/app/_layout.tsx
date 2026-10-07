import "react-native-reanimated";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Theme from "@/constants/Theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CategoryProvider } from "@/context/CategoryContext";

const ChoosyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Theme.background,
    card: Theme.surface,
    text: Theme.text,
    border: Theme.line,
    primary: Theme.brand,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "login";
    const path = segments.join("/");
    if (!user && !inAuth && (path.includes("my-polls") || path.includes("my-stats"))) {
      router.replace("/login");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.background }}>
        <ActivityIndicator color={Theme.brand} />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Theme.background }}>
        <ActivityIndicator color={Theme.brand} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CategoryProvider>
          <AuthProvider>
            <ThemeProvider value={ChoosyTheme}>
              <AuthGate>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Theme.background } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="login" options={{ presentation: "modal" }} />
                </Stack>
              </AuthGate>
            </ThemeProvider>
          </AuthProvider>
        </CategoryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
