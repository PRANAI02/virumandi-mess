import { type Order } from "./orders";

/**
 * Porter dispatch.
 *
 * IMPORTANT: Porter does not publish an open API spec — order-creation access
 * comes with a Porter Enterprise account and their integration doc. So this is
 * written as a thin adapter rather than a guess dressed up as an integration:
 * the endpoint, the auth header and the request body are all configurable, and
 * `buildPorterPayload` is the single function to line up with whatever their
 * doc says once you have the account.
 *
 * Env:
 *   PORTER_API_BASE     e.g. https://api.porter.in  (from your Porter doc)
 *   PORTER_API_KEY      the key/token they issue
 *   PORTER_AUTH_HEADER  header name, defaults to "x-api-key"
 *   PORTER_CREATE_PATH  path for creating a trip, defaults to "/v1/orders"
 *   PICKUP_*            the mess's pickup details (below)
 *
 * Until those are set, dispatch is "manual": the order is recorded and the
 * mess books the trip in the Porter app. Nothing silently fails.
 */

export function porterConfigured(): boolean {
  return Boolean(process.env.PORTER_API_BASE && process.env.PORTER_API_KEY);
}

const PICKUP = {
  name: process.env.PICKUP_NAME || "Virumandi Mess",
  phone: process.env.PICKUP_PHONE || "",
  address:
    process.env.PICKUP_ADDRESS ||
    "3rd Floor, 412/1, 5th Main Road, HRBR Layout 2nd Block, Kalyan Nagar, Bengaluru, Karnataka 560043",
  lat: process.env.PICKUP_LAT || "",
  lng: process.env.PICKUP_LNG || "",
};

/** The one function to reconcile with Porter's integration doc. */
export function buildPorterPayload(order: Order) {
  return {
    request_id: order.id,
    delivery_instructions: order.customer.note || undefined,
    pickup_details: {
      address: {
        contact_name: PICKUP.name,
        contact_phone: PICKUP.phone,
        address_line: PICKUP.address,
        lat: PICKUP.lat || undefined,
        lng: PICKUP.lng || undefined,
      },
    },
    drop_details: {
      address: {
        contact_name: order.customer.name,
        contact_phone: `+91${order.customer.phone}`,
        address_line: order.customer.address || "",
      },
    },
    order_details: {
      reference: order.code,
      amount: order.totals.total,
      // COD orders need the rider to collect; prepaid ones don't.
      collect_amount:
        order.payment.method === "cod" ? order.totals.total : 0,
    },
  };
}

export type DispatchResult = {
  provider: "porter" | "manual";
  reference?: string;
  trackingUrl?: string;
  error?: string;
};

export async function dispatchDelivery(order: Order): Promise<DispatchResult> {
  if (order.mode !== "delivery") return { provider: "manual" };
  if (!porterConfigured()) {
    return { provider: "manual", error: "Porter not configured — book the trip in the Porter app" };
  }

  const base = process.env.PORTER_API_BASE!.replace(/\/$/, "");
  const path = process.env.PORTER_CREATE_PATH || "/v1/orders";
  const header = process.env.PORTER_AUTH_HEADER || "x-api-key";

  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        [header]: process.env.PORTER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPorterPayload(order)),
    });
    const text = await res.text();
    if (!res.ok) {
      return { provider: "porter", error: `Porter ${res.status}: ${text.slice(0, 300)}` };
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* Porter returned something non-JSON; keep the raw text as the reference */
    }
    return {
      provider: "porter",
      reference: String(parsed.order_id ?? parsed.id ?? text.slice(0, 60)),
      trackingUrl: (parsed.tracking_url as string) || undefined,
    };
  } catch (err) {
    return { provider: "porter", error: String(err) };
  }
}
