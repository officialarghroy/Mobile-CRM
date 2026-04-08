#!/usr/bin/env node
/**
 * Deletes auth users by profile display name and/or email (case-insensitive, trimmed).
 * Any argument containing @ is treated as an email; others as display names.
 * Cascades to user_profiles and team_members (FK to auth.users).
 *
 * Usage (repo root):
 *   node scripts/delete-users-by-display-name.mjs "Display One" user@example.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
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

function normName(s) {
  if (s == null || typeof s !== "string") return "";
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normEmail(s) {
  if (s == null || typeof s !== "string") return "";
  return s.trim().toLowerCase();
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const rawArgs = process.argv.slice(2).filter(Boolean);
const targetEmails = new Set();
const targetNames = new Set();
for (const a of rawArgs) {
  if (a.includes("@")) {
    const e = normEmail(a);
    if (e) targetEmails.add(e);
  } else {
    const n = normName(a);
    if (n) targetNames.add(n);
  }
}

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

if (targetEmails.size === 0 && targetNames.size === 0) {
  console.error("Pass one or more display names and/or email addresses as arguments.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const idsToDelete = new Set();

const { data: profiles, error: profErr } = await admin.from("user_profiles").select("user_id, display_name");
if (profErr) {
  console.error("user_profiles select:", profErr.message);
  process.exit(1);
}
for (const row of profiles ?? []) {
  if (row?.user_id && targetNames.size > 0 && targetNames.has(normName(row.display_name))) {
    idsToDelete.add(row.user_id);
  }
}

let page = 1;
const perPage = 1000;
for (;;) {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
  if (listErr) {
    console.error("listUsers:", listErr.message);
    process.exit(1);
  }
  const users = listData?.users ?? [];
  for (const u of users) {
    const mail = normEmail(u.email);
    if (mail && targetEmails.has(mail)) {
      idsToDelete.add(u.id);
    }
    const metaName = normName(u.user_metadata?.name);
    if (targetNames.size > 0 && metaName && targetNames.has(metaName)) {
      idsToDelete.add(u.id);
    }
  }
  if (users.length < perPage) break;
  page += 1;
}

if (idsToDelete.size === 0) {
  console.log("No users matched.", {
    displayNames: [...targetNames],
    emails: [...targetEmails],
  });
  process.exit(0);
}

console.log("Deleting user ids:", [...idsToDelete].join(", "));

for (const id of idsToDelete) {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error("deleteUser", id, error.message);
    process.exit(1);
  }
}

console.log("Done. Removed", idsToDelete.size, "user(s).");
