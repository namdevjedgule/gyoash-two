(function () {
  "use strict";

  const includeTargets = document.querySelectorAll("[data-include]");

  const loadFragment = (el) =>
    fetch(el.getAttribute("data-include"))
      .then((res) => {
        if (!res.ok) throw new Error("Fragment not found: " + el.getAttribute("data-include"));
        return res.text();
      })
      .then((html) => {
        el.outerHTML = html;
      })
      .catch((err) => console.warn(err.message));

  Promise.all(Array.from(includeTargets).map(loadFragment)).then(() => {
    initNavbar();
    initRevealObserver();
  });

  /* Everything else can init immediately (doesn't depend on fragments) */
  document.addEventListener("DOMContentLoaded", () => {
    initCounters();
    initScrollers();
    setYear();
  });

  /* ---------- 2. Navbar: scroll state, mobile menu, dropdown ---------- */
  function initNavbar() {
    const navbar = document.getElementById("navbar");
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    const scrim = document.getElementById("navScrim");
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const closeMenu = () => {
      links.classList.remove("is-open");
      toggle.classList.remove("is-active");
      scrim.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const openMenu = () => {
      links.classList.add("is-open");
      toggle.classList.add("is-active");
      scrim.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle?.addEventListener("click", () => {
      links.classList.contains("is-open") ? closeMenu() : openMenu();
    });
    scrim?.addEventListener("click", closeMenu);
    links?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

    // Mobile dropdown toggle (Products)
    const ddToggle = links?.querySelector(".dropdown-toggle");
    ddToggle?.addEventListener("click", () => {
      const dd = ddToggle.nextElementSibling;
      const expanded = ddToggle.getAttribute("aria-expanded") === "true";
      ddToggle.setAttribute("aria-expanded", String(!expanded));
      dd?.classList.toggle("is-open");
    });

    // Escape closes mobile menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- 3. Scroll reveal ---------- */
  function initRevealObserver() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- 4. Animated counters (stats strip) ---------- */
  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const duration = 1600;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value.toLocaleString("en-IN");
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString("en-IN");
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => io.observe(el));
  }

  /* ---------- 5. Horizontal scrollers (products / testimonials) ---------- */
  function initScrollers() {
    document.querySelectorAll("[data-scroller]").forEach((wrap) => {
      const track = wrap.querySelector("[data-track]");
      const prev = wrap.querySelector("[data-prev]");
      const next = wrap.querySelector("[data-next]");
      if (!track) return;

      const scrollByAmount = () => {
        const card = track.querySelector(":scope > *");
        return card ? card.getBoundingClientRect().width + 22 : 300;
      };

      prev?.addEventListener("click", () =>
        track.scrollBy({ left: -scrollByAmount(), behavior: "smooth" })
      );
      next?.addEventListener("click", () =>
        track.scrollBy({ left: scrollByAmount(), behavior: "smooth" })
      );
    });
  }

  /* ---------- 6. Footer year ---------- */
  function setYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }
})();
