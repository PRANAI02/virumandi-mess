"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  // A reload should open the page at the top, not wherever the reader last
  // was. The browser restores scroll by default, and because html has
  // scroll-behavior:smooth you actually watch it slide down into the story
  // section. Turn restoration off and pin to the top — unless the URL carries
  // a hash, in which case that anchor is what the reader asked for.
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      const root = document.documentElement;
      const behavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = behavior;
    }
  }, []);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
