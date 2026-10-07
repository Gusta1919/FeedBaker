import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { getCategoryEmoji } from "@/lib/categoryEmoji";

type ActiveCategoryChipProps = {
  category: string;
  onClear: () => void;
  variant?: "overlay" | "inline";
};

export function ActiveCategoryChip({
  category,
  onClear,
  variant = "overlay",
}: ActiveCategoryChipProps) {
  const insets = useSafeAreaInsets();
  const isInline = variant === "inline";

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(200)}
      style={[
        isInline ? styles.inlineWrap : styles.wrap,
        !isInline && { top: insets.top + 8 },
      ]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.chip} onPress={onClear}>
        <Text style={styles.text}>
          {getCategoryEmoji(category)} {category}
        </Text>
        <Text style={styles.clear}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  inlineWrap: {
    alignItems: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22, 22, 24, 0.92)",
    borderWidth: 1,
    borderColor: Theme.brand,
    borderRadius: Theme.radiusPill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  text: {
    color: Theme.brand,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  clear: {
    color: Theme.brand,
    fontSize: 12,
    fontWeight: "700",
  },
});
