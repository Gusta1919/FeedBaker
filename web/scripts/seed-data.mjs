/**
 * Curated showcase polls — 10 realistic decisions with topic-matched Unsplash photos.
 * Reseed with `npm run seed:force` after changing URLs.
 */

const CREATORS = [
  { email: "demo@feedbacker.local", username: "demo" },
  { email: "marta@feedbacker.local", username: "marta_w" },
  { email: "tomek@feedbacker.local", username: "tomek_design" },
  { email: "kasia@feedbacker.local", username: "kasia_cooks" },
  { email: "ola@feedbacker.local", username: "ola_beauty" },
];

/** Unsplash crop tuned for portrait poll tiles */
function u(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?w=720&h=960&fit=crop&q=85&auto=format`;
}

export const SHOWCASE_POLLS = [
  {
    question: "Job interview tomorrow — which blazer reads more confident?",
    category: "Fashion",
    creator: "marta_w",
    options: [
      { label: "Navy structured", image: u("1785706873511-77e157860250") },
      { label: "Camel relaxed", image: u("1539533113208-f6df8cc8b543") },
      { label: "Classic black", image: u("1748290880596-2a2c80530bc0") },
    ],
  },
  {
    question: "First date at a nice restaurant — which dress?",
    category: "Fashion",
    creator: "marta_w",
    options: [
      { label: "Little black", image: u("1640262653856-126f61bf57ff") },
      { label: "Floral midi", image: u("1515372039744-b8f02a3ae446") },
    ],
  },
  {
    question: "Small living room — which sofa colour opens it up?",
    category: "Home",
    creator: "tomek_design",
    options: [
      { label: "Light grey linen", image: u("1583847268964-b28dc8f51f92") },
      { label: "Deep forest green", image: u("1555041469-a586c61ea9bc") },
      { label: "Warm sand beige", image: u("1560448204-e02f11c3d0e2") },
    ],
  },
  {
    question: "Bedroom accent wall — which mood do you want?",
    category: "Home",
    creator: "tomek_design",
    options: [
      { label: "Soft sage", image: u("1785706313879-241b6d545591") },
      { label: "Dusty rose", image: u("1615529328331-f8917597711f") },
      { label: "Warm charcoal", image: u("1611845242407-ca3cc476eade") },
      { label: "Deep navy", image: u("1773062177647-76cf543b1795") },
    ],
  },
  {
    question: "Gallery opening tonight — which outfit?",
    category: "Style",
    creator: "ola_beauty",
    options: [
      { label: "All black minimal", image: u("1627577279474-b87fe8490617") },
      { label: "Bold colour block", image: u("1773932546972-e12607f8ff15") },
      { label: "Classic tailored", image: u("1614786269829-d24616faf56d") },
    ],
  },
  {
    question: "Hosting brunch for eight — which table setup?",
    category: "Food",
    creator: "kasia_cooks",
    options: [
      { label: "All-white minimal", image: u("1532204182725-d0f67855ac87") },
      { label: "Rustic wood & linen", image: u("1606660023296-81d67734170a") },
    ],
  },
  {
    question: "Kitchen reno — which cabinet direction?",
    category: "Home",
    creator: "tomek_design",
    options: [
      { label: "Shaker white", image: u("1682888813913-e13f18692019") },
      { label: "Dark walnut", image: u("1610733374054-59454fe657cd") },
      { label: "Two-tone modern", image: u("1600489000022-c2086d79f9d4") },
    ],
  },
  {
    question: "Freelance portfolio — which hero feels more you?",
    category: "Design",
    creator: "demo",
    options: [
      { label: "Clean & typographic", image: u("1621606453029-5656bd7fa6c1") },
      { label: "Bold photo-led", image: u("1551288049-bebda4e38f71") },
    ],
  },
  {
    question: "Hinge main photo — which gets more matches?",
    category: "Social",
    creator: "ola_beauty",
    options: [
      { label: "Candid laugh", image: u("1494790108377-be9c29b29330") },
      { label: "Full body outdoors", image: u("1665934503306-868756e66966") },
      { label: "Close-up natural light", image: u("1544005313-94ddf0286df2") },
    ],
  },
  {
    question: "Winter capsule — invest in which coat?",
    category: "Fashion",
    creator: "marta_w",
    options: [
      { label: "Camel wool", image: u("1618333453296-9e35280fd6b1") },
      { label: "Black puffer", image: u("1611025504703-8c143abe6996") },
      { label: "Beige trench", image: u("1692180142575-c31fcd106b5b") },
    ],
  },
];

/** @deprecated Use SHOWCASE_POLLS — kept so older imports don't break */
export const SEED_POLLS = SHOWCASE_POLLS;

/** Fail fast if any showcase image URL is broken before seeding. */
export async function validateSeedUrls() {
  const urls = [
    ...new Set(
      SHOWCASE_POLLS.flatMap((poll) => poll.options.map((option) => option.image)),
    ),
  ];

  const failed = [];
  await Promise.all(
    urls.map(async (imageUrl) => {
      const response = await fetch(imageUrl, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
      });
      if (!response.ok && response.status !== 206) failed.push(imageUrl);
    }),
  );

  if (failed.length > 0) {
    throw new Error(
      `${failed.length} seed image URL(s) returned non-200:\n${failed.join("\n")}`,
    );
  }

  return urls.length;
}

export { CREATORS };
