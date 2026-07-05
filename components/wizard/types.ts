import type { Phase, TemplateId } from "@/lib/types";

export interface UploadedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  name: string;
  caption?: string;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  title: string;
  building: string;
  date: string;
  preparedBy: string;
  scope: string;
  remarks: string;
  buildingPhoto: UploadedImage | null;
  logo: UploadedImage | null;
  templateId: TemplateId;
  photos: Record<Phase, UploadedImage[]>;
  paired: boolean;
}

export const initialState = (): WizardState => ({
  step: 1,
  title: "",
  building: "",
  date: new Date().toISOString().slice(0, 10),
  preparedBy: "",
  scope: "",
  remarks: "",
  buildingPhoto: null,
  logo: null,
  templateId: "hero-dark",
  photos: { before: [], during: [], after: [] },
  paired: false,
});

export async function uploadFiles(
  files: File[],
  kind: "photo" | "building" | "logo",
): Promise<UploadedImage[]> {
  const form = new FormData();
  form.set("kind", kind);
  for (const f of files) form.append("files", f);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed.");
  return (json.files as { id: string; width: number; height: number; name: string }[]).map(
    (f) => ({ ...f, url: `/api/images/${f.id}` }),
  );
}
