"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import { formatInPST, formatLeadUpdateRelativeTime } from "@/lib/timezone";

function fileKeyForDedupe(f: File): string {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

export type UpdateCardData = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  image_urls?: string[] | null;
};

type LeadUpdatesSectionProps = {
  initialUpdates: UpdateCardData[];
  createLeadUpdate: (formData: FormData) => Promise<void>;
  viewerEmail: string;
  /** When false, activity history still shows but adding updates is hidden (e.g. Recently deleted). */
  allowAddUpdate?: boolean;
  /** Rendered after the add-note card (or read-only notice) and before activity history. */
  belowAddNote?: ReactNode;
};

export function LeadUpdatesSection({
  initialUpdates,
  createLeadUpdate,
  viewerEmail,
  allowAddUpdate = true,
  belowAddNote,
}: LeadUpdatesSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [updates, setUpdates] = useState<UpdateCardData[]>(initialUpdates);
  const [showSaved, setShowSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    if (previewIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewIndex]);

  useEffect(() => {
    setUpdates(initialUpdates);
  }, [initialUpdates]);

  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    const input = event.target;
    setSelectedFiles((prev) => {
      const seen = new Set(prev.map(fileKeyForDedupe));
      const next = [...prev];
      for (const f of incoming) {
        if (next.length >= 5) break;
        const k = fileKeyForDedupe(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      return next;
    });
    setPreviewIndex(null);
    input.value = "";
  };

  const removeImage = (index: number) => {
    setPreviewIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      const fail = () => resolve(file);

      reader.onerror = fail;
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onerror = fail;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 1280;
        const scale = Math.min(1, MAX_WIDTH / img.width);

        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        if (!ctx) {
          fail();
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const isPng = file.type === "image/png";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: isPng ? "image/png" : "image/jpeg",
            });

            resolve(compressedFile);
          },
          isPng ? "image/png" : "image/jpeg",
          0.7,
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    const fileCount = selectedFiles.length;
    if (!content && fileCount === 0) return;

    setDraft("");

    const optimisticId = `optimistic-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticUpdate: UpdateCardData = {
      id: optimisticId,
      content: content || (fileCount ? "Photo attachment" : ""),
      createdAt: nowIso,
      author: viewerEmail,
      image_urls: null,
    };

    setUpdates((prev) => [optimisticUpdate, ...prev]);

    startTransition(async () => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.set("content", content);
        for (const file of selectedFiles.slice(0, 5)) {
          const compressed = await compressImage(file);
          formData.append("images", compressed);
        }
        await createLeadUpdate(formData);
        setShowSaved(true);
        setSelectedFiles([]);
        setPreviewIndex(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (error) {
        console.error("Failed to create lead update:", error);
        setDraft(content);
        setUpdates((prev) =>
          prev.filter((update) => update.id !== optimisticId),
        );
      } finally {
        setIsUploading(false);
      }
    });
  };

  const fullscreenUrl =
    previewIndex !== null && previewUrls[previewIndex]
      ? previewUrls[previewIndex]
      : null;

  return (
    <>
      <div className="flex flex-col space-y-5">
        <p className="crm-section-label">Activity</p>

        {allowAddUpdate ? (
          <Card className="flex flex-col gap-3 border-[#d4e2fc] bg-[var(--surface-accent)]">
            <p className="crm-meta leading-snug">
              Add a note visible on this record.
            </p>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <label htmlFor="lead-update" className="sr-only">
                Add update
              </label>
              <textarea
                id="lead-update"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="What happened? (e.g. visited store, spoke to client...)"
                rows={4}
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/82 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa2e]"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFiles.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 [-webkit-overflow-scrolling:touch]">
                  {selectedFiles.map((file, index) => {
                    const url = previewUrls[index];
                    return (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className="relative shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewIndex(index)}
                          className="block cursor-pointer rounded-md border-0 bg-transparent p-0 touch-manipulation"
                          aria-label={`View image ${index + 1} full screen`}
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-20 w-20 rounded-md border border-[var(--border)] object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          aria-label={`Remove image ${index + 1}`}
                          className="absolute -right-1 -top-1 flex h-7 w-7 touch-manipulation items-center justify-center rounded-full bg-black/70 text-sm text-white shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach images to this note, up to 5 images"
                className="min-h-11 w-full touch-manipulation py-2 text-left text-sm font-medium text-[var(--accent-strong)] active:opacity-80"
              >
                + Add Images
              </button>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isPending || isUploading || (!draft.trim() && selectedFiles.length === 0)
                }
              >
                {isUploading
                  ? "Uploading..."
                  : isPending
                    ? "Adding..."
                    : "Save Update"}
              </Button>
              {showSaved ? <p className="crm-meta">Saved</p> : null}
            </form>
          </Card>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Activity is read-only while this lead is in Recently deleted.
          </p>
        )}

        {belowAddNote ? (
          <div className="flex flex-col gap-2">{belowAddNote}</div>
        ) : null}

        <section
          className="flex flex-col space-y-5 pb-2"
          aria-label="Activity history"
        >
          {!updates.length ? (
            <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
              <p>No updates yet. Log your first activity.</p>
            </div>
          ) : null}
          <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
            {updates.map((update, index) => (
              <div
                key={update.id}
                className={`border-b border-[var(--border)] border-l-[3px] border-l-[#cbd5e1] px-4 py-4 last:border-b-0 ${
                  index === 0
                    ? "bg-[var(--surface-muted)]"
                    : "bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 pl-1">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-sm font-semibold leading-snug [overflow-wrap:anywhere] ${
                        index === 0
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-primary)]/95"
                      } ${!update.content.trim() && update.image_urls?.length ? "font-normal italic text-[var(--text-secondary)]" : ""}`}
                    >
                      {update.content.trim()
                        ? update.content
                        : update.image_urls?.length
                          ? "Photo attachment"
                          : update.content}
                    </p>
                    {update.image_urls?.length ? (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                        {update.image_urls.map((url) => (
                          <img
                            key={url}
                            src={url}
                            alt=""
                            className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    ) : null}
                    <p className="crm-meta mt-1">{update.author}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5 text-right">
                    <p className="crm-meta">
                      {formatLeadUpdateRelativeTime(update.createdAt)}
                    </p>
                    <p className="crm-meta text-[var(--text-tertiary)]">
                      {formatInPST(update.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </SurfaceListShell>
        </section>
      </div>

      {fullscreenUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 flex touch-manipulation items-center justify-center bg-black/90"
          onClick={() => setPreviewIndex(null)}
        >
          <img
            src={fullscreenUrl}
            alt=""
            className="max-h-[90dvh] max-w-[90dvw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex(null);
            }}
            aria-label="Close preview"
            className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 px-3 text-lg text-white"
          >
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}
