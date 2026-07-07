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

  const initParticlePet = () => {
    const stage = document.querySelector("[data-particle-pet]");
    if (!stage || reduceMotion) return;

    const canvas = stage.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer = { active: false, x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let particles = [];
    let frameId = null;
    let resizeTimer = null;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const roundedRect = (context, x, y, w, h, r) => {
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.fill();
    };

    const drawElephant = (context, boxWidth, boxHeight) => {
      const scale = Math.min(boxWidth / 224, boxHeight / 176);
      const offsetX = (boxWidth - 224 * scale) / 2;
      const offsetY = (boxHeight - 176 * scale) / 2 + 6 * scale;
      const x = (value) => offsetX + value * scale;
      const y = (value) => offsetY + value * scale;

      context.clearRect(0, 0, boxWidth, boxHeight);
      context.fillStyle = "#111";
      context.strokeStyle = "#111";
      context.lineCap = "round";
      context.lineJoin = "round";

      context.beginPath();
      context.ellipse(x(94), y(82), 54 * scale, 33 * scale, -0.04, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.ellipse(x(132), y(72), 22 * scale, 28 * scale, -0.18, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.ellipse(x(150), y(77), 28 * scale, 25 * scale, 0.08, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = 18 * scale;
      context.beginPath();
      context.moveTo(x(169), y(86));
      context.bezierCurveTo(x(190), y(100), x(176), y(133), x(151), y(125));
      context.stroke();

      context.lineWidth = 4.4 * scale;
      context.beginPath();
      context.moveTo(x(168), y(86));
      context.quadraticCurveTo(x(189), y(88), x(198), y(80));
      context.stroke();

      context.lineWidth = 5 * scale;
      context.beginPath();
      context.moveTo(x(42), y(75));
      context.quadraticCurveTo(x(24), y(64), x(28), y(51));
      context.stroke();

      [58, 82, 112, 136].forEach((legX, index) => {
        const h = index % 2 === 0 ? 40 : 36;
        roundedRect(context, x(legX), y(101), 15 * scale, h * scale, 7 * scale);
        context.beginPath();
        context.ellipse(x(legX + 7), y(101 + h), 11 * scale, 5 * scale, 0, 0, Math.PI * 2);
        context.fill();
      });

      context.beginPath();
      context.ellipse(x(156), y(70), 3.5 * scale, 3.5 * scale, 0, 0, Math.PI * 2);
      context.fill();
    };

    const makeTargets = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return [];

      drawElephant(offCtx, width, height);
      const imageData = offCtx.getImageData(0, 0, width, height).data;
      const step = width < 190 ? 3 : 2;
      let targets = [];

      const eye = { x: width * 0.7, y: height * 0.4 };
      const tusk = { x: width * 0.83, y: height * 0.46 };
      const scale = Math.min(width / 224, height / 176);
      const offsetX = (width - 224 * scale) / 2;
      const offsetY = (height - 176 * scale) / 2 + 6 * scale;
      const sx = (value) => offsetX + value * scale;
      const sy = (value) => offsetY + value * scale;
      const outlineColor = "rgba(76, 112, 126, 0.58)";
      const softOutlineColor = "rgba(126, 157, 162, 0.5)";
      const addPoint = (x, y, zone, color, size = rand(0.58, 1.08)) => {
        targets.push({
          x: x + rand(-0.72, 0.72),
          y: y + rand(-0.72, 0.72),
          zone,
          color,
          size,
          feature: true
        });
      };
      const addEllipse = (cx, cy, rx, ry, rotation, count, zone, color) => {
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rotatedX = cos * rx * Math.cos(rotation) - sin * ry * Math.sin(rotation);
          const rotatedY = cos * rx * Math.sin(rotation) + sin * ry * Math.cos(rotation);
          addPoint(sx(cx) + rotatedX * scale, sy(cy) + rotatedY * scale, zone, color, rand(0.62, 1.16));
        }
      };
      const cubicPoint = (a, b, c, d, t) => {
        const mt = 1 - t;
        return mt ** 3 * a + 3 * mt ** 2 * t * b + 3 * mt * t ** 2 * c + t ** 3 * d;
      };
      const addCurve = (x1, y1, x2, y2, x3, y3, x4, y4, count, zone, color) => {
        for (let i = 0; i < count; i += 1) {
          const t = i / Math.max(count - 1, 1);
          addPoint(
            sx(cubicPoint(x1, x2, x3, x4, t)),
            sy(cubicPoint(y1, y2, y3, y4, t)),
            zone,
            color,
            rand(0.66, 1.2)
          );
        }
      };
      const addLine = (x1, y1, x2, y2, count, zone, color) => {
        for (let i = 0; i < count; i += 1) {
          const t = i / Math.max(count - 1, 1);
          addPoint(sx(x1 + (x2 - x1) * t), sy(y1 + (y2 - y1) * t), zone, color, rand(0.6, 1.1));
        }
      };

      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          const alpha = imageData[(py * width + px) * 4 + 3];
          if (alpha > 70) {
            const nx = px / width;
            const ny = py / height;
            const isEye = Math.hypot(px - eye.x, py - eye.y) < 5;
            const isTusk = Math.hypot(px - tusk.x, py - tusk.y) < 18 && ny < 0.55;
            const zone = ny > 0.62 ? "leg" : nx > 0.66 ? "trunk" : nx > 0.53 && ny < 0.58 ? "head" : "body";
            let color = "rgba(224, 236, 235, 0.72)";
            if (Math.random() > 0.68) color = "rgba(242, 247, 245, 0.82)";
            if (Math.random() > 0.84) color = "rgba(91, 122, 134, 0.48)";
            if (isEye) color = "rgba(43, 78, 90, 0.76)";
            if (isTusk) color = "rgba(207, 184, 143, 0.5)";
            targets.push({
              x: px + rand(-0.45, 0.45),
              y: py + rand(-0.45, 0.45),
              zone,
              color
            });
          }
        }
      }

      addEllipse(94, 82, 55, 34, -0.04, 180, "body", softOutlineColor);
      addEllipse(132, 72, 22, 28, -0.18, 90, "head", softOutlineColor);
      addEllipse(150, 77, 28, 25, 0.08, 112, "head", outlineColor);
      addCurve(169, 86, 190, 100, 176, 133, 151, 125, 120, "trunk", outlineColor);
      addCurve(168, 86, 187, 88, 191, 86, 198, 80, 44, "trunk", "rgba(201, 176, 131, 0.56)");
      addCurve(42, 75, 31, 69, 24, 63, 28, 51, 42, "body", outlineColor);
      [58, 82, 112, 136].forEach((legX) => {
        addLine(legX, 103, legX, 139, 28, "leg", softOutlineColor);
        addLine(legX + 15, 103, legX + 15, 139, 28, "leg", softOutlineColor);
        addEllipse(legX + 7, 141, 11, 5, 0, 36, "leg", softOutlineColor);
      });
      for (let i = 0; i < 34; i += 1) {
        addPoint(sx(156), sy(70), "head", "rgba(43, 78, 90, 0.78)", rand(0.72, 1.2));
      }

      const maxParticles = width < 190 ? 1450 : 2400;
      if (targets.length > maxParticles) {
        const stride = Math.ceil(targets.length / maxParticles);
        targets = targets.filter((target, index) => target.feature || index % stride === 0);
      }

      return targets;
    };

    const rebuild = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);
      if (width < 80 || height < 80) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const previous = particles;
      const targets = makeTargets();
      particles = targets.map((target, index) => {
        const old = previous[index % Math.max(previous.length, 1)];
        return {
          x: old ? old.x : target.x + rand(-36, 36),
          y: old ? old.y : target.y + rand(-28, 28),
          tx: target.x,
          ty: target.y,
          vx: old ? old.vx * 0.35 : 0,
          vy: old ? old.vy * 0.35 : 0,
          r: target.size || rand(0.52, 1.08),
          phase: rand(0, Math.PI * 2),
          swing: rand(1.2, 3.4),
          zone: target.zone,
          color: target.color
        };
      });
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const walk = Math.sin(time * 0.00052) * 15;
      const bob = Math.sin(time * 0.0015) * 2.2;

      particles.forEach((particle) => {
        let tx = particle.tx + walk;
        let ty = particle.ty + bob;

        if (particle.zone === "leg") {
          const step = Math.sin(time * 0.0032 + particle.phase);
          tx += step * particle.swing;
          ty += Math.abs(step) * 1.6;
        } else if (particle.zone === "trunk") {
          tx += Math.sin(time * 0.0019 + particle.phase) * 2.6;
          ty += Math.cos(time * 0.0016 + particle.phase) * 1.4;
        } else if (particle.zone === "head") {
          ty += Math.sin(time * 0.00135 + particle.phase) * 1.1;
        }

        particle.vx += (tx - particle.x) * 0.019;
        particle.vy += (ty - particle.y) * 0.019;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = width < 190 ? 68 : 82;

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * 1.28;
            particle.vx += (dx / distance) * force + (-dy / distance) * force * 0.1;
            particle.vy += (dy / distance) * force + (dx / distance) * force * 0.1;
          }
        }

        particle.vx *= 0.9;
        particle.vy *= 0.9;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const shimmer = Math.sin(time * 0.001 + particle.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r + shimmer * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    stage.addEventListener(
      "pointermove",
      (event) => {
        const rect = stage.getBoundingClientRect();
        pointer.active = true;
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      },
      { passive: true }
    );

    stage.addEventListener(
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
  initParticlePet();
  initLiquidMicroInteractions();
})();
