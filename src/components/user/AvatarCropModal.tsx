"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModalScaffold } from "@/components/ui/ModalScaffold";

const OUTPUT_SIZE = 512;
const JPEG_QUALITY = 0.92;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type AvatarCropModalProps = {
  open: boolean;
  file: File | null;
  onClose: () => void;
  /** Called with cropped square image (JPEG), ready for upload. Reject or throw on failure so the modal stays open. */
  onConfirm: (blob: Blob) => void | Promise<void>;
};

function clampPan(
  panX: number,
  panY: number,
  viewport: number,
  iw: number,
  ih: number,
  scale: number,
): { x: number; y: number } {
  const dw = iw * scale;
  const dh = ih * scale;
  const maxX = Math.max(0, dw / 2 - viewport / 2);
  const maxY = Math.max(0, dh / 2 - viewport / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, panX)),
    y: Math.min(maxY, Math.max(-maxY, panY)),
  };
}

/** Keep the viewport point (focalX, focalY) anchored on the image while zoom changes from fromZoom to toZoom. */
function zoomAroundViewportPoint(
  viewport: number,
  iw: number,
  ih: number,
  baseScale: number,
  focalX: number,
  focalY: number,
  fromPan: { x: number; y: number },
  fromZoom: number,
  toZoom: number,
): { zoom: number; pan: { x: number; y: number } } {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, toZoom));
  const oldS = baseScale * fromZoom;
  const newS = baseScale * z;
  if (oldS <= 0) {
    return { zoom: z, pan: clampPan(fromPan.x, fromPan.y, viewport, iw, ih, newS) };
  }
  const ratio = newS / oldS;
  const cx = viewport / 2;
  const cy = viewport / 2;
  const panX = (focalX - cx) * (1 - ratio) + fromPan.x * ratio;
  const panY = (focalY - cy) * (1 - ratio) + fromPan.y * ratio;
  return { zoom: z, pan: clampPan(panX, panY, viewport, iw, ih, newS) };
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

type PinchSession = {
  startDist: number;
  startZoom: number;
  startPan: { x: number; y: number };
  focalX: number;
  focalY: number;
};

