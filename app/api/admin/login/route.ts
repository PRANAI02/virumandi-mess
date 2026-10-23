import { NextResponse } from "next/server";
import {
  passwordMatches,
  makeToken,
  adminConfigured,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not set up yet — ADMIN_PASSWORD is missing." },
      { status: 503 }
    );
  }

  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!password || !passwordMatches(password)) {
    // Slow the loop down a little so the password can't be brute-forced fast.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  // Secure is keyed off the actual request protocol rather than NODE_ENV:
  // a Secure cookie is silently dropped over plain http, which would lock
  // admin out when the site is run locally in production mode.
  const proto =
    req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
