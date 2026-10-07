import { Pressable, StyleSheet, Text, View } from "react-native";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { getCategoryEmoji } from "@/lib/categoryEmoji";
import { POLL_CATEGORIES } from "@/lib/types";

type CategoryGridProps = {
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
};

export function CategoryGrid({ activeCategory, onSelect }: CategoryGridProps) {
  return (
    <View style={styles.grid}>
      <Pressable
        style={[styles.cell, !activeCategory && styles.cellActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={styles.cellEmoji}>✨</Text>
        <Text style={[styles.cellLabel, !activeCategory && styles.cellLabelActive]}>
          All
        </Text>
      </Pressable>

      {POLL_CATEGORIES.map((category) => {
        const active = activeCategory === category;
        return (
          <Pressable
            key={category}
            style={[styles.cell, active && styles.cellActive]}
            onPress={() => onSelect(category)}
          >
            <Text style={styles.cellEmoji}>{getCategoryEmoji(category)}</Text>
            <Text style={[styles.cellLabel, active && styles.cellLabelActive]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    width: "31%",
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.line,
    borderRadius: Theme.radiusTile,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  cellActive: {
    backgroundColor: Theme.brandSoft,
    borderColor: Theme.brand,
  },
  cellEmoji: {
    fontSize: 24,
  },
  cellLabel: {
    color: Theme.textMuted,
    fontSize: 11,
    fontFamily: Fonts.semibold,
    textAlign: "center",
  },
  cellLabelActive: {
    color: Theme.brand,
  },
});
