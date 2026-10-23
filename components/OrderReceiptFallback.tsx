"use client";

import { useEffect, useState } from "react";

type Stashed = {
  id: string;
  code: string;
  mode: "delivery" | "pickup";
  payment: { method: "online" | "cod"; status: string };
  lines: { id: string; name: string; qty: number; price: number }[];
  totals: { subtotal: number; packaging: number; delivery: number; total: number };
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Shown when the server can't find the order.
 *
 * On Vercel each request is its own serverless instance, so with the
 * in-memory fallback store an order written by /api/orders is invisible to
 * this page. The browser keeps a copy of what it just ordered, so the person
 * who placed it still gets their confirmation. Configure Upstash (SETUP.md)
 * and the server copy becomes the source of truth instead.
 */
export default function OrderReceiptFallback({ id }: { id: string }) {
  const [order, setOrder] = useState<Stashed | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vm:lastOrder");
      if (raw) {
        const parsed = JSON.parse(raw) as Stashed;
        if (parsed.id === id) setOrder(parsed);
      }
    } catch {
      /* sessionStorage unavailable — fall through to the notice below */
    }
    setChecked(true);
  }, [id]);

  if (!checked) return null;

  if (!order) {
    return (
      <div className="receipt">
        <h2 className="h3">We can&apos;t find that order</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          The link may have expired. If you&apos;ve just placed an order the
          kitchen still has it — call the mess to check, or place it again.
        </p>
        <a className="btn btn-primary" href="/order" style={{ marginTop: 18 }}>
          Back to ordering
        </a>
      </div>
    );
  }

  return (
    <div className="receipt">
      {order.lines.map((l) => (
        <div className="sheet-line" key={l.id}>
          <span>
            {l.qty} × {l.name}
          </span>
          <span>{rupees(l.price * l.qty)}</span>
        </div>
      ))}
      <div className="sheet-totals" style={{ marginTop: 12 }}>
        <div>
          <span>Subtotal</span>
          <span>{rupees(order.totals.subtotal)}</span>
        </div>
        {order.totals.packaging > 0 && (
          <div>
            <span>Packaging</span>
            <span>{rupees(order.totals.packaging)}</span>
          </div>
        )}
        {order.mode === "delivery" && (
          <div>
            <span>Delivery</span>
            <span>{order.totals.delivery ? rupees(order.totals.delivery) : "Free"}</span>
          </div>
        )}
        <div className="grand">
          <span>Total</span>
          <span>{rupees(order.totals.total)}</span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 16, fontSize: "0.92rem" }}>
        {order.mode === "delivery"
          ? "Delivered to your address by Porter."
          : "Pick up at the mess, 3rd floor, next to Polar Bear."}{" "}
        {order.payment.method === "cod" ? "Pay cash when it arrives." : "Paid online."}
      </p>
    </div>
  );
}
