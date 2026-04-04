import { AppMain } from "@/components/layout/AppMain";
import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <AppMain className="items-start">
      <Container className="pt-2 pb-[var(--app-page-scroll-pad)]">
        <div className="flex items-center gap-3 text-[0.8125rem] font-medium text-[var(--text-secondary)]" role="status" aria-live="polite">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-strong)]" aria-hidden />
          <span>Loading lead details...</span>
        </div>
      </Container>
    </AppMain>
  );
}
