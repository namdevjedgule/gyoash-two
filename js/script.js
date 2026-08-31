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

  document.addEventListener("DOMContentLoaded", () => {
    initCounters();
    initScrollers();
    initMediaLightbox();
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
      navbar.classList.remove("menu-open");
    };
    const openMenu = () => {
      links.classList.add("is-open");
      toggle.classList.add("is-active");
      scrim.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      navbar.classList.add("menu-open");
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

    function markActiveNavLink() {
      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

      // Top-level links (Home, About, AMC/CMC, etc.)
      const navAnchors = document.querySelectorAll('.nav-links > li > a[href]');
      navAnchors.forEach((a) => {
        const linkPath = new URL(a.getAttribute('href'), window.location.origin)
          .pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
          a.classList.add('is-active');
        }
      });

      // Dropdown links (Products submenu)
      const dropdownAnchors = document.querySelectorAll('.dropdown a[href]');
      let dropdownHasActive = false;

      dropdownAnchors.forEach((a) => {
        const linkPath = new URL(a.getAttribute('href'), window.location.origin)
          .pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
          a.classList.add('is-active');
          dropdownHasActive = true;
        }
      });

      // If a dropdown child is active, highlight the "Products" toggle button too
      if (dropdownHasActive) {
        const ddToggleEl = document.querySelector('.nav-links .dropdown-toggle');
        ddToggleEl?.classList.add('is-active');
      }
    }

    markActiveNavLink();
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

  /* ---------- 7. Media modal + lightbox (Gallery / Instagram) ---------- */
  function initMediaLightbox() {
    const modals = document.querySelectorAll("[data-modal]");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    if (!modals.length || !lightbox) return;

    let currentGroup = [];
    let currentIndex = 0;

    // Open "View more" modals
    document.querySelectorAll("[data-open-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById(btn.getAttribute("data-open-modal"));
        modal?.classList.add("is-open");
        document.body.style.overflow = "hidden";
      });
    });

    modals.forEach((modal) => {
      modal.querySelectorAll("[data-close-modal]").forEach((btn) =>
        btn.addEventListener("click", () => closeModal(modal))
      );
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    function closeModal(modal) {
      modal.classList.remove("is-open");
      if (!document.querySelector(".media-modal.is-open") && !lightbox.classList.contains("is-open")) {
        document.body.style.overflow = "";
      }
    }

    // Lightbox trigger (works for items in the page grid AND inside modals)
    document.querySelectorAll("[data-lightbox]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const group = el.getAttribute("data-group");
        currentGroup = Array.from(document.querySelectorAll(`[data-lightbox][data-group="${group}"]`));
        currentIndex = currentGroup.indexOf(el);
        openLightbox();
      });
    });

    function openLightbox() {
      lightboxImg.src = currentGroup[currentIndex].getAttribute("data-full");
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function showIndex(delta) {
      currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
      lightboxImg.src = currentGroup[currentIndex].getAttribute("data-full");
    }

    lightbox.querySelector("[data-close-lightbox]")?.addEventListener("click", () => {
      lightbox.classList.remove("is-open");
      if (!document.querySelector(".media-modal.is-open")) document.body.style.overflow = "";
    });
    lightbox.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => showIndex(-1));
    lightbox.querySelector("[data-lightbox-next]")?.addEventListener("click", () => showIndex(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("is-open");
        if (!document.querySelector(".media-modal.is-open")) document.body.style.overflow = "";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") lightbox.classList.remove("is-open");
      if (e.key === "ArrowRight") showIndex(1);
      if (e.key === "ArrowLeft") showIndex(-1);
    });
  }
})();


