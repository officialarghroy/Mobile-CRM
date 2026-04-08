"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RiRefreshLine, RiUserAddLine } from "react-icons/ri";
import { createLead } from "@/app/leads/actions";
import { createUser } from "@/app/users/actions";
import { AddLeadInline } from "@/components/leads/AddLeadInline";
import { CreateUserModal } from "@/components/user/CreateUserModal";
import { normalizePathname } from "@/lib/routeHeaderMeta";

const iconBtnClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

export function AppHeaderActions() {
  const pathname = normalizePathname(usePathname() ?? "");
  const router = useRouter();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [isRefreshPending, startRefreshTransition] = useTransition();

  if (pathname === "/leads") {
    return (
      <div className="ml-auto shrink-0">
        <AddLeadInline createLead={createLead} compact />
      </div>
    );
  }

  if (pathname === "/users") {
    return (
      <>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={`${iconBtnClass} ${isRefreshPending ? "cursor-wait" : ""} disabled:pointer-events-none disabled:opacity-75`}
            aria-label={isRefreshPending ? "Refreshing" : "Refresh user list"}
            aria-busy={isRefreshPending}
            disabled={isRefreshPending}
            onClick={() => {
              startRefreshTransition(() => {
                router.refresh();
              });
            }}
          >
            <RiRefreshLine
              className={`h-5 w-5 shrink-0 ${isRefreshPending ? "animate-spin motion-reduce:animate-none" : ""}`}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className={iconBtnClass}
            aria-label="Create user"
            onClick={() => setCreateUserOpen(true)}
          >
            <RiUserAddLine className="h-5 w-5 shrink-0" aria-hidden />
          </button>
        </div>
        <CreateUserModal open={createUserOpen} onOpenChange={setCreateUserOpen} createUser={createUser} />
      </>
    );
  }

  const showRefresh =
    pathname === "/calendar" ||
    pathname.startsWith("/calendar/") ||
    (pathname.startsWith("/leads/") && pathname.length > "/leads/".length);

  if (showRefresh) {
    return (
      <div className="ml-auto shrink-0">
        <button
          type="button"
          className={`${iconBtnClass} ${isRefreshPending ? "cursor-wait" : ""} disabled:pointer-events-none disabled:opacity-75`}
          aria-label={isRefreshPending ? "Refreshing" : "Refresh"}
          aria-busy={isRefreshPending}
          disabled={isRefreshPending}
          onClick={() => {
            startRefreshTransition(() => {
              router.refresh();
            });
          }}
        >
          <RiRefreshLine
            className={`h-5 w-5 shrink-0 ${isRefreshPending ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden
          />
        </button>
      </div>
    );
  }

  return null;
}
