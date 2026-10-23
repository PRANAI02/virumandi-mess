import { NextResponse, after } from "next/server";
import {
  priceCart,
  saveOrder,
  newOrderIds,
  isValidPhone,
  normalisePhone,
  type Order,
  type CartLine,
} from "@/lib/orders";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { finaliseOrder } from "@/lib/fulfil";

export const dynamic = "force-dynamic";

type Body = {
  cart: CartLine[];
  mode: "delivery" | "pickup";
  payment: "online" | "cod";
  name: string;
  phone: string;
  address?: string;
  note?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const mode = body.mode === "pickup" ? "pickup" : "delivery";
  const name = String(body.name || "").trim().slice(0, 80);
  const phone = normalisePhone(String(body.phone || ""));
  const address = String(body.address || "").trim().slice(0, 400);
  const note = String(body.note || "").trim().slice(0, 300);

  if (!name) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!isValidPhone(phone))
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  if (mode === "delivery" && address.length < 10)
    return NextResponse.json(
      { error: "Please add a delivery address." },
      { status: 400 }
    );

  const { lines, totals, settings, problems } = await priceCart(
    Array.isArray(body.cart) ? body.cart : [],
    mode
  );

  if (!settings.acceptingOrders)
    return NextResponse.json(
      { error: "The mess isn't taking orders right now." },
      { status: 409 }
    );
  if (!lines.length)
    return NextResponse.json(
      { error: problems[0] || "Your cart is empty." },
      { status: 400 }
    );
  if (problems.length)
    return NextResponse.json({ error: problems[0] }, { status: 409 });
  if (totals.subtotal < settings.minOrder)
    return NextResponse.json(
      { error: `Minimum order is ₹${settings.minOrder}.` },
      { status: 400 }
    );

  // Online payment is only offered when Razorpay is actually configured.
  const payMethod =
    body.payment === "online" && razorpayConfigured() ? "online" : "cod";

  const { id, code } = newOrderIds();
  const order: Order = {
    id,
    code,
    createdAt: new Date().toISOString(),
    status: payMethod === "online" ? "awaiting_payment" : "placed",
    mode,
    payment: { method: payMethod, status: "pending" },
    customer: { name, phone, address: mode === "delivery" ? address : undefined, note },
    lines,
    totals,
  };

  if (payMethod === "online") {
    try {
      const rp = await createRazorpayOrder(totals.total, code);
      order.payment.razorpayOrderId = rp.id;
    } catch (err) {
      return NextResponse.json(
        { error: "Couldn't start the payment. Try cash on delivery." , detail: String(err) },
        { status: 502 }
      );
    }
  }

  await saveOrder(order);

  // Cash orders are live immediately. Notifying the mess and booking the rider
  // runs after the response so a slow WhatsApp or Porter call never leaves the
  // customer staring at a spinner — `after` keeps the function alive for it.
  if (payMethod === "cod") {
    after(async () => {
      try {
        await finaliseOrder(order);
      } catch (err) {
        console.error("finaliseOrder failed", order.code, err);
      }
    });
  }

  return NextResponse.json({
    id: order.id,
    code: order.code,
    status: order.status,
    totals: order.totals,
    payment: order.payment,
    razorpayKeyId: payMethod === "online" ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID : undefined,
  });
}
