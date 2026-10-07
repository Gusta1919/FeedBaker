import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import {
  CAROUSEL_REPEAT_BLOCKS,
  getCarouselStartIndex,
} from "@/lib/carouselLoop";
import {
  HALF_GAP,
  getCarouselLayout,
  offsetForLoopIndex,
} from "@/lib/rollerCarouselLogic";
import {
  CAROUSEL_ACTIVE_OFFSET_X,
  CAROUSEL_FAIL_OFFSET_Y,
} from "@/lib/rollerCarouselAxis";
import { resolveStageFromGesture } from "@/lib/rollerCarouselStages";

type FlatEntry<T> = {
  item: T;
  realIndex: number;
  key: string;
};

type RollerCarouselProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onIndexChange?: (index: number) => void;
  enabled?: boolean;
};

type RollerItemProps = {
  listIndex: number;
  scrollX: SharedValue<number>;
  strideSV: SharedValue<number>;
  halfGapSV: SharedValue<number>;
  children: ReactNode;
};

const PAN_ACTIVATE_PX = CAROUSEL_ACTIVE_OFFSET_X;
const SETTLE_SPRING = {
  damping: 24,
  stiffness: 220,
  mass: 0.82,
  overshootClamping: false,
} as const;

function buildFlatData<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
): FlatEntry<T>[] {
  if (data.length <= 1) {
    return data.map((item, i) => ({
      item,
      realIndex: i,
      key: keyExtractor(item, i),
    }));
  }

  const rows: FlatEntry<T>[] = [];
  for (let block = 0; block < CAROUSEL_REPEAT_BLOCKS; block++) {
    for (let i = 0; i < data.length; i++) {
      rows.push({
        item: data[i],
        realIndex: i,
        key: `${block}-${keyExtractor(data[i], i)}`,
      });
    }
  }
  return rows;
}

