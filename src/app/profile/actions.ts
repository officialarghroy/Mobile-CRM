"use server";

import { revalidatePath } from "next/cache";
import { Buffer } from "node:buffer";
import { ensureAvatarsBucket } from "@/lib/ensureAvatarsBucket";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function updateMyDisplayName(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("You must be signed in.");
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { name: displayName },
  });

  if (metaError) {
    throw new Error(metaError.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/calendar", "page");
}

const AVATAR_MAX_BYTES = 2_000_000;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadMyAvatar(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("You must be signed in.");
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image to upload.");
  }
  if (!AVATAR_TYPES.has(file.type)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("Image must be under 2 MB.");
  }

  const admin = createSupabaseAdmin();
  await ensureAvatarsBucket(admin);

  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const objectPath = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from("avatars").upload(objectPath, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(objectPath);

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  return { publicUrl };
}

export async function removeMyAvatar() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("You must be signed in.");
  }

  const prefix = user.id;
  const { data: objects, error: listError } = await supabase.storage.from("avatars").list(prefix, { limit: 100 });
  if (!listError && objects?.length) {
    const paths = objects.map((o) => `${prefix}/${o.name}`);
    await supabase.storage.from("avatars").remove(paths);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function setMyAvatarUrl(publicUrl: string) {
  const url = publicUrl.trim();
  if (!url) {
    throw new Error("Invalid image URL");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      avatar_url: url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function updateMyPassword(formData: FormData) {
  const password = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (password !== confirm) {
    throw new Error("Passwords do not match");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/profile");
}
