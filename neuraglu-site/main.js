// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      document.querySelector(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', id);
    }
  });
});

// Optional: subtle scroll-reveal (basic) for any elements you mark manually
const reveal = (el) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(14px)';
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        el.style.transition = 'opacity .6s ease, transform .6s ease';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12 });
  io.observe(el);
};
document.querySelectorAll('.card, .step, .section h2').forEach(reveal);

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  if (!btn) return;
  btn.addEventListener('click', () => {
    item.classList.toggle('open');
  });
});

/* ---- Scroll reveal (stagger via data-delay) ---- */
(() => {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

  // optional: assign delays in each grid
  const groups = [
    document.querySelector('#features .grid-4'),
    document.querySelector('#how .grid-4')
  ].filter(Boolean);

  groups.forEach(group => {
    [...group.children].forEach((el, i) => el.querySelector('.reveal')?.setAttribute('data-delay', String(i)));
  });

  items.forEach(el => io.observe(el));
})();

/* ---- Card tilt (3D) ---- */
(() => {
  const tilts = document.querySelectorAll('.tilt');
  if (!tilts.length) return;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  tilts.forEach(card => {
    const r = 8; // max degrees
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = clamp((0.5 - y) * (r * 2), -r, r);
      const ry = clamp((x - 0.5) * (r * 2), -r, r);
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      // shine position
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    };
    const onLeave = () => { card.style.transform = ''; };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
  });
})();

/* ---- Hero parallax (subtle) ---- */
(() => {
  const wrap = document.querySelector('.hero-parallax');
  const svg = wrap?.querySelector('.flow-svg');
  if (!wrap || !svg) return;

  const max = 8; // px translate
  const onMove = (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    svg.style.transform = `translate(${x * max}px, ${y * max}px) rotateX(${(-y) * 4}deg) rotateY(${x * 4}deg)`;
  };
  const onLeave = () => { svg.style.transform = ''; };

  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerleave', onLeave);
})();

/* --- Sticky header shadow --- */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', y > 8);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* --- Scroll-spy with debounce (active section in nav) --- */
(() => {
  const links = [...document.querySelectorAll('header nav a[href^="#"]:not(.btn)')];
  if (!links.length) return;

  const map = new Map(); // sectionEl -> linkEl
  links.forEach(link => {
    const id = link.getAttribute('href');
    const sec = id && document.querySelector(id);
    if (sec) map.set(sec, link);
  });

  let lock;
  const setActive = (link) => {
    clearTimeout(lock);
    lock = setTimeout(() => {
      links.forEach(a => a.classList.remove('is-active'));
      link?.classList.add('is-active');
    }, 80);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) setActive(map.get(en.target));
    });
  }, {
    threshold: 0.6,                // section is “active” when ~60% visible
    rootMargin: '-80px 0px -35% 0px' // account for sticky header height
  });

  map.forEach((_l, sec) => io.observe(sec));
})();


/* --- Force hero reveal + eager check --- */
(() => {
  document.querySelector('.hero__copy.reveal')?.classList.add('is-in');

  const items = document.querySelectorAll('.reveal');
  items.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) el.classList.add('is-in');
  });
})();

/* --- Highlight flow labels as dot passes --- */
(() => {
  const labels = document.querySelectorAll('.flow-label');
  if (!labels.length) return;

  let i = 0;
  setInterval(() => {
    labels.forEach(l => l.classList.remove('active'));
    labels[i % labels.length].classList.add('active');
    i++;
  }, 2000); // every 2s cycle highlight
})();

