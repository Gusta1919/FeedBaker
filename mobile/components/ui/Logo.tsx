import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";

type LogoProps = {
  variant?: "header" | "full" | "mark";
  size?: "sm" | "md" | "lg";
};

const MARK_SIZES = { sm: 22, md: 30, lg: 40 } as const;
const WORD_SIZES = { sm: 20, md: 26, lg: 34 } as const;

/** Two options, one pick — split-card mark. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect
        x="5"
        y="8"
        width="14"
        height="24"
        rx="4"
        stroke={Theme.brand}
        strokeWidth="1.5"
        opacity={0.45}
      />
      <Rect x="21" y="8" width="14" height="24" rx="4" fill={Theme.brand} opacity={0.9} />
      <Path
        d="M26 20l2.5 2.5 5-5"
        stroke={Theme.background}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="20" r="2" fill={Theme.brand} opacity={0.35} />
    </Svg>
  );
}

export function LogoWordmark({ size = "md" }: { size?: keyof typeof WORD_SIZES }) {
  const fontSize = WORD_SIZES[size];
  return (
    <Text style={[styles.wordmark, { fontSize }]}>
      <Text style={styles.cho}>Ch</Text>
      <Text style={styles.osy}>oosy</Text>
    </Text>
  );
}

export function Logo({ variant = "full", size = "md" }: LogoProps) {
  if (variant === "header") {
    return <LogoWordmark size="sm" />;
  }

  if (variant === "mark") {
    return <LogoMark size={MARK_SIZES[size]} />;
  }

  return (
    <View style={styles.row}>
      <LogoMark size={MARK_SIZES[size]} />
      <LogoWordmark size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wordmark: {
    fontFamily: Fonts.extrabold,
    letterSpacing: -1,
  },
  cho: {
    color: Theme.text,
  },
  osy: {
    color: Theme.brand,
  },
});
