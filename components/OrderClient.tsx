"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedItem, Settings } from "@/lib/catalog";
import { Kaaram } from "@/components/Moustache";

type Props = {
  items: ResolvedItem[];
  settings: Settings;
  categories: string[];
  onlinePayments: boolean;
};

type Cart = Record<string, number>;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function OrderClient({
  items,
  settings,
  categories,
  onlinePayments,
}: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({});
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<"online" | "cod">(
    onlinePayments ? "online" : "cod"
  );
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Escape closes the sheet, and the page behind it is locked so a scroll
  // gesture over the backdrop doesn't drift the menu underneath.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const totals = useMemo(() => {
    const subtotal = Object.entries(cart).reduce((n, [id, qty]) => {
      const item = byId.get(id);
      return item ? n + item.price * qty : n;
    }, 0);
    const count = Object.values(cart).reduce((n, q) => n + q, 0);
    const packaging = count ? settings.packagingFee : 0;
    const freeDelivery =
      settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove;
    const delivery =
      mode === "delivery" && count && !freeDelivery ? settings.deliveryFee : 0;
    return { subtotal, count, packaging, delivery, total: subtotal + packaging + delivery };
  }, [cart, byId, mode, settings]);

  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(20, qty);
      return next;
    });

  const belowMin = totals.subtotal > 0 && totals.subtotal < settings.minOrder;

  async function placeOrder() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
          mode,
          payment,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        // Prices or availability may have moved on since the page loaded.
        router.refresh();
        return;
      }

      // Keep a copy client-side: with the in-memory store the confirmation
      // page runs in a different instance and can't see the order.
      try {
        sessionStorage.setItem(
          "vm:lastOrder",
          JSON.stringify({
            id: data.id,
            code: data.code,
            mode,
            payment: data.payment,
            lines: Object.entries(cart).flatMap(([id, qty]) => {
              const item = byId.get(id);
              return item ? [{ id, name: item.name, qty, price: item.price }] : [];
            }),
            totals: data.totals,
          })
        );
      } catch {
        /* private mode — the server copy is the only one, which is fine */
      }

      if (data.payment?.method === "cod") {
        router.push(`/order/${data.id}`);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setError("Couldn't open the payment window. Try cash on delivery.");
        return;
      }

      const rz = new window.Razorpay({
        key: data.razorpayKeyId,
        order_id: data.payment.razorpayOrderId,
        amount: data.totals.total * 100,
        currency: "INR",
        name: "Virumandi Mess",
        description: `Order ${data.code}`,
        image: "/images/logo.png",
        prefill: { name: form.name, contact: form.phone },
        theme: { color: "#d9631f" },
        handler: async (response: Record<string, string>) => {
          const v = await fetch(`/api/orders/${data.id}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          router.push(v.ok ? `/order/${data.id}` : `/order/${data.id}?payment=failed`);
        },
        modal: {
          ondismiss: () => router.push(`/order/${data.id}?payment=cancelled`),
        },
      });
      rz.open();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    totals.count > 0 &&
    !belowMin &&
    form.name.trim().length > 0 &&
    /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "")) &&
    (mode === "pickup" || form.address.trim().length >= 10);

  if (!settings.acceptingOrders) {
    return (
      <div className="order-closed">
        <h2 className="h2">Not taking orders right now</h2>
        <p className="lead">
          The kitchen is closed for orders at the moment. Do come and eat at the
          mess — {"Tue–Sun, lunch and dinner."}
        </p>
      </div>
    );
  }

  return (
    <>
      {categories.map((cat) => {
        const list = items.filter((i) => i.category === cat);
        if (!list.length) return null;
        return (
          <section className="order-cat" key={cat}>
            <h2 className="h3">{cat}</h2>
            <div className="order-items">
              {list.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <article
                    className={`order-item${item.available ? "" : " sold-out"}`}
                    key={item.id}
                  >
                    {item.img && (
                      <div className="order-thumb">
                        <img src={item.img} alt="" loading="lazy" />
                      </div>
                    )}
                    <div className="order-info">
                      <div className="order-name">
                        <span className={`veg ${item.veg ? "v" : "n"}`} />
                        {item.name}
                      </div>
                      <div className="ta">{item.ta}</div>
                      <p>{item.desc}</p>
                      <div className="order-meta">
                        <b>{rupees(item.price)}</b>
                        {item.kaaram ? <Kaaram level={item.kaaram} label={false} /> : null}
                      </div>
                    </div>
                    <div className="order-add">
                      {!item.available ? (
                        <span className="sold-tag">Finished today</span>
                      ) : qty === 0 ? (
                        <button className="btn btn-ghost" onClick={() => setQty(item.id, 1)}>
                          Add
                        </button>
                      ) : (
                        <div className="qty">
                          <button aria-label={`Remove one ${item.name}`} onClick={() => setQty(item.id, qty - 1)}>
                            −
                          </button>
                          <span>{qty}</span>
                          <button aria-label={`Add one ${item.name}`} onClick={() => setQty(item.id, qty + 1)}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {totals.count > 0 && (
        <div className="cart-bar">
          <div className="wrap cart-bar-inner">
            <div>
              <b>
                {totals.count} item{totals.count > 1 ? "s" : ""} · {rupees(totals.total)}
              </b>
              {belowMin && (
                <span className="cart-warn">
                  Minimum order {rupees(settings.minOrder)}
                </span>
              )}
            </div>
            <button
              className="btn btn-primary"
              disabled={belowMin}
              onClick={() => setOpen(true)}
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-label="Checkout"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-head">
              <h2 className="h3">Your order</h2>
              <button className="sheet-close" aria-label="Close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className="sheet-lines">
              {Object.entries(cart).map(([id, qty]) => {
                const item = byId.get(id);
                if (!item) return null;
                return (
                  <div className="sheet-line" key={id}>
                    <span>
                      {qty} × {item.name}
                    </span>
                    <span>{rupees(item.price * qty)}</span>
                  </div>
                );
              })}
            </div>

            <div className="seg">
              <button
                className={mode === "delivery" ? "on" : ""}
                onClick={() => setMode("delivery")}
              >
                Delivery
              </button>
              <button
                className={mode === "pickup" ? "on" : ""}
                onClick={() => setMode("pickup")}
              >
                Pickup
              </button>
            </div>

            <div className="fields">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
              <label>
                Mobile number
                <input
                  value={form.phone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  placeholder="10-digit number"
                />
              </label>
              {mode === "delivery" && (
                <label className="full">
                  Delivery address
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Flat / house, street, landmark, area"
                  />
                </label>
              )}
              <label className="full">
                Note for the kitchen <span className="opt">optional</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Less spice, extra rice…"
                />
              </label>
            </div>

            {onlinePayments && (
              <div className="seg">
                <button className={payment === "online" ? "on" : ""} onClick={() => setPayment("online")}>
                  Pay online
                </button>
                <button className={payment === "cod" ? "on" : ""} onClick={() => setPayment("cod")}>
                  Cash on delivery
                </button>
              </div>
            )}

            <div className="sheet-totals">
              <div>
                <span>Subtotal</span>
                <span>{rupees(totals.subtotal)}</span>
              </div>
              {totals.packaging > 0 && (
                <div>
                  <span>Packaging</span>
                  <span>{rupees(totals.packaging)}</span>
                </div>
              )}
              {mode === "delivery" && (
                <div>
                  <span>Delivery</span>
                  <span>{totals.delivery ? rupees(totals.delivery) : "Free"}</span>
                </div>
              )}
              <div className="grand">
                <span>Total</span>
                <span>{rupees(totals.total)}</span>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn btn-primary sheet-cta"
              disabled={!canSubmit || busy}
              onClick={placeOrder}
            >
              {busy
                ? "Placing…"
                : payment === "online" && onlinePayments
                  ? `Pay ${rupees(totals.total)}`
                  : `Place order · ${rupees(totals.total)}`}
            </button>
            <p className="sheet-note">
              We&apos;ll send order updates to your mobile number.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
