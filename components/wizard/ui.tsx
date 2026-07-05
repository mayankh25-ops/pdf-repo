"use client";

/* Small shared UI atoms for the wizard. Tokens only — see design/tokens.md. */

export function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-text">
        {label}
        {optional && <span className="text-xs font-normal text-text-muted">Optional</span>}
      </span>
      {children}
    </label>
  );
}

// 16px font stops iOS Safari from zooming in on focus; min-h keeps a 44px+ target.
export const inputCls =
  "w-full min-h-12 rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-[16px] text-text placeholder:text-text-tertiary outline-none transition-colors focus:border-border-strong";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full " : ""}inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-accent px-6 py-3 text-[16px] font-medium text-accent-contrast transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border border-border bg-bg px-6 py-3 text-[16px] font-medium text-text transition-colors hover:bg-bg-hover active:bg-bg-element disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-[13px] text-text" style={{ fontWeight: 500 }}>
      ⚠ {message}
    </p>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
