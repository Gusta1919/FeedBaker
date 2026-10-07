import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryGrid } from "@/components/CategoryGrid";
import { LogoWordmark } from "@/components/ui/Logo";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { useCategory } from "@/context/CategoryContext";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category, setCategory } = useCategory();

  const pickCategory = (next: string | null) => {
    setCategory(next);
    router.push("/(tabs)");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <LogoWordmark size="md" />
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Pick a category — your feed updates instantly.</Text>

      <CategoryGrid activeCategory={category} onSelect={pickCategory} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 20,
    color: Theme.text,
    fontSize: 28,
    fontFamily: Fonts.extrabold,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: Theme.textMuted,
    fontSize: 14,
    fontFamily: Fonts.medium,
    lineHeight: 20,
  },
});
