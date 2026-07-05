"use client";

/*
 * Home themes — five looks for the app shell, inspired by the client's
 * reference covers (wave-line finance dark, navy/orange curves, photo hero,
 * soft field, classic neutral). Themes restyle ONLY the web UI; the report
 * documents keep their own token system.
 */

export type HomeThemeId = "classic" | "wave" | "ocean" | "photo" | "field";

export interface HomeTheme {
  id: HomeThemeId;
  name: string;
  blurb: string;
  dark: boolean;
  /** wrapper class applied to the page root */
  className: string;
  /** swatch background for the picker chip */
  swatch: string;
}

export const HOME_THEMES: HomeTheme[] = [
  {
    id: "classic",
    name: "Classic",
    blurb: "Clean neutral, matches the documents",
    dark: false,
    className: "",
    swatch: "linear-gradient(135deg, #fdfdfc 0%, #e9e8e6 100%)",
  },
  {
    id: "wave",
    name: "Wave",
    blurb: "Near-black with electric blue lines",
    dark: true,
    className: "home-wave",
    swatch: "linear-gradient(160deg, #0c0c10 55%, #4d68f9 160%)",
  },
  {
    id: "ocean",
    name: "Ocean",
    blurb: "Deep navy with warm orange curves",
    dark: true,
    className: "home-ocean",
    swatch: "linear-gradient(150deg, #122438 55%, #e8722c 175%)",
  },
  {
    id: "photo",
    name: "On site",
    blurb: "Building photography behind glass cards",
    dark: true,
    className: "home-photo",
    swatch: "linear-gradient(180deg, #6a6a64 0%, #2a2a26 100%)",
  },
  {
    id: "field",
    name: "Field",
    blurb: "Soft sage with a lime keyline",
    dark: false,
    className: "home-field",
    swatch: "linear-gradient(140deg, #f2f5ea 40%, #d3e97a 170%)",
  },
];

export const getHomeTheme = (id: string | null): HomeTheme =>
  HOME_THEMES.find((t) => t.id === id) ?? HOME_THEMES[0];

const wavePath = (w: number, baseY: number, amp: number, phase: number) => {
  const seg = w / 4;
  let d = `M -20 ${baseY}`;
  for (let i = 0; i < 5; i++) {
    const x0 = i * seg;
    const dir = (i + phase) % 2 === 0 ? 1 : -1;
    d += ` C ${x0 + seg * 0.35} ${baseY - amp * dir}, ${x0 + seg * 0.65} ${baseY + amp * dir}, ${x0 + seg} ${baseY}`;
  }
  return d;
};

/** Full-viewport decorative backdrop for the selected theme. */
export function HomeBackdrop({ theme }: { theme: HomeThemeId }) {
  if (theme === "classic") return null;

  if (theme === "wave") {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(180deg, #0b0b0e 0%, #101017 100%)" }}>
        <svg className="absolute bottom-[-4%] left-0 h-[55%] w-[140%]" viewBox="0 0 1200 500" preserveAspectRatio="none">
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={wavePath(1200, 60 + i * 28, 46 + (i % 4) * 10, i)}
              fill="none"
              stroke={i % 3 === 0 ? "#8fa2ff" : "#4d68f9"}
              strokeWidth={1.1}
              opacity={0.12 + (i / 16) * 0.5}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (theme === "ocean") {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(170deg, #10202f 0%, #16354a 70%, #123043 100%)" }}>
        <svg className="absolute -right-[10%] -top-[6%] h-[46%] w-[80%]" viewBox="0 0 800 360" preserveAspectRatio="none">
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d={`M 0 ${330 - i * 26} C 260 ${240 - i * 22}, 420 ${360 - i * 30}, 820 ${80 - i * 12}`}
              fill="none"
              stroke="#e8722c"
              strokeWidth={1.4}
              opacity={0.14 + (i / 12) * 0.4}
            />
          ))}
        </svg>
        <svg className="absolute -bottom-[4%] -left-[8%] h-[34%] w-[70%]" viewBox="0 0 700 300" preserveAspectRatio="none">
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M -20 ${40 + i * 30} C 200 ${140 + i * 22}, 380 ${-20 + i * 30}, 720 ${170 + i * 18}`}
              fill="none"
              stroke="#e8722c"
              strokeWidth={1.2}
              opacity={0.1 + (i / 9) * 0.3}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (theme === "photo") {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/samples/building.jpg" alt="" className="size-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,8,0.72) 0%, rgba(10,10,8,0.82) 55%, rgba(10,10,8,0.92) 100%)" }} />
      </div>
    );
  }

  // field
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "radial-gradient(120% 90% at 15% 0%, #f5f7ee 0%, #eef2e2 55%, #e4ecd2 100%)" }}>
      <div
        className="absolute inset-x-[6%] top-[10%] h-[70%] rounded-[28px]"
        style={{ border: "1.5px solid rgba(180, 205, 90, 0.45)" }}
      />
      <div
        className="absolute -bottom-[20%] -right-[12%] size-[46vw] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(211,233,122,0.35) 0%, transparent 70%)" }}
      />
    </div>
  );
}

/** Compact theme chooser shown on the home page. */
export function ThemePicker({
  value,
  onChange,
}: {
  value: HomeThemeId;
  onChange: (id: HomeThemeId) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
        PORTAL LOOK
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {HOME_THEMES.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={active}
              title={t.blurb}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-[12px] p-1.5 transition-shadow ${
                active ? "ring-2 ring-accent" : "hover:bg-bg-hover"
              }`}
            >
              <span
                className="block h-12 w-16 rounded-[8px] border border-hairline"
                style={{ background: t.swatch }}
              />
              <span className={`text-[12px] ${active ? "font-semibold text-text" : "text-text-muted"}`}>
                {t.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