/* --- Schematic sequence: highlight nodes + wires in sync with 4s dot --- */
(() => {
  const diagram = document.querySelector('.dataflow-diagram');
  if (!diagram) return;

  // Order matters: match the visual left-to-right flow you added
  const nodes = [...diagram.querySelectorAll('.node')];              // 6 nodes (5 inputs + 1 output)
  const wires = [...diagram.querySelectorAll('svg .wire')];          // 5 wires feeding the curve
  const tap   = diagram.querySelector('svg .tap');                   // output tap circle

  if (!nodes.length) return;

  // Approx timings along the 4s path (ms). Tune if you like.
  // Inputs left->right then Output.
  const t = [450, 1050, 1750, 2450, 3100, 3725]; // tuned: BG, Insulin, Activity, Weight&Age, Carb History, Output
  const cycleMs = 4000;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  if (prefersReduced) return; // don't animate if user prefers reduced motion

  let rafId;
  const runCycle = () => {
    // clear any pending timers from the previous cycle
    timers.forEach(id => clearTimeout(id));
    timers = [];

    // clear previous actives
    nodes.forEach(n => n.classList.remove('active'));
    wires.forEach(w => w.classList.remove('active'));
    tap?.classList.remove('blink');

    // schedule highlights
    // map node 0..4 to wires 0..4; node 5 -> output tap
    t.forEach((ms, i) => {
      const id = setTimeout(() => {
        nodes.forEach(n => n.classList.remove('active'));
        nodes[i]?.classList.add('active');

        if (i < wires.length) {
          wires.forEach(w => w.classList.remove('active'));
          wires[i]?.classList.add('active');
        } else {
          tap?.classList.add('blink');
        }
      }, ms);
      timers.push(id);
    });

    // schedule next cycle
    rafId = setTimeout(runCycle, cycleMs);
  };

  // Start after a tiny delay so the page is ready
  setTimeout(runCycle, 200);

  // Clean up if you ever navigate SPA-style
  window.addEventListener('beforeunload', () => {
    clearTimeout(rafId);
    timers.forEach(id => clearTimeout(id));
  });
})();

