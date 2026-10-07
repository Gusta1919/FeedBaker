import { resolveCarouselPosition } from "./carouselLoop.ts";
import {
  HALF_GAP,
  offsetForLoopIndex,
} from "./rollerCarouselLogic.ts";

/** Minimum drag (as fraction of stride) to leave the current stage. */
export const STAGE_DRAG_RATIO = 0.15;

export type StageResult = {
  listIndex: number;
  realIndex: number;
  offset: number;
  didRecenter: boolean;
  step: -1 | 0 | 1;
};

export function realIndexFromListIndex(listIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return ((listIndex % itemCount) + itemCount) % itemCount;
}

/**
 * Snap to one of three stages: start-1, start, start+1.
 * Uses release position only (velocity ignored — it was causing wrong commits).
 *
 * With `- translationX` in the carousel:
 * - scrollX increased (finger moved left)  → next photo (step +1)
 * - scrollX decreased (finger moved right) → previous photo (step -1)
 */
export function resolveStageFromGesture(
  offsetX: number,
  _velocityX: number,
  stageListIndex: number,
  itemCount: number,
  stride: number,
  halfGap = HALF_GAP,
): StageResult {
  const centerOffset = offsetForLoopIndex(stageListIndex, stride, halfGap);
  const delta = offsetX - centerOffset;
  const dragThreshold = stride * STAGE_DRAG_RATIO;

  let step: -1 | 0 | 1 = 0;
  if (delta > dragThreshold) {
    step = 1;
  } else if (delta < -dragThreshold) {
    step = -1;
  }

  const targetListIndex = stageListIndex + step;
  const resolved = resolveCarouselPosition(targetListIndex, itemCount);

  return {
    listIndex: resolved.listIndex,
    realIndex: resolved.realIndex,
    offset: offsetForLoopIndex(resolved.listIndex, stride, halfGap),
    didRecenter: resolved.didRecenter,
    step,
  };
}

export function stageOffset(listIndex: number, stride: number, halfGap = HALF_GAP) {
  return offsetForLoopIndex(listIndex, stride, halfGap);
}

export function centerTiltDistance(
  scrollX: number,
  listIndex: number,
  stride: number,
  halfGap = HALF_GAP,
) {
  return scrollX - stageOffset(listIndex, stride, halfGap);
}

/** Mirror of RollerCarousel pan release math (for tests). */
export function scrollXAfterPan(
  stageListIndex: number,
  translationX: number,
  stride: number,
  halfGap = HALF_GAP,
) {
  const dragStartScrollX = offsetForLoopIndex(stageListIndex, stride, halfGap);
  const min = (stageListIndex - 1) * stride + halfGap;
  const max = (stageListIndex + 1) * stride + halfGap;
  const next = dragStartScrollX - translationX;
  return Math.min(Math.max(next, min), max);
}
