import { resolveCarouselPosition } from "./carouselLoop.ts";
import {
  HALF_GAP,
  offsetForLoopIndex,
} from "./rollerCarouselLogic.ts";

export const SWIPE_COMMIT_RATIO = 0.18;

export type CommitPageResult = {
  listIndex: number;
  realIndex: number;
  offset: number;
  didRecenter: boolean;
};

export function commitTargetFromDrag(
  offsetX: number,
  dragStartListIndex: number,
  itemCount: number,
  stride: number,
  halfGap = HALF_GAP,
): CommitPageResult {
  const startOffset = offsetForLoopIndex(dragStartListIndex, stride, halfGap);
  const delta = offsetX - startOffset;
  const threshold = stride * SWIPE_COMMIT_RATIO;

  let targetListIndex = dragStartListIndex;
  if (delta > threshold) targetListIndex = dragStartListIndex + 1;
  else if (delta < -threshold) targetListIndex = dragStartListIndex - 1;

  const resolved = resolveCarouselPosition(targetListIndex, itemCount);
  return {
    listIndex: resolved.listIndex,
    realIndex: resolved.realIndex,
    offset: offsetForLoopIndex(resolved.listIndex, stride, halfGap),
    didRecenter: resolved.didRecenter,
  };
}

export function tiltDistanceAtRest(
  scrollX: number,
  listIndex: number,
  stride: number,
  halfGap = HALF_GAP,
) {
  return scrollX - offsetForLoopIndex(listIndex, stride, halfGap);
}

export function shouldApplySideTilt(
  scrollX: number,
  listIndex: number,
  stride: number,
  halfGap = HALF_GAP,
) {
  const flatZone = stride * 0.1;
  return Math.abs(tiltDistanceAtRest(scrollX, listIndex, stride, halfGap)) >= flatZone;
}
