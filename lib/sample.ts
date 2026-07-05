import type { Phase, PhotoMeta, ReportData, TemplateId } from "./types";

export interface PhotoView extends PhotoMeta {
  url: string;
}

export interface ReportView {
  reportNo?: string;
  title: string;
  building: string;
  date: string;
  preparedBy?: string;
  scope?: string;
  remarks?: string;
  templateId: TemplateId;
  paired: boolean;
  buildingPhoto?: PhotoView | null;
  logo?: PhotoView | null;
  photos: Record<Phase, PhotoView[]>;
}

export const toView = (r: ReportData, url: (id: string) => string): ReportView => ({
  ...r,
  buildingPhoto: r.buildingPhoto ? { ...r.buildingPhoto, url: url(r.buildingPhoto.id) } : null,
  logo: r.logo ? { ...r.logo, url: url(r.logo.id) } : null,
  photos: {
    before: r.photos.before.map((p) => ({ ...p, url: url(p.id) })),
    during: r.photos.during.map((p) => ({ ...p, url: url(p.id) })),
    after: r.photos.after.map((p) => ({ ...p, url: url(p.id) })),
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
export const sampleReport = (templateId: TemplateId = "hero-dark"): ReportView => ({
  reportNo: "2026-0001",
  title: "External Facade & Communal Areas Deep Clean",
  building: "Riverside House, 12 Embankment Way",
  date: new Date().toISOString().slice(0, 10),
  preparedBy: "J. Whitfield",
  scope:
    "Full soft-wash of the front and rear elevations including render, cladding and glazing frames; degrease and pressure-clean of loading bay and bin store; machine scrub and re-seal of lobby and stair-core hard floors; high-level dusting of communal ceilings, vents and light fittings. All works completed to the agreed specification with photographic evidence collected before, during and after each stage.",
  templateId,
  paired: false,
  buildingPhoto: sm("building.jpg", 2400, 1600),
  logo: sm("logo.svg", 320, 88),
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
  },
});
