import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamMemberRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  member_since: string;
};

/** Display names to drop from team listings (legacy test accounts). */
const REMOVED_TEAM_MEMBER_DISPLAY_NAMES = new Set(["test user", "test user 2", "testuser2"]);

function isRemovedTeamMemberRow(row: TeamMemberRow): boolean {
  const key = row.display_name.trim().toLowerCase().replace(/\s+/g, " ");
  return REMOVED_TEAM_MEMBER_DISPLAY_NAMES.has(key);
}

const TEAM_ROLES = ["admin", "developer", "content_writer"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export function parseTeamRole(raw: string): TeamRole | null {
  const s = raw.trim().toLowerCase().replace(/-/g, "_");
  return TEAM_ROLES.includes(s as TeamRole) ? (s as TeamRole) : null;
}

function isMissingTeamTableError(error: { code?: string; message?: string }): boolean {
  const msg = String(error.message ?? "");
  if (error.code === "PGRST205") return true;
  if (msg.includes("schema cache")) return true;
  if (msg.toLowerCase().includes("could not find the table")) return true;
  return false;
}

export async function getMembershipForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ teamId: string | null; role: TeamRole | null }> {
  const { data, error } = await supabase.from("team_members").select("team_id, role").eq("user_id", userId).limit(1);

  if (error) {
    if (process.env.NODE_ENV === "development" && !isMissingTeamTableError(error)) {
      console.error("team_members select:", error.message);
    }
    return { teamId: null, role: null };
  }
  if (!data?.length) {
    return { teamId: null, role: null };
  }

  const row = data[0] as { team_id: string; role: string };
  const role = parseTeamRole(String(row.role ?? ""));
  const teamId = typeof row.team_id === "string" ? row.team_id : null;
  return { teamId, role };
}

export async function isTeamAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { role } = await getMembershipForUser(supabase, userId);
  return role === "admin";
}

export async function fetchTeamMembers(
  supabase: SupabaseClient,
): Promise<{ rows: TeamMemberRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("get_team_members");

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("Could not find the function") ||
      msg.includes("does not exist") ||
      error.code === "42883"
    ) {
      return {
        rows: [],
        error:
          "Team tables are missing. Run supabase/migrations/20260402100000_teams_members_profiles.sql in the Supabase SQL Editor.",
      };
    }
    return { rows: [], error: msg };
  }

  const raw = (data ?? []) as Record<string, unknown>[];
  const rows: TeamMemberRow[] = raw.map((r) => ({
    user_id: String(r.user_id ?? ""),
    email: String(r.email ?? ""),
    display_name: String(r.display_name ?? "—"),
    role: String(r.role ?? ""),
    member_since: String(r.member_since ?? ""),
  }));

  return { rows: rows.filter((r) => !isRemovedTeamMemberRow(r)), error: null };
}
