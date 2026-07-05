import type { TemplateId } from "./types";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  blurb: string;
  /** Whether interior pages use dark chrome */
  dark: boolean;
  /** Whether the cover needs the building photo to look right */
  usesPhoto: boolean;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "hero-dark",
    name: "Image Hero — Dark scrim",
    blurb: "Full-bleed building photo under a dark gradient scrim, white display type.",
    dark: true,
    usesPhoto: true,
  },
  {
    id: "hero-light",
    name: "Image Hero — Light panel",
    blurb: "Photo top two-thirds, solid light panel carrying title, logo and date.",
    dark: false,
    usesPhoto: true,
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    blurb: "White page, oversized display title, hairline rules, small photo inset.",
    dark: false,
    usesPhoto: false,
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    blurb: "Near-black cover, light type, reversed logo, thin accent rule.",
    dark: true,
    usesPhoto: false,
  },
  {
    id: "editorial-split",
    name: "Editorial Split",
    blurb: "Vertical split — photo left half, typographic block right half.",
    dark: false,
    usesPhoto: true,
  },
];

export const getTemplate = (id: TemplateId): TemplateDef =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
