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
    const pointer = { active: false, x: 0, y: 0 };
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

  const initIdentityCardPhysics = () => {
    const shell = document.querySelector("[data-identity-card]");
    if (!shell) return;

    const paper = shell.querySelector("[data-identity-paper]");
    if (!paper || reduceMotion) return;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const state = {
      x: 0,
      y: 0,
      active: 0,
      lift: -1,
      tiltX: 0,
      tiltY: 0,
      scaleX: 1,
      scaleY: 1,
      radius: 0,
      sheen: 0,
      dent: 0,
      shadow: 0.052,
      contact: 0.035,
      edge: 0,
      edgeX: 0,
      edgeY: 0,
      fiberX: 0,
      fiberY: 0
    };
    const target = { ...state };
    let frameId = null;

    const setVar = (name, value) => shell.style.setProperty(name, value);
    const writeState = () => {
      setVar("--sheen-x", `${state.x.toFixed(1)}px`);
      setVar("--sheen-y", `${state.y.toFixed(1)}px`);
      setVar("--sheen-opacity", state.sheen.toFixed(3));
      setVar("--surface-dent", state.dent.toFixed(3));
      setVar("--paper-lift", `${state.lift.toFixed(2)}px`);
      setVar("--paper-tilt-x", `${state.tiltX.toFixed(3)}deg`);
      setVar("--paper-tilt-y", `${state.tiltY.toFixed(3)}deg`);
      setVar("--paper-scale-x", state.scaleX.toFixed(4));
      setVar("--paper-scale-y", state.scaleY.toFixed(4));
      setVar("--paper-radius", `${state.radius.toFixed(2)}px`);
      setVar("--paper-shadow", state.shadow.toFixed(3));
      setVar("--paper-contact", state.contact.toFixed(3));
      setVar("--edge-glow-opacity", state.edge.toFixed(3));
      setVar("--edge-shift-x", `${state.edgeX.toFixed(2)}px`);
      setVar("--edge-shift-y", `${state.edgeY.toFixed(2)}px`);
      setVar("--fiber-shift-x", `${state.fiberX.toFixed(2)}px`);
      setVar("--fiber-shift-y", `${state.fiberY.toFixed(2)}px`);
    };

    const animate = () => {
      Object.keys(state).forEach((key) => {
        state[key] += (target[key] - state[key]) * 0.13;
      });
      writeState();
      frameId = window.requestAnimationFrame(animate);
    };

    const updatePointer = (event) => {
      const rect = paper.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nx = clamp(x / Math.max(rect.width, 1), 0, 1);
      const ny = clamp(y / Math.max(rect.height, 1), 0, 1);
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const edgeDistance = Math.min(x, y, rect.width - x, rect.height - y);
      const edge = inside ? Math.pow(clamp(1 - edgeDistance / 104, 0, 1), 1.35) : 0;
      const pressure = inside ? 1 : 0;
      const horizontalPull = nx - 0.5;
      const verticalPull = ny - 0.5;

      target.x = x;
      target.y = y;
      target.active = pressure;
      target.lift = -1 - pressure * 5.8 - edge * 1.6;
      target.tiltX = (0.5 - ny) * (0.85 + edge * 0.85);
      target.tiltY = horizontalPull * (0.85 + edge * 0.85);
      target.scaleX = 1 + pressure * 0.004 - Math.abs(horizontalPull) * edge * 0.006;
      target.scaleY = 1 + pressure * 0.003 - Math.abs(verticalPull) * edge * 0.005;
      target.radius = pressure * 1.2 + edge * 2.8;
      target.sheen = 0.07 + pressure * 0.14 + edge * 0.06;
      target.dent = 0.01 + edge * 0.045;
      target.shadow = 0.058 + pressure * 0.02 + edge * 0.02;
      target.contact = 0.036 + pressure * 0.018 + edge * 0.018;
      target.edge = 0.16 + edge * 0.32;
      target.edgeX = horizontalPull * (3.2 + edge * 4.2);
      target.edgeY = verticalPull * (2.4 + edge * 3.8);
      target.fiberX = horizontalPull * (5 + edge * 7);
      target.fiberY = verticalPull * (4 + edge * 6);
      shell.classList.toggle("is-hovered", inside);
    };

    const clearPointer = () => {
      shell.classList.remove("is-hovered");
      target.active = 0;
      target.lift = -1;
      target.tiltX = 0;
      target.tiltY = 0;
      target.scaleX = 1;
      target.scaleY = 1;
      target.radius = 0;
      target.sheen = 0;
      target.dent = 0;
      target.shadow = 0.052;
      target.contact = 0.035;
      target.edge = 0;
      target.edgeX = 0;
      target.edgeY = 0;
      target.fiberX = 0;
      target.fiberY = 0;
    };

    shell.addEventListener("pointermove", updatePointer, { passive: true });
    shell.addEventListener("pointerleave", clearPointer, { passive: true });
    frameId = window.requestAnimationFrame(animate);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!document.hidden && !frameId) {
        frameId = window.requestAnimationFrame(animate);
      }
    });
  };

  initParticleTitle();
  initIdentityCardPhysics();
})();
