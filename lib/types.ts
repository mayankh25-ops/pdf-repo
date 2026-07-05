export type Phase = "before" | "during" | "after";

export const PHASES: Phase[] = ["before", "during", "after"];

export const PHASE_LABEL: Record<Phase, string> = {
  before: "BEFORE",
  during: "DURING WORK",
  after: "AFTER",
};

export const PHASE_TITLE: Record<Phase, string> = {
  before: "Before",
  during: "During works",
  after: "After",
};

export type TemplateId =
  | "hero-dark"
  | "hero-light"
  | "minimal-light"
  | "minimal-dark"
  | "editorial-split";

export interface PhotoMeta {
  id: string;
  width: number;
  height: number;
  caption?: string;
}

export interface ReportData {
  title: string;
  building: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  preparedBy?: string;
  scope?: string;
  templateId: TemplateId;
  /** Paired before/after comparison layout when counts match */
  paired: boolean;
  buildingPhoto?: PhotoMeta | null;
  logo?: PhotoMeta | null;
  photos: Record<Phase, PhotoMeta[]>;
}

export interface GenerateResult {
  pdfUrl: string;
  docxUrl: string;
  expiresAt: string;
}
