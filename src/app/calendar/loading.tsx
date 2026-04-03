import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { Container } from "@/components/ui/Container";

export default function CalendarLoading() {
  return (
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden py-5">
      <Container className="flex min-h-0 flex-1 flex-col space-y-5 pb-24">
        <CalendarPageSkeleton />
      </Container>
    </main>
  );
}
