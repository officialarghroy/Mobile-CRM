"use client";

import { useRouter } from "next/navigation";
import { formatInPST, formatLeadUpdateRelativeTime } from "@/lib/timezone";

export type NotificationListItem = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  entity_id: string | null;
  entity_type: string | null;
};

type NotificationsPageClientProps = {
  notifications: NotificationListItem[];
};

export function NotificationsPageClient({
  notifications,
}: NotificationsPageClientProps) {
  const router = useRouter();

  const tasksHrefFor = (item: NotificationListItem) => {
    if (item.entity_type === "event" && item.entity_id?.trim()) {
      return `/tasks?highlight=${encodeURIComponent(item.entity_id.trim())}`;
    }
    return "/tasks";
  };

  const handleRowActivate = (item: NotificationListItem) => {
    router.push(tasksHrefFor(item));
  };

  if (!notifications.length) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No notifications yet.
      </p>
    );
  }

  const rowClass = (unread: boolean) =>
    `flex w-full items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left shadow-[var(--shadow-card)] touch-manipulation transition-shadow hover:shadow-[var(--shadow-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 ${
      unread ? "font-semibold" : "font-normal"
    }`;

  return (
    <ul className="flex flex-col gap-2" aria-label="Notifications">
      {notifications.map((item) => {
        const unread = !item.is_read;
        const body = (
          <>
            <span className="mt-1.5 flex h-2 w-2 shrink-0 justify-center" aria-hidden>
              {unread ? (
                <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-transparent" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]">
                {item.message}
              </span>
              <span className="crm-meta mt-1 block text-[var(--text-secondary)]">
                {formatLeadUpdateRelativeTime(item.created_at)}
                <span className="mx-1.5 text-[var(--text-tertiary)]/50" aria-hidden>
                  ·
                </span>
                <span className="text-[var(--text-tertiary)]">
                  {formatInPST(item.created_at)}
                </span>
              </span>
            </span>
          </>
        );

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleRowActivate(item)}
              className={rowClass(unread)}
              title="Open in My Tasks"
            >
              {body}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
