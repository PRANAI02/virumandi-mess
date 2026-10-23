import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Public status lookup for the customer's own order page. Only the fields the
 * customer needs are returned — no address, no phone, so a guessed id leaks
 * nothing about someone else.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: order.id,
    code: order.code,
    status: order.status,
    mode: order.mode,
    createdAt: order.createdAt,
    payment: { method: order.payment.method, status: order.payment.status },
    lines: order.lines,
    totals: order.totals,
    tracking: order.delivery?.trackingUrl ?? null,
  });
}
