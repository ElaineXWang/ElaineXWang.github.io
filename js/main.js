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
    const rand = (min, max) => Math.random() * (max - min) + min;

    const state = {
      x: 0,
      y: 0,
      sheen: 0,
      dent: 0,
      shadow: 0.052,
      contact: 0.035,
      edgeGlow: 0,
      fiberX: 0,
      fiberY: 0
    };
    const target = { ...state };
    const pointer = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      lastX: 0,
      lastY: 0,
      lastT: 0
    };
    let width = 0;
    let height = 0;
    let points = [];
    let frameId = null;
    let resizeTimer = null;

    const setVar = (name, value) => shell.style.setProperty(name, value);

    const addPoint = (x, y, nx, ny) => {
      const fiber = rand(-0.45, 0.45);
      points.push({
        restX: x + nx * fiber,
        restY: y + ny * fiber,
        x: x + nx * fiber,
        y: y + ny * fiber,
        vx: 0,
        vy: 0,
        nx,
        ny
      });
    };

    const rebuildEdge = () => {
      const rect = paper.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(220, Math.round(rect.height));
      points = [];

      const radius = Math.min(20, width * 0.045, height * 0.08);
      const sideSteps = width < 560 ? 10 : 16;
      const verticalSteps = width < 560 ? 7 : 10;
      const cornerSteps = 6;

      for (let i = 0; i <= sideSteps; i += 1) {
        addPoint(radius + ((width - radius * 2) * i) / sideSteps, 0, 0, -1);
      }
      for (let i = 1; i <= cornerSteps; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / (2 * cornerSteps);
        addPoint(width - radius + Math.cos(angle) * radius, radius + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle));
      }
      for (let i = 1; i <= verticalSteps; i += 1) {
        addPoint(width, radius + ((height - radius * 2) * i) / verticalSteps, 1, 0);
      }
      for (let i = 1; i <= cornerSteps; i += 1) {
        const angle = (i * Math.PI) / (2 * cornerSteps);
        addPoint(width - radius + Math.cos(angle) * radius, height - radius + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle));
      }
      for (let i = 1; i <= sideSteps; i += 1) {
        addPoint(width - radius - ((width - radius * 2) * i) / sideSteps, height, 0, 1);
      }
      for (let i = 1; i <= cornerSteps; i += 1) {
        const angle = Math.PI / 2 + (i * Math.PI) / (2 * cornerSteps);
        addPoint(radius + Math.cos(angle) * radius, height - radius + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle));
      }
      for (let i = 1; i <= verticalSteps; i += 1) {
        addPoint(0, height - radius - ((height - radius * 2) * i) / verticalSteps, -1, 0);
      }
      for (let i = 1; i <= cornerSteps; i += 1) {
        const angle = Math.PI + (i * Math.PI) / (2 * cornerSteps);
        addPoint(radius + Math.cos(angle) * radius, radius + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle));
      }
    };

    const writeClip = () => {
      if (!points.length) return;
      const polygon = points
        .map((point) => {
          const x = (point.x / width) * 100;
          const y = (point.y / height) * 100;
          return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
        })
        .join(", ");
      setVar("--paper-clip", `polygon(${polygon})`);
    };

    const writeState = () => {
      setVar("--sheen-x", `${state.x.toFixed(1)}px`);
      setVar("--sheen-y", `${state.y.toFixed(1)}px`);
      setVar("--sheen-opacity", state.sheen.toFixed(3));
      setVar("--surface-dent", state.dent.toFixed(3));
      setVar("--paper-shadow", state.shadow.toFixed(3));
      setVar("--paper-contact", state.contact.toFixed(3));
      setVar("--edge-glow-opacity", state.edgeGlow.toFixed(3));
      setVar("--fiber-shift-x", `${state.fiberX.toFixed(2)}px`);
      setVar("--fiber-shift-y", `${state.fiberY.toFixed(2)}px`);
    };

    const animate = () => {
      Object.keys(state).forEach((key) => {
        state[key] += (target[key] - state[key]) * 0.13;
      });

      points.forEach((point) => {
        point.vx += (point.restX - point.x) * 0.055;
        point.vy += (point.restY - point.y) * 0.055;

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);
          const radius = width < 560 ? 112 : 154;

          if (distance > 0 && distance < radius) {
            const pull = Math.pow(1 - distance / radius, 2.15);
            const velocity = Math.hypot(pointer.vx, pointer.vy);
            const tide = 1 + clamp(velocity / 18, 0, 0.72);
            point.vx += (dx / distance) * pull * 1.36 * tide + pointer.vx * pull * 0.074;
            point.vy += (dy / distance) * pull * 1.36 * tide + pointer.vy * pull * 0.074;
          }
        }

        point.vx *= 0.82;
        point.vy *= 0.82;
        point.x += point.vx;
        point.y += point.vy;

        const offsetX = point.x - point.restX;
        const offsetY = point.y - point.restY;
        const offset = Math.hypot(offsetX, offsetY);
        const limit = width < 560 ? 14 : 21;
        if (offset > limit) {
          const scale = limit / offset;
          point.x = point.restX + offsetX * scale;
          point.y = point.restY + offsetY * scale;
          point.vx *= 0.58;
          point.vy *= 0.58;
        }
      });

      points.forEach((point, index) => {
        const previous = points[(index - 1 + points.length) % points.length];
        const next = points[(index + 1) % points.length];
        const surfaceX = (previous.x + next.x) * 0.5 - point.x;
        const surfaceY = (previous.y + next.y) * 0.5 - point.y;
        point.vx += surfaceX * 0.021;
        point.vy += surfaceY * 0.021;
      });

      writeState();
      writeClip();
      frameId = window.requestAnimationFrame(animate);
    };

    const updatePointer = (event) => {
      const rect = paper.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = window.performance.now();
      const elapsed = Math.max(16, now - pointer.lastT);
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const near = x >= -80 && y >= -80 && x <= rect.width + 80 && y <= rect.height + 80;
      const edgeDistance = Math.min(x, y, rect.width - x, rect.height - y);
      const edge = near ? Math.pow(clamp(1 - Math.abs(edgeDistance) / 118, 0, 1), 1.05) : 0;
      const pressure = inside ? 1 : 0;

      pointer.vx = clamp(((x - pointer.lastX) / elapsed) * 16, -28, 28);
      pointer.vy = clamp(((y - pointer.lastY) / elapsed) * 16, -28, 28);
      pointer.x = x;
      pointer.y = y;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastT = now;
      pointer.active = near;

      target.x = x;
      target.y = y;
      target.sheen = pressure ? 0.07 + pressure * 0.14 + edge * 0.06 : 0;
      target.dent = pressure ? 0.01 + edge * 0.045 : 0;
      target.shadow = 0.052 + edge * 0.018;
      target.contact = 0.035 + edge * 0.018;
      target.edgeGlow = near ? 0.12 + edge * 0.3 : 0;
      target.fiberX = pointer.vx * 0.08;
      target.fiberY = pointer.vy * 0.07;
      shell.classList.toggle("is-hovered", near);
    };

    const clearPointer = () => {
      shell.classList.remove("is-hovered");
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
      target.sheen = 0;
      target.dent = 0;
      target.shadow = 0.052;
      target.contact = 0.035;
      target.edgeGlow = 0;
      target.fiberX = 0;
      target.fiberY = 0;
    };

    shell.addEventListener("pointermove", updatePointer, { passive: true });
    shell.addEventListener("pointerleave", clearPointer, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(rebuildEdge, 160);
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!document.hidden && !frameId) {
        frameId = window.requestAnimationFrame(animate);
      }
    });

    rebuildEdge();
    frameId = window.requestAnimationFrame(animate);
  };

  const initLiquidMicroInteractions = () => {
    if (reduceMotion) return;

    const items = document.querySelectorAll(".identity-keywords span, .metric-card");
    if (!items.length) return;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    items.forEach((element) => {
      const isMetric = element.classList.contains("metric-card");
      const state = {
        x: 50,
        y: 50,
        opacity: 0,
        shiftX: 0,
        shiftY: 0,
        scale: 1,
        numberScale: 1,
        border: 0
      };
      const target = { ...state };
      let frameId = null;

      const write = () => {
        element.style.setProperty("--fluid-x", `${state.x.toFixed(1)}%`);
        element.style.setProperty("--fluid-y", `${state.y.toFixed(1)}%`);
        element.style.setProperty("--fluid-opacity", state.opacity.toFixed(3));
        element.style.setProperty("--fluid-shift-x", `${state.shiftX.toFixed(2)}px`);
        element.style.setProperty("--fluid-shift-y", `${state.shiftY.toFixed(2)}px`);
        element.style.setProperty("--fluid-scale", state.scale.toFixed(4));
        element.style.setProperty("--number-scale", state.numberScale.toFixed(4));
        element.style.setProperty("--fluid-border", state.border.toFixed(3));
      };

      const animate = () => {
        let moving = false;
        Object.keys(state).forEach((key) => {
          state[key] += (target[key] - state[key]) * 0.18;
          moving = moving || Math.abs(target[key] - state[key]) > 0.002;
        });
        write();

        if (moving || element.classList.contains("is-fluid-active")) {
          frameId = window.requestAnimationFrame(animate);
        } else {
          frameId = null;
        }
      };

      const ensureAnimation = () => {
        if (!frameId) frameId = window.requestAnimationFrame(animate);
      };

      const update = (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const nx = clamp(x / Math.max(rect.width, 1), 0, 1);
        const ny = clamp(y / Math.max(rect.height, 1), 0, 1);
        const centerX = nx - 0.5;
        const centerY = ny - 0.5;
        const pull = isMetric ? 4.6 : 2.4;

        target.x = nx * 100;
        target.y = ny * 100;
        target.opacity = isMetric ? 0.44 : 0.36;
        target.shiftX = centerX * pull;
        target.shiftY = centerY * pull * 0.72;
        target.scale = isMetric ? 1.012 : 1.018;
        target.numberScale = isMetric ? 1.032 : 1;
        target.border = isMetric ? 1 : 0.8;
        element.classList.add("is-fluid-active");
        ensureAnimation();
      };

      const clear = () => {
        target.opacity = 0;
        target.shiftX = 0;
        target.shiftY = 0;
        target.scale = 1;
        target.numberScale = 1;
        target.border = 0;
        element.classList.remove("is-fluid-active");
        ensureAnimation();
      };

      element.addEventListener("pointermove", update, { passive: true });
      element.addEventListener("pointerleave", clear, { passive: true });
      element.addEventListener("blur", clear, { passive: true });
      write();
    });
  };

  initParticleTitle();
  initIdentityCardPhysics();
  initLiquidMicroInteractions();
})();
