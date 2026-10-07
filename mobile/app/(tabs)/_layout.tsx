import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "@/constants/Theme";

const TAB_BAR_CORE = 52;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.background,
          borderTopColor: Theme.line,
          borderTopWidth: 1,
          height: TAB_BAR_CORE + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          marginBottom: 2,
        },
        tabBarActiveTintColor: Theme.brand,
        tabBarInactiveTintColor: Theme.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "For you",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "rectangle.stack", android: "layers", web: "layers" }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "safari", android: "explore", web: "explore" }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-polls"
        options={{
          title: "My polls",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "square.grid.2x2", android: "grid_view", web: "grid_view" }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "chart.bar", android: "bar_chart", web: "bar_chart" }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