function RollerItem({ listIndex, scrollX, strideSV, halfGapSV, children }: RollerItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stride = strideSV.value;
    const halfGap = halfGapSV.value;
    if (stride <= 0) return {};

    const distance = scrollX.value - (listIndex * stride + halfGap);
    const spread = stride;
    const flatZone = stride * 0.3;

    if (Math.abs(distance) < flatZone) {
      return {
        opacity: 1,
        zIndex: 10,
        transform: [{ perspective: 1400 }, { rotateY: "0deg" }, { scale: 1 }],
      };
    }

    const tilt = interpolate(
      distance,
      [-spread, -flatZone, flatZone, spread],
      [11, 0, 0, -11],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      distance,
      [-spread, -flatZone, flatZone, spread],
      [0.93, 1, 1, 0.93],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      distance,
      [-spread, -flatZone * 0.5, flatZone * 0.5, spread],
      [0.82, 1, 1, 0.82],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      zIndex: 1,
      transform: [{ perspective: 1400 }, { rotateY: `${tilt}deg` }, { scale }],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const MemoRollerItem = memo(RollerItem);

export function RollerCarousel<T>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
  enabled = true,
}: RollerCarouselProps<T>) {
  const scrollX = useSharedValue(0);
  const dragStartScrollX = useSharedValue(0);
  const dragStartStageSV = useSharedValue(0);
  const strideSV = useSharedValue(0);
  const halfGapSV = useSharedValue(HALF_GAP);
  const sidePadSV = useSharedValue(0);
  const itemCountSV = useSharedValue(data.length);
  const gestureStageListIndexSV = useSharedValue(0);
  const animatingSV = useSharedValue(false);
  const panActiveSV = useSharedValue(false);
  const enabledSV = useSharedValue(true);
  const gestureHandledSV = useSharedValue(false);

  const onIndexChangeRef = useRef(onIndexChange);
  const didInit = useRef(false);
  const lastItemCountRef = useRef(data.length);
  const [layoutWidth, setLayoutWidth] = useState(0);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  useEffect(() => {
    enabledSV.value = enabled;
  }, [enabled, enabledSV]);

  const flatData = useMemo(
    () => buildFlatData(data, keyExtractor),
    [data, keyExtractor],
  );
  const isLooping = data.length > 1;

  const layout = layoutWidth > 0 ? getCarouselLayout(layoutWidth) : null;
  const stride = layout?.stride ?? 0;
  const itemWidth = layout?.itemWidth ?? 0;
  const sidePad = layout?.sidePad ?? 0;
  const startListIndex = isLooping ? getCarouselStartIndex(data.length) : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    setLayoutWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
  }, []);

  const emitStage = useCallback((realIndex: number) => {
    onIndexChangeRef.current?.(realIndex);
  }, []);

  useEffect(() => {
    strideSV.value = stride;
    halfGapSV.value = HALF_GAP;
    sidePadSV.value = sidePad;
    itemCountSV.value = data.length;
  }, [data.length, halfGapSV, itemCountSV, sidePad, sidePadSV, stride, strideSV]);

  useEffect(() => {
    if (!isLooping || stride <= 0) return;

    if (lastItemCountRef.current !== data.length) {
      lastItemCountRef.current = data.length;
      didInit.current = false;
    }

    if (didInit.current) return;

    didInit.current = true;
    const offset = offsetForLoopIndex(startListIndex, stride);
    scrollX.value = offset;
    gestureStageListIndexSV.value = startListIndex;
    emitStage(0);
  }, [
    data.length,
    emitStage,
    gestureStageListIndexSV,
    isLooping,
    scrollX,
    startListIndex,
    stride,
  ]);

  const releaseAnimating = useCallback(() => {
    animatingSV.value = false;
  }, [animatingSV]);

  const settleToStage = useCallback(
    (offsetX: number, startStageListIndex: number, velocityX = 0) => {
      if (stride <= 0 || !isLooping) return;

      cancelAnimation(scrollX);

      const next = resolveStageFromGesture(
        offsetX,
        0,
        startStageListIndex,
        data.length,
        stride,
      );

      const finish = () => {
        scrollX.value = next.offset;
        gestureStageListIndexSV.value = next.listIndex;
        releaseAnimating();
        emitStage(next.realIndex);
      };

      if (next.didRecenter) {
        finish();
        return;
      }

      animatingSV.value = true;

      const toTarget = next.offset - offsetX;
      const scrollVelocity = -velocityX;
      const springVelocity =
        Math.abs(toTarget) > 0.5 &&
        Math.sign(toTarget) === Math.sign(scrollVelocity)
          ? scrollVelocity * 0.45
          : 0;

      scrollX.value = withSpring(
        next.offset,
        {
          ...SETTLE_SPRING,
          velocity: springVelocity,
        },
        (done) => {
          if (done) runOnJS(finish)();
        },
      );
    },
    [
      animatingSV,
      data.length,
      emitStage,
      gestureStageListIndexSV,
      isLooping,
      releaseAnimating,
      scrollX,
      stride,
    ],
  );

  useAnimatedReaction(
    () => {
      if (animatingSV.value) return -1;
      const stride = strideSV.value;
      const count = itemCountSV.value;
      if (stride <= 0 || count <= 0) return -1;
      const listIndex = Math.round((scrollX.value - halfGapSV.value) / stride);
      return ((listIndex % count) + count) % count;
    },
    (realIndex, prev) => {
      if (realIndex >= 0 && realIndex !== prev) {
        runOnJS(emitStage)(realIndex);
      }
    },
  );

  const panGesture = useMemo(() => {
    const native = Gesture.Native();

    const pan = Gesture.Pan()
      .activeOffsetX([-PAN_ACTIVATE_PX, PAN_ACTIVATE_PX])
      .failOffsetY([-CAROUSEL_FAIL_OFFSET_Y, CAROUSEL_FAIL_OFFSET_Y])
      .onBegin(() => {
        gestureHandledSV.value = false;
      })
      .onStart(() => {
        if (!enabledSV.value || animatingSV.value) return;

        panActiveSV.value = true;
        cancelAnimation(scrollX);
        animatingSV.value = false;

        const stride = strideSV.value;
        const halfGap = halfGapSV.value;
        const committedStage = gestureStageListIndexSV.value;

        dragStartStageSV.value = committedStage;
        dragStartScrollX.value = scrollX.value;

        if (stride > 0) {
          const committedOffset = committedStage * stride + halfGap;
          if (Math.abs(scrollX.value - committedOffset) > stride * 0.45) {
            dragStartStageSV.value = Math.round((scrollX.value - halfGap) / stride);
          }
        }
      })
      .onUpdate((event) => {
        if (animatingSV.value || strideSV.value <= 0) return;

        const stride = strideSV.value;
        const halfGap = halfGapSV.value;
        const stage = dragStartStageSV.value;
        const min = (stage - 1) * stride + halfGap;
        const max = (stage + 1) * stride + halfGap;
        const next = dragStartScrollX.value - event.translationX;

        scrollX.value = Math.min(Math.max(next, min), max);
      })
      .onEnd((event) => {
        if (
          !panActiveSV.value ||
          !enabledSV.value ||
          animatingSV.value ||
          gestureHandledSV.value
        ) {
          return;
        }
        gestureHandledSV.value = true;
        runOnJS(settleToStage)(scrollX.value, dragStartStageSV.value, event.velocityX);
      })
      .onFinalize((event, success) => {
        const wasActive = panActiveSV.value;
        panActiveSV.value = false;

        if (
          !wasActive ||
          !enabledSV.value ||
          success ||
          animatingSV.value ||
          gestureHandledSV.value
        ) {
          return;
        }
        gestureHandledSV.value = true;
        runOnJS(settleToStage)(
          scrollX.value,
          dragStartStageSV.value,
          event.velocityX ?? 0,
        );
      });

    return Gesture.Simultaneous(pan, native);
  }, [
    animatingSV,
    dragStartScrollX,
    dragStartStageSV,
    enabledSV,
    gestureHandledSV,
    gestureStageListIndexSV,
    halfGapSV,
    panActiveSV,
    scrollX,
    settleToStage,
    strideSV,
  ]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value + sidePadSV.value }],
  }));

  if (data.length <= 1) {
    return (
      <View style={styles.single} onLayout={onLayout}>
        {data.length === 1 ? renderItem(data[0], 0) : null}
      </View>
    );
  }

  if (layoutWidth === 0) {
    return <View style={styles.carousel} onLayout={onLayout} />;
  }

  const trackWidth = sidePad * 2 + flatData.length * stride;

  return (
    <View style={styles.carousel} onLayout={onLayout}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.viewport}>
          <Animated.View
            style={[
              styles.track,
              trackStyle,
              { width: trackWidth, paddingRight: sidePad },
            ]}
          >
            {flatData.map((entry, index) => (
              <MemoRollerItem
                key={entry.key}
                listIndex={index}
                scrollX={scrollX}
                strideSV={strideSV}
                halfGapSV={halfGapSV}
              >
                <View style={[styles.slot, { width: stride }]}>
                  <View style={{ width: itemWidth, height: "100%" }}>
                    {renderItem(entry.item, entry.realIndex)}
                  </View>
                </View>
              </MemoRollerItem>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
    overflow: "hidden",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    height: "100%",
  },
  single: {
    flex: 1,
  },
  slot: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
