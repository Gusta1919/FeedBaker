const CAROUSEL_REPEAT_BLOCKS = 25;

function getCarouselMiddleBlock(repeatBlocks = CAROUSEL_REPEAT_BLOCKS) {
  return Math.floor(repeatBlocks / 2);
}

function getCarouselStartIndex(itemCount, repeatBlocks = CAROUSEL_REPEAT_BLOCKS) {
  if (itemCount <= 0) return 0;
  return getCarouselMiddleBlock(repeatBlocks) * itemCount;
}

function getCarouselRealIndex(listIndex, itemCount) {
  if (itemCount <= 0) return 0;
  return ((listIndex % itemCount) + itemCount) % itemCount;
}

function getCarouselListIndex(offsetX, stride) {
  if (stride <= 0) return 0;
  return Math.round(offsetX / stride);
}

function resolveCarouselPosition(listIndex, itemCount, repeatBlocks = CAROUSEL_REPEAT_BLOCKS) {
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testRecenterPreservesVisualDistance() {
  const itemCount = 3;
  const stride = 300;
  const middle = getCarouselStartIndex(itemCount);
  const scrollX = (middle + 2) * stride;

  for (let listIndex = middle - 2; listIndex <= middle + 4; listIndex++) {
    const before = scrollX - listIndex * stride;
    const resolved = resolveCarouselPosition(getCarouselListIndex(scrollX, stride), itemCount);
    const afterScrollX = resolved.listIndex * stride;
    const after = afterScrollX - listIndex * stride;
    assert(before === after, `visual distance changed for index ${listIndex}`);
  }
}

function testWrapIndices() {
  assert(getCarouselRealIndex(0, 3) === 0, "real index 0");
  assert(getCarouselRealIndex(2, 3) === 2, "real index 2");
  assert(getCarouselRealIndex(3, 3) === 0, "real index wrap");
  assert(getCarouselRealIndex(5, 3) === 2, "real index wrap 2");
}

function testRecenterNearEdges() {
  const itemCount = 3;
  const low = resolveCarouselPosition(1, itemCount);
  assert(low.didRecenter, "low block should recenter");
  assert(low.realIndex === 1, "low block keeps real index");
  assert(low.listIndex === getCarouselStartIndex(itemCount) + 1, "low block jumps to middle");

  const high = resolveCarouselPosition(CAROUSEL_REPEAT_BLOCKS * itemCount - 2, itemCount);
  assert(high.didRecenter, "high block should recenter");
  assert(high.realIndex === 1, "high block keeps real index");
}

function testAdjacentStepsAreUniform() {
  const itemCount = 3;
  const stride = 280;
  const start = getCarouselStartIndex(itemCount);

  for (let step = 0; step < itemCount; step++) {
    const from = (start + step) * stride;
    const to = (start + step + 1) * stride;
    assert(Math.abs(to - from) === stride, "each horizontal step uses one stride");
  }

  const wrapFrom = (start + 2) * stride;
  const wrapTo = (start + 3) * stride;
  assert(Math.abs(wrapTo - wrapFrom) === stride, "3→1 uses the same stride as 1→2");
}

testWrapIndices();
testRecenterNearEdges();
testRecenterPreservesVisualDistance();
testAdjacentStepsAreUniform();

console.log("carouselLoop tests passed");
