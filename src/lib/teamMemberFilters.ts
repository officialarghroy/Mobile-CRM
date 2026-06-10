import type { TeamMemberRow } from "@/lib/teamAccess";

export function eventBelongsToMember(
  row: { owner_user_id?: string | null; user_name?: string | null },
  member: TeamMemberRow,
): boolean {
  if (!member.user_id) return false;
  if (row.owner_user_id && row.owner_user_id === member.user_id) return true;
  const memberEmail = member.email?.trim().toLowerCase();
  const rowEmail = row.user_name?.trim().toLowerCase();
  return Boolean(memberEmail && rowEmail && memberEmail === rowEmail);
}

export function sortTeamMembersForList(
  members: TeamMemberRow[],
  viewerUserId: string | null,
): TeamMemberRow[] {
  const copy = [...members];
  copy.sort((a, b) => {
    const aViewer = Boolean(viewerUserId && a.user_id === viewerUserId);
    const bViewer = Boolean(viewerUserId && b.user_id === viewerUserId);
    if (aViewer !== bViewer) return aViewer ? -1 : 1;
    return (a.display_name || a.email || "").localeCompare(b.display_name || b.email || "", undefined, {
      sensitivity: "base",
    });
  });
  return copy;
}

export function memberDisplayName(m: TeamMemberRow): string {
  const d = m.display_name?.trim();
  if (d && d !== "—") return d;
  const em = m.email?.trim();
  return em || "Team member";
}
