import { kvGet, kvSet, kvListPush, kvListRange, kvListTrim, kvMGet } from "./store";
import { getCatalog, type Settings } from "./catalog";

export type OrderStatus =
  | "awaiting_payment"
  | "placed"
  | "accepted"
  | "cooking"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "cooking",
  "out_for_delivery",
  "completed",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  placed: "Placed",
  accepted: "Accepted",
  cooking: "Cooking",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type OrderLine = {
  id: string;
  name: string;
  qty: number;
  price: number; // unit price at time of order
};

export type Order = {
  id: string;
  code: string; // short human reference, e.g. VM-8341
  createdAt: string;
  status: OrderStatus;
  mode: "delivery" | "pickup";
  payment: {
    method: "online" | "cod";
    status: "pending" | "paid" | "failed";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  customer: { name: string; phone: string; address?: string; note?: string };
  lines: OrderLine[];
  totals: {
    subtotal: number;
    packaging: number;
    delivery: number;
    total: number;
  };
  delivery?: {
    provider: "porter" | "manual";
    reference?: string;
    trackingUrl?: string;
    error?: string;
  };
  notified?: boolean;
};

const INDEX = "vm:orderids";
const orderKey = (id: string) => `vm:order:${id}`;
const MAX = 200;

export type CartLine = { id: string; qty: number };

/**
 * Prices always come from the catalogue on the server — the browser only ever
 * sends item ids and quantities, so a tampered cart can't change what is
 * charged.
 */
export const MAX_QTY_PER_ITEM = 20;
export const MAX_UNITS_PER_ORDER = 40;

export async function priceCart(
  cart: CartLine[],
  mode: "delivery" | "pickup"
): Promise<{
  lines: OrderLine[];
  totals: Order["totals"];
  settings: Settings;
  problems: string[];
}> {
  const { items, settings } = await getCatalog();
  const problems: string[] = [];

  // Collapse repeats first: a cart with the same id twice used to become two
  // lines, which both looked wrong on the kitchen ticket and let the per-item
  // cap be multiplied by repeating the entry.
  const merged = new Map<string, number>();
  for (const entry of cart) {
    const qty = Math.floor(Number(entry.qty) || 0);
    if (qty <= 0 || typeof entry.id !== "string") continue;
    merged.set(entry.id, (merged.get(entry.id) ?? 0) + qty);
  }

  const lines: OrderLine[] = [];
  let units = 0;

  for (const [id, rawQty] of merged) {
    const item = items.find((i) => i.id === id);
    if (!item) {
      problems.push(`That item is no longer on the card.`);
      continue;
    }
    if (!item.available) {
      problems.push(`${item.name} is finished for today.`);
      continue;
    }
    const qty = Math.min(rawQty, MAX_QTY_PER_ITEM, MAX_UNITS_PER_ORDER - units);
    if (qty <= 0) {
      problems.push(
        `That's more than ${MAX_UNITS_PER_ORDER} portions — call the mess for a bulk order.`
      );
      break;
    }
    units += qty;
    lines.push({ id: item.id, name: item.name, qty, price: item.price });
  }

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const packaging = lines.length ? settings.packagingFee : 0;
  const freeDelivery =
    settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove;
  const delivery =
    mode === "delivery" && !freeDelivery ? settings.deliveryFee : 0;

  return {
    lines,
    totals: {
      subtotal,
      packaging,
      delivery,
      total: subtotal + packaging + delivery,
    },
    settings,
    problems,
  };
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""));
}

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.replace(/^91(?=\d{10}$)/, "");
}

/**
 * Each order is its own key, with a separate index list of ids.
 *
 * The previous shape — one JSON array of every order — meant two people
 * checking out at the same moment both read the array and both wrote it back,
 * so one order silently vanished. Per-order keys mean a write only ever
 * touches that order, and the index is appended with an atomic list push.
 */
export async function listOrders(limit = MAX): Promise<Order[]> {
  const ids = await kvListRange(INDEX, 0, limit - 1);
  if (!ids.length) return [];
  const orders = await kvMGet<Order>(ids.map(orderKey));
  return orders.filter((o): o is Order => Boolean(o));
}

export async function getOrder(id: string): Promise<Order | null> {
  return kvGet<Order>(orderKey(id));
}

export async function saveOrder(order: Order): Promise<Order> {
  await kvSet(orderKey(order.id), order);
  await kvListPush(INDEX, order.id);
  await kvListTrim(INDEX, MAX);
  return order;
}

export async function updateOrder(
  id: string,
  fn: (o: Order) => Order
): Promise<Order | null> {
  const current = await getOrder(id);
  if (!current) return null;
  const next = fn(current);
  await kvSet(orderKey(id), next);
  return next;
}

/**
 * The reference code is derived from the id rather than rolled separately —
 * a random 4-digit code collided roughly once every 9,000 orders, which would
 * put two different tickets on the same number.
 */
export function newOrderIds() {
  const rand = Math.random().toString(36).slice(2, 10);
  const id = `${Date.now().toString(36)}${rand}`;
  const code = `VM-${id.slice(-4).toUpperCase()}`;
  return { id, code };
}

export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
