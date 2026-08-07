import type { Phase, PhotoSize, TemplateId } from "@/lib/types";

export interface BuildingView {
  name: string;
  /** the building's default hero photo, shown on covers automatically */
  photo: { id: string; url: string; width: number; height: number } | null;
}

export interface UploadedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  name: string;
  caption?: string;
  /** print size: full page / 2 per page / 4 per page / automatic */
  size?: PhotoSize;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  title: string;
  building: string;
  date: string;
  preparedBy: string;
  level: string;
  area: string;
  scope: string;
  remarks: string;
  currentSituation: string;
  rectifications: string;
  recommendations: string;
  buildingPhoto: UploadedImage | null;
  templateIds: TemplateId[];
  photos: Record<Phase, UploadedImage[]>;
  paired: boolean;
}

export const initialState = (): WizardState => ({
  step: 1,
  title: "",
  building: "",
  date: new Date().toISOString().slice(0, 10),
  preparedBy: "",
  level: "",
  area: "",
  scope: "",
  remarks: "",
  currentSituation: "",
  rectifications: "",
  recommendations: "",
  buildingPhoto: null,
  templateIds: ["improvement"],
  photos: { before: [], during: [], after: [], general: [] },
  paired: false,
});

/**
 * Downscales a photo in the browser before upload (long edge ≤ 2000px, JPEG).
 * Phone photos drop from ~8MB to a few hundred KB, which makes multi-image
 * uploads fast and reliable on mobile connections. EXIF orientation is baked
 * in by createImageBitmap; falls back to the original file on any failure.
 */
export async function compressImage(file: File): Promise<{ blob: Blob; name: string }> {
  const SKIP_BELOW = 1.2 * 1024 * 1024;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.size < SKIP_BELOW) {
    return { blob: file, name: file.name };
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, 2000 / longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (blob && blob.size < file.size) {
      return { blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
    }
    return { blob: file, name: file.name };
  } catch {
    return { blob: file, name: file.name };
  }
}

/**
 * Uploads ONE image with byte-level progress (XHR — fetch can't report upload
 * progress). Compresses first. Throws with a readable message on failure.
 */
export function uploadSingle(
  file: File,
  kind: "photo" | "building" | "logo",
  onProgress?: (fraction: number) => void,
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    compressImage(file).then(({ blob, name }) => {
      const form = new FormData();
      form.set("kind", kind);
      form.append("files", blob, name);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.timeout = 120_000;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.files?.[0]) {
            const f = json.files[0];
            resolve({ ...f, url: `/api/images/${f.id}` });
          } else {
            reject(new Error(json.error ?? "Upload failed."));
          }
        } catch {
          reject(new Error("Upload failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload — please retry."));
      xhr.ontimeout = () => reject(new Error("Upload timed out — please retry."));
      xhr.send(form);
    }, reject);
  });
}

/** Uploads files one at a time (compressed); kept for single-file callers. */
export async function uploadFiles(
  files: File[],
  kind: "photo" | "building" | "logo",
): Promise<UploadedImage[]> {
  const uploaded: UploadedImage[] = [];
  for (const file of files) {
    uploaded.push(await uploadSingle(file, kind));
  }
  return uploaded;
}
