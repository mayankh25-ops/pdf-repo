import type { CompanyInfo, Phase, PhotoMeta, ReportData, TemplateId } from "./types";

export interface PhotoView extends PhotoMeta {
  url: string;
}

export interface ReportView {
  reportNo?: string;
  title: string;
  building: string;
  level?: string;
  area?: string;
  company?: CompanyInfo;
  date: string;
  preparedBy?: string;
  scope?: string;
  remarks?: string;
  currentSituation?: string;
  rectifications?: string;
  recommendations?: string;
  templateId: TemplateId;
  paired: boolean;
  buildingPhoto?: PhotoView | null;
  logo?: PhotoView | null;
  photos: Record<Phase, PhotoView[]>;
}

export const assetUrl = (id: string): string =>
  id.startsWith("sample:")
    ? `/samples/${id.slice(7)}`
    : id.startsWith("builtin:")
      ? `/brand/${id.slice(8)}.png`
      : `/api/images/${id}`;

export const toView = (r: ReportData, url: (id: string) => string): ReportView => ({
  ...r,
  buildingPhoto: r.buildingPhoto ? { ...r.buildingPhoto, url: url(r.buildingPhoto.id) } : null,
  logo: r.logo ? { ...r.logo, url: url(r.logo.id) } : null,
  photos: {
    before: r.photos.before.map((p) => ({ ...p, url: url(p.id) })),
    during: r.photos.during.map((p) => ({ ...p, url: url(p.id) })),
    after: r.photos.after.map((p) => ({ ...p, url: url(p.id) })),
    general: (r.photos.general ?? []).map((p) => ({ ...p, url: url(p.id) })),
  },
});

const sm = (name: string, width: number, height: number, caption?: string): PhotoView => ({
  id: `sample:${name}`,
  url: `/samples/${name}`,
  width,
  height,
  caption,
});

/** Sample report used by the template picker previews and /preview routes. */
export const FOCUSED_LOGO: PhotoMeta & { url: string } = {
  id: "builtin:focused-fm",
  url: "/brand/focused-fm.png",
  width: 72,
  height: 47,
};

export const sampleReport = (templateId: TemplateId = "improvement"): ReportView => ({
  reportNo: "2026-0001",
  title: "Floor Scrubbing & Pressure Wash",
  building: "Aurora Melbourne Central",
  level: "B1",
  area: "Corridor",
  company: { name: "Focused Facilities Management", accent: "#D9232E" },
  date: new Date().toISOString().slice(0, 10),
  preparedBy: "Nikki",
  scope:
    "Full soft-wash of the front and rear elevations including render, cladding and glazing frames; degrease and pressure-clean of loading bay and bin store; machine scrub and re-seal of lobby and stair-core hard floors; high-level dusting of communal ceilings, vents and light fittings. All works completed to the agreed specification with photographic evidence collected before, during and after each stage.",
  currentSituation:
    "Heavy soiling and staining across the B1 corridor and bin store. Odours affecting the adjacent lift lobby, with visible contamination to floors and skirtings.",
  rectifications:
    "Removed all dumped waste and completed a deep clean of the corridor. Machine-scrubbed and re-sealed the floor with a durable, easy-to-clean coating.",
  recommendations:
    "Schedule a monthly deep clean of the bin store and review waste collection frequency to prevent overflow between services.",
  templateId,
  paired: false,
  buildingPhoto: sm("building.jpg", 2400, 1600),
  logo: FOCUSED_LOGO,
  photos: {
    before: [
      sm("before-1.jpg", 1600, 1067, "Render staining, front elevation"),
      sm("before-2.jpg", 1067, 1600, "Bin store, heavy soiling"),
      sm("before-3.jpg", 1600, 1067, "Lobby floor prior to scrub"),
      sm("before-4.jpg", 1067, 1600, "Stair core, scuffed skirting"),
    ],
    during: [
      sm("during-1.jpg", 1600, 1067, "Soft-wash in progress"),
      sm("during-2.jpg", 1067, 1600, "Pressure-clean, loading bay"),
      sm("during-3.jpg", 1600, 1067),
      sm("during-4.jpg", 1067, 1600, "Machine scrub, lobby"),
    ],
    after: [
      sm("after-1.jpg", 1600, 1067, "Front elevation, complete"),
      sm("after-2.jpg", 1067, 1600, "Bin store, complete"),
      sm("after-3.jpg", 1600, 1067, "Lobby floor re-sealed"),
      sm("after-4.jpg", 1067, 1600, "Stair core, complete"),
    ],
    general: [],
  },
});
