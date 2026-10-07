import { getCarouselStartIndex } from "./carouselLoop.ts";
import { commitTargetFromDrag, tiltDistanceAtRest } from "./rollerCarouselCommit.ts";
import {
  getCarouselLayout,
  HALF_GAP,
  offsetForLoopIndex,
} from "./rollerCarouselLogic.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function simulateGesture({ layout, itemCount, startListIndex, dragDeltaRatio, velocityX }) {
  let dragStartListIndex = startListIndex;
  let scrollX = offsetForLoopIndex(dragStartListIndex, layout.stride);
  let committedGesture = false;
  let lastRealIndex = -1;

  const beginDrag = () => {
    committedGesture = false;
    dragStartListIndex = Math.round((scrollX - HALF_GAP) / layout.stride);
  };

  const endDrag = () => {
    scrollX = offsetForLoopIndex(dragStartListIndex, layout.stride) + layout.stride * dragDeltaRatio;
    if (Math.abs(velocityX) < 0.05) {
      applyCommit(scrollX);
    }
  };

  const momentumEnd = () => {
    applyCommit(scrollX);
  };

  const applyCommit = (offsetX) => {
    if (committedGesture) return;
    committedGesture = true;

    const committed = commitTargetFromDrag(
      offsetX,
      dragStartListIndex,
      itemCount,
      layout.stride,
    );

    scrollX = committed.offset;
    dragStartListIndex = committed.listIndex;
    lastRealIndex = committed.realIndex;
  };

  beginDrag();
  endDrag();
  if (Math.abs(velocityX) >= 0.05) {
    momentumEnd();
  }

  return {
    scrollX,
    listIndex: dragStartListIndex,
    realIndex: lastRealIndex,
    flat: Math.abs(tiltDistanceAtRest(scrollX, dragStartListIndex, layout.stride)) < 0.001,
  };
}

function testSlowDragCommitIsFlat() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const start = getCarouselStartIndex(itemCount);

  const stay = simulateGesture({
    layout,
    itemCount,
    startListIndex: start,
    dragDeltaRatio: 0.1,
    velocityX: 0,
  });
  assert(stay.flat, "slow small drag must end flat");
  assert(stay.realIndex === 0, "small drag stays on first slide");

  const next = simulateGesture({
    layout,
    itemCount,
    startListIndex: start,
    dragDeltaRatio: 0.55,
    velocityX: 0,
  });
  assert(next.flat, "slow right drag must end flat");
  assert(next.realIndex === 1, "slow right drag moves one slide");
}

function testFlingCommitIsFlatAndOneStep() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const start = getCarouselStartIndex(itemCount);

  const fling = simulateGesture({
    layout,
    itemCount,
    startListIndex: start,
    dragDeltaRatio: 2.5,
    velocityX: 1.2,
  });
  assert(fling.flat, "fling must end flat");
  assert(fling.realIndex === 1, "fling must commit only one slide");
}

function testDoubleCommitGuard() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const start = getCarouselStartIndex(itemCount);
  let dragStartListIndex = start;
  let scrollX = offsetForLoopIndex(start, layout.stride);
  let committedGesture = false;
  let commits = 0;

  const applyCommit = (offsetX) => {
    if (committedGesture) return;
    committedGesture = true;
    commits += 1;
    const committed = commitTargetFromDrag(
      offsetX,
      dragStartListIndex,
      itemCount,
      layout.stride,
    );
    scrollX = committed.offset;
    dragStartListIndex = committed.listIndex;
  };

  committedGesture = false;
  scrollX = offsetForLoopIndex(start, layout.stride) + layout.stride * 0.6;
  applyCommit(scrollX);
  applyCommit(scrollX + 100);

  assert(commits === 1, "second commit in same gesture must be ignored");
  assert(
    Math.abs(tiltDistanceAtRest(scrollX, dragStartListIndex, layout.stride)) < 0.001,
    "single commit must stay flat",
  );
}

testSlowDragCommitIsFlat();
testFlingCommitIsFlatAndOneStep();
testDoubleCommitGuard();

console.log("rollerCarouselGesture tests passed");
