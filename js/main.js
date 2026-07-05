(() => {
  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const backToTop = document.querySelector("[data-back-to-top]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    body.classList.remove("nav-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = body.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
    });
  });

  if (backToTop) {
    const syncBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 520);
    };
    syncBackToTop();
    window.addEventListener("scroll", syncBackToTop, { passive: true });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  if ("IntersectionObserver" in window) {
    document.querySelectorAll(".reveal").forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add("is-visible");
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      { threshold: [0.12, 0.26, 0.42], rootMargin: "-22% 0px -62% 0px" }
    );

    sections.forEach((section) => navObserver.observe(section));
  } else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  }

  const initParticleTitle = () => {
    const holder = document.querySelector("[data-particle-title]");
    if (!holder || reduceMotion) return;

    const canvas = holder.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const text = holder.dataset.particleText || "Xi Wang";
    const pointer = { active: false, x: 0, y: 0, edge: 0 };
    let width = 0;
    let height = 0;
    let particles = [];
    let frameId = null;
    let resizeTimer = null;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const makeTargets = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return [];

      let fontSize = Math.min(height * 0.8, width * 0.18);
      offCtx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
      let metrics = offCtx.measureText(text);
      const maxTextWidth = width - 8;

      if (metrics.width > maxTextWidth) {
        fontSize *= maxTextWidth / metrics.width;
        offCtx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
        metrics = offCtx.measureText(text);
      }

      const x = 2;
      const y = height * 0.58;
      offCtx.clearRect(0, 0, width, height);
      offCtx.fillStyle = "#111";
      offCtx.textAlign = "left";
      offCtx.textBaseline = "middle";
      offCtx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
      offCtx.fillText(text, x, y);

      const imageData = offCtx.getImageData(0, 0, width, height).data;
      const step = width < 480 ? 3 : 2;
      let targets = [];

      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          const alpha = imageData[(py * width + px) * 4 + 3];
          if (alpha > 80) {
            targets.push({ x: px + rand(-0.55, 0.55), y: py + rand(-0.55, 0.55) });
          }
        }
      }

      const maxParticles = width < 480 ? 1450 : 2600;
      if (targets.length > maxParticles) {
        const stride = Math.ceil(targets.length / maxParticles);
        targets = targets.filter((_, index) => index % stride === 0);
      }

      return targets;
    };

    const rebuild = () => {
      const rect = holder.getBoundingClientRect();
      width = Math.max(260, Math.round(rect.width));
      height = Math.max(72, Math.round(rect.height));

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const previous = particles;
      const targets = makeTargets();

      particles = targets.map((target, index) => {
        const old = previous[index % Math.max(previous.length, 1)];
        return {
          x: old ? old.x : target.x + rand(-80, 80),
          y: old ? old.y : target.y + rand(-46, 46),
          tx: target.x,
          ty: target.y,
          vx: old ? old.vx * 0.35 : 0,
          vy: old ? old.vy * 0.35 : 0,
          r: rand(0.55, 1.18),
          phase: rand(0, Math.PI * 2)
        };
      });

      holder.classList.add("is-ready");
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        const toTargetX = particle.tx - particle.x;
        const toTargetY = particle.ty - particle.y;
        particle.vx += toTargetX * 0.018;
        particle.vy += toTargetY * 0.018;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = width < 480 ? 92 : 128;

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * 1.18;
            particle.vx += (dx / distance) * force + (-dy / distance) * force * 0.08;
            particle.vy += (dy / distance) * force + (dx / distance) * force * 0.08;
          }
        }

        particle.vx *= 0.91;
        particle.vy *= 0.91;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const drift = Math.sin(time * 0.00075 + particle.phase) * 0.18;
        ctx.beginPath();
        ctx.arc(particle.x + drift, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(43, 78, 90, 0.68)";
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    holder.addEventListener(
      "pointermove",
      (event) => {
        const rect = holder.getBoundingClientRect();
        pointer.active = true;
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      },
      { passive: true }
    );

    holder.addEventListener(
      "pointerleave",
      () => {
        pointer.active = false;
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(rebuild, 160);
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!document.hidden && !frameId) {
        frameId = window.requestAnimationFrame(draw);
      }
    });

    rebuild();
    frameId = window.requestAnimationFrame(draw);
  };

  const initIdentityCard = () => {
    const card = document.querySelector("[data-identity-card]");
    if (!card) return;

    const pointer = { active: false, x: 0, y: 0 };

    const setPointerVars = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const lookX = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
      const lookY = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));
      const nearestEdge = Math.min(x, y, rect.width - x, rect.height - y);
      const edge = Math.max(0, Math.min(1, 1 - nearestEdge / 150));
      card.style.setProperty("--card-x", `${x}px`);
      card.style.setProperty("--card-y", `${y}px`);
      card.style.setProperty("--look-x", lookX.toFixed(3));
      card.style.setProperty("--look-y", lookY.toFixed(3));
      card.style.setProperty("--edge-opacity", (0.06 + edge * 0.26).toFixed(3));
      card.style.setProperty("--edge-size", `${Math.round(130 + edge * 78)}px`);
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
      pointer.edge = edge;
    };

    card.addEventListener("pointermove", setPointerVars, { passive: true });
    card.addEventListener(
      "pointerleave",
      () => {
        pointer.active = false;
        pointer.edge = 0;
        card.style.setProperty("--look-x", "0");
        card.style.setProperty("--look-y", "0");
        card.style.setProperty("--edge-opacity", "0.05");
        card.style.setProperty("--edge-size", "140px");
      },
      { passive: true }
    );

    if (reduceMotion) return;

    const canvas = card.querySelector("[data-identity-particles]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let ratio = 1;
    let points = [];
    let frameId = null;
    let resizeTimer = null;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const rebuild = () => {
      const rect = card.getBoundingClientRect();
      width = Math.max(280, Math.round(rect.width));
      height = Math.max(260, Math.round(rect.height));
      ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = width < 560 ? 22 : 44;
      points = Array.from({ length: count }, (_, index) => {
        const side = index % 4;
        const margin = 18;
        let x = rand(margin, width - margin);
        let y = rand(margin, height - margin);

        if (side === 0) y = rand(margin, 70);
        if (side === 1) x = rand(width - 86, width - margin);
        if (side === 2) y = rand(height - 76, height - margin);
        if (side === 3) x = rand(margin, 86);

        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          r: rand(0.8, 1.8),
          phase: rand(0, Math.PI * 2)
        };
      });
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);

      points.forEach((point, index) => {
        point.vx += (point.baseX - point.x) * 0.006;
        point.vy += (point.baseY - point.y) * 0.006;

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);
          const radius = (width < 560 ? 138 : 170) + pointer.edge * 42;

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * (0.36 + pointer.edge * 0.28);
            point.vx += (dx / distance) * force;
            point.vy += (dy / distance) * force;
          }
        }

        point.vx *= 0.9;
        point.vy *= 0.9;
        point.x += point.vx + Math.sin(time * 0.00045 + point.phase) * 0.045;
        point.y += point.vy + Math.cos(time * 0.00042 + point.phase) * 0.045;

        for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
          const other = points[otherIndex];
          const dx = other.x - point.x;
          const dy = other.y - point.y;
          const distance = Math.hypot(dx, dy);

          const linkDistance = width < 560 ? 84 : 112;

          if (distance < linkDistance) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(81, 117, 140, ${(0.018 + pointer.edge * 0.028) * (1 - distance / linkDistance)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 88, 105, ${0.2 + pointer.edge * 0.1})`;
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(rebuild, 160);
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!document.hidden && !frameId) {
        frameId = window.requestAnimationFrame(draw);
      }
    });

    rebuild();
    frameId = window.requestAnimationFrame(draw);
  };

  initParticleTitle();
  initIdentityCard();
})();
