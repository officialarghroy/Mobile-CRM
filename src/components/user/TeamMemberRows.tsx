export type TeamMemberRow = {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
};

type TeamMemberRowsProps = {
  rows: TeamMemberRow[];
};

export function TeamMemberRows({ rows }: TeamMemberRowsProps) {
  return (
    <>
      {rows.map((row) => (
        <div
          key={row.user_id}
          role="row"
          className="grid cursor-default grid-cols-[1fr_1fr_minmax(5rem,auto)] gap-3 border-b border-[var(--border)] py-4 px-5 text-sm last:border-b-0 hover:bg-[var(--surface-muted)]"
        >
          <span className="min-w-0 truncate text-[var(--text-primary)]">{row.display_name}</span>
          <span className="min-w-0 text-left whitespace-normal [overflow-wrap:anywhere] text-[var(--text-secondary)]">
            {row.email || "—"}
          </span>
          <span className="min-w-0 shrink-0 text-right capitalize text-[var(--text-secondary)]">{row.role}</span>
        </div>
      ))}
    </>
  );
}
