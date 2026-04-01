"use client";

import { usePathname } from "next/navigation";

function getHeaderTitle(pathname: string): string {
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) {
    return "Calendar";
  }

  if (pathname.startsWith("/leads/") && pathname !== "/leads") {
    return "Lead details";
  }

  if (pathname === "/leads") {
    return "Leads";
  }

  return "CRM";
}

export function HeaderTitle() {
  const pathname = usePathname();
  const title = getHeaderTitle(pathname);

  return (
    <span className="block truncate px-1 text-center text-[0.8125rem] font-semibold tracking-tight text-[var(--text-primary)]">
      {title}
    </span>
  );
}
