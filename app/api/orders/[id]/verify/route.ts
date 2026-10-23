import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { finaliseOrder } from "@/lib/fulfil";

export const dynamic = "force-dynamic";

/**
 * Called by the browser after Razorpay Checkout succeeds. The signature is
 * re-checked here on the server — the browser's word for "it worked" is never
 * enough to mark an order paid.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment.status === "paid")
    return NextResponse.json({ ok: true, status: order.status });

  const ok =
    body.razorpay_order_id === order.payment.razorpayOrderId &&
    Boolean(body.razorpay_payment_id) &&
    Boolean(body.razorpay_signature) &&
    verifyPaymentSignature({
      razorpayOrderId: body.razorpay_order_id!,
      razorpayPaymentId: body.razorpay_payment_id!,
      signature: body.razorpay_signature!,
    });

  if (!ok) {
    await updateOrder(id, (o) => ({
      ...o,
      payment: { ...o.payment, status: "failed" },
    }));
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  const updated = await updateOrder(id, (o) => ({
    ...o,
    status: "placed",
    payment: {
      ...o.payment,
      status: "paid",
      razorpayPaymentId: body.razorpay_payment_id,
    },
  }));

  if (updated) await finaliseOrder(updated);

  return NextResponse.json({ ok: true, status: "placed" });
}
