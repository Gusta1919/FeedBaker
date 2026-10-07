#!/usr/bin/env node
/**
 * Reset all votes & skips, then re-seed crowd votes on existing polls.
 * Your account can vote again; poll results stay populated for others.
 *
 *   npm run reset:votes
 *   npm run reset:votes -- --email demo@feedbacker.local   # one user only
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const emailArg = process.argv.find((arg) => arg.startsWith("--email="));
const singleEmail = emailArg?.split("=")[1] ?? null;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VOTER_COUNT = 24;

/** Login / creator accounts stay vote-free after reset. */
const CROWD_VOTE_EMAIL = /^voter\d+@feedbacker\.local$/;

async function listUsers() {
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
  return all;
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

async function resetOneUser(email) {
  const users = await listUsers();
  const user = users.find((row) => row.email === email);
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const { count: voteCount } = await supabase
    .from("votes")
    .delete({ count: "exact" })
    .eq("user_id", user.id);

  const { count: skipCount } = await supabase
    .from("poll_skips")
    .delete({ count: "exact" })
    .eq("user_id", user.id);

  console.log(
    `Reset ${email}: ${voteCount ?? 0} votes, ${skipCount ?? 0} skips removed.`,
  );
}

async function resetAllAndReseedCrowd() {
  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  const { count: skipCount } = await supabase
    .from("poll_skips")
    .select("*", { count: "exact", head: true });

  await supabase.from("votes").delete().gte("created_at", "1970-01-01T00:00:00Z");
  await supabase.from("poll_skips").delete().gte("created_at", "1970-01-01T00:00:00Z");

  console.log(
    `Cleared ${voteCount ?? 0} votes and ${skipCount ?? 0} skips.`,
  );

  const users = await listUsers();
  const voterIds = users
    .filter((user) => CROWD_VOTE_EMAIL.test(user.email ?? ""))
    .map((user) => user.id);

  if (voterIds.length === 0) {
    console.log("No demo voters found — run npm run seed first.");
    return;
  }

  const { data: polls } = await supabase
    .from("polls")
    .select("id, question")
    .eq("visibility", "public")
    .order("created_at", { ascending: true });

  if (!polls?.length) {
    console.log("No public polls to reseed. Run npm run seed:force.");
    return;
  }

  let reseeded = 0;

  for (const poll of polls) {
    const { data: options } = await supabase
      .from("poll_options")
      .select("id, sort_order")
      .eq("poll_id", poll.id)
      .order("sort_order", { ascending: true });

    if (!options?.length) continue;

    const optionIds = options.map((row) => row.id);
    const voteRows = buildVoteRows(poll.id, optionIds, voterIds);

    const { error } = await supabase.from("votes").insert(voteRows);
    if (error) {
      console.error(`Votes failed for poll ${poll.id}:`, error.message);
      continue;
    }

    reseeded += 1;
  }

  console.log(`Reseeded crowd votes on ${reseeded} polls. You can vote again.`);
}

async function main() {
  console.log("Resetting votes at", url);

  if (singleEmail) {
    await resetOneUser(singleEmail);
    return;
  }

  await resetAllAndReseedCrowd();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
