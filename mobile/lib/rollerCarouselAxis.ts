/** Horizontal movement (px) before carousel pan may activate. */
export const CAROUSEL_ACTIVE_OFFSET_X = 14;

/** Vertical movement (px) that cancels carousel pan in favour of feed scroll. */
export const CAROUSEL_FAIL_OFFSET_Y = 11;

export type CarouselAxisDecision = "pending" | "horizontal" | "vertical";

/**
 * Mirrors RNGH Pan activeOffsetX / failOffsetY intent for tests.
 * Feed scroll wins when vertical movement dominates early.
 */
export function resolveCarouselAxis(
  dx: number,
  dy: number,
  activeOffsetX = CAROUSEL_ACTIVE_OFFSET_X,
  failOffsetY = CAROUSEL_FAIL_OFFSET_Y,
): CarouselAxisDecision {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (ady >= failOffsetY && ady > adx * 0.92) {
    return "vertical";
  }

  if (adx >= activeOffsetX && adx > ady * 1.12) {
    return "horizontal";
  }

  return "pending";
}
