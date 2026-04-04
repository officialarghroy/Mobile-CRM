import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { AppMain } from "@/components/layout/AppMain";
import { Container } from "@/components/ui/Container";

export default function CalendarLoading() {
  return (
    <AppMain>
      <Container className="flex min-h-0 flex-1 flex-col space-y-5 pb-[var(--app-page-scroll-pad)]">
        <CalendarPageSkeleton />
      </Container>
    </AppMain>
  );
}
