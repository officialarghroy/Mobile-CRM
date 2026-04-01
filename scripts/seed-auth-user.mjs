#!/usr/bin/env node
/**
 * One-off: create a Supabase Auth user via the Admin API.
 * Do not commit passwords. Set secrets only in your shell for this run.
 *
 * Usage (from repo root):
 *   export SEED_EMAIL=you@example.com
 *   export SEED_PASSWORD='your-temporary-password'
 *   export SEED_DISPLAY_NAME='Optional Name'   # optional
 *   node scripts/seed-auth-user.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.env.SEED_EMAIL?.trim();
const password = process.env.SEED_PASSWORD ?? "";
const displayName = process.env.SEED_DISPLAY_NAME?.trim() || email?.split("@")[0] || "User";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

if (!email || !password) {
  console.error("Set SEED_EMAIL and SEED_PASSWORD in the environment, then run again.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name: displayName },
});

if (error && /already been registered|already exists|duplicate/i.test(error.message)) {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error("listUsers failed:", listErr.message);
    process.exit(1);
  }
  const existing = listData.users?.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (!existing?.id) {
    console.error("User exists but could not be found to update:", error.message);
    process.exit(1);
  }
  const { data: updated, error: upErr } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { name: displayName },
  });
  if (upErr) {
    console.error("updateUserById failed:", upErr.message);
    process.exit(1);
  }
  console.log("Updated existing user:", updated.user?.email ?? email, "id:", updated.user?.id);
  process.exit(0);
}

if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}

console.log("Created user:", data.user?.email ?? email, "id:", data.user?.id);
