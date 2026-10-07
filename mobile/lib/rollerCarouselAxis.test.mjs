import {
  CAROUSEL_ACTIVE_OFFSET_X,
  CAROUSEL_FAIL_OFFSET_Y,
  resolveCarouselAxis,
} from "./rollerCarouselAxis.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  resolveCarouselAxis(0, -16) === "vertical",
  "swipe down should prefer feed scroll",
);
assert(
  resolveCarouselAxis(0, 18) === "vertical",
  "swipe up should prefer feed scroll",
);
assert(
  resolveCarouselAxis(-20, 4) === "horizontal",
  "swipe left should prefer carousel",
);
assert(
  resolveCarouselAxis(20, 4) === "horizontal",
  "swipe right should prefer carousel",
);
assert(
  resolveCarouselAxis(8, 8) === "pending",
  "small diagonal should stay pending",
);
assert(
  resolveCarouselAxis(16, 12) === "horizontal",
  "mostly horizontal diagonal should activate carousel",
);
assert(
  resolveCarouselAxis(12, 14) === "vertical",
  "mostly vertical diagonal should activate feed",
);

assert(CAROUSEL_ACTIVE_OFFSET_X > CAROUSEL_FAIL_OFFSET_Y, "axis constants tuned");

console.log("rollerCarouselAxis tests passed");
