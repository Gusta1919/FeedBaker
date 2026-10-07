import { getCarouselStartIndex } from "./carouselLoop.ts";
import { getCarouselLayout } from "./rollerCarouselLogic.ts";
import {
  centerTiltDistance,
  resolveStageFromGesture,
  scrollXAfterPan,
  stageOffset,
} from "./rollerCarouselStages.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testOneStagePerGesture() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const stage = getCarouselStartIndex(itemCount);

  const stay = resolveStageFromGesture(
    stageOffset(stage, layout.stride) + layout.stride * 0.04,
    0,
    stage,
    itemCount,
    layout.stride,
  );
  assert(stay.step === 0 && stay.realIndex === 0, "tiny drag stays on stage 0");

  const swipeLeft = resolveStageFromGesture(
    stageOffset(stage, layout.stride) + layout.stride * 0.2,
    0,
    stage,
    itemCount,
    layout.stride,
  );
  assert(swipeLeft.step === 1 && swipeLeft.realIndex === 1, "swipe left → next photo");

  const swipeRight = resolveStageFromGesture(
    stageOffset(stage, layout.stride) - layout.stride * 0.2,
    0,
    stage,
    itemCount,
    layout.stride,
  );
  assert(swipeRight.step === -1 && swipeRight.realIndex === 2, "swipe right → previous photo");

  const hugeFling = resolveStageFromGesture(
    stageOffset(stage, layout.stride) + layout.stride * 2.5,
    900,
    stage,
    itemCount,
    layout.stride,
  );
  assert(hugeFling.step === 1 && hugeFling.realIndex === 1, "large offset still one stage");
}

function testPanSimulationBothDirections() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  let stage = getCarouselStartIndex(itemCount);

  const leftRelease = scrollXAfterPan(stage, -layout.stride * 0.35, layout.stride);
  const left = resolveStageFromGesture(leftRelease, 0, stage, itemCount, layout.stride);
  assert(left.realIndex === 1, "pan left from 0 → photo 1");
  stage = left.listIndex;

  const rightRelease = scrollXAfterPan(stage, layout.stride * 0.35, layout.stride);
  const right = resolveStageFromGesture(rightRelease, 0, stage, itemCount, layout.stride);
  assert(right.realIndex === 0, "pan right back → photo 0");
  stage = right.listIndex;

  const rightAgain = scrollXAfterPan(stage, layout.stride * 0.35, layout.stride);
  const next = resolveStageFromGesture(rightAgain, 0, stage, itemCount, layout.stride);
  assert(next.realIndex === 2, "pan right from 0 → photo 2");
  stage = next.listIndex;

  const leftAgain = scrollXAfterPan(stage, -layout.stride * 0.35, layout.stride);
  const back = resolveStageFromGesture(leftAgain, 0, stage, itemCount, layout.stride);
  assert(back.realIndex === 0, "pan left back → photo 0");
}

function testVelocityDoesNotOverrideDrag() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  const stage = getCarouselStartIndex(itemCount);
  const atCenter = stageOffset(stage, layout.stride);

  const wrongVelocity = resolveStageFromGesture(
    atCenter - layout.stride * 0.25,
    -900,
    stage,
    itemCount,
    layout.stride,
  );
  assert(
    wrongVelocity.step === -1 && wrongVelocity.realIndex === 2,
    "right drag stays previous even with opposite velocity",
  );
}

function testEveryStageRestIsFlat() {
  const layout = getCarouselLayout(390);
  const itemCount = 3;
  let stage = getCarouselStartIndex(itemCount);

  for (let i = 0; i < 9; i++) {
    const offset = stageOffset(stage, layout.stride);
    assert(
      Math.abs(centerTiltDistance(offset, stage, layout.stride)) < 0.001,
      `stage ${i} must be flat at rest`,
    );
    const next = resolveStageFromGesture(
      offset + layout.stride * 0.5,
      0,
      stage,
      itemCount,
      layout.stride,
    );
    stage = next.listIndex;
  }
}

function testAlternateDirectionsCycle() {
  const layout = getCarouselLayout(402);
  const itemCount = 3;
  let stage = getCarouselStartIndex(itemCount);
  const sequence = [0];

  for (let i = 0; i < 6; i++) {
    const translationX = i % 2 === 0 ? -layout.stride * 0.35 : layout.stride * 0.35;
    const release = scrollXAfterPan(stage, translationX, layout.stride);
    const next = resolveStageFromGesture(release, 0, stage, itemCount, layout.stride);
    sequence.push(next.realIndex);
    stage = next.listIndex;
  }

  assert(sequence.join(",") === "0,1,0,1,0,1,0", `unexpected cycle: ${sequence.join(",")}`);
}

testOneStagePerGesture();
testPanSimulationBothDirections();
testVelocityDoesNotOverrideDrag();
testEveryStageRestIsFlat();
testAlternateDirectionsCycle();

console.log("rollerCarouselStages tests passed");
