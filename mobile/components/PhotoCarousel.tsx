import { useCallback, useState, type ReactNode } from "react";
import { LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import {
  ITEM_SPACING,
  getCarouselLayout,
} from "@/lib/rollerCarouselLogic";

type PhotoCarouselProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onIndexChange?: (index: number) => void;
};

export function PhotoCarousel<T>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
}: PhotoCarouselProps<T>) {
  const [layoutWidth, setLayoutWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setLayoutWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
  }, []);

  const layout = layoutWidth > 0 ? getCarouselLayout(layoutWidth) : null;

  if (data.length <= 1) {
    return (
      <View style={styles.root} onLayout={onLayout}>
        {layout && data.length === 1 ? (
          <View style={[styles.singleSlot, { width: layout.itemWidth }]}>
            {renderItem(data[0], 0)}
          </View>
        ) : null}
      </View>
    );
  }

  if (!layout) {
    return <View style={styles.root} onLayout={onLayout} />;
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      <PagerView
        style={styles.pager}
        initialPage={0}
        pageMargin={ITEM_SPACING}
        offscreenPageLimit={1}
        overdrag={Platform.OS === "ios"}
        onPageSelected={(event) => {
          onIndexChange?.(event.nativeEvent.position);
        }}
      >
        {data.map((item, index) => (
          <View
            key={keyExtractor(item, index)}
            style={styles.page}
            collapsable={false}
          >
            <View style={[styles.slot, { width: layout.itemWidth }]}>
              {renderItem(item, index)}
            </View>
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slot: {
    flex: 1,
    maxWidth: "100%",
  },
  singleSlot: {
    flex: 1,
    alignSelf: "center",
  },
});
