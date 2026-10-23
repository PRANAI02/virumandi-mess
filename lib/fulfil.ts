import { updateOrder, type Order } from "./orders";
import { notifyRestaurant } from "./notify";
import { dispatchDelivery } from "./porter";

/**
 * Everything that happens once an order is really live: tell the mess on
 * WhatsApp and book the Porter trip. Neither is allowed to fail the order —
 * the result of each is recorded so /admin can show what went through.
 */
export async function finaliseOrder(order: Order): Promise<void> {
  const [notify, delivery] = await Promise.all([
    notifyRestaurant(order),
    dispatchDelivery(order),
  ]);
  await updateOrder(order.id, (o) => ({ ...o, notified: notify.sent, delivery }));
}
