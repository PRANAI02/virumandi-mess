import Nav from "@/components/Nav";
import ScrollReveal from "@/components/ScrollReveal";
import Footer from "@/components/Footer";
import { Moustache, StacheRule, Kaaram } from "@/components/Moustache";
import { INFO, SIGNATURES, MENU, CHANNELS, HOURS, LEAF } from "@/lib/data";

const PREVIEW = MENU.slice(0, 4);

export default function Home() {
  return (
    <>
      <Nav />
      <ScrollReveal />
      <main id="top">
        {/* ---------------- HERO ---------------- */}
        <header className="hero">
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow">
                {INFO.addressShort} · {INFO.city}
              </p>
              <Moustache className="hero-mark" />
              <p className="hero-name ta-name">{INFO.nameTa}</p>
              <h1 className="display">
                Tamil Nadu meals, served on a{" "}
                <span className="accent">banana leaf.</span>
              </h1>
              <p className="lead">
                Mutton, fish, crab, prawn and chicken, cooked the way a Tamil
                Nadu mess kitchen cooks them.
              </p>
              <div className="hero-cta">
                <a href="/order" className="btn btn-primary">
                  Order Online
                </a>
                <a href="/menu" className="btn btn-ghost">
                  See the Menu
                </a>
              </div>
              <div className="hero-meta">
                <span>
                  <i />
                  {INFO.hours}
                </span>
                <span>
                  <i />
                  {INFO.landmark}
                </span>
              </div>
            </div>
            <div className="hero-plate reveal">
              <img
                src="/images/virundhu-spread.jpg"
                alt="A Virumandi Mess meals plate laid out on a banana leaf"
              />
            </div>
          </div>
        </header>

        {/* ---------------- STORY ---------------- */}
        <section className="section" id="story">
          <div className="wrap story-grid">
            <div className="story-figure reveal">
              <img
                src="/images/rice-serve.jpg"
                alt="Rice served onto a banana leaf at Virumandi Mess"
              />
            </div>
            <div className="story reveal">
              <p className="eyebrow">The Kitchen</p>
              <h2 className="h2">Cooked plain, served full.</h2>
              <p className="lead">
                A short card, on purpose. You choose the fry — the leaf, the
                rice, the gravies and the sides come with it.
              </p>
              <div className="stat-row">
                <div className="stat">
                  <b>6</b>
                  <span>Days a week</span>
                </div>
                <div className="stat">
                  <b>2</b>
                  <span>Sittings a day</span>
                </div>
                <div className="stat">
                  <b>3rd</b>
                  <span>Floor, HRBR Layout</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SIGNATURES ---------------- */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec-head">
              <h2 className="h2">What to order</h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <span className="kaaram-legend">
                  <Kaaram level={3} label={false} /> கார அளவு
                </span>
                <a href="/menu" className="btn btn-ghost">
                  Full Menu
                </a>
              </div>
            </div>
            {/* Rail sits inside the content column, so the scroll range is
                exactly the cards — it ends flush on the last one. */}
            <div
              className="dish-rail"
              tabIndex={0}
              role="region"
              aria-label="Dishes — scroll horizontally"
            >
              <div className="dish-track">
                {SIGNATURES.map((d) => (
                  <article className="dish reveal" key={d.name}>
                    <div className="dish-img">
                      <img src={d.img} alt={d.name} loading="lazy" />
                    </div>
                    <div className="dish-body">
                      <h3>{d.name}</h3>
                      <div className="ta">{d.ta}</div>
                      <p>{d.note}</p>
                      <div className="dish-foot">
                        <Kaaram level={d.kaaram} label={false} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- THE LEAF ---------------- */}
        <section className="section leaf-sec on-leaf" id="leaf">
          <div className="wrap">
            <div className="sec-head center">
              <StacheRule />
              <h2 className="h2">How a meals plate is laid out</h2>
            </div>
            <div className="leaf-grid">
              <div className="leaf-figure reveal">
                <img
                  src="/images/mutton-meals.jpg"
                  alt="A full meals plate on a banana leaf"
                />
              </div>
              <ol className="leaf-list reveal">
                {LEAF.map((l) => (
                  <li key={l.n}>
                    <span className="n">{l.n}</span>
                    <div>
                      <h3>{l.name}</h3>
                      <div className="ta">{l.ta}</div>
                      <p>{l.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------- MENU PREVIEW ---------------- */}
        <section className="section">
          <div className="wrap">
            <div className="sec-head center">
              <h2 className="h2">The card</h2>
            </div>
            <div className="menu-cats reveal">
              {PREVIEW.map((cat) => (
                <div className="menu-cat" key={cat.title}>
                  <h3>
                    {cat.title}
                    <span className="ta">{cat.ta}</span>
                  </h3>
                  {cat.items.slice(0, 4).map((it) => (
                    <div className="menu-item" key={it.name}>
                      <div>
                        <span className={`veg ${it.veg ? "v" : "n"}`} />
                        <span className="nm">{it.name}</span>
                        {it.ta && <div className="ta">{it.ta}</div>}
                      </div>
                      <span className="dots" />
                      {it.kaaram ? (
                        <Kaaram level={it.kaaram} label={false} />
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href="/menu" className="btn btn-primary">
                See the Full Menu
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- INSTAGRAM ---------------- */}
        <section className="section insta" id="insta">
          <div className="wrap insta-grid">
            <div className="reveal">
              <h2 className="h2">The day&apos;s plates, as they go out.</h2>
              <p className="insta-handle">@{INFO.handle}</p>
              <div className="hero-cta" style={{ marginTop: 26 }}>
                <a
                  href={INFO.instagram}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-primary"
                >
                  Follow @{INFO.handle}
                </a>
                <a
                  href={INFO.instagramDM}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-ghost"
                >
                  Message Us
                </a>
              </div>
            </div>
            <div className="insta-tiles reveal">
              {[
                "/images/virundhu-spread.jpg",
                "/images/chicken-chukka.jpg",
                "/images/prawn-biryani.jpg",
                "/images/mutton-fry.jpg",
              ].map((src) => (
                <a
                  key={src}
                  href={INFO.instagram}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${INFO.name} on Instagram`}
                >
                  <img src={src} alt="" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- LOCATION ---------------- */}
        <section className="section" id="visit">
          <div className="wrap">
            <div className="sec-head">
              <h2 className="h2">Come hungry</h2>
              <a
                href={INFO.mapsUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost"
              >
                Get Directions
              </a>
            </div>
            <div className="loc-grid reveal">
              <div className="loc-info">
                <div className="loc-row">
                  <div className="k">Address</div>
                  <div className="v">{INFO.address}</div>
                  <div className="v muted" style={{ marginTop: 6 }}>
                    {INFO.landmark}
                  </div>
                </div>
                <div className="loc-row">
                  <div className="k">Hours</div>
                  <div className="v">
                    <ul className="hours-list">
                      {HOURS.map((h) => (
                        <li
                          key={h.day}
                          className={h.times[0] === "Closed" ? "closed" : ""}
                        >
                          <span className="d">{h.day}</span>
                          <span className="t">{h.times.join(" · ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="loc-row">
                  <div className="k">Tables</div>
                  <div className="v">
                    {INFO.whatsappRaw ? (
                      <a
                        href={`https://wa.me/${INFO.whatsappRaw}`}
                        target="_blank"
                        rel="noopener"
                        className="red"
                      >
                        WhatsApp {INFO.whatsappDisplay}
                      </a>
                    ) : (
                      <>
                        Walk in. For a large group,{" "}
                        <a
                          href={INFO.instagramDM}
                          target="_blank"
                          rel="noopener"
                          className="red"
                        >
                          message us
                        </a>
                        .
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="loc-map">
                <iframe
                  title={`${INFO.name} map`}
                  src={INFO.mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- CHANNELS ---------------- */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec-head center">
              <StacheRule />
              <h2 className="h2">Follow &amp; find</h2>
            </div>
            <div className="order-grid">
              {CHANNELS.map((o) => (
                <a
                  key={o.name}
                  href={o.href}
                  target="_blank"
                  rel="noopener"
                  className="order-card reveal"
                >
                  <b>{o.name}</b>
                  <span>{o.desc}</span>
                  <span className="go">{o.cta} →</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
