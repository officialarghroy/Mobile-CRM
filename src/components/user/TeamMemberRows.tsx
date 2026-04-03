import { EmailTwoLines } from "@/components/ui/EmailTwoLines";
import { usersTableEmailColumnClass } from "@/components/user/usersTableLayout";
import { formatRoleFirstSegment, splitRoleForDisplay } from "@/lib/formatRoleDisplay";

export type TeamMemberRow = {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
};

type TeamMemberRowsProps = {
  rows: TeamMemberRow[];
};

function RoleCell({ role }: { role: string }) {
  const { line1, line2 } = splitRoleForDisplay(role);
  const top = formatRoleFirstSegment(line1);
  return (
    <div
      className="inline-block max-w-full text-right [direction:ltr] [unicode-bidi:isolate]"
      title={role}
    >
      <span className="block">{top}</span>
      {line2 != null ? <span className="block normal-case">{line2.toLowerCase()}</span> : null}
    </div>
  );
}

export function TeamMemberRows({ rows }: TeamMemberRowsProps) {
  return (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td
            colSpan={3}
            className="border-b border-[var(--border)] px-5 py-4 text-sm text-[var(--text-secondary)]"
          >
            No team members found.
          </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr
            key={row.user_id}
            className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-muted)]"
          >
            <td className="min-w-0 px-4 py-3 align-top break-words text-left text-sm font-medium text-[var(--text-primary)] sm:py-3.5 sm:truncate sm:break-normal">
              {row.display_name}
            </td>
            <td className={`py-3 align-top text-sm text-[var(--text-secondary)] sm:py-3.5 ${usersTableEmailColumnClass}`}>
              {row.email ? (
                <EmailTwoLines
                  email={row.email}
                  align="start"
                  fullWidth
                  className="text-[0.8125rem] leading-snug text-[var(--text-secondary)] sm:text-sm sm:leading-normal"
                />
              ) : (
                "—"
              )}
            </td>
            <td className="min-w-0 px-4 py-3 align-top text-right text-[0.75rem] leading-snug text-[var(--text-secondary)] sm:py-3.5 sm:text-sm sm:leading-normal">
              <RoleCell role={row.role} />
            </td>
          </tr>
        ))
      )}
    </tbody>
  );
}
