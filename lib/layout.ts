/**
 * Shared photo pagination for a report section, matching the client's
 * newest reference layout: photos are grouped into 2×2 grid pages first
 * ("4 in a page"), and whatever is left runs big — a full-page single or
 * a stacked pair. Sections with fewer than four photos keep the classic
 * one-large-photo-per-page look of the original reference reports.
 *
 * Used by both the HTML/PDF renderer and the Word export so the two
 * documents paginate identically.
 */
export type PhotoChunkKind = "grid" | "big" | "duo";

export interface PhotoChunk {
  kind: PhotoChunkKind;
  /** index of the first photo of this page within the section */
  start: number;
  count: number;
}

/**
 * Size-aware pagination: each photo may carry an explicit print size
 * (full = own page, half = 2/page, quarter = 4/page); consecutive photos of
 * the same explicit size share pages, and runs of "auto" photos fall back to
 * the default grid-then-big pattern above. Order is always preserved.
 */
export function photoPageChunksSized(sizes: (string | undefined)[]): PhotoChunk[] {
  const chunks: PhotoChunk[] = [];
  let i = 0;
  while (i < sizes.length) {
    const s = sizes[i] && sizes[i] !== "auto" ? sizes[i] : "auto";
    let j = i;
    while (j < sizes.length && ((sizes[j] && sizes[j] !== "auto" ? sizes[j] : "auto") === s)) j++;
    const runLen = j - i;
    if (s === "full") {
      for (let k = 0; k < runLen; k++) chunks.push({ kind: "big", start: i + k, count: 1 });
    } else if (s === "half") {
      for (let k = 0; k < runLen; k += 2) {
        const count = Math.min(2, runLen - k);
        chunks.push(count === 2 ? { kind: "duo", start: i + k, count } : { kind: "big", start: i + k, count });
      }
    } else if (s === "quarter") {
      for (let k = 0; k < runLen; k += 4) {
        const count = Math.min(4, runLen - k);
        chunks.push(
          count >= 2
            ? { kind: "grid", start: i + k, count }
            : { kind: "big", start: i + k, count },
        );
      }
    } else {
      for (const c of photoPageChunks(runLen)) {
        chunks.push({ ...c, start: c.start + i });
      }
    }
    i = j;
  }
  return chunks;
}

export function photoPageChunks(n: number): PhotoChunk[] {
  const chunks: PhotoChunk[] = [];
  let i = 0;
  while (n - i >= 4) {
    chunks.push({ kind: "grid", start: i, count: 4 });
    i += 4;
  }
  const rem = n - i;
  if (i === 0) {
    // Fewer than four photos in the whole section: every shot gets its
    // own page, exactly like the original reference reports.
    for (; i < n; i++) chunks.push({ kind: "big", start: i, count: 1 });
  } else if (rem === 3) {
    chunks.push({ kind: "big", start: i, count: 1 });
    chunks.push({ kind: "duo", start: i + 1, count: 2 });
  } else if (rem === 2) {
    chunks.push({ kind: "duo", start: i, count: 2 });
  } else if (rem === 1) {
    chunks.push({ kind: "big", start: i, count: 1 });
  }
  return chunks;
}
