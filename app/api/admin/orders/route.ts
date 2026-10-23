import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders, updateOrder, type OrderStatus } from "@/lib/orders";
import { whatsappHandoffUrl } from "@/lib/notify";

export const dynamic = "force-dynamic";

const ALLOWED: OrderStatus[] = [
  "placed",
  "accepted",
  "cooking",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orders = await listOrders();
  return NextResponse.json({
    orders: orders.map((o) => ({ ...o, whatsappUrl: whatsappHandoffUrl(o) })),
  });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, status } = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: OrderStatus;
  };
  if (!id || !status || !ALLOWED.includes(status))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const updated = await updateOrder(id, (o) => ({ ...o, status }));
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order: updated });
}