// ---------- Utility ----------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ---------- Sticky header on scroll ----------
(() => {
  const header = $('.site-header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ---------- Scroll reveal (elements with .reveal) ----------
(() => {
  const els = $$('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

// ---------- FAQ accordion (works on any page if present) ----------
(() => {
  const items = $$('.faq-item');
  if (!items.length) return;
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

// ---------- Hero parallax (only runs if .hero-parallax exists) ----------
(() => {
  const wrap = $('.hero-parallax');
  const art = $('.hero-parallax .flow-svg, .hero-parallax .hero-illustration');
  if (!wrap || !art) return;

  const move = (e) => {
    const rect = wrap.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    const rotX = my * -6;   // tilt up/down
    const rotY = mx *  6;   // tilt left/right
    art.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
  };
  const reset = () => { art.style.transform = 'none'; };

  wrap.addEventListener('mousemove', move);
  wrap.addEventListener('mouseleave', reset);
})();

// ---------- Nav active state ----------
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = $$('header nav a');
  links.forEach(a => {
    // normalize href target
    const href = a.getAttribute('href') || '';
    const file = href.includes('.html') ? href.split('/').pop() : null;
    a.classList.toggle('is-active', !!file && file === path);
  });
})();

// ---------- Data Flow page: placeholder hooks ----------
(() => {
  // Only run on data-flow page
  const onDataFlowPage = /data-flow\.html$/.test(location.pathname);
  if (!onDataFlowPage) return;

  // Example: When we add interactive blocks later, keep the scaffolding ready
  // Smooth-scroll to top on load (useful if coming from deep scroll on home)
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Placeholder: click-to-highlight future diagram or cards
  $$('.card, .step').forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('active'));
    el.addEventListener('mouseleave', () => el.classList.remove('active'));
  });
})();

(function(){
  const path   = document.getElementById('trendPath');
  const red    = document.getElementById('progressRed');
  const green  = document.getElementById('progressGreen');
  const ball   = document.getElementById('ball');
  if(!path || !ball || !red || !green) return;

  const total   = path.getTotalLength();
  const splitAt = 0.60;                 
  const split   = total * splitAt;

  [red, green].forEach(p => {
    p.style.strokeDasharray = `0 ${total}`;
    p.style.strokeDashoffset = '0';
  });

  let d = 0;
  const pxPerFrame = 2.2;

  function drawProgress(progressLen){
    const redLen = Math.min(progressLen, split);
    red.style.strokeDasharray = `${redLen} ${total}`;

    const greenLen = Math.max(0, progressLen - split);
    green.style.strokeDasharray = `${greenLen} ${total}`;
    green.style.strokeDashoffset = `-${split}`;
  }

  function frame(){
    d += pxPerFrame;
    if (d > total) {
      // short pause before restarting
      setTimeout(() => {
        d = 0;
        [red, green].forEach(p => p.style.strokeDasharray = `0 ${total}`);
        ball.classList.remove('is-green');
        requestAnimationFrame(frame);
      }, 800); // 0.8s pause at top
      return;
    }

    const p = path.getPointAtLength(d);
    ball.setAttribute('cx', p.x);
    ball.setAttribute('cy', p.y);

    drawProgress(d);

    const t = d / total;
    if (t > 0.9) ball.classList.add('is-green');
    else         ball.classList.remove('is-green');

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();


(function() {
  const target = document.getElementById('early-access');
  if (!target) return;

  function go(e){
    e.preventDefault();
    const header = document.querySelector('header, .site-header, .nav');
    const headerH = header ? header.offsetHeight : 0;
    const y = target.getBoundingClientRect().top + window.pageYOffset - (headerH + 16);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  document.querySelectorAll('a[href="#early-access"], #cta-early, #nav-early')
  .forEach(a => a.addEventListener('click', go));
})();

// Highlight the nav CTA when #early-access is in view
(function(){
  const section = document.getElementById('early-access');
  const navCta  = document.querySelector('#nav-early, a[href="#early-access"]');
  if (!section || !navCta) return;

  // Flash highlight on click too (instant feedback)
  navCta.addEventListener('click', () => {
    navCta.classList.add('cta-highlight');
    setTimeout(() => navCta.classList.remove('cta-highlight'), 1200);
  });

  // Observe when the section is on screen 
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      navCta.classList.add('cta-highlight');
      setTimeout(() => navCta.classList.remove('cta-highlight'), 1200);
    }
  }, {
    rootMargin: '-40% 0px -50% 0px', // triggers near the middle of the viewport 
  });

  io.observe(section);
})();

// Highlight active footer link
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  const footerLinks = document.querySelectorAll(".site-footer a");

  footerLinks.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
});




document.addEventListener("DOMContentLoaded", () => {
  const form      = document.getElementById("ea-form");
  if (!form) return;

  const nameEl    = document.getElementById("ea-name");
  const emailEl   = document.getElementById("ea-email");
  const detailsEl = document.getElementById("ea-details");
  const consentEl = document.getElementById("ea-consent");
  const statusEl  = document.getElementById("ea-status");  // <p id="ea-status" hidden>

  const showStatus = (msg, isError = false) => {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.toggle("error", !!isError);
    statusEl.textContent = msg;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const action = form.getAttribute("action");
    if (!action) { showStatus("Form error: missing action URL.", true); return; }

    const name    = (nameEl?.value || "").trim();
    const email   = (emailEl?.value || "").trim();
    const details = (detailsEl?.value || "").trim();

    if (!email) { showStatus("Please enter a valid email.", true); emailEl?.focus(); return; }
    if (consentEl && !consentEl.checked) { showStatus("Please accept the consent.", true); return; }

    showStatus("Sending…", false);

    try {
      const data = new FormData(form);
      if (!data.has("name"))    data.set("name", name);
      if (!data.has("email"))   data.set("email", email);
      if (!data.has("details")) data.set("details", details);

      const res = await fetch(action, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        form.reset();
        showStatus("Thanks! You’re on the list.", false);
      } else {
        let msg = "Submission failed. Please try again.";
        try {
          const j = await res.json();
          if (j?.errors?.length) msg = j.errors[0].message;
        } catch {}
        showStatus(msg, true);
      }
    } catch {
      showStatus("Network error. Please try again.", true);
    }
  });
});


