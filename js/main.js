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
    const shell = document.querySelector("[data-identity-card]");
    if (!shell || reduceMotion) return;

    const paper = shell.querySelector("[data-identity-paper]");
    const canvas = shell.querySelector("[data-identity-edge]");
    if (!paper || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer = { active: false, cx: 0, cy: 0, px: 0, py: 0, side: "top", strength: 0, target: 0 };
    const palette = [
      [55, 91, 108],
      [93, 128, 111],
      [205, 171, 112],
      [224, 235, 233],
      [128, 158, 176]
    ];

    let width = 0;
    let height = 0;
    let paperBox = { x: 0, y: 0, w: 0, h: 0 };
    let particles = [];
    let waves = [];
    let frameId = null;
    let resizeTimer = null;
    let lastWave = 0;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const edgePoint = (distance) => {
      const perimeter = Math.max(1, 2 * (paperBox.w + paperBox.h));
      let d = ((distance % perimeter) + perimeter) % perimeter;
      let x = paperBox.x;
      let y = paperBox.y;
      let nx = 0;
      let ny = -1;
      let tx = 1;
      let ty = 0;
      let side = "top";

      if (d < paperBox.w) {
        x += d;
      } else if (d < paperBox.w + paperBox.h) {
        d -= paperBox.w;
        x += paperBox.w;
        y += d;
        nx = 1;
        ny = 0;
        tx = 0;
        ty = 1;
        side = "right";
      } else if (d < paperBox.w * 2 + paperBox.h) {
        d -= paperBox.w + paperBox.h;
        x += paperBox.w - d;
        y += paperBox.h;
        nx = 0;
        ny = 1;
        tx = -1;
        ty = 0;
        side = "bottom";
      } else {
        d -= paperBox.w * 2 + paperBox.h;
        y += paperBox.h - d;
        nx = -1;
        ny = 0;
        tx = 0;
        ty = -1;
        side = "left";
      }

      const outward = rand(-0.6, 8.4);
      const tangent = rand(-1.8, 1.8);
      return {
        x: x + nx * outward + tx * tangent,
        y: y + ny * outward + ty * tangent,
        nx,
        ny,
        tx,
        ty,
        side
      };
    };

    const rebuild = () => {
      const shellRect = shell.getBoundingClientRect();
      const paperRect = paper.getBoundingClientRect();
      width = Math.max(300, Math.round(shellRect.width));
      height = Math.max(240, Math.round(shellRect.height));
      paperBox = {
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
      const perimeter = 2 * (paperBox.w + paperBox.h);
      const targetCount = clamp(Math.round(perimeter / (width < 520 ? 7.3 : 6.1)), 160, width < 520 ? 220 : 380);

      particles = Array.from({ length: targetCount }, (_, index) => {
        const target = edgePoint((perimeter * index) / targetCount + rand(-2.5, 2.5));
        const old = previous[index % Math.max(previous.length, 1)];
        const color = palette[Math.floor(rand(0, palette.length))];
        return {
          x: old ? old.x : target.x + rand(-20, 20),
          y: old ? old.y : target.y + rand(-20, 20),
          tx: target.x,
          ty: target.y,
          nx: target.nx,
          ny: target.ny,
          tangentX: target.tx,
          tangentY: target.ty,
          side: target.side,
          vx: old ? old.vx * 0.35 : 0,
          vy: old ? old.vy * 0.35 : 0,
          r: rand(0.55, 1.65),
          phase: rand(0, Math.PI * 2),
          color,
          glow: old ? old.glow * 0.6 : 0
        };
      });
    };

    const addWave = (time) => {
      if (pointer.target < 0.25 || time - lastWave < 210) return;
      waves.push({
        x: pointer.cx,
        y: pointer.cy,
        side: pointer.side,
        born: time,
        strength: pointer.target
      });
      lastWave = time;
    };

    const syncPointer = (event) => {
      const shellRect = shell.getBoundingClientRect();
      const paperRect = paper.getBoundingClientRect();
      const px = event.clientX - paperRect.left;
      const py = event.clientY - paperRect.top;
      const distances = [
        { side: "top", value: py },
        { side: "right", value: paperRect.width - px },
        { side: "bottom", value: paperRect.height - py },
        { side: "left", value: px }
      ];
      const nearest = distances.sort((a, b) => Math.abs(a.value) - Math.abs(b.value))[0];
      const edgeRadius = width < 520 ? 116 : 160;
      const strength = clamp(1 - Math.abs(nearest.value) / edgeRadius, 0, 1);

      pointer.active = true;
      pointer.cx = event.clientX - shellRect.left;
      pointer.cy = event.clientY - shellRect.top;
      pointer.px = px;
      pointer.py = py;
      pointer.side = nearest.side;
      pointer.target = strength;

      shell.style.setProperty("--edge-x", `${pointer.cx}px`);
      shell.style.setProperty("--edge-y", `${pointer.cy}px`);
      shell.style.setProperty("--edge-glow", (0.13 + strength * 0.32).toFixed(3));
      shell.style.setProperty("--ripple-x", `${px}px`);
      shell.style.setProperty("--ripple-y", `${py}px`);
      shell.style.setProperty("--ripple-opacity", (0.04 + strength * 0.16).toFixed(3));
      shell.style.setProperty("--ripple-size", `${Math.round(150 + strength * 92)}px`);
      shell.style.setProperty("--paper-lift", `${(-1 - strength * 1.15).toFixed(2)}px`);
      shell.style.setProperty("--paper-tilt-x", `${((0.5 - py / paperRect.height) * strength * 0.95).toFixed(2)}deg`);
      shell.style.setProperty("--paper-tilt-y", `${((px / paperRect.width - 0.5) * strength * 0.95).toFixed(2)}deg`);

      addWave(performance.now());
    };

    const clearPointer = () => {
      pointer.active = false;
      pointer.target = 0;
      shell.style.setProperty("--edge-glow", "0.13");
      shell.style.setProperty("--ripple-opacity", "0.04");
      shell.style.setProperty("--ripple-size", "150px");
      shell.style.setProperty("--paper-lift", "-1px");
      shell.style.setProperty("--paper-tilt-x", "0deg");
      shell.style.setProperty("--paper-tilt-y", "0deg");
    };

    const drawPaperPath = (offset = 0) => {
      const radius = 12 + offset * 0.2;
      const x = paperBox.x - offset;
      const y = paperBox.y - offset;
      const w = paperBox.w + offset * 2;
      const h = paperBox.h + offset * 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    };

    const drawSoftFrame = () => {
      const frameGradient = ctx.createLinearGradient(paperBox.x, paperBox.y, paperBox.x + paperBox.w, paperBox.y + paperBox.h);
      frameGradient.addColorStop(0, `rgba(81, 117, 140, ${0.1 + pointer.strength * 0.13})`);
      frameGradient.addColorStop(0.48, `rgba(224, 235, 233, ${0.24 + pointer.strength * 0.16})`);
      frameGradient.addColorStop(1, `rgba(205, 171, 112, ${0.1 + pointer.strength * 0.12})`);

      ctx.save();
      ctx.shadowColor = `rgba(105, 132, 112, ${0.16 + pointer.strength * 0.16})`;
      ctx.shadowBlur = 10 + pointer.strength * 18;
      ctx.lineWidth = 1.05 + pointer.strength * 0.75;
      ctx.strokeStyle = frameGradient;
      drawPaperPath(2.4);
      ctx.stroke();
      ctx.restore();
    };

    const drawWaves = (time) => {
      waves = waves.filter((wave) => time - wave.born < 1700);
      waves.forEach((wave) => {
        const age = (time - wave.born) / 1700;
        const alpha = (1 - age) * 0.38 * wave.strength;
        const spread = 42 + age * 155;
        const lift = Math.sin(age * Math.PI) * 14 * wave.strength;
        let nx = 0;
        let ny = -1;

        if (wave.side === "right") {
          nx = 1;
          ny = 0;
        } else if (wave.side === "bottom") {
          nx = 0;
          ny = 1;
        } else if (wave.side === "left") {
          nx = -1;
          ny = 0;
        }

        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = `rgba(205, 171, 112, ${alpha * 0.6})`;
        ctx.shadowBlur = 8 + wave.strength * 10;
        ctx.lineWidth = 1.25 + wave.strength * 0.5;
        ctx.strokeStyle = `rgba(90, 126, 139, ${alpha})`;
        ctx.beginPath();

        if (wave.side === "top" || wave.side === "bottom") {
          const y = wave.y + ny * lift;
          ctx.moveTo(wave.x - spread, y);
          ctx.quadraticCurveTo(wave.x, y + ny * lift * 0.9, wave.x + spread, y);
        } else {
          const x = wave.x + nx * lift;
          ctx.moveTo(x, wave.y - spread);
          ctx.quadraticCurveTo(x + nx * lift * 0.9, wave.y, x, wave.y + spread);
        }

        ctx.stroke();
        ctx.restore();
      });
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.075;

      drawSoftFrame();
      drawWaves(time);

      particles.forEach((particle) => {
        const idle = Math.sin(time * 0.001 + particle.phase) * 0.9;
        const shimmer = Math.cos(time * 0.00072 + particle.phase) * 0.45;
        const restX = particle.tx + particle.nx * idle + particle.tangentX * shimmer;
        const restY = particle.ty + particle.ny * idle + particle.tangentY * shimmer;

        particle.vx += (restX - particle.x) * 0.018;
        particle.vy += (restY - particle.y) * 0.018;

        if (pointer.active && pointer.strength > 0.01) {
          const dx = particle.x - pointer.cx;
          const dy = particle.y - pointer.cy;
          const distance = Math.hypot(dx, dy);
          const radius = width < 520 ? 110 : 154;

          if (distance > 0 && distance < radius) {
            const force = Math.pow(1 - distance / radius, 2) * pointer.strength;
            particle.vx += (dx / distance) * force * 2.35 + (-dy / distance) * force * 0.42;
            particle.vy += (dy / distance) * force * 2.35 + (dx / distance) * force * 0.42;
            particle.glow = Math.max(particle.glow, force * 1.35);
          }
        }

        particle.vx *= 0.9;
        particle.vy *= 0.9;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.glow *= 0.9;

        const [r, g, b] = particle.color;
        const speed = Math.hypot(particle.vx, particle.vy);
        const alpha = 0.28 + particle.glow * 0.58 + Math.sin(time * 0.001 + particle.phase) * 0.035;

        if (speed > 0.055 || particle.glow > 0.045) {
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.vx * 6.4, particle.y - particle.vy * 6.4);
          ctx.lineTo(particle.x, particle.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(0.38, particle.glow * 0.42 + 0.045)})`;
          ctx.lineWidth = Math.max(0.5, particle.r * 0.8);
          ctx.stroke();
        }

        if (particle.glow > 0.065) {
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.r * 8.2);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${particle.glow * 0.36})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.r * 8.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0.22, 0.82)})`;
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    shell.addEventListener("pointermove", syncPointer, { passive: true });
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
  initIdentityCard();
})();
