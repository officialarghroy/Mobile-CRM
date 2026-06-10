import { AppMain } from "@/components/layout/AppMain";
import { TeamUpdatesPageSkeleton } from "@/components/team-updates/TeamUpdatesPageSkeleton";
import { Container } from "@/components/ui/Container";

export default function TeamUpdatesLoading() {
  return (
    <AppMain>
      <Container className="flex min-h-0 flex-1 flex-col space-y-4 pb-[var(--app-page-scroll-pad)]">
        <TeamUpdatesPageSkeleton />
      </Container>
    </AppMain>
  );
}
