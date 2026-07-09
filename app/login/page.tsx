"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorNote, Field, PrimaryButton, Spinner, inputCls } from "@/components/wizard/ui";

type Mode = "signin" | "register" | "forgot";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
    return json;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        await post("/api/login", { username, password });
        router.replace(params.get("from") || "/");
        router.refresh();
        return;
      }
      if (mode === "register") {
        await post("/api/register", { name, email: username, password });
        router.replace("/");
        router.refresh();
        return;
      }
      const json = await post("/api/forgot", { email: username });
      setNotice(
        json.sent
          ? "If an account exists for that email, a reset link is on its way."
          : "Email sending isn't configured on this portal yet — ask your admin to reset your password (or to set RESEND_API_KEY).",
      );
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-[16px] border border-hairline bg-bg-subtle p-6 sm:p-8"
    >
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
        CLEANING WORKS REPORT GENERATOR
      </p>
      <h1 className="mb-5 mt-2 font-display text-[22px] font-semibold text-text">
        {mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Reset password"}
      </h1>

      <div className="mb-5 flex gap-1 rounded-[12px] border border-border bg-bg p-1">
        {(
          [
            ["signin", "Sign in"],
            ["register", "Create account"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
            className={`min-h-10 flex-1 rounded-[9px] text-[14px] font-medium transition-colors ${
              mode === m ? "bg-accent text-accent-contrast" : "text-text-muted hover:bg-bg-hover"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {mode === "register" && (
          <Field label="Your name">
            <input
              className={inputCls}
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
        )}
        <Field label={mode === "signin" ? "Email or username" : "Email"}>
          <input
            className={inputCls}
            value={username}
            type={mode === "signin" ? "text" : "email"}
            autoComplete="username"
            autoCapitalize="none"
            autoFocus={mode === "signin"}
            enterKeyHint={mode === "forgot" ? "go" : "next"}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              // Enter on the username jumps straight to the password field.
              if (e.key === "Enter" && mode !== "forgot") {
                e.preventDefault();
                passwordRef.current?.focus();
              }
            }}
            required
          />
        </Field>
        {mode !== "forgot" && (
          <Field label="Password">
            <input
              ref={passwordRef}
              type="password"
              className={inputCls}
              value={password}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 8 : undefined}
              enterKeyHint="go"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        )}
      </div>

      <ErrorNote message={error} />
      {notice && <p className="mt-3 text-[13.5px] leading-relaxed text-text-muted">{notice}</p>}

      <div className="mt-6">
        <PrimaryButton type="submit" disabled={busy} full>
          {busy ? <Spinner /> : null}{" "}
          {mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
        </PrimaryButton>
      </div>

      {mode === "signin" ? (
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="mt-4 w-full text-center text-[13.5px] text-text-muted underline decoration-hairline underline-offset-2 hover:text-text"
        >
          Forgot password?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className="mt-4 w-full text-center text-[13.5px] text-text-muted underline decoration-hairline underline-offset-2 hover:text-text"
        >
          Back to sign in
        </button>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
