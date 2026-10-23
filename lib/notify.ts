import { type Order, rupees } from "./orders";

/**
 * WhatsApp alert to the mess when an order comes in.
 *
 * Uses Meta's WhatsApp Cloud API. Meta only allows free-form text inside a
 * 24-hour customer service window, so business-initiated alerts must go
 * through an approved *template*. Set WHATSAPP_TEMPLATE_NAME to a template
 * with a single body parameter and the order summary is passed into it;
 * without it we fall back to a plain text message, which works while you are
 * testing from the Meta dashboard.
 *
 * Required env:
 *   WHATSAPP_TOKEN            permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's id
 *   WHATSAPP_TO               the mess's number, digits only, e.g. 9198...
 * Optional:
 *   WHATSAPP_TEMPLATE_NAME    approved template name
 *   WHATSAPP_TEMPLATE_LANG    defaults to en
 *
 * With none of these set this is a no-op that reports back why, so ordering
 * still works and the order is always visible in /admin.
 */

export function orderSummary(order: Order): string {
  const lines = order.lines
    .map((l) => `• ${l.qty} × ${l.name} — ${rupees(l.price * l.qty)}`)
    .join("\n");

  const where =
    order.mode === "delivery"
      ? `Deliver to: ${order.customer.address ?? "—"}`
      : "Pickup at the mess";

  return [
    `New order ${order.code}`,
    "",
    lines,
    "",
    `Subtotal ${rupees(order.totals.subtotal)}`,
    order.totals.packaging ? `Packaging ${rupees(order.totals.packaging)}` : "",
    order.totals.delivery ? `Delivery ${rupees(order.totals.delivery)}` : "",
    `Total ${rupees(order.totals.total)}`,
    "",
    `${order.customer.name} — ${order.customer.phone}`,
    where,
    order.customer.note ? `Note: ${order.customer.note}` : "",
    `Payment: ${order.payment.method === "online" ? "Paid online" : "Cash on delivery"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type NotifyResult = { sent: boolean; reason?: string };

export async function notifyRestaurant(order: Order): Promise<NotifyResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_TO;

  if (!token || !phoneNumberId || !to) {
    return { sent: false, reason: "WhatsApp env vars not configured" };
  }

  const summary = orderSummary(order);
  const template = process.env.WHATSAPP_TEMPLATE_NAME;

  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: summary.replace(/\n/g, " | ") }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: summary },
      };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      return { sent: false, reason: `WhatsApp API ${res.status}: ${await res.text()}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

/**
 * A wa.me link preloaded with the order — the manual fallback the mess can tap
 * from /admin when the Cloud API isn't set up yet.
 */
export function whatsappHandoffUrl(order: Order, to?: string): string {
  const number = (to || process.env.NEXT_PUBLIC_MESS_WHATSAPP || "").replace(/\D/g, "");
  const text = encodeURIComponent(orderSummary(order));
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
