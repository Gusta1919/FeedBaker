export const ITEM_SPACING = 6;
export const ITEM_RATIO = 0.82;
export const HALF_GAP = ITEM_SPACING / 2;

export type CarouselLayout = {
  width: number;
  itemWidth: number;
  stride: number;
  sidePad: number;
};

export type CarouselSettleResult = {
  loopIndex: number;
  realIndex: number;
  offset: number;
  didJump: boolean;
};

export function getCarouselLayout(width: number): CarouselLayout {
  const roundedWidth = Math.round(width);
  const itemWidth = Math.round(roundedWidth * ITEM_RATIO);
  const stride = itemWidth + ITEM_SPACING;
  const sidePad = Math.round((roundedWidth - itemWidth) / 2);
  return { width: roundedWidth, itemWidth, stride, sidePad };
}

export function offsetForLoopIndex(loopIndex: number, stride: number, halfGap = HALF_GAP) {
  return loopIndex * stride + halfGap;
}

export function loopIndexFromOffset(offsetX: number, stride: number, halfGap = HALF_GAP) {
  if (stride <= 0) return 0;
  return Math.round((offsetX - halfGap) / stride);
}

export function realIndexFromLoopIndex(loopIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  let realIndex = loopIndex - 1;
  if (realIndex < 0) realIndex = itemCount - 1;
  if (realIndex >= itemCount) realIndex = 0;
  return realIndex;
}

export function isItemCentered(
  layout: CarouselLayout,
  loopIndex: number,
  scrollX: number,
  halfGap = HALF_GAP,
) {
  const itemCenter = layout.sidePad + loopIndex * layout.stride + layout.stride / 2;
  const viewportCenter = scrollX + layout.width / 2;
  return Math.abs(itemCenter - viewportCenter) < 0.5;
}

export function tiltDistance(
  scrollX: number,
  loopIndex: number,
  stride: number,
  halfGap = HALF_GAP,
) {
  return scrollX - offsetForLoopIndex(loopIndex, stride, halfGap);
}

export function settleCarouselOffset(
  offsetX: number,
  itemCount: number,
  stride: number,
  halfGap = HALF_GAP,
): CarouselSettleResult {
  if (itemCount <= 1) {
    return { loopIndex: 0, realIndex: 0, offset: 0, didJump: false };
  }

  const loopIndex = loopIndexFromOffset(offsetX, stride, halfGap);
  const tailCloneIndex = itemCount + 1;

  if (loopIndex <= 0) {
    const targetLoopIndex = itemCount;
    return {
      loopIndex: targetLoopIndex,
      realIndex: itemCount - 1,
      offset: offsetForLoopIndex(targetLoopIndex, stride, halfGap),
      didJump: true,
    };
  }

  if (loopIndex >= tailCloneIndex) {
    return {
      loopIndex: 1,
      realIndex: 0,
      offset: offsetForLoopIndex(1, stride, halfGap),
      didJump: true,
    };
  }

  const exactOffset = offsetForLoopIndex(loopIndex, stride, halfGap);
  return {
    loopIndex,
    realIndex: loopIndex - 1,
    offset: exactOffset,
    didJump: Math.abs(offsetX - exactOffset) > 0.5,
  };
}

export function snapOffsets(itemCount: number, stride: number, halfGap = HALF_GAP) {
  const slots = itemCount <= 1 ? itemCount : itemCount + 2;
  return Array.from({ length: slots }, (_, loopIndex) =>
    offsetForLoopIndex(loopIndex, stride, halfGap),
  );
}

export function maxScrollOffset(layout: CarouselLayout, slotCount: number) {
  const contentWidth = layout.sidePad * 2 + slotCount * layout.stride;
  return contentWidth - layout.width;
}

export function canReachLoopIndex(layout: CarouselLayout, loopIndex: number, slotCount: number) {
  const offset = offsetForLoopIndex(loopIndex, layout.stride);
  return offset <= maxScrollOffset(layout, slotCount) + 0.5;
}
