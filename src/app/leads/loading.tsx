import { AppMain } from "@/components/layout/AppMain";
import { LeadsListSkeleton } from "@/components/leads/LeadsListSkeleton";
import { Container } from "@/components/ui/Container";

export default function LeadsLoading() {
  return (
    <AppMain className="items-start">
      <Container className="space-y-5 pb-[var(--app-page-scroll-pad)]">
        <LeadsListSkeleton />
      </Container>
    </AppMain>
  );
}
