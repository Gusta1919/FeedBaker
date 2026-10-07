"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserVoteInsights } from "@/lib/polls/queries";
import { generateInviteCode } from "@/lib/polls/utils";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  type PollVisibility,
  type VoteInsights,
} from "@/types/poll";

const UNIQUE_VIOLATION = "23505";

export type ActionResult = {
  ok: boolean;
  error?: string;
  pollId?: string;
  inviteCode?: string | null;
  insights?: VoteInsights;
};

export async function fetchVoteInsights(): Promise<VoteInsights | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return getUserVoteInsights(user.id);
}

export async function voteOnPoll(
  pollId: string,
  optionId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in to vote." };

  const { data: option } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();

  if (!option) return { ok: false, error: "That option no longer exists." };

  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "You already voted on this one." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/my-stats");
  revalidatePath("/my-polls");
  revalidatePath("/profile");
  revalidatePath("/feed");

  const insights = await getUserVoteInsights(user.id);
  return { ok: true, insights };
}

export async function skipPoll(pollId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in first." };

  const { error } = await supabase
    .from("poll_skips")
    .upsert(
      { poll_id: pollId, user_id: user.id },
      { onConflict: "poll_id,user_id", ignoreDuplicates: true },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

type CreatePollInput = {
  question: string;
  category: string;
  visibility: PollVisibility;
  options: { label: string; imageUrl: string }[];
};

export async function createPoll(
  input: CreatePollInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in to create a poll." };

  const question = input.question.trim();
  if (question.length < 3) {
    return { ok: false, error: "Write a question first." };
  }
  if (question.length > 200) {
    return { ok: false, error: "Question is too long (max 200 characters)." };
  }

  const options = input.options.filter((option) => option.imageUrl);
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return {
      ok: false,
      error: `Add between ${MIN_OPTIONS} and ${MAX_OPTIONS} photos.`,
    };
  }

  const inviteCode =
    input.visibility === "private" ? generateInviteCode() : null;

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      creator_id: user.id,
      question,
      category: input.category,
      visibility: input.visibility,
      results_policy: "voters_only",
      results_threshold: null,
      invite_code: inviteCode,
    })
    .select("id")
    .single();

  if (pollError || !poll) {
    return { ok: false, error: pollError?.message ?? "Could not save poll." };
  }

  const { error: optionsError } = await supabase.from("poll_options").insert(
    options.map((option, index) => ({
      poll_id: poll.id,
      label: option.label.trim().slice(0, 60),
      image_url: option.imageUrl,
      sort_order: index,
    })),
  );

  if (optionsError) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { ok: false, error: optionsError.message };
  }

  revalidatePath("/feed");
  revalidatePath("/my-stats");
  revalidatePath("/my-polls");
  revalidatePath("/profile");

  return { ok: true, pollId: poll.id, inviteCode };
}

export async function deletePoll(pollId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in first." };

  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", pollId)
    .eq("creator_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/my-stats");
  revalidatePath("/my-polls");
  revalidatePath("/profile");
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateUsername(username: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in first." };

  const trimmed = username.trim().replace(/^@+/, "");

  if (!/^[a-zA-Z0-9._-]{2,24}$/.test(trimmed)) {
    return {
      ok: false,
      error: "2–24 characters: letters, numbers, dot, dash, underscore.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username: trimmed });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "That username is taken." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/my-stats");
  revalidatePath("/my-polls");
  revalidatePath("/profile");
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateAvatarUrl(avatarUrl: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Log in first." };

  if (!avatarUrl.startsWith("http")) {
    return { ok: false, error: "Invalid image URL." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id)
    : await supabase.from("profiles").insert({
        id: user.id,
        avatar_url: avatarUrl,
      });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/my-stats");
  revalidatePath("/my-polls");
  revalidatePath("/profile");
  revalidatePath("/feed");
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
