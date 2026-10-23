# Virumandi Mess — ordering setup

The site takes orders out of the box using **cash on delivery** and an
**in-memory** store. Each block below switches on one more real capability.
Add the variables in Vercel → Project → Settings → Environment Variables, then
redeploy. Nothing here needs a code change.

---

## 0. Before you take a single live order

**Set your real prices.** The amounts in `lib/catalog.ts` are placeholders —
no price list for the mess has ever been published, so I could not use real
ones. Open `/admin` → **Today's card**, set every price, then tick **Prices
confirmed**.

---

## 1. Admin password (required — admin is locked until this is set)

```bash
vercel env add ADMIN_PASSWORD production
```

Pick your own password when prompted. It is compared in constant time and is
never written to storage or logs. Optionally add `ADMIN_SESSION_SECRET` (any
long random string) so that changing the password doesn't have to invalidate
sessions.

Then visit `/admin`.

## 2. Durable storage (REQUIRED on Vercel)

Every Vercel request runs in its own serverless instance, so the built-in
in-memory fallback cannot be shared between them: **the kitchen dashboard will
not see orders until this is configured.** (The customer still gets their
confirmation — the browser keeps a copy of what it just ordered.) Locally with
`next start` the memory store works fine, which is what it is there for.

Vercel Marketplace → **Upstash Redis** → connect to this project. It injects
`KV_REST_API_URL` and `KV_REST_API_TOKEN`, which is all the store looks for.

## 3. Online payments — Razorpay

```
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID   # same value as RAZORPAY_KEY_ID
RAZORPAY_WEBHOOK_SECRET       # optional but recommended
```

Until these are set, the "Pay online" option is hidden and everything is cash
on delivery — so there is never a half-working payment button.

For the webhook, add an endpoint in the Razorpay dashboard pointing at
`https://<your-domain>/api/payments/webhook`, subscribe to `payment.captured`,
and use the same secret. It's the safety net for when a customer pays but
their browser dies before telling us.

Amounts are always recomputed on the server from the catalogue — the browser
only ever sends item ids and quantities, so a tampered cart can't change the
price.

## 4. WhatsApp alerts to the mess

```
WHATSAPP_TOKEN              # permanent token from Meta
WHATSAPP_PHONE_NUMBER_ID    # the sending number's id
WHATSAPP_TO                 # the mess's number, e.g. 919876543210
WHATSAPP_TEMPLATE_NAME      # optional, see below
WHATSAPP_TEMPLATE_LANG      # optional, defaults to en
```

Meta only allows free-form WhatsApp text inside a 24-hour window, so a
business-initiated alert needs an **approved message template** with one body
parameter. Set `WHATSAPP_TEMPLATE_NAME` to it and the order summary is passed
in. Without a template name a plain text message is sent, which works while
testing from the Meta dashboard.

Until this is configured, every order in `/admin` has a **Send on WhatsApp**
button that opens WhatsApp with the order already typed out. Nothing is lost —
it's just one tap instead of automatic.

## 5. Porter delivery

```
PORTER_API_BASE      # from your Porter Enterprise integration doc
PORTER_API_KEY
PORTER_AUTH_HEADER   # optional, defaults to x-api-key
PORTER_CREATE_PATH   # optional, defaults to /v1/orders
PICKUP_NAME
PICKUP_PHONE
PICKUP_ADDRESS
PICKUP_LAT
PICKUP_LNG
```

**Porter does not publish an open API spec** — order-creation access comes with
a Porter Enterprise account and their own integration document. So rather than
guess at endpoints, `lib/porter.ts` is a thin adapter: the endpoint, auth header
and request body are all configurable, and `buildPorterPayload()` is the single
function to line up with their doc once you have the account.

Until then, delivery is "manual": the order is recorded and the mess books the
trip in the Porter app. The admin card says so on every delivery order rather
than failing silently.

---

## What's wired where

| Area | File |
|---|---|
| Prices, availability, fees | `lib/catalog.ts` |
| Order model, server-side pricing | `lib/orders.ts` |
| Storage adapter | `lib/store.ts` |
| Razorpay | `lib/razorpay.ts` |
| WhatsApp | `lib/notify.ts` |
| Porter | `lib/porter.ts` |
| Admin session | `lib/admin-auth.ts` |
| Customer ordering UI | `components/OrderClient.tsx` |
| Kitchen dashboard | `components/AdminClient.tsx` |

Customer pages: `/order`, `/order/<id>`. Kitchen: `/admin`.
