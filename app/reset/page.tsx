"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorNote, Field, PrimaryButton, Spinner, inputCls } from "@/components/wizard/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: params.get("email"),
          token: params.get("token"),
          password,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Reset failed.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
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
      <h1 className="mb-5 mt-2 font-display text-[22px] font-semibold text-text">
        Choose a new password
      </h1>
      <Field label="New password">
        <input
          type="password"
          className={inputCls}
          value={password}
          autoComplete="new-password"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <ErrorNote message={error} />
      <div className="mt-6">
        <PrimaryButton type="submit" disabled={busy} full>
          {busy ? <Spinner /> : null} Set password & sign in
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function ResetPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </main>
  );
}
