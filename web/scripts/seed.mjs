#!/usr/bin/env node
/**
 * Seed Feedbacker with 10 curated showcase polls + realistic vote counts.
 *
 *   npm run seed          # skip if showcase polls exist
 *   npm run seed:force    # wipe demo polls, votes, skips — fresh feed
 */

import { createClient } from "@supabase/supabase-js";
import { CREATORS, SHOWCASE_POLLS, validateSeedUrls } from "./seed-data.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const force = process.argv.includes("--force");

/** Default password for seeded demo accounts (local dev only). */
const DEMO_PASSWORD = "demo123456";

const VOTER_COUNT = 24;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Percentages show only after you vote — same for every showcase poll. */
const SHOWCASE_RESULTS_POLICY = "voters_only";

let userCache = null;

async function listUsers() {
  if (userCache) return userCache;
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < 200) break;
  }
  userCache = all;
  return all;
}

async function getOrCreateUser({ email, username }) {
  const users = await listUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
    });
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) throw new Error(`User ${email}: ${error.message}`);

  userCache?.push(data.user);
  await supabase.from("profiles").upsert({ id: data.user.id, username });
  return data.user.id;
}

async function clearAllPolls() {
  const { data: polls } = await supabase.from("polls").select("id");

  if (!polls?.length) return;

  const pollIds = polls.map((p) => p.id);
  await supabase.from("votes").delete().in("poll_id", pollIds);
  await supabase.from("poll_skips").delete().in("poll_id", pollIds);
  await supabase.from("poll_options").delete().in("poll_id", pollIds);
  await supabase.from("polls").delete().in("id", pollIds);
  console.log(`Cleared ${pollIds.length} polls from the database.`);
}

/** Wipe votes & skips so every account gets a full feed again. */
async function resetEngagement() {
  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  const { count: skipCount } = await supabase
    .from("poll_skips")
    .select("*", { count: "exact", head: true });

  // Supabase requires a filter on delete — match everything.
  await supabase.from("votes").delete().gte("created_at", "1970-01-01T00:00:00Z");
  await supabase.from("poll_skips").delete().gte("created_at", "1970-01-01T00:00:00Z");

  console.log(
    `Reset engagement: ${voteCount ?? 0} votes, ${skipCount ?? 0} skips removed.`,
  );
}

function buildVoteRows(pollId, optionIds, voterIds) {
  const weights = optionIds.map(() => 0.25 + Math.random());
  const favourite = Math.floor(Math.random() * optionIds.length);
  weights[favourite] += 1.15;
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const voterPool = [...voterIds].sort(() => Math.random() - 0.5);
  const voteCount = Math.min(
    voterPool.length,
    12 + Math.floor(Math.random() * 28),
  );

  return voterPool.slice(0, voteCount).map((voterId) => {
    let roll = Math.random() * totalWeight;
    let chosen = optionIds[optionIds.length - 1];

    for (let i = 0; i < optionIds.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        chosen = optionIds[i];
        break;
      }
    }

    return { poll_id: pollId, option_id: chosen, user_id: voterId };
  });
}

async function seed() {
  console.log("Seeding Feedbacker showcase at", url);

  const urlCount = await validateSeedUrls();
  console.log(`✓ ${urlCount} showcase image URLs verified`);

  const creatorMap = {};
  for (const creator of CREATORS) {
    creatorMap[creator.username] = await getOrCreateUser(creator);
  }

  const voterIds = [...Object.values(creatorMap)];
  for (let i = 1; i <= VOTER_COUNT; i += 1) {
    voterIds.push(
      await getOrCreateUser({
        email: `voter${i}@feedbacker.local`,
        username: `voter_${i}`,
      }),
    );
  }
  console.log(`${voterIds.length} demo accounts ready.`);

  const creatorIds = Object.values(creatorMap);

  if (force) {
    await clearAllPolls();
    await resetEngagement();
  } else {
    const { count } = await supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .in("creator_id", creatorIds);

    if ((count ?? 0) >= SHOWCASE_POLLS.length) {
      console.log(`${count} showcase polls exist. Use: npm run seed:force`);
      return;
    }
  }

  let created = 0;

  for (const seedPoll of SHOWCASE_POLLS) {
    const creatorId = creatorMap[seedPoll.creator];
    if (!creatorId) continue;

    const { data: poll, error } = await supabase
      .from("polls")
      .insert({
        creator_id: creatorId,
        question: seedPoll.question,
        category: seedPoll.category,
        visibility: "public",
        results_policy: SHOWCASE_RESULTS_POLICY,
        results_threshold: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Poll failed:", seedPoll.question, error.message);
      continue;
    }

    const { data: insertedOptions, error: optError } = await supabase
      .from("poll_options")
      .insert(
        seedPoll.options.map((opt, i) => ({
          poll_id: poll.id,
          label: opt.label,
          image_url: opt.image,
          sort_order: i,
        })),
      )
      .select("id, sort_order");

    if (optError) {
      console.error("Options failed:", optError.message);
      continue;
    }

    const optionIds = insertedOptions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => o.id);

    const voteRows = buildVoteRows(poll.id, optionIds, voterIds);
    const { error: voteError } = await supabase.from("votes").upsert(voteRows, {
      onConflict: "poll_id,user_id",
      ignoreDuplicates: true,
    });

    if (voteError) console.error("Votes failed:", voteError.message);

    created += 1;
    console.log(
      `✓ [${seedPoll.category}] ${seedPoll.question.slice(0, 52)}… — ${voteRows.length} votes`,
    );
  }

  console.log(`\nDone — ${created} showcase polls. Open http://localhost:3000/feed`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
