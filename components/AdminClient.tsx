"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResolvedItem, Settings } from "@/lib/catalog";
import type { Order, OrderStatus } from "@/lib/orders";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  accepted: "cooking",
  cooking: "out_for_delivery",
  out_for_delivery: "completed",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  placed: "New",
  accepted: "Accepted",
  cooking: "Cooking",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

type AdminOrder = Order & { whatsappUrl: string };

export default function AdminClient({
  durable,
  integrations,
}: {
  durable: boolean;
  integrations: { razorpay: boolean; whatsapp: boolean; porter: boolean };
}) {
  const [tab, setTab] = useState<"orders" | "kitchen">("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [items, setItems] = useState<ResolvedItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.ok) setOrders((await res.json()).orders);
  }, []);

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/admin/catalog", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setSettings(data.settings);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadOrders(), loadCatalog()]).finally(() => setLoading(false));
  }, [loadOrders, loadCatalog]);

  // Poll while the orders board is open so new orders appear without a refresh.
  useEffect(() => {
    if (tab !== "orders") return;
    const t = setInterval(loadOrders, 15000);
    return () => clearInterval(t);
  }, [tab, loadOrders]);

  async function setStatus(id: string, status: OrderStatus) {
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadOrders();
  }

  async function patchCatalog(payload: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setSettings(data.settings);
    }
    setSaving(false);
  }

  const live = orders.filter(
    (o) => !["completed", "cancelled", "awaiting_payment"].includes(o.status)
  );
  const past = orders.filter((o) =>
    ["completed", "cancelled", "awaiting_payment"].includes(o.status)
  );

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="seg">
          <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
            Orders {live.length ? `(${live.length})` : ""}
          </button>
          <button className={tab === "kitchen" ? "on" : ""} onClick={() => setTab("kitchen")}>
            Today&apos;s card
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            location.href = "/admin";
          }}
        >
          Sign out
        </button>
      </div>

      {(!durable || !settings?.pricesConfirmed) && (
        <div className="admin-warn">
          {!settings?.pricesConfirmed && (
            <p>
              <b>Set your real prices.</b> The amounts below are placeholders —
              no price list for the mess was available. Edit them under
              &ldquo;Today&apos;s card&rdquo;, then tick &ldquo;prices
              confirmed&rdquo; to clear this.
            </p>
          )}
          {!durable && (
            <p>
              <b>Storage is temporary.</b> Orders are held in memory and are lost
              when the server restarts. Add <code>KV_REST_API_URL</code> and{" "}
              <code>KV_REST_API_TOKEN</code> to keep them.
            </p>
          )}
        </div>
      )}

      {tab === "orders" && (
        <>
          {loading && <p className="muted">Loading…</p>}
          {!loading && !live.length && <p className="muted">No live orders.</p>}

          {live.map((o) => (
            <article className="ord" key={o.id}>
              <div className="ord-top">
                <div>
                  <b>{o.code}</b>
                  <span className={`pill s-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="pill">
                    {o.mode === "delivery" ? "Delivery" : "Pickup"}
                  </span>
                  <span className={`pill ${o.payment.status === "paid" ? "paid" : ""}`}>
                    {o.payment.method === "cod"
                      ? "Cash"
                      : o.payment.status === "paid"
                        ? "Paid"
                        : "Unpaid"}
                  </span>
                </div>
                <time>{new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
              </div>

              <div className="ord-lines">
                {o.lines.map((l) => (
                  <div key={l.id}>
                    <span>
                      {l.qty} × {l.name}
                    </span>
                    <span>{rupees(l.price * l.qty)}</span>
                  </div>
                ))}
                <div className="ord-total">
                  <span>Total</span>
                  <span>{rupees(o.totals.total)}</span>
                </div>
              </div>

              <div className="ord-cust">
                <div>
                  <b>{o.customer.name}</b> ·{" "}
                  <a href={`tel:+91${o.customer.phone}`}>{o.customer.phone}</a>
                </div>
                {o.customer.address && <div className="muted">{o.customer.address}</div>}
                {o.customer.note && <div className="note-line">Note: {o.customer.note}</div>}
                {o.delivery?.error && (
                  <div className="note-line warn">Delivery: {o.delivery.error}</div>
                )}
                {o.delivery?.reference && (
                  <div className="muted">Porter ref: {o.delivery.reference}</div>
                )}
                {o.notified === false && (
                  <div className="note-line warn">
                    WhatsApp alert didn&apos;t send — use the button below.
                  </div>
                )}
              </div>

              <div className="ord-actions">
                {NEXT_STATUS[o.status] && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setStatus(o.id, NEXT_STATUS[o.status]!)}
                  >
                    Mark {STATUS_LABEL[NEXT_STATUS[o.status]!]}
                  </button>
                )}
                <a className="btn btn-ghost" href={o.whatsappUrl} target="_blank" rel="noopener">
                  Send on WhatsApp
                </a>
                <button className="btn btn-ghost" onClick={() => setStatus(o.id, "cancelled")}>
                  Cancel
                </button>
              </div>
            </article>
          ))}

          {past.length > 0 && (
            <>
              <h3 className="h3" style={{ marginTop: 40, marginBottom: 14 }}>
                Earlier
              </h3>
              <div className="ord-past">
                {past.slice(0, 30).map((o) => (
                  <div key={o.id}>
                    <span>
                      {o.code} · {o.customer.name} · {rupees(o.totals.total)}
                    </span>
                    <span className="muted">{STATUS_LABEL[o.status]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "kitchen" && settings && (
        <>
          <div className="admin-settings">
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.acceptingOrders}
                onChange={(e) => patchCatalog({ settings: { acceptingOrders: e.target.checked } })}
              />
              Taking orders
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.pricesConfirmed}
                onChange={(e) => patchCatalog({ settings: { pricesConfirmed: e.target.checked } })}
              />
              Prices confirmed
            </label>
            {(
              [
                ["deliveryFee", "Delivery fee"],
                ["packagingFee", "Packaging"],
                ["minOrder", "Minimum order"],
                ["freeDeliveryAbove", "Free delivery above (0 = never)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="num">
                {label}
                <input
                  type="number"
                  min={0}
                  defaultValue={settings[key]}
                  onBlur={(e) => patchCatalog({ settings: { [key]: Number(e.target.value) } })}
                />
              </label>
            ))}
          </div>

          <p className="muted" style={{ margin: "18px 0" }}>
            Untick an item to take it off the site when it runs out. Prices save
            when you click away. {saving && <em>Saving…</em>}
          </p>

          <div className="admin-items">
            {items.map((item) => (
              <div className={`admin-item${item.available ? "" : " off"}`} key={item.id}>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={(e) => {
                      const unavailable = items
                        .filter((i) =>
                          i.id === item.id ? !e.target.checked : !i.available
                        )
                        .map((i) => i.id);
                      patchCatalog({ unavailable });
                    }}
                  />
                  <span>
                    <b>{item.name}</b>
                    <em>{item.ta}</em>
                  </span>
                </label>
                <div className="admin-price">
                  ₹
                  <input
                    type="number"
                    min={0}
                    defaultValue={item.price}
                    onBlur={(e) =>
                      patchCatalog({ price: { [item.id]: Number(e.target.value) } })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-integrations">
            <h3 className="h3">Connections</h3>
            <ul>
              <li className={integrations.razorpay ? "ok" : ""}>
                Razorpay — {integrations.razorpay ? "connected" : "not set up (cash only)"}
              </li>
              <li className={integrations.whatsapp ? "ok" : ""}>
                WhatsApp alerts —{" "}
                {integrations.whatsapp ? "connected" : "not set up (use the button on each order)"}
              </li>
              <li className={integrations.porter ? "ok" : ""}>
                Porter —{" "}
                {integrations.porter ? "connected" : "not set up (book trips in the Porter app)"}
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
