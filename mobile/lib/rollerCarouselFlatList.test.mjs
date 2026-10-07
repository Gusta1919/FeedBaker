import {
  CAROUSEL_REPEAT_BLOCKS,
  getCarouselListIndex,
  getCarouselRealIndex,
  getCarouselStartIndex,
  resolveCarouselPosition,
} from "./carouselLoop.ts";
import {
  HALF_GAP,
  getCarouselLayout,
  offsetForLoopIndex,
} from "./rollerCarouselLogic.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function settleFlatListOffset(offsetX, itemCount, stride) {
  const listIndex = getCarouselListIndex(offsetX - HALF_GAP, stride);
  const resolved = resolveCarouselPosition(listIndex, itemCount);
  return {
    listIndex: resolved.listIndex,
    realIndex: resolved.realIndex,
    offset: offsetForLoopIndex(resolved.listIndex, stride),
    didRecenter: resolved.didRecenter,
  };
}

function simulateSwipeRight(state, layout, itemCount) {
  const nextListIndex = state.listIndex + 1;
  const noisyOffset = offsetForLoopIndex(nextListIndex, layout.stride) + 0.35;
  return settleFlatListOffset(noisyOffset, itemCount, layout.stride);
}

function simulateSwipeLeft(state, layout, itemCount) {
  const nextListIndex = state.listIndex - 1;
  const noisyOffset = offsetForLoopIndex(nextListIndex, layout.stride) - 0.25;
  return settleFlatListOffset(noisyOffset, itemCount, layout.stride);
}

function testFlatListInfiniteRightTwoItems() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const start = getCarouselStartIndex(itemCount);
  let state = settleFlatListOffset(offsetForLoopIndex(start, layout.stride), itemCount, layout.stride);

  const seen = [];
  for (let step = 0; step < 40; step++) {
    seen.push(state.realIndex);
    state = simulateSwipeRight(state, layout, itemCount);
    assert(
      Math.abs(state.offset - offsetForLoopIndex(state.listIndex, layout.stride)) < 0.001,
      `step ${step}: offset must match list index`,
    );
  }

  const expected = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 0 : 1)).join(",");
  assert(seen.join(",") === expected, "flat list right swipes should alternate 0/1");
}

function testFlatListInfiniteLeftTwoItems() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const start = getCarouselStartIndex(itemCount);
  let state = settleFlatListOffset(offsetForLoopIndex(start, layout.stride), itemCount, layout.stride);

  const seen = [];
  for (let step = 0; step < 40; step++) {
    seen.push(state.realIndex);
    state = simulateSwipeLeft(state, layout, itemCount);
  }

  const expected = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 0 : 1)).join(",");
  assert(seen.join(",") === expected, "flat list left swipes should alternate 0/1");
}

function testFlatListThreeItemCycle() {
  const layout = getCarouselLayout(402);
  const itemCount = 3;
  const start = getCarouselStartIndex(itemCount);
  let state = settleFlatListOffset(offsetForLoopIndex(start, layout.stride), itemCount, layout.stride);
  const sequence = [];

  for (let step = 0; step < 12; step++) {
    sequence.push(state.realIndex);
    state = simulateSwipeRight(state, layout, itemCount);
  }

  assert(sequence.join("") === "012012012012", `expected 012 cycle, got ${sequence.join("")}`);
}

function testFlatListRecenterPreservesRealIndex() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const nearEdge = 1;
  const settled = settleFlatListOffset(offsetForLoopIndex(nearEdge, layout.stride), itemCount, layout.stride);
  assert(settled.didRecenter, "near low edge should recenter");
  assert(settled.realIndex === getCarouselRealIndex(nearEdge, itemCount), "recenter keeps real index");

  const highEdge = CAROUSEL_REPEAT_BLOCKS * itemCount - 2;
  const settledHigh = settleFlatListOffset(
    offsetForLoopIndex(highEdge, layout.stride),
    itemCount,
    layout.stride,
  );
  assert(settledHigh.didRecenter, "near high edge should recenter");
  assert(
    settledHigh.realIndex === getCarouselRealIndex(highEdge, itemCount),
    "high recenter keeps real index",
  );
}

testFlatListInfiniteRightTwoItems();
testFlatListInfiniteLeftTwoItems();
testFlatListThreeItemCycle();
testFlatListRecenterPreservesRealIndex();

console.log("rollerCarouselFlatList tests passed");
