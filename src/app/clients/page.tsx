import { Suspense } from "react";
import { AppMain } from "@/components/layout/AppMain";
import { LeadsPageContent } from "@/components/leads/LeadsPageContent";
import { LeadsListSkeleton } from "@/components/leads/LeadsListSkeleton";
import { Container } from "@/components/ui/Container";

export default function ClientsPage() {
  return (
    <AppMain className="items-start">
      <Container className="space-y-5 pb-[var(--app-page-scroll-pad)]">
        <Suspense fallback={<LeadsListSkeleton />}>
          <LeadsPageContent initialFilter="client" />
        </Suspense>
      </Container>
    </AppMain>
  );
}
