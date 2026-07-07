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
