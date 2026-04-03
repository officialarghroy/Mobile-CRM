import { LeadsListSkeleton } from "@/components/leads/LeadsListSkeleton";
import { Container } from "@/components/ui/Container";

export default function LeadsLoading() {
  return (
    <main className="flex min-h-dvh w-full items-start py-5">
      <Container className="space-y-5 pb-24">
        <LeadsListSkeleton />
      </Container>
    </main>
  );
}
