import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Kaaram, StacheRule } from "@/components/Moustache";
import { INFO, MENU } from "@/lib/data";

// Split the card into two balanced columns by item count.
const total = MENU.reduce((n, c) => n + c.items.length, 0);
const left: typeof MENU = [];
const right: typeof MENU = [];
let running = 0;
for (const cat of MENU) {
  (running < total / 2 ? left : right).push(cat);
  running += cat.items.length;
}

function Category({ cat }: { cat: (typeof MENU)[number] }) {
  return (
    <div className="menu-block menu-cat">
      <h3>
        {cat.title}
        <span className="ta">{cat.ta}</span>
      </h3>
      <p className="menu-kicker">{cat.kicker}</p>
      {cat.items.map((it) => (
        <div className="menu-item" key={it.name}>
          <div>
            <span className={`veg ${it.veg ? "v" : "n"}`} />
            <span className="nm">{it.name}</span>
            {it.ta && <div className="ta">{it.ta}</div>}
            {it.desc && <div className="ds">{it.desc}</div>}
          </div>
          <span className="dots" />
          {it.kaaram ? <Kaaram level={it.kaaram} label={false} /> : null}
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <>
      <Nav />
      <ScrollReveal />
      <main>
        <header className="menu-hero">
          <div className="wrap">
            <a href="/#top" className="back-link">
              ← Back to {INFO.name}
            </a>
            <p
              className="hero-name ta-name"
              style={{ marginTop: 20, marginBottom: 6 }}
            >
              சாப்பாடு
            </p>
            <h1 className="display">The Card</h1>
            <div
              className="kaaram-legend"
              style={{ marginTop: 24, flexWrap: "wrap" }}
            >
              <Kaaram level={1} label={false} /> mild
              <span style={{ opacity: 0.4 }}>·</span>
              <Kaaram level={2} label={false} /> medium
              <span style={{ opacity: 0.4 }}>·</span>
              <Kaaram level={3} label={false} /> கார அளவு
            </div>
          </div>
        </header>

        <section className="section" style={{ paddingTop: 56 }}>
          <div className="wrap">
            <div className="menu-page-grid">
              <div>
                {left.map((cat) => (
                  <Category key={cat.title} cat={cat} />
                ))}
              </div>
              <div>
                {right.map((cat) => (
                  <Category key={cat.title} cat={cat} />
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 72 }}>
              <StacheRule />
              <p className="muted" style={{ marginBottom: 24 }}>
                {INFO.hours} · {INFO.hoursNote}
              </p>
              <a
                href={INFO.mapsUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-primary"
              >
                Get Directions
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
