import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "@/components/ui/Logo";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";

type FeedWelcomeSlideProps = {
  height: number;
};

export function FeedWelcomeSlide({ height }: FeedWelcomeSlideProps) {
  const insets = useSafeAreaInsets();
  const bounce = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [bounce, pulse]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
    opacity: 0.5 + bounce.value / 16,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.slide, { height }]}>
      <Animated.View entering={FadeIn.duration(700)} style={logoStyle}>
        <Logo variant="full" size="lg" />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(350).duration(600)}
        style={styles.tagline}
      >
        Pick what looks best
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(650).duration(600)}
        style={[styles.hintBlock, { bottom: Math.max(insets.bottom, 24) + 24 }]}
      >
        <Text style={styles.hint}>Scroll down to start</Text>
        <Animated.Text style={[styles.chevron, chevronStyle]}>↓</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    backgroundColor: Theme.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  tagline: {
    marginTop: 16,
    color: Theme.textMuted,
    fontSize: 16,
    fontFamily: Fonts.medium,
    letterSpacing: -0.2,
  },
  hintBlock: {
    position: "absolute",
    alignItems: "center",
    gap: 8,
  },
  hint: {
    color: Theme.textFaint,
    fontSize: 13,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.3,
  },
  chevron: {
    color: Theme.brand,
    fontSize: 22,
    fontWeight: "700",
  },
});
