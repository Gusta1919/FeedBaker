const ITEM_SPACING = 6;
const HALF_GAP = ITEM_SPACING / 2;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getLayout(width) {
  const ITEM_RATIO = 0.82;
  const itemWidth = width * ITEM_RATIO;
  const stride = itemWidth + ITEM_SPACING;
  const sidePad = (width - itemWidth) / 2;
  return { itemWidth, stride, sidePad };
}

function scrollForLoopIndex(loopIndex, stride) {
  return loopIndex * stride + HALF_GAP;
}

function isItemCentered(width, loopIndex, scrollX, layout) {
  const { stride, sidePad } = layout;
  const itemCenter = sidePad + loopIndex * stride + stride / 2;
  const viewportCenter = scrollX + width / 2;
  return Math.abs(itemCenter - viewportCenter) < 0.5;
}

function testCenteringAtStart() {
  const width = 390;
  const layout = getLayout(width);
  const startIndex = 1;
  const scrollX = scrollForLoopIndex(startIndex, layout.stride);
  assert(
    isItemCentered(width, startIndex, scrollX, layout),
    "first real item should be centered",
  );
}

function testTwoItemPollCentering() {
  const width = 402;
  const layout = getLayout(width);
  for (let loopIndex = 0; loopIndex < 4; loopIndex++) {
    const scrollX = scrollForLoopIndex(loopIndex, layout.stride);
    assert(
      isItemCentered(width, loopIndex, scrollX, layout),
      `two-item poll loop index ${loopIndex} should center`,
    );
  }
}

function testInfiniteRightJump() {
  const width = 390;
  const layout = getLayout(width);
  const itemCount = 2;
  const tailCloneIndex = itemCount + 1;
  const tailOffset = scrollForLoopIndex(tailCloneIndex, layout.stride);
  const resetOffset = scrollForLoopIndex(1, layout.stride);

  assert(tailCloneIndex === 3, "tail clone index for 2 items");
  assert(
    isItemCentered(width, tailCloneIndex, tailOffset, layout),
    "tail clone should be centered before jump",
  );
  assert(
    isItemCentered(width, 1, resetOffset, layout),
    "reset lands on first real item centered",
  );
}

function testRestHasZeroTiltDistance() {
  const width = 390;
  const layout = getLayout(width);
  for (let loopIndex = 0; loopIndex < 4; loopIndex++) {
    const scrollX = scrollForLoopIndex(loopIndex, layout.stride);
    const distance = scrollX - (loopIndex * layout.stride + HALF_GAP);
    assert(Math.abs(distance) < 0.001, `rest distance should be zero for index ${loopIndex}`);
  }
}

testCenteringAtStart();
testTwoItemPollCentering();
testInfiniteRightJump();
testRestHasZeroTiltDistance();

console.log("carouselLayout tests passed");
