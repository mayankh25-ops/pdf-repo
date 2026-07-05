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
  | "editorial-split"
  | "flow-dark"
  | "quiet-caps"
  | "accent-panel"
  | "collage-card"
  | "filmstrip";

export interface PhotoMeta {
  id: string;
  width: number;
  height: number;
  caption?: string;
}

export interface ReportData {
  /** Portal-assigned report number, e.g. "2026-0014" (set at generate time) */
  reportNo?: string;
  title: string;
  building: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  preparedBy?: string;
  scope?: string;
  /** Optional remarks shown on the last page only when filled in */
  remarks?: string;
  templateId: TemplateId;
  /** Paired before/after comparison layout when counts match */
  paired: boolean;
  buildingPhoto?: PhotoMeta | null;
  logo?: PhotoMeta | null;
  photos: Record<Phase, PhotoMeta[]>;
}

export interface GenerateResult {
  reportNo: string;
  pdfUrl: string;
  docxUrl: string;
}

export interface ReportRecord {
  reportNo: string;
  title: string;
  building: string;
  date: string;
  preparedBy?: string;
  templateId: TemplateId;
  createdAt: string;
  pdfToken: string;
  docxToken: string;
}
