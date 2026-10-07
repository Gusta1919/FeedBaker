import {
  HALF_GAP,
  canReachLoopIndex,
  getCarouselLayout,
  isItemCentered,
  loopIndexFromOffset,
  offsetForLoopIndex,
  realIndexFromLoopIndex,
  settleCarouselOffset,
  snapOffsets,
  tiltDistance,
} from "./rollerCarouselLogic.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testCenteringForTwoItems() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const slots = itemCount + 2;

  for (let loopIndex = 0; loopIndex < slots; loopIndex++) {
    const offset = offsetForLoopIndex(loopIndex, layout.stride);
    assert(
      isItemCentered(layout, loopIndex, offset),
      `loop ${loopIndex} should center at offset ${offset}`,
    );
    assert(
      Math.abs(tiltDistance(offset, loopIndex, layout.stride)) < 0.001,
      `tilt distance should be zero at rest for loop ${loopIndex}`,
    );
  }
}

function testTailCloneReachable() {
  for (const width of [360, 390, 402, 430]) {
    const layout = getCarouselLayout(width);
    const itemCount = 2;
    const slots = itemCount + 2;
    const tailIndex = itemCount + 1;
    assert(
      canReachLoopIndex(layout, tailIndex, slots),
      `width ${width}: tail clone must be reachable`,
    );
  }
}

function simulateSwipeRight(state, layout, itemCount) {
  const nextLoopIndex = state.loopIndex + 1;
  const noisyOffset = offsetForLoopIndex(nextLoopIndex, layout.stride) + 0.35;
  return settleCarouselOffset(noisyOffset, itemCount, layout.stride);
}

function simulateSwipeLeft(state, layout, itemCount) {
  const nextLoopIndex = state.loopIndex - 1;
  const noisyOffset = offsetForLoopIndex(nextLoopIndex, layout.stride) - 0.25;
  return settleCarouselOffset(noisyOffset, itemCount, layout.stride);
}

function testInfiniteRightTwoItems() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  let state = settleCarouselOffset(offsetForLoopIndex(1, layout.stride), itemCount, layout.stride);

  const seen = [];
  for (let step = 0; step < 30; step++) {
    seen.push(state.realIndex);
    state = simulateSwipeRight(state, layout, itemCount);
    assert(
      Math.abs(tiltDistance(state.offset, state.loopIndex, layout.stride)) < 0.001,
      `step ${step}: settled offset must be flat`,
    );
    assert(
      isItemCentered(layout, state.loopIndex, state.offset),
      `step ${step}: settled item must be centered`,
    );
  }

  assert(seen.join(",") === "0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1", "right swipes should alternate indices");
}

function testInfiniteLeftTwoItems() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  let state = settleCarouselOffset(offsetForLoopIndex(1, layout.stride), itemCount, layout.stride);

  const seen = [];
  for (let step = 0; step < 30; step++) {
    seen.push(state.realIndex);
    state = simulateSwipeLeft(state, layout, itemCount);
    assert(
      Math.abs(tiltDistance(state.offset, state.loopIndex, layout.stride)) < 0.001,
      `left step ${step}: settled offset must be flat`,
    );
  }

  assert(seen.join(",") === "0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1", "left swipes should alternate indices");
}

function testThreeItemWrap() {
  const layout = getCarouselLayout(402);
  const itemCount = 3;
  let state = settleCarouselOffset(offsetForLoopIndex(1, layout.stride), itemCount, layout.stride);
  const sequence = [];

  for (let step = 0; step < 9; step++) {
    sequence.push(state.realIndex);
    state = simulateSwipeRight(state, layout, itemCount);
  }

  assert(sequence.join("") === "012012012", `3-item wrap expected 012 cycle, got ${sequence.join("")}`);
}

function testMisalignedSnapGetsCorrected() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const drifted = offsetForLoopIndex(2, layout.stride) + 7;
  const settled = settleCarouselOffset(drifted, itemCount, layout.stride);

  assert(settled.realIndex === 1, "drifted offset on real item 2 should settle as index 1");
  assert(settled.didJump === true, "drifted offset should require correction");
  assert(
    Math.abs(tiltDistance(settled.offset, settled.loopIndex, layout.stride)) < 0.001,
    "corrected offset must be flat",
  );
}

function testBoundaryJumpPreservesRealIndex() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;

  const tail = settleCarouselOffset(
    offsetForLoopIndex(itemCount + 1, layout.stride),
    itemCount,
    layout.stride,
  );
  assert(tail.realIndex === 0, "tail clone should jump to first item");
  assert(tail.loopIndex === 1, "tail clone should jump to loop index 1");

  const head = settleCarouselOffset(offsetForLoopIndex(0, layout.stride), itemCount, layout.stride);
  assert(head.realIndex === 1, "head clone should jump to last item");
  assert(head.loopIndex === itemCount, "head clone should jump to last real slot");
}

function testSnapOffsetsLength() {
  const layout = getCarouselLayout(390);
  assert(snapOffsets(2, layout.stride).length === 4, "two-item carousel has four slots");
  assert(snapOffsets(3, layout.stride).length === 5, "three-item carousel has five slots");
}

function testLoopIndexRoundTrip() {
  const layout = getCarouselLayout(390);
  for (let loopIndex = 0; loopIndex < 4; loopIndex++) {
    const offset = offsetForLoopIndex(loopIndex, layout.stride);
    assert(
      loopIndexFromOffset(offset, layout.stride) === loopIndex,
      `round trip failed for loop ${loopIndex}`,
    );
    assert(
      realIndexFromLoopIndex(loopIndex, 2) === (loopIndex === 0 ? 1 : loopIndex === 3 ? 0 : loopIndex - 1),
      `real index mapping failed for loop ${loopIndex}`,
    );
  }
}

function testNoHalfGapRegression() {
  const layout = getCarouselLayout(390);
  const wrongOffset = offsetForLoopIndex(1, layout.stride) - HALF_GAP;
  const distance = tiltDistance(wrongOffset, 1, layout.stride);
  assert(Math.abs(distance) > 1, "old offset math should produce visible tilt");
}

testCenteringForTwoItems();
testTailCloneReachable();
testInfiniteRightTwoItems();
testInfiniteLeftTwoItems();
testThreeItemWrap();
testMisalignedSnapGetsCorrected();
testBoundaryJumpPreservesRealIndex();
testSnapOffsetsLength();
testLoopIndexRoundTrip();
testNoHalfGapRegression();

console.log("rollerCarouselLogic tests passed");
