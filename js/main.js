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

    const pointer = { active: false, x: 0, y: 0, side: "top", strength: 0, target: 0 };

    const syncPointer = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const distances = [
        ["top", y],
        ["right", rect.width - x],
        ["bottom", rect.height - y],
        ["left", x]
      ];
      const nearest = distances.sort((a, b) => a[1] - b[1])[0];
      const strength = Math.max(0, Math.min(1, 1 - nearest[1] / 130));
      card.style.setProperty("--ripple-x", `${x}px`);
      card.style.setProperty("--ripple-y", `${y}px`);
      card.style.setProperty("--ripple-opacity", (0.04 + strength * 0.18).toFixed(3));
      card.style.setProperty("--ripple-size", `${Math.round(145 + strength * 80)}px`);
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
      pointer.side = nearest[0];
      pointer.target = strength;
    };

    card.addEventListener("pointermove", syncPointer, { passive: true });
    card.addEventListener(
      "pointerleave",
      () => {
        pointer.active = false;
        pointer.target = 0;
        card.style.setProperty("--ripple-opacity", "0.04");
        card.style.setProperty("--ripple-size", "150px");
      },
      { passive: true }
    );

    if (reduceMotion) return;

    const canvas = card.querySelector("[data-identity-ripple]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frameId = null;
    let resizeTimer = null;
    let lastRipple = 0;
    let ripples = [];

    const rebuild = () => {
      const rect = card.getBoundingClientRect();
      width = Math.max(280, Math.round(rect.width));
      height = Math.max(230, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const projection = (side) => (side === "top" || side === "bottom" ? pointer.x : pointer.y);

    const waveOffset = (side, position, time) => {
      const axis = side === "top" || side === "bottom" ? width : height;
      const focus = pointer.active ? projection(side) : axis * 0.5;
      const distance = Math.abs(position - focus);
      const envelope = Math.exp(-Math.pow(distance / Math.max(axis * 0.22, 82), 2));
      const direction = side === "top" || side === "left" ? 1 : -1;
      const base = Math.sin(position * 0.035 + time * 0.0022) * 0.55;
      const ripple = Math.sin(distance * 0.12 - time * 0.011) * envelope * pointer.strength * 7.5;
      return direction * (base + ripple);
    };

    const drawEdge = (side, time) => {
      const steps = 34;
      ctx.beginPath();

      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        let x = t * width;
        let y = t * height;

        if (side === "top") {
          x = t * width;
          y = 1.5 + waveOffset(side, x, time);
        } else if (side === "bottom") {
          x = t * width;
          y = height - 1.5 + waveOffset(side, x, time);
        } else if (side === "left") {
          x = 1.5 + waveOffset(side, y, time);
          y = t * height;
        } else {
          x = width - 1.5 + waveOffset(side, y, time);
          y = t * height;
        }

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const active = pointer.side === side ? pointer.strength : pointer.strength * 0.25;
      ctx.strokeStyle = `rgba(81, 117, 140, ${0.07 + active * 0.18})`;
      ctx.lineWidth = 1.1 + active * 1.1;
      ctx.stroke();
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.08;

      if (pointer.active && pointer.target > 0.25 && time - lastRipple > 260) {
        ripples.push({ x: pointer.x, y: pointer.y, side: pointer.side, born: time });
        lastRipple = time;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawEdge("top", time);
      drawEdge("right", time);
      drawEdge("bottom", time);
      drawEdge("left", time);

      ripples = ripples.filter((ripple) => time - ripple.born < 1600);
      ripples.forEach((ripple) => {
        const age = (time - ripple.born) / 1600;
        const radius = 18 + age * 115;
        const alpha = (1 - age) * 0.16;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, radius * 1.3, radius * 0.42, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(81, 117, 140, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.restore();

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
