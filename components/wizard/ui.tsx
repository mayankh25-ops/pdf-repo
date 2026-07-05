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

export const inputCls =
  "w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-tertiary outline-none transition-colors focus:border-border-strong";

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
      className={`${full ? "w-full " : ""}inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-[15px] font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
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
      className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-border bg-bg px-5 py-2.5 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
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
