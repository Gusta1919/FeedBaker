import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import type { PollOption } from "@/lib/types";
import { getPercent } from "@/lib/utils";

const PICK_SPRING = {
  damping: 13,
  stiffness: 210,
  mass: 0.58,
} as const;

const TAP_MAX_DISTANCE = 10;
const TAP_MAX_DURATION = 260;

type OptionTileProps = {
  option: PollOption;
  index: number;
  displayCount: number;
  totalVotes: number;
  picked: boolean;
  isWinner: boolean;
  revealed: boolean;
  locked: boolean;
  onPick: () => void;
};

export const OptionTile = memo(function OptionTile({
  option,
  index,
  displayCount,
  totalVotes,
  picked,
  revealed,
  locked,
  onPick,
}: OptionTileProps) {
  const [showResults, setShowResults] = useState(revealed);
  const [localPick, setLocalPick] = useState(false);
  const percent = getPercent(displayCount, totalVotes);
  const letter = String.fromCharCode(65 + index);
  const isPicked = showResults && (picked || localPick);

  const pickProgress = useSharedValue(isPicked ? 1 : 0);
  const barProgress = useSharedValue(showResults ? Math.max(percent, 2) : 0);

  useEffect(() => {
    if (picked) setLocalPick(false);
  }, [picked]);

  useEffect(() => {
    if (revealed) setShowResults(true);
  }, [revealed]);

  useEffect(() => {
    pickProgress.value = withSpring(isPicked ? 1 : 0, PICK_SPRING);
  }, [isPicked, pickProgress]);

  useEffect(() => {
    if (showResults) {
      barProgress.value = withTiming(Math.max(percent, 2), { duration: 540 });
    } else {
      barProgress.value = 0;
    }
  }, [barProgress, percent, showResults]);

  const handlePick = useCallback(() => {
    if (locked && showResults) return;
    setShowResults(true);
    setLocalPick(true);
    pickProgress.value = withSpring(1, PICK_SPRING);
    barProgress.value = withTiming(Math.max(percent, 2), { duration: 540 });
    onPick();
  }, [barProgress, locked, onPick, percent, pickProgress, showResults]);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(TAP_MAX_DISTANCE)
        .maxDuration(TAP_MAX_DURATION)
        .enabled(!(locked && showResults))
        .onEnd(() => {
          runOnJS(handlePick)();
        }),
    [handlePick, locked, showResults],
  );

  const frameRingStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      pickProgress.value,
      [0, 1],
      [Theme.lineStrong, Theme.brand],
    ),
    shadowOpacity: interpolate(pickProgress.value, [0, 1], [0, 0.42]),
  }));

  const checkBadgeStyle = useAnimatedStyle(() => ({
    opacity: pickProgress.value,
    transform: [{ scale: interpolate(pickProgress.value, [0, 1], [0.3, 1]) }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value}%`,
  }));

  const percentColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      pickProgress.value,
      [0, 1],
      ["#ffffff", Theme.brand],
    ),
  }));

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.tile, frameRingStyle]}>
        <View style={styles.media}>
          <Image
            source={{ uri: option.imageUrl }}
            style={styles.photo}
            contentFit="cover"
            contentPosition="center"
          />

          <LinearGradient
            colors={
              showResults
                ? ["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.62)"]
                : ["transparent", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.58)"]
            }
            locations={[0.45, 0.72, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {!showResults && (
            <View style={styles.letterBadge}>
              <Text style={styles.letter}>{letter}</Text>
            </View>
          )}

          {showResults && isPicked ? (
            <Animated.View
              style={[styles.letterBadge, styles.letterBadgePicked, checkBadgeStyle]}
            >
              <Text style={styles.check}>✓</Text>
            </Animated.View>
          ) : null}

          <View style={styles.photoFooter}>
            {showResults ? (
              <View style={styles.results}>
                <View style={styles.percentRow}>
                  <Animated.Text style={[styles.percent, percentColorStyle]}>
                    {percent}
                    <Text style={styles.percentSuffix}>%</Text>
                  </Animated.Text>
                  {option.label ? (
                    <Text style={styles.labelMuted} numberOfLines={1}>
                      {option.label}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.barFill,
                      picked || localPick ? styles.barAccent : styles.barMuted,
                      barStyle,
                    ]}
                  />
                </View>
                <Text style={styles.voteCount}>
                  {displayCount} {displayCount === 1 ? "vote" : "votes"}
                </Text>
              </View>
            ) : option.label ? (
              <Text style={styles.labelPreview} numberOfLines={2}>
                {option.label}
              </Text>
            ) : (
              <Text style={styles.labelPreview}>Option {letter}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: Theme.radiusTile,
    borderWidth: 2,
    borderColor: Theme.lineStrong,
    backgroundColor: Theme.inkSoft,
    overflow: "hidden",
    shadowColor: Theme.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 3,
  },
  media: {
    flex: 1,
    overflow: "hidden",
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: "106%",
    height: "106%",
    marginLeft: "-3%",
    marginTop: "-3%",
  },
  letterBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  letterBadgePicked: {
    backgroundColor: Theme.brand,
    borderColor: Theme.brand,
  },
  letter: {
    color: "#fff",
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  check: {
    color: "#fff",
    fontFamily: Fonts.extrabold,
    fontSize: 14,
  },
  photoFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 28,
  },
  results: {
    gap: 6,
  },
  percentRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  percent: {
    fontSize: 28,
    fontFamily: Fonts.extrabold,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  percentSuffix: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  labelMuted: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontFamily: Fonts.semibold,
    textAlign: "right",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  barAccent: {
    backgroundColor: Theme.brand,
  },
  barMuted: {
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  voteCount: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontFamily: Fonts.semibold,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelPreview: {
    color: "#fff",
    fontSize: 15,
    fontFamily: Fonts.bold,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
