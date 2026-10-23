"use client";

import { useEffect, useState } from "react";
import { INFO } from "@/lib/data";

const LINKS = [
  { href: "/#story", label: "The Mess" },
  { href: "/#leaf", label: "The Leaf" },
  { href: "/menu", label: "Menu" },
  { href: "/#visit", label: "Visit" },
  { href: "/order", label: "Order" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <a href="/#top" className="brand" aria-label={`${INFO.name} home`}>
            {/* Drop a square logo at /public/images/logo.png. Remove this <img> if none. */}
            <img className="logo" src="/images/logo.png" alt={`${INFO.name} logo`} />
            <span className="brand-txt">
              <b>{INFO.name}</b>
              <span className="brand-ta">{INFO.nameTa}</span>
            </span>
          </a>
          <div className="nav-links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <a href="/order" className="btn btn-primary">
            Order Online
          </a>
          <button
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      <div className={`drawer${open ? " open" : ""}`}>
        <button
          style={{
            position: "absolute",
            top: 22,
            right: 26,
            background: "none",
            border: "1px solid var(--line-strong)",
            color: "var(--cream)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 20,
          }}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a
          href={INFO.instagram}
          target="_blank"
          rel="noopener"
          onClick={() => setOpen(false)}
          className="red"
        >
          @{INFO.handle}
        </a>
      </div>
    </>
  );
}
