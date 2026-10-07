import { createClient } from "@/lib/supabase/client";
import {
  compressImageForAvatar,
  compressImageForUpload,
} from "@/lib/upload/compress-image";

export type UploadResult = { url: string } | { error: string };

const MAX_RAW_BYTES = 25 * 1024 * 1024;

async function uploadImage(
  prepared: File,
  path: string,
  upsert: boolean,
): Promise<UploadResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Log in again." };
  }

  const direct = await supabase.storage.from("poll-images").upload(path, prepared, {
    contentType: prepared.type,
    cacheControl: "3600",
    upsert,
  });

  if (!direct.error) {
    const {
      data: { publicUrl },
    } = supabase.storage.from("poll-images").getPublicUrl(path);
    return { url: upsert ? `${publicUrl}?v=${Date.now()}` : publicUrl };
  }

  try {
    const body = new FormData();
    body.append("file", prepared);
    if (upsert) body.append("upsert", "1");
    body.append("path", path);

    const response = await fetch("/api/upload", { method: "POST", body });
    const payload = (await response.json()) as { url?: string; error?: string };

    if (response.ok && payload.url) return { url: payload.url };
    return { error: payload.error ?? direct.error.message };
  } catch {
    return { error: "Upload failed. Check your connection and try again." };
  }
}

export async function uploadPollImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    return { error: "That file isn't an image." };
  }

  if (file.size > MAX_RAW_BYTES) {
    return { error: "That photo is huge — pick one under 25 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Log in again." };
  }

  let prepared: File;
  try {
    prepared = await compressImageForUpload(file);
  } catch {
    return {
      error:
        "Couldn't read that image. HEIC photos often fail — try exporting as JPG.",
    };
  }

  const path = `${user.id}/${crypto.randomUUID()}.jpg`;

  return uploadImage(prepared, path, false);
}

export async function uploadAvatarImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
    return { error: "That file isn't an image." };
  }

  if (file.size > MAX_RAW_BYTES) {
    return { error: "That photo is huge — pick one under 25 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Log in again." };
  }

  let prepared: File;
  try {
    prepared = await compressImageForAvatar(file);
  } catch {
    return {
      error:
        "Couldn't read that image. HEIC photos often fail — try exporting as JPG.",
    };
  }

  const path = `${user.id}/avatar.jpg`;
  return uploadImage(prepared, path, true);
}