export function AvatarCropModal({ open, file, onClose, onConfirm }: AvatarCropModalProps) {
  const maskId = useId().replace(/:/g, "");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [viewportPx, setViewportPx] = useState(280);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  zoomRef.current = zoom;
  panRef.current = pan;

  const dragRef = useRef<{ id: number | null; startX: number; startY: number; origPanX: number; origPanY: number }>({
    id: null,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
  });

  const pointersRef = useRef(new Map<number, { x: number; y: number; clientX: number; clientY: number }>());
  const pinchSessionRef = useRef<PinchSession | null>(null);

  const clientToViewport = useCallback((clientX: number, clientY: number) => {
    const el = viewportRef.current;
    if (!el) return { x: viewportPx / 2, y: viewportPx / 2 };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, [viewportPx]);

  useEffect(() => {
    if (!open || !file) {
      setObjectUrl(null);
      setNaturalW(0);
      setNaturalH(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setLoading(false);
      setConfirmError(null);
      pointersRef.current.clear();
      pinchSessionRef.current = null;
      dragRef.current.id = null;
      return;
    }

    setConfirmError(null);
    setLoading(true);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    const img = new Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
      setObjectUrl(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, file]);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setViewportPx(w);
    });
    ro.observe(el);
    const w = el.getBoundingClientRect().width;
    if (w > 0) setViewportPx(w);
    return () => ro.disconnect();
  }, [open, naturalW, naturalH]);

  const baseScale =
    naturalW > 0 && naturalH > 0 && viewportPx > 0
      ? Math.max(viewportPx / naturalW, viewportPx / naturalH)
      : 1;
  const displayScale = baseScale * zoom;
  const dw = naturalW * displayScale;
  const dh = naturalH * displayScale;

  const applyClampedPan = useCallback(
    (nx: number, ny: number) => {
      if (!viewportPx || !naturalW || !naturalH) return;
      const c = clampPan(nx, ny, viewportPx, naturalW, naturalH, displayScale);
      setPan(c);
    },
    [viewportPx, naturalW, naturalH, displayScale],
  );

  useEffect(() => {
    if (!open || !naturalW || !naturalH || !viewportPx) return;
    setPan((p) => {
      const c = clampPan(p.x, p.y, viewportPx, naturalW, naturalH, displayScale);
      if (c.x === p.x && c.y === p.y) return p;
      return c;
    });
  }, [open, naturalW, naturalH, viewportPx, displayScale]);

  const applyZoomAroundPoint = useCallback(
    (focalX: number, focalY: number, nextZoom: number) => {
      if (!viewportPx || !naturalW || !naturalH) return;
      const { zoom: z, pan: p } = zoomAroundViewportPoint(
        viewportPx,
        naturalW,
        naturalH,
        baseScale,
        focalX,
        focalY,
        panRef.current,
        zoomRef.current,
        nextZoom,
      );
      setZoom(z);
      setPan(p);
    },
    [viewportPx, naturalW, naturalH, baseScale],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open || loading || !naturalW) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x: px, y: py } = clientToViewport(e.clientX, e.clientY);
      const sensitivity = e.ctrlKey ? 0.012 : 0.0018;
      const factor = Math.exp(-e.deltaY * sensitivity);
      const next = zoomRef.current * factor;
      applyZoomAroundPoint(px, py, next);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, loading, naturalW, clientToViewport, applyZoomAroundPoint]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (loading || !naturalW) return;
    const target = e.currentTarget;
    const rel = clientToViewport(e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, { ...rel, clientX: e.clientX, clientY: e.clientY });
    target.setPointerCapture(e.pointerId);

    const n = pointersRef.current.size;
    if (n === 1) {
      pinchSessionRef.current = null;
      dragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origPanX: panRef.current.x,
        origPanY: panRef.current.y,
      };
    } else if (n === 2) {
      dragRef.current.id = null;
      const pts = [...pointersRef.current.values()];
      const [a, b] = pts;
      const d = distance(a.x, a.y, b.x, b.y);
      if (d > 1) {
        pinchSessionRef.current = {
          startDist: d,
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          focalX: (a.x + b.x) / 2,
          focalY: (a.y + b.y) / 2,
        };
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const rel = clientToViewport(e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, { ...rel, clientX: e.clientX, clientY: e.clientY });

    if (pointersRef.current.size >= 2 && pinchSessionRef.current) {
      const pts = [...pointersRef.current.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const d = distance(a.x, a.y, b.x, b.y);
      const session = pinchSessionRef.current;
      if (d < 1) return;
      const nextZoom = session.startZoom * (d / session.startDist);
      const { zoom: z, pan: p } = zoomAroundViewportPoint(
        viewportPx,
        naturalW,
        naturalH,
        baseScale,
        session.focalX,
        session.focalY,
        session.startPan,
        session.startZoom,
        nextZoom,
      );
      setZoom(z);
      setPan(p);
      return;
    }

    if (pointersRef.current.size === 1 && dragRef.current.id === e.pointerId) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      applyClampedPan(dragRef.current.origPanX + dx, dragRef.current.origPanY + dy);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (dragRef.current.id === e.pointerId) {
      dragRef.current.id = null;
    }
    if (pointersRef.current.size < 2) {
      pinchSessionRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      const [remainingId, pt] = [...pointersRef.current.entries()][0];
      dragRef.current = {
        id: remainingId,
        startX: pt.clientX,
        startY: pt.clientY,
        origPanX: panRef.current.x,
        origPanY: panRef.current.y,
      };
    }
    if (pointersRef.current.size === 0) {
      dragRef.current.id = null;
    }
  };

  const handleConfirm = async () => {
    if (!objectUrl || !naturalW || !naturalH || !viewportPx) return;
    setExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      const ratio = OUTPUT_SIZE / viewportPx;
      const s = displayScale * ratio;

      ctx.save();
      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      const drawW = naturalW * s;
      const drawH = naturalH * s;
      const cx = OUTPUT_SIZE / 2 + pan.x * ratio;
      const cy = OUTPUT_SIZE / 2 + pan.y * ratio;
      ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
      );
      if (!blob) throw new Error("Could not create image");
      await Promise.resolve(onConfirm(blob));
      onClose();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ModalScaffold open={open} onBackdropClose={onClose} titleId="avatar-crop-title">
      <div
        className="pointer-events-auto mx-auto w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="avatar-crop-title" className="text-lg font-semibold text-[var(--text-primary)]">
          Adjust photo
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          Drag to move. On a phone or tablet, pinch with two fingers to zoom. On a computer, scroll the mouse wheel or pinch on the trackpad. The circle is how your avatar will look.
        </p>

        <div className="mt-4">
          <div
            ref={viewportRef}
            className="relative mx-auto aspect-square w-full max-w-[min(100%,18rem)] touch-none select-none overflow-hidden rounded-lg bg-[var(--surface-muted)]"
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {objectUrl && naturalW > 0 ? (
              <img
                src={objectUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                style={{
                  width: dw,
                  height: dh,
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                }}
              />
            ) : null}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <mask id={`crop-mask-${maskId}`}>
                  <rect width="100" height="100" fill="white" />
                  <circle cx="50" cy="50" r="49.2" fill="black" />
                </mask>
              </defs>
              <rect width="100" height="100" fill="rgba(15,23,42,0.52)" mask={`url(#crop-mask-${maskId})`} />
              <circle
                cx="50"
                cy="50"
                r="49.2"
                fill="none"
                stroke="white"
                strokeWidth="0.35"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-muted)]/90 text-sm text-[var(--text-secondary)]">
                Loading…
              </div>
            ) : null}
          </div>
        </div>

        {confirmError ? (
          <p className="mt-4 text-sm font-medium text-[var(--text-danger)]" role="alert">
            {confirmError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void handleConfirm()}
            disabled={loading || exporting || !naturalW}
          >
            {exporting ? "Saving…" : "Use photo"}
          </Button>
        </div>
      </div>
    </ModalScaffold>
  );
}
