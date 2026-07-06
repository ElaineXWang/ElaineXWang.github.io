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

  const initIdentityCardSimple = () => {
    const shell = document.querySelector("[data-identity-card]");
    if (!shell || reduceMotion) return;

    const paper = shell.querySelector("[data-identity-paper]");
    const canvas = shell.querySelector("[data-identity-edge]");
    if (!paper || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer = { active: false, x: 0, y: 0, strength: 0, target: 0 };
    const colors = [
      [54, 86, 101],
      [88, 122, 107],
      [186, 152, 96],
      [138, 164, 177]
    ];
    let width = 0;
    let height = 0;
    let box = { x: 0, y: 0, w: 0, h: 0 };
    let particles = [];
    let frameId = null;
    let resizeTimer = null;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const pointOnEdge = (distance) => {
      const perimeter = Math.max(1, 2 * (box.w + box.h));
      let d = ((distance % perimeter) + perimeter) % perimeter;
      let x = box.x;
      let y = box.y;
      let nx = 0;
      let ny = -1;

      if (d < box.w) {
        x += d;
      } else if (d < box.w + box.h) {
        d -= box.w;
        x += box.w;
        y += d;
        nx = 1;
        ny = 0;
      } else if (d < box.w * 2 + box.h) {
        d -= box.w + box.h;
        x += box.w - d;
        y += box.h;
        nx = 0;
        ny = 1;
      } else {
        d -= box.w * 2 + box.h;
        y += box.h - d;
        nx = -1;
        ny = 0;
      }

      const outward = rand(1.5, 6.5);
      return { x: x + nx * outward, y: y + ny * outward, nx, ny };
    };

    const rebuild = () => {
      const shellRect = shell.getBoundingClientRect();
      const paperRect = paper.getBoundingClientRect();
      width = Math.max(300, Math.round(shellRect.width));
      height = Math.max(240, Math.round(shellRect.height));
      box = {
        x: paperRect.left - shellRect.left,
        y: paperRect.top - shellRect.top,
        w: paperRect.width,
        h: paperRect.height
      };

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const previous = particles;
      const perimeter = 2 * (box.w + box.h);
      const count = clamp(Math.round(perimeter / (width < 520 ? 8.5 : 7.2)), 130, width < 520 ? 190 : 310);

      particles = Array.from({ length: count }, (_, index) => {
        const target = pointOnEdge((perimeter * index) / count + rand(-1.6, 1.6));
        const old = previous[index % Math.max(previous.length, 1)];
        return {
          x: old ? old.x : target.x + rand(-18, 18),
          y: old ? old.y : target.y + rand(-18, 18),
          tx: target.x,
          ty: target.y,
          nx: target.nx,
          ny: target.ny,
          vx: old ? old.vx * 0.35 : 0,
          vy: old ? old.vy * 0.35 : 0,
          r: rand(0.55, 1.35),
          phase: rand(0, Math.PI * 2),
          color: colors[Math.floor(rand(0, colors.length))]
        };
      });
    };

    const updatePointer = (event) => {
      const shellRect = shell.getBoundingClientRect();
      const paperRect = paper.getBoundingClientRect();
      const px = event.clientX - paperRect.left;
      const py = event.clientY - paperRect.top;
      const edgeDistance = Math.min(px, py, paperRect.width - px, paperRect.height - py);
      const strength = clamp(1 - Math.abs(edgeDistance) / (width < 520 ? 98 : 130), 0, 1);

      pointer.active = true;
      pointer.x = event.clientX - shellRect.left;
      pointer.y = event.clientY - shellRect.top;
      pointer.target = strength;

      shell.style.setProperty("--ripple-x", `${px}px`);
      shell.style.setProperty("--ripple-y", `${py}px`);
      shell.style.setProperty("--ripple-opacity", (0.035 + strength * 0.08).toFixed(3));
      shell.style.setProperty("--paper-lift", `${(-1 - strength * 0.7).toFixed(2)}px`);
      shell.style.setProperty("--paper-tilt-x", `${((0.5 - py / paperRect.height) * strength * 0.45).toFixed(2)}deg`);
      shell.style.setProperty("--paper-tilt-y", `${((px / paperRect.width - 0.5) * strength * 0.45).toFixed(2)}deg`);
    };

    const clearPointer = () => {
      pointer.active = false;
      pointer.target = 0;
      shell.style.setProperty("--ripple-opacity", "0.035");
      shell.style.setProperty("--paper-lift", "-1px");
      shell.style.setProperty("--paper-tilt-x", "0deg");
      shell.style.setProperty("--paper-tilt-y", "0deg");
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.08;

      particles.forEach((particle) => {
        const drift = Math.sin(time * 0.0008 + particle.phase) * 0.65;
        const restX = particle.tx + particle.nx * drift;
        const restY = particle.ty + particle.ny * drift;
        particle.vx += (restX - particle.x) * 0.019;
        particle.vy += (restY - particle.y) * 0.019;

        if (pointer.active && pointer.strength > 0.01) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = width < 520 ? 94 : 122;
          if (distance > 0 && distance < radius) {
            const force = Math.pow(1 - distance / radius, 2) * pointer.strength * 1.75;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        particle.vx *= 0.91;
        particle.vy *= 0.91;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const [r, g, b] = particle.color;
        const activity = clamp(Math.hypot(particle.vx, particle.vy) * 0.28, 0, 0.32);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r + activity * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.38 + activity})`;
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    shell.addEventListener("pointermove", updatePointer, { passive: true });
    shell.addEventListener("pointerleave", clearPointer, { passive: true });
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
  initIdentityCardSimple();
})();
