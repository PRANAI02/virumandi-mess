/**
 * The moustache from the logo, as a CSS-masked shape.
 *
 * It's one silhouette (public/images/moustache.png) used as a mask, so it
 * inherits `color` and can be tinted per context — the giant hero watermark,
 * the section dividers, and the kaaram meter are all this component.
 */
export function Moustache({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span className={`stache ${className}`} style={style} aria-hidden="true" />;
}

/** The engraved rule from under the wordmark, reused between sections. */
export function StacheRule({ className = "" }: { className?: string }) {
  return (
    <div className={`stache-rule ${className}`} aria-hidden="true">
      <Moustache />
    </div>
  );
}

/**
 * Kaaram (கார அளவு) — how hot the dish runs, 1 to 3, counted in moustaches
 * instead of chillies.
 */
export function Kaaram({ level, label = true }: { level: number; label?: boolean }) {
  const n = Math.max(1, Math.min(3, level));
  return (
    <span
      className="kaaram"
      title={`Kaaram ${n} of 3`}
      aria-label={`Spice level ${n} of 3`}
    >
      {[1, 2, 3].map((i) => (
        <Moustache key={i} className={i <= n ? "on" : ""} />
      ))}
      {label ? <span className="sr-only">Spice level {n} of 3</span> : null}
    </span>
  );
}
