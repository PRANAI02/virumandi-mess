import crypto from "node:crypto";

/**
 * Razorpay, called over plain REST so there's no SDK dependency.
 *
 * Required env for online payments:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID   (the same key id, exposed to Checkout)
 * Optional:
 *   RAZORPAY_WEBHOOK_SECRET       to verify webhook callbacks
 *
 * With the keys unset the site still takes cash-on-delivery orders and the
 * online option is hidden, so nothing half-works.
 */

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function auth(): string {
  const raw = `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

export type RazorpayOrder = { id: string; amount: number; currency: string };

/** amountRupees is converted to paise, which is what Razorpay expects. */
export async function createRazorpayOrder(
  amountRupees: number,
  receipt: string
): Promise<RazorpayOrder> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) throw new Error(`razorpay: ${res.status} ${await res.text()}`);
  return (await res.json()) as RazorpayOrder;
}

/**
 * Checkout returns order_id, payment_id and a signature. The signature is
 * HMAC-SHA256 of "order_id|payment_id" keyed with the secret. Compared in
 * constant time so the check can't be probed byte by byte.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, params.signature);
}

/** Webhook bodies are signed over the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
