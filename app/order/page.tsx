import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import OrderClient from "@/components/OrderClient";
import { getCatalog, CATEGORY_ORDER } from "@/lib/catalog";
import { razorpayConfigured } from "@/lib/razorpay";
import { INFO } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Order online — ${INFO.name}`,
  description: `Order Tamil Nadu meals from ${INFO.name}, ${INFO.addressShort}. Delivery across Bengaluru or pickup at the mess.`,
};

export default async function OrderPage() {
  const { items, settings } = await getCatalog();

  return (
    <>
      <Nav />
      <main>
        <header className="menu-hero">
          <div className="wrap">
            <a href="/#top" className="back-link">
              ← Back to {INFO.name}
            </a>
            <p className="hero-name ta-name" style={{ marginTop: 20, marginBottom: 6 }}>
              சாப்பாடு ஆர்டர்
            </p>
            <h1 className="display">Order</h1>
            <div className="hero-meta" style={{ marginTop: 22 }}>
              <span>
                <i />
                {INFO.hours}
              </span>
              <span>
                <i />
                Delivered by Porter
              </span>
              <span>
                <i />
                Or pick up at the mess
              </span>
            </div>
          </div>
        </header>

        <section className="section" style={{ paddingTop: 48, paddingBottom: 160 }}>
          <div className="wrap">
            <OrderClient
              items={items}
              settings={settings}
              categories={CATEGORY_ORDER}
              onlinePayments={razorpayConfigured()}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
