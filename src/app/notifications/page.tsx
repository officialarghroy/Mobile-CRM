import { redirect } from "next/navigation";
import { AppMain } from "@/components/layout/AppMain";
import {
  NotificationsPageClient,
  type NotificationListItem,
} from "@/components/notifications/NotificationsPageClient";
import { Container } from "@/components/ui/Container";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function normalizeRow(raw: Record<string, unknown>): NotificationListItem | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  const message = typeof raw.message === "string" ? raw.message : null;
  const created_at = typeof raw.created_at === "string" ? raw.created_at : null;
  const is_read = raw.is_read === true;
  const entity_id = typeof raw.entity_id === "string" ? raw.entity_id : null;
  const entity_type = typeof raw.entity_type === "string" ? raw.entity_type : null;
  if (!id || !message || !created_at) return null;
  return { id, message, created_at, is_read, entity_id, entity_type };
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: markAllError } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (markAllError) {
    const code =
      typeof markAllError === "object" && markAllError && "code" in markAllError
        ? String((markAllError as { code?: string }).code ?? "")
        : "";
    if (code !== "PGRST205") {
      console.error("Failed to mark notifications read:", markAllError);
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, message, created_at, is_read, entity_id, entity_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load notifications:", error);
  }

  const notifications: NotificationListItem[] = (data ?? [])
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((n): n is NotificationListItem => n != null);

  return (
    <AppMain className="items-start">
      <Container className="flex min-h-0 flex-1 flex-col gap-4 pb-[var(--app-page-scroll-pad)]">
        <NotificationsPageClient notifications={notifications} />
      </Container>
    </AppMain>
  );
}
