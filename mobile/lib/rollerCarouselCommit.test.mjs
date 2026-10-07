import { getCarouselStartIndex } from "./carouselLoop.ts";
import {
  commitTargetFromDrag,
  tiltDistanceAtRest,
} from "./rollerCarouselCommit.ts";
import {
  getCarouselLayout,
  offsetForLoopIndex,
} from "./rollerCarouselLogic.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testCommitStaysOneStep() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const start = getCarouselStartIndex(itemCount);

  const small = commitTargetFromDrag(
    offsetForLoopIndex(start, layout.stride) + layout.stride * 0.1,
    start,
    itemCount,
    layout.stride,
  );
  assert(small.listIndex === start, "small drag should stay on same slide");

  const right = commitTargetFromDrag(
    offsetForLoopIndex(start, layout.stride) + layout.stride * 0.8,
    start,
    itemCount,
    layout.stride,
  );
  assert(right.listIndex === start + 1, "right drag should move one slide");

  const fling = commitTargetFromDrag(
    offsetForLoopIndex(start, layout.stride) + layout.stride * 3,
    start,
    itemCount,
    layout.stride,
  );
  assert(fling.listIndex === start + 1, "hard fling should still move one slide");
}

function testRestIsFlatForCenterItem() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const start = getCarouselStartIndex(itemCount);
  const committed = commitTargetFromDrag(
    offsetForLoopIndex(start, layout.stride) + layout.stride * 0.5,
    start,
    itemCount,
    layout.stride,
  );

  const distance = tiltDistanceAtRest(committed.offset, committed.listIndex, layout.stride);
  assert(Math.abs(distance) < 0.001, "committed center slide must have zero tilt distance");
}

function testInfiniteWrapCommit() {
  const layout = getCarouselLayout(390);
  const itemCount = 2;
  const start = getCarouselStartIndex(itemCount);

  let listIndex = start;
  for (let step = 0; step < 6; step++) {
    const committed = commitTargetFromDrag(
      offsetForLoopIndex(listIndex, layout.stride) + layout.stride * 0.7,
      listIndex,
      itemCount,
      layout.stride,
    );
    assert(
      Math.abs(tiltDistanceAtRest(committed.offset, committed.listIndex, layout.stride)) < 0.001,
      `step ${step}: rest must be flat`,
    );
    listIndex = committed.listIndex;
  }
}

function testSideItemHasTiltDistance() {
  const layout = getCarouselLayout(390);
  const center = getCarouselStartIndex(3);
  const side = center + 1;
  const offset = offsetForLoopIndex(center, layout.stride);
  const sideDistance = tiltDistanceAtRest(offset, side, layout.stride);
  assert(Math.abs(sideDistance) > layout.stride * 0.5, "side item should have large tilt distance");
}

testCommitStaysOneStep();
testRestIsFlatForCenterItem();
testInfiniteWrapCommit();
testSideItemHasTiltDistance();

console.log("rollerCarouselCommit tests passed");
