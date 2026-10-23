import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  getCatalog,
  getOverrides,
  saveOverrides,
  DEFAULT_ITEMS,
  DEFAULT_SETTINGS,
  type Settings,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { items, settings } = await getCatalog();
  return NextResponse.json({ items, settings });
}

/** Body: { price?: {id: number}, unavailable?: string[], settings?: Partial<Settings> } */
export async function PATCH(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    price?: Record<string, number>;
    unavailable?: string[];
    settings?: Partial<Settings>;
  };

  const current = await getOverrides();
  const validIds = new Set(DEFAULT_ITEMS.map((i) => i.id));

  const price = { ...current.price };
  for (const [id, value] of Object.entries(body.price ?? {})) {
    if (!validIds.has(id)) continue;
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && n >= 0 && n <= 100000) price[id] = n;
  }

  const unavailable = Array.isArray(body.unavailable)
    ? body.unavailable.filter((id) => validIds.has(id))
    : current.unavailable;

  const s = body.settings ?? {};
  const num = (v: unknown, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : fallback;
  };
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...current.settings,
    acceptingOrders:
      typeof s.acceptingOrders === "boolean"
        ? s.acceptingOrders
        : current.settings.acceptingOrders,
    pricesConfirmed:
      typeof s.pricesConfirmed === "boolean"
        ? s.pricesConfirmed
        : current.settings.pricesConfirmed,
    deliveryFee: num(s.deliveryFee, current.settings.deliveryFee),
    freeDeliveryAbove: num(s.freeDeliveryAbove, current.settings.freeDeliveryAbove),
    packagingFee: num(s.packagingFee, current.settings.packagingFee),
    minOrder: num(s.minOrder, current.settings.minOrder),
  };

  await saveOverrides({ price, unavailable, settings });
  const fresh = await getCatalog();
  return NextResponse.json({ ok: true, ...fresh });
}
