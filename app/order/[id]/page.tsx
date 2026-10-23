import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getOrder, STATUS_FLOW, STATUS_LABEL, rupees } from "@/lib/orders";
import { INFO } from "@/lib/data";
import OrderReceiptFallback from "@/components/OrderReceiptFallback";

export const dynamic = "force-dynamic";

// A receipt with an order reference — never let this into a search index.
export const metadata = { robots: { index: false, follow: false } };

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const order = await getOrder(id);

  if (!order) {
    return (
      <>
        <Nav />
        <main>
          <header className="menu-hero">
            <div className="wrap">
              <a href="/order" className="back-link">
                ← Order again
              </a>
              <h1 className="display" style={{ marginTop: 20 }}>
                Order placed
              </h1>
            </div>
          </header>
          <section className="section" style={{ paddingTop: 48 }}>
            <div className="wrap" style={{ maxWidth: 720 }}>
              <OrderReceiptFallback id={id} />
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const stepIndex = STATUS_FLOW.indexOf(order.status);
  const cancelled = order.status === "cancelled";
  const awaiting = order.status === "awaiting_payment";

  return (
    <>
      <Nav />
      <main>
        <header className="menu-hero">
          <div className="wrap">
            <a href="/order" className="back-link">
              ← Order again
            </a>
            <h1 className="display" style={{ marginTop: 20 }}>
              {cancelled ? "Order cancelled" : awaiting ? "Payment pending" : "Order placed"}
            </h1>
            <p className="lead" style={{ marginTop: 14 }}>
              Reference <b>{order.code}</b> · we&apos;ll call {order.customer.phone} if
              the kitchen needs anything.
            </p>
          </div>
        </header>

        <section className="section" style={{ paddingTop: 48 }}>
          <div className="wrap" style={{ maxWidth: 720 }}>
            {payment === "failed" && (
              <p className="form-error">
                That payment didn&apos;t go through. Nothing has been charged —
                place the order again, or choose cash on delivery.
              </p>
            )}
            {payment === "cancelled" && (
              <p className="form-error">
                Payment window closed before it finished. Nothing has been charged.
              </p>
            )}

            {!cancelled && !awaiting && (
              <ol className="track">
                {STATUS_FLOW.map((s, i) => (
                  <li key={s} className={i <= stepIndex ? "done" : ""}>
                    <span className="dot" />
                    {STATUS_LABEL[s]}
                  </li>
                ))}
              </ol>
            )}

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
                    <span>
                      {order.totals.delivery ? rupees(order.totals.delivery) : "Free"}
                    </span>
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
                  : `Pick up at ${INFO.landmark}.`}{" "}
                {order.payment.method === "cod"
                  ? "Pay cash when it arrives."
                  : order.payment.status === "paid"
                    ? "Paid online."
                    : "Payment pending."}
              </p>
              {order.delivery?.trackingUrl && (
                <a
                  className="btn btn-ghost"
                  href={order.delivery.trackingUrl}
                  target="_blank"
                  rel="noopener"
                  style={{ marginTop: 18 }}
                >
                  Track the rider
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
