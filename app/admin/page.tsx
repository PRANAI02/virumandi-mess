import Nav from "@/components/Nav";
import AdminClient from "@/components/AdminClient";
import AdminLogin from "@/components/AdminLogin";
import { isAdmin, adminConfigured } from "@/lib/admin-auth";
import { isDurable } from "@/lib/store";
import { razorpayConfigured } from "@/lib/razorpay";
import { porterConfigured } from "@/lib/porter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kitchen — Virumandi Mess",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const signedIn = await isAdmin();

  const whatsapp = Boolean(
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_TO
  );

  return (
    <>
      <Nav />
      <main>
        <header className="menu-hero">
          <div className="wrap">
            <h1 className="display">Kitchen</h1>
            <p className="lead" style={{ marginTop: 14 }}>
              Orders as they come in, and what&apos;s on today&apos;s card.
            </p>
          </div>
        </header>
        <section className="section" style={{ paddingTop: 44 }}>
          <div className="wrap">
            {signedIn ? (
              <AdminClient
                durable={isDurable}
                integrations={{
                  razorpay: razorpayConfigured(),
                  whatsapp,
                  porter: porterConfigured(),
                }}
              />
            ) : (
              <AdminLogin configured={adminConfigured()} />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
