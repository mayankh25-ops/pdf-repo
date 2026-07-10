"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserRow {
  email: string;
  name: string;
  status: "pending" | "active" | "rejected";
  createdAt: string;
}

const STATUS_STYLE: Record<UserRow["status"], { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FBF3E2", fg: "#7A5A12", label: "PENDING" },
  active: { bg: "rgba(30,158,87,0.10)", fg: "#1E9E57", label: "ACTIVE" },
  rejected: { bg: "rgba(217,35,46,0.09)", fg: "#D9232E", label: "REJECTED" },
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch("/api/users")
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) throw new Error(json.error ?? "Could not load users.");
        setUsers(json.users);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load users."));

  useEffect(() => {
    void load();
  }, []);

  const act = async (email: string, action: "approve" | "reject") => {
    setBusy(email);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Action failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const pending = users?.filter((u) => u.status === "pending") ?? [];
  const others = users?.filter((u) => u.status !== "pending") ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
            USER MANAGEMENT
          </p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-[-0.01em] text-text">
            Account requests
          </h1>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-[12px] border border-border bg-bg-subtle px-4 py-2 text-[14px] font-semibold text-text transition-colors hover:bg-bg-hover"
        >
          Home
        </Link>
      </header>

      {error && (
        <div className="mb-4 rounded-[12px] border border-hairline bg-bg-subtle p-4 text-[14px] text-text">
          ⚠ {error}
        </div>
      )}

      {users !== null && (
        <>
          <h2 className="mb-3 text-[15px] font-bold text-text">
            Pending {pending.length > 0 && `(${pending.length})`}
          </h2>
          <ul className="mb-8 flex flex-col gap-3">
            {pending.length === 0 && (
              <li className="rounded-[12px] border border-hairline bg-bg-subtle p-6 text-center text-[14px] text-text-muted">
                No pending requests.
              </li>
            )}
            {pending.map((u) => (
              <li
                key={u.email}
                className="flex flex-col gap-3 rounded-[14px] border border-hairline bg-bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-text">{u.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-text-muted">{u.email}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busy === u.email}
                    onClick={() => act(u.email, "approve")}
                    className="rounded-[10px] bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === u.email}
                    onClick={() => act(u.email, "reject")}
                    className="rounded-[10px] border border-border bg-bg px-4 py-2.5 text-[14px] font-semibold text-text transition-colors hover:bg-bg-hover disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mb-3 text-[15px] font-bold text-text">All users</h2>
          <ul className="flex flex-col gap-2">
            {others.length === 0 && (
              <li className="rounded-[12px] border border-hairline bg-bg-subtle p-6 text-center text-[14px] text-text-muted">
                No user accounts yet.
              </li>
            )}
            {others.map((u) => {
              const s = STATUS_STYLE[u.status];
              return (
                <li
                  key={u.email}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-hairline bg-bg-subtle px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-medium text-text">{u.name}</p>
                    <p className="truncate text-[12.5px] text-text-muted">{u.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em]"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {s.label}
                    </span>
                    {u.status === "active" ? (
                      <button
                        type="button"
                        disabled={busy === u.email}
                        onClick={() => act(u.email, "reject")}
                        className="text-[13px] font-medium text-text-muted underline decoration-hairline underline-offset-2 hover:text-text disabled:opacity-40"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === u.email}
                        onClick={() => act(u.email, "approve")}
                        className="text-[13px] font-medium text-text-muted underline decoration-hairline underline-offset-2 hover:text-text disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
