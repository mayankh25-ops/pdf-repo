import type { TemplateId } from "./types";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  blurb: string;
  /** Whether interior pages use dark chrome */
  dark: boolean;
  /** Whether the cover needs the building photo to look right */
  usesPhoto: boolean;
  /** "focused" = the client's own report family (light chrome on every page,
   *  one large photo per page, Thank-you last page) */
  family?: "focused";
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "focused-photo",
    name: "Focused — Photo cover",
    blurb: "Full photo card, building pill and white title over the image, meta bar at the base.",
    dark: false,
    usesPhoto: true,
    family: "focused",
  },
  {
    id: "focused-card",
    name: "Focused — Spec card",
    blurb: "Photo card with an overlapping white spec card carrying title and meta columns.",
    dark: false,
    usesPhoto: true,
    family: "focused",
  },
  {
    id: "focused-scrim",
    name: "Focused — Dark scrim",
    blurb: "Photo card under a dark scrim, brand kicker and white meta columns.",
    dark: false,
    usesPhoto: true,
    family: "focused",
  },
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
  {
    id: "flow-dark",
    name: "Flow — Dark",
    blurb: "Near-black cover, accent display title, flowing hairline curves, accent base bar.",
    dark: true,
    usesPhoto: false,
  },
  {
    id: "quiet-caps",
    name: "Quiet Caps",
    blurb: "Letterspaced capitals centred over the darkened building photo.",
    dark: true,
    usesPhoto: true,
  },
  {
    id: "accent-panel",
    name: "Accent Panel",
    blurb: "Solid accent panel overlapping the building photo, title on the panel.",
    dark: false,
    usesPhoto: true,
  },
  {
    id: "collage-card",
    name: "Collage Card",
    blurb: "Before / during / after photo collage behind a centred white card.",
    dark: false,
    usesPhoto: true,
  },
  {
    id: "filmstrip",
    name: "Filmstrip",
    blurb: "Light cover with a vertical tagged photo filmstrip down the right edge.",
    dark: false,
    usesPhoto: true,
  },
];

export const getTemplate = (id: TemplateId): TemplateDef =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
