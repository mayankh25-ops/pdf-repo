"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorNote, Field, PrimaryButton, Spinner, inputCls } from "@/components/wizard/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Sign in failed.");
      }
      router.replace(params.get("from") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-[16px] border border-hairline bg-bg-subtle p-6 sm:p-8"
    >
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
        CLEANING WORKS REPORT GENERATOR
      </p>
      <h1 className="mb-6 mt-2 font-display text-[22px] font-semibold text-text">Sign in</h1>
      <div className="flex flex-col gap-4">
        <Field label="Username">
          <input
            className={inputCls}
            value={username}
            autoComplete="username"
            autoCapitalize="none"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className={inputCls}
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
      </div>
      <ErrorNote message={error} />
      <div className="mt-6">
        <PrimaryButton type="submit" disabled={busy} full>
          {busy ? <Spinner /> : null} Sign in
        </PrimaryButton>
      </div>
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
