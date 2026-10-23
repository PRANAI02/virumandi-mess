"use client";

import { useState, FormEvent } from "react";
import { INFO } from "@/lib/data";

export default function ReserveForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const msg = [
      `Hi ${INFO.name}, I'd like to request a table.`,
      ``,
      `Name: ${f.get("name") || "-"}`,
      `Date: ${f.get("date") || "-"}`,
      `Time: ${f.get("time") || "-"}`,
      `Guests: ${f.get("guests") || "-"}`,
      f.get("notes") ? `Notes: ${f.get("notes")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    // Open WhatsApp with the request pre-filled (works on web + mobile).
    const url = `https://wa.me/${INFO.whatsappRaw}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="form-ok">
        <b>Your request is on its way.</b>
        <p className="muted" style={{ margin: 0 }}>
          We&apos;ve opened WhatsApp with your details pre-filled — just hit
          send and the team will confirm your table shortly. Prefer to DM?{" "}
          <a href={INFO.instagram} target="_blank" rel="noopener" className="red">
            @{INFO.handle}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required placeholder="Your name" />
      </div>
      <div className="field">
        <label htmlFor="guests">Guests</label>
        <select id="guests" name="guests" defaultValue="2">
          {["1", "2", "3", "4", "5", "6", "7", "8+"].map((g) => (
            <option key={g} value={g}>
              {g} {g === "1" ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" required />
      </div>
      <div className="field">
        <label htmlFor="time">Time</label>
        <input id="time" name="time" type="time" required />
      </div>
      <div className="field full">
        <label htmlFor="notes">Occasion (optional)</label>
        <input id="notes" name="notes" placeholder="Birthday, counter seat…" />
      </div>
      <div className="field full">
        <button
          type="submit"
          className="btn btn-primary"
          style={{ justifyContent: "center" }}
        >
          Request Table via WhatsApp
        </button>
        <p className="note">
          Bookings are confirmed by the team over WhatsApp. Walk-ins welcome —
          but weekends fill up fast, so a heads-up helps.
        </p>
      </div>
    </form>
  );
}
