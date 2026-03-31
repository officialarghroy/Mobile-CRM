import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <main className="flex min-h-dvh w-full items-start py-6">
      <Container className="pt-2">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <span>Loading lead...</span>
        </div>
      </Container>
    </main>
  );
}
