export const CAROUSEL_REPEAT_BLOCKS = 9;

export function getCarouselMiddleBlock(repeatBlocks = CAROUSEL_REPEAT_BLOCKS) {
  return Math.floor(repeatBlocks / 2);
}

export function getCarouselStartIndex(itemCount: number, repeatBlocks = CAROUSEL_REPEAT_BLOCKS) {
  if (itemCount <= 0) return 0;
  return getCarouselMiddleBlock(repeatBlocks) * itemCount;
}

export function getCarouselRealIndex(listIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return ((listIndex % itemCount) + itemCount) % itemCount;
}

export function getCarouselListIndex(offsetX: number, stride: number) {
  if (stride <= 0) return 0;
  return Math.round(offsetX / stride);
}

export type CarouselRecenterResult = {
  listIndex: number;
  realIndex: number;
  didRecenter: boolean;
};

/** Keep the user in the middle block so swipes always feel like 1→2→3→1. */
export function resolveCarouselPosition(
  listIndex: number,
  itemCount: number,
  repeatBlocks = CAROUSEL_REPEAT_BLOCKS,
): CarouselRecenterResult {
  if (itemCount <= 1) {
    return { listIndex: 0, realIndex: 0, didRecenter: false };
  }

  const realIndex = getCarouselRealIndex(listIndex, itemCount);
  const block = Math.floor(listIndex / itemCount);
  const safeLow = 3;
  const safeHigh = repeatBlocks - 4;

  if (block >= safeLow && block <= safeHigh) {
    return { listIndex, realIndex, didRecenter: false };
  }

  const middleBlock = getCarouselMiddleBlock(repeatBlocks);
  return {
    listIndex: middleBlock * itemCount + realIndex,
    realIndex,
    didRecenter: true,
  };
}
