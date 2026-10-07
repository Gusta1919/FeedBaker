"use client";

import { useCallback, useState } from "react";

type PhotoFrameProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
};

const FALLBACKS = [
  "linear-gradient(160deg, #1a1a1c, #131314)",
  "linear-gradient(160deg, #1c1917, #131314)",
  "linear-gradient(160deg, #171717, #131314)",
];

function hashToIndex(value: string, length: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 997;
  }
  return hash % length;
}

export function PhotoFrame({
  src,
  alt,
  priority,
  className,
  fit = "cover",
}: PhotoFrameProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  // Cached images can finish before React attaches onLoad, so check on mount too.
  const attach = useCallback((node: HTMLImageElement | null) => {
    if (!node) return;
    if (node.complete) {
      setStatus(node.naturalWidth > 0 ? "ready" : "failed");
    }
  }, []);

  if (status === "failed") {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center ${className ?? ""}`}
        style={{ background: FALLBACKS[hashToIndex(src, FALLBACKS.length)] }}
      >
        <span className="px-4 text-center text-xs font-medium text-paper-muted">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="skeleton absolute inset-0" aria-hidden />
      )}
      {/* Seed photos come from third-party hosts; the optimizer adds latency without benefit. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={attach}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("failed")}
        className={`transition-opacity duration-500 ${
          fit === "contain" ? "photo-contain" : "photo-fill"
        } ${status === "ready" ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
      />
    </>
  );
}
