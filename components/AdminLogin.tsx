"use client";

import { useState } from "react";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) location.reload();
    else setError(((await res.json()) as { error?: string }).error || "Wrong password.");
    setBusy(false);
  }

  if (!configured) {
    return (
      <div className="admin-warn">
        <p>
          <b>Admin isn&apos;t set up yet.</b> Set an <code>ADMIN_PASSWORD</code>{" "}
          environment variable in the Vercel project, redeploy, and this page
          will ask for it. Until then it stays locked.
        </p>
      </div>
    );
  }

  return (
    <form className="admin-login" onSubmit={submit}>
      <label>
        Password
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Staff password"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={busy || !password}>
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
