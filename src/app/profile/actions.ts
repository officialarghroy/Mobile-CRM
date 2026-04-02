"use server";

import { revalidatePath } from "next/cache";
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
