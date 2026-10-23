import { NextResponse } from "next/server";
import { listOrders, updateOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { finaliseOrder } from "@/lib/fulfil";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the safety net for when the customer's browser dies
 * between paying and telling us. Point Razorpay at /api/payments/webhook for
 * the `payment.captured` event and set RAZORPAY_WEBHOOK_SECRET.
 *
 * The raw body is needed for signature verification, so it is read as text
 * and only parsed afterwards.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const entity = event.payload?.payment?.entity;
  const rpOrderId = entity?.order_id;
  if (!rpOrderId) return NextResponse.json({ ok: true });

  const order = (await listOrders()).find(
    (o) => o.payment.razorpayOrderId === rpOrderId
  );
  if (!order || order.payment.status === "paid")
    return NextResponse.json({ ok: true });

  const updated = await updateOrder(order.id, (o) => ({
    ...o,
    status: o.status === "awaiting_payment" ? "placed" : o.status,
    payment: { ...o.payment, status: "paid", razorpayPaymentId: entity?.id },
  }));
  if (updated) await finaliseOrder(updated);

  return NextResponse.json({ ok: true });
}
