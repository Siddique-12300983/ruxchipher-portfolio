/*
 * main.js · ruxchipher portfolio
 * Modules: boot · hero · typing · reveal · nav · spotlight · tabs · copy ·
 *          email · optional files · terminal · background network
 * Loaded with `defer`, so the DOM is ready when this runs.
 */
(() => {
  "use strict";

  /* ---------- Shared state & helpers (declared first: no TDZ surprises) ---------- */
  window.__rux = true;
  const root = document.documentElement;
  if (root.classList.contains("no-js")) { root.classList.replace("no-js", "js"); } // late load after failsafe

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const mq = (q) => window.matchMedia(q);
  const reduceMotion = mq("(prefers-reduced-motion: reduce)").matches;
  const finePointer = mq("(hover: hover) and (pointer: fine)").matches;

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  const ROLES = ["Cyber Security Student", "Purple Team Learner", "AD Lab Builder", "Aspiring Threat Hunter"];
  const BOOT_LINES = [
    '<span class="ok">[  OK  ]</span> Mounting /home/ruxchipher',
    '<span class="ok">[  OK  ]</span> Starting kvm-lab.target',
    '<span class="ok">[  OK  ]</span> Reached harbourline-freight.domain',
    '<span class="ok">[  OK  ]</span> Started detect-4769.service',
    '<span class="acc">[ INFO ]</span> loading portfolio…'
  ];
  const BOOT_KEY = "rux:booted";

  /* ---------- Tuning: one place for speeds and sizes ----------
     Values are per 60fps frame or in ms, and stay the same on 120/144Hz screens. */
  const FX = {
    // background network
    maxNodes: 70,             // desktop node cap
    maxNodesMobile: 32,       // phone node cap
    areaPerNode: 18000,       // px² of screen per node
    nodeSpeed: 0.14,          // px per frame (max drift)
    nodeRadius: 1.6,          // px
    linkDistance: 130,        // px, desktop
    linkDistanceMobile: 100,  // px, phone
    repelRadius: 110,         // px around the mouse
    repelForce: 0.6,          // px per frame
    // packets
    spawnEveryMs: 260,        // a new packet roughly 4 times a second
    packetMs: 1400,           // time to travel one link
    redChance: 0.08,          // 8% of packets are "attacks"
    packetCore: 1.5,          // px
    packetGlow: 7,            // px
    // decrypt + alert log
    decryptMs: 700,           // full decrypt time
    roleEveryMs: 3200,        // hero role line changes every 3.2s
    glyphs: "!<>-_/[]{}=+*^?#01",
    alertGapMs: 2600,         // minimum time between new alert lines
    alertMaxLines: 6
  };

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Boot sequence (once per session) ---------- */
  function initBoot(onDone) {
    const bootEl = $("#boot");
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add("booted");
      store.set(BOOT_KEY, "1");
      window.removeEventListener("keydown", finish);
      if (bootEl) bootEl.removeEventListener("click", finish);
      onDone();
    };

    if (root.classList.contains("booted") || !bootEl) { finish(); return; }

    const linesEl = $("#bootLines");
    const bar = $("#bootBar");
    window.addEventListener("keydown", finish);
    bootEl.addEventListener("click", finish);

    BOOT_LINES.forEach((html, i) => {
      const div = document.createElement("div");
      div.className = "boot-line";
      div.innerHTML = html; // static strings defined above, never user input
      linesEl.appendChild(div);
      setTimeout(() => {
        if (finished) return;
        div.classList.add("show");
        bar.style.width = ((i + 1) / (BOOT_LINES.length + 1)) * 100 + "%";
      }, 160 + i * 180);
    });

    const grantAt = 160 + BOOT_LINES.length * 180 + 100;
    setTimeout(() => {
      if (finished) return;
      const g = document.createElement("div");
      g.className = "boot-line granted";
      g.innerHTML = "<span>ACCESS GRANTED</span>";
      linesEl.appendChild(g);
      requestAnimationFrame(() => g.classList.add("show"));
      bar.style.width = "100%";
    }, grantAt);
    setTimeout(finish, grantAt + 600);
  }

  /* ---------- Hero: reveal, terminal intro, typing ---------- */
  function initHero() {
    $$("#hero .reveal").forEach((el) => el.classList.add("in"));
    decryptHeroName();
    if (!reduceMotion) setTimeout(startRoleCycle, 1400);
  }

  // Role line: each role decrypts into the next one (replaces the old typing effect)
  function startRoleCycle() {
    const roleEl = $("#role");
    if (!roleEl) return;
    const d = new Decrypt(roleEl);
    let r = Math.max(0, ROLES.indexOf(roleEl.textContent.trim()));
    setInterval(() => {
      if (document.hidden) return;
      r = (r + 1) % ROLES.length;
      d.run(ROLES[r], { duration: FX.decryptMs });
    }, FX.roleEveryMs);
  }

  /* ---------- Scroll reveals ---------- */
  function initReveal() {
    // stagger skill tags
    $$(".tags").forEach((list) => {
      $$(".tag", list).forEach((t, i) => t.style.setProperty("--td", (0.25 + i * 0.06).toFixed(2) + "s"));
    });

    const targets = $$("main .reveal").filter((el) => !el.closest("#hero"));
    if (!("IntersectionObserver" in window) || reduceMotion) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Nav: scrolled state, mobile menu, active link ---------- */
  function initNav() {
    const nav = $("#nav");
    const btn = $("#menuBtn");
    const list = $("#navLinks");
    const scrim = $("#navScrim");
    const links = $$("a", list);

    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const isOpen = () => btn.getAttribute("aria-expanded") === "true";
    const setMenu = (open, { focusButton = false } = {}) => {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      list.classList.toggle("open", open);
      nav.classList.toggle("menu-open", open);
      scrim.classList.toggle("show", open);
      root.classList.toggle("menu-lock", open);
      if (open) links[0] && links[0].focus({ preventScroll: true });
      if (!open && focusButton) btn.focus();
    };

    btn.addEventListener("click", () => setMenu(!isOpen()));
    scrim.addEventListener("click", () => setMenu(false));
    links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) setMenu(false, { focusButton: true });
    });
    // close if the viewport grows past the mobile breakpoint
    const desktop = mq("(min-width: 1101px)");
    const onBp = () => { if (desktop.matches && isOpen()) setMenu(false); };
    desktop.addEventListener ? desktop.addEventListener("change", onBp) : desktop.addListener(onBp);

    // active section highlight
    const setActive = (id) => {
      links.forEach((a) => {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };
    if ("IntersectionObserver" in window) {
      const sio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("main section[id]").forEach((s) => sio.observe(s));
    }
    // the last section can be too short to reach the middle band
    window.addEventListener("scroll", () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActive("contact");
    }, { passive: true });
  }

  /* ---------- Card spotlight (mouse only) ---------- */
  function initSpotlight() {
    if (!finePointer) return;
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ---------- Code tabs ---------- */
  function initTabs() {
    $$("[data-tabs]").forEach((wrap) => {
      const tabs = $$('[role="tab"]', wrap);
      const select = (tab, focus) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      };
      tabs.forEach((t, i) => {
        t.addEventListener("click", () => select(t));
        t.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
            select(next, true);
          }
        });
      });
      select(tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0]);
    });
  }

  /* ---------- Copy code ---------- */
  function initCopy() {
    $$("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const wrap = btn.closest("[data-tabs]");
        const panel = wrap && $(".code-panel:not([hidden]) code", wrap);
        if (!panel) return;
        const text = panel.textContent;
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; }
        catch (e) {
          const ta = document.createElement("textarea");
          ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
          ta.remove();
        }
        btn.textContent = ok ? "copied ✓" : "copy failed";
        btn.classList.toggle("done", ok);
        setTimeout(() => { btn.textContent = "copy"; btn.classList.remove("done"); }, 1600);
      });
    });
  }

  /* ---------- Email (assembled here so it isn't in the HTML) ---------- */
  let EMAIL = "";
  function initEmail() {
    $$("[data-email-user]").forEach((a) => {
      const addr = a.dataset.emailUser + "@" + a.dataset.emailDomain;
      EMAIL = addr;
      a.href = "mailto:" + addr;
      const t = $("[data-email-text]", a);
      if (t) t.textContent = addr;
    });
  }

  /* ---------- Optional files (e.g. resume.pdf): show only if they exist ---------- */
  const available = {};
  function initOptionalFiles() {
    const groups = {};
    $$("[data-requires]").forEach((el) => { (groups[el.dataset.requires] ||= []).push(el); });
    Object.keys(groups).forEach((path) => {
      if (location.protocol === "file:") return; // can't check locally; stays hidden
      fetch(path, { method: "HEAD", cache: "no-cache" })
        .then((res) => {
          if (!res.ok) return;
          available[path] = true;
          groups[path].forEach((el) => el.classList.add("is-available"));
        })
        .catch(() => { /* missing or offline: keep hidden */ });
    });
  }

  /* ---------- Interactive terminal ---------- */
  function initTerminal() {
    const out = $("#termOut");
    const form = $("#termForm");
    const input = $("#termIn");
    if (!out || !form || !input) return;

    const history = [];
    let hIndex = 0;
    const MAX_LINES = 160;

    // Build a line from [className, text] segments. Text only: user input never becomes HTML.
    const line = (...segs) => {
      const ln = document.createElement("span");
      ln.className = "ln";
      segs.forEach((s) => {
        if (typeof s === "string") { ln.appendChild(document.createTextNode(s)); return; }
        const [cls, text, href] = s;
        const el = document.createElement(href ? "a" : "span");
        if (cls) el.className = cls;
        if (href) {
          el.href = href;
          if (/^https?:/.test(href)) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
        }
        el.textContent = text;
        ln.appendChild(el);
      });
      out.appendChild(ln);
    };
    const blank = () => line(" ");
    const trim = () => { while (out.children.length > MAX_LINES) out.firstElementChild.remove(); };
    const scrollDown = () => { out.scrollTop = out.scrollHeight; };

    const SECTIONS = ["about", "lab", "detections", "skills", "journey", "contact"];
    const goTo = (name) => {
      const id = (name || "").replace(/^[~./]+|\/+$/g, "").toLowerCase();
      if (!SECTIONS.includes(id)) {
        line(["r", "cd: no such directory: "], name || "");
        line(["cm", "# try: ls"]);
        return;
      }
      line(["cm", "# jumping to "], ["c", "#" + id]);
      setTimeout(() => {
        document.getElementById(id).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }, 250);
    };

    const COMMANDS = {
      help() {
        line(["w", "available commands"]);
        [
          ["whoami", "who is behind this"],
          ["lab", "the Harbourline Freight lab"],
          ["detect", "the Kerberoasting detection"],
          ["skills", "red · blue · build"],
          ["journey", "study and work"],
          ["contact", "ways to reach me"],
          ["resume", "download my résumé"],
          ["ls / cd <dir>", "list and jump to sections"],
          ["clear", "clear the screen"]
        ].forEach(([c, d]) => line("  ", ["c", c.padEnd(14)], ["cm", d]));
        line(["cm", "  ↑ / ↓ cycles through history"]);
      },
      whoami() {
        line(["c", "siddique"], ["cm", "  # aka ruxchipher"]);
        line("B.IT Cyber Security · CQUniversity · Sydney, AU");
        line("target: ", ["y", "purple team internship (2027)"]);
      },
      about() { COMMANDS.whoami(); },
      lab() {
        line(["g", "●"], " harbourline-freight ", ["g", "active (running)"]);
        line("  host      Arch Linux · KVM/QEMU");
        line("  dc        Windows Server 2025 (AD DS)");
        line("  client    Windows 11, domain-joined");
        line("  attacker  Kali Linux, isolated network");
        line("  org       12 users · OUs · GPOs");
        line("  next      ", ["c", "sysmon + wazuh"]);
      },
      detect() {
        line(["r", "[red]   "], "request a TGS for an SPN account from Kali");
        line(["c", "[blue]  "], "catch Event 4769 with ticket type 0x17 (RC4)");
        line(["p", "[purple]"], " tune out noise, harden the account");
        line(["cm", "# MITRE ATT&CK T1558.003 · full query: cd detections"]);
      },
      kerberoast() { COMMANDS.detect(); },
      skills() {
        line(["r", "red   "], "Kali · Kerberoasting · SPN enumeration · Networking");
        line(["c", "blue  "], "Active Directory · GPO · 4769 detection · Wireshark");
        line(["p", "build "], "Python · Java · JDBC · Git · Arch Linux · KVM");
      },
      journey() {
        line(["y", "2025 "], " started B.IT (Cyber Security) at CQUniversity");
        line(["y", "now  "], " 2nd year · Rental Operations Agent at Avis");
        line(["y", "2027 "], " goal: purple team internship");
      },
      contact() {
        line("github    ", ["c", "github.com/Siddique-12300983", "https://github.com/Siddique-12300983"]);
        line("linkedin  ", ["c", "linkedin.com/in/siddiqueabu", "https://www.linkedin.com/in/siddiqueabu/"]);
        if (EMAIL) line("email     ", ["c", EMAIL, "mailto:" + EMAIL]);
      },
      resume() {
        if (available["assets/resume.pdf"]) {
          line(["g", "[+] "], "opening ", ["c", "resume.pdf", "assets/resume.pdf"]);
          window.open("assets/resume.pdf", "_blank", "noopener");
        } else {
          line(["y", "[!] "], "resume.pdf isn't uploaded yet. try ", ["c", "contact"], " instead.");
        }
      },
      ls() { line(...SECTIONS.map((s) => ["c", s + "/  "])); },
      cd(args) { goTo(args[0]); },
      goto(args) { goTo(args[0]); },
      clear() { out.textContent = ""; },
      history() { history.forEach((h, i) => line(["cm", String(i + 1).padStart(3) + "  "], h)); },
      echo(args) { line(args.join(" ")); },
      date() { line(new Date().toString()); },
      pwd() { line("/home/ruxchipher"); },
      sudo() {
        line(["r", "siddique is not in the sudoers file."]);
        line(["cm", "# this incident will be reported (and detected)."]);
      },
      rm(args) {
        if (args.join(" ").includes("-rf")) line(["y", "nice try. the lab has snapshots."]);
        else line(["r", "rm: permission denied"]);
      },
      exit() { line(["cm", "# there is no escape. try 'help'."]); }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value.trim().slice(0, 80);
      input.value = "";
      if (!raw) return;
      history.push(raw);
      hIndex = history.length;

      line(["p", "❯ "], ["w", raw]);
      const [cmd, ...args] = raw.split(/\s+/);
      const fn = Object.prototype.hasOwnProperty.call(COMMANDS, cmd.toLowerCase()) && COMMANDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else line(["r", "command not found: "], cmd, ["cm", "  # try 'help'"]);
      if (out.children.length) blank();
      trim();
      scrollDown();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && history.length) {
        e.preventDefault();
        hIndex = Math.max(0, hIndex - 1);
        input.value = history[hIndex];
      } else if (e.key === "ArrowDown" && history.length) {
        e.preventDefault();
        hIndex = Math.min(history.length, hIndex + 1);
        input.value = history[hIndex] || "";
      }
    });

    // clicking the terminal body focuses the prompt (desktop only; avoids surprise keyboards on phones)
    out.addEventListener("click", (e) => {
      if (finePointer && !e.target.closest("a") && !window.getSelection().toString()) input.focus({ preventScroll: true });
    });
  }

  /* ---------- Decrypt (text scramble) ----------
     Used in exactly four places so it stays subtle:
     the hero name (once per visit), the codename on hover, the hero role line, and new alert lines. */
  class Decrypt {
    constructor(el) { this.el = el; this.raf = 0; this.resolve = null; }
    run(text, { from = this.el.textContent, duration = FX.decryptMs } = {}) {
      cancelAnimationFrame(this.raf);
      if (this.resolve) this.resolve();
      const len = Math.max(from.length, text.length);
      const frames = Math.max(8, Math.round(duration / 16.7));      // ~60fps budget
      this.queue = Array.from({ length: len }, (_, i) => {
        const start = Math.floor(Math.random() * frames * 0.45);
        const end = start + Math.floor(frames * 0.35 + Math.random() * frames * 0.2);
        return { from: from[i] || "", to: text[i] || "", start, end, ch: "" };
      });
      this.frame = 0;
      return new Promise((res) => { this.resolve = res; this.tick(); });
    }
    tick() {
      let out = "", complete = 0;
      for (const q of this.queue) {
        if (this.frame >= q.end) { complete++; out += escapeHtml(q.to); }
        else if (this.frame >= q.start && q.to !== " ") {
          if (!q.ch || Math.random() < 0.28) q.ch = FX.glyphs[Math.floor(Math.random() * FX.glyphs.length)];
          out += '<span class="dud">' + escapeHtml(q.ch) + "</span>";
        } else out += escapeHtml(this.frame >= q.start ? q.to : q.from);
      }
      this.el.innerHTML = out;
      if (complete === this.queue.length) { const r = this.resolve; this.resolve = null; if (r) r(); return; }
      this.frame++;
      this.raf = requestAnimationFrame(() => this.tick());
    }
  }
  const escapeHtml = (s) => s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const noise = (n) => Array.from({ length: n }, () => FX.glyphs[Math.floor(Math.random() * FX.glyphs.length)]).join("");

  function initDecrypt() {
    // codename: re-encrypts and decrypts on hover / focus / tap
    const chip = $("#codename");
    if (!chip || reduceMotion) return;
    const d = new Decrypt(chip);
    const word = chip.textContent;
    let busy = false;
    const go = () => {
      if (busy) return;
      busy = true;
      d.run(word, { from: noise(word.length), duration: FX.decryptMs }).then(() => { busy = false; });
    };
    ["pointerenter", "focus", "click"].forEach((ev) => chip.addEventListener(ev, go));
  }

  function decryptHeroName() {
    if (reduceMotion) return;
    $$("#hero-title [data-decrypt]").forEach((el, i) => {
      const text = el.textContent;
      el.textContent = noise(text.length);
      setTimeout(() => new Decrypt(el).run(text, { duration: FX.decryptMs + 200 }), 120 + i * 160);
    });
  }

  /* ---------- Alert log (fed by red packets) ---------- */
  let pushAlert = () => {};
  function initAlertLog(network) {
    const body = $("#alertBody");
    const countEl = $("#alertCount");
    const simBtn = $("#simBtn");
    if (!body) return;
    let count = body.children.length;
    let last = 0, forceNext = false;
    const EVENTS = [
      ["4769", "TGS-REQ · RC4 (0x17)", "DC01"],
      ["4625", "failed logon ×5", "DC01"],
      ["4688", "suspicious process", "WIN11"],
      ["7045", "new service installed", "WIN11"],
      ["4769", "TGS-REQ · RC4 (0x17)", "DC01"]
    ];
    const pad = (n) => String(n).padStart(2, "0");
    const clock = (t) => pad(t.getHours()) + ":" + pad(t.getMinutes()) + ":" + pad(t.getSeconds());

    // the sample lines in the HTML get recent timestamps so they match the live ones
    $$(".alert-line .cm", body).forEach((el, i, all) => {
      el.textContent = clock(new Date(Date.now() - (all.length - i) * 14000));
    });

    pushAlert = (force) => {
      const now = performance.now();
      if (!force && !forceNext && now - last < FX.alertGapMs) return;   // keep the log calm
      forceNext = false;
      last = now;
      const time = clock(new Date());
      const [eid, what, host] = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const plain = time + " [!] EID " + eid + " " + what + " → " + host;
      const html = '<span class="cm">' + time + '</span> <span class="r">[!]</span> EID <span class="c">' + eid +
        "</span> " + escapeHtml(what) + ' → <span class="g">' + host + "</span>";

      const line = document.createElement("span");
      line.className = "ln alert-line new";
      body.appendChild(line);
      while (body.children.length > FX.alertMaxLines) body.firstElementChild.remove();
      count++;
      countEl.textContent = count + (count === 1 ? " alert" : " alerts");
      if (reduceMotion) { line.innerHTML = html; return; }
      new Decrypt(line).run(plain, { from: noise(plain.length), duration: FX.decryptMs }).then(() => { line.innerHTML = html; });
    };

    if (simBtn) simBtn.addEventListener("click", () => {
      forceNext = true;   // the first red packet that lands always shows up
      if (network && network.attack && !reduceMotion) network.attack();
      else pushAlert(true);
    });
  }

  /* ---------- Background: packet-flow network ---------- */
  function initNetwork() {
    const canvas = $("#net");
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext("2d");
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, dpr = 1, nodes = [], packets = [], raf = null, link = FX.linkDistance;
    let lastT = 0, spawnAcc = 0;

    const build = () => {
      const small = w < 760;
      link = small ? FX.linkDistanceMobile : FX.linkDistance;
      const max = small ? FX.maxNodesMobile : FX.maxNodes;
      const count = Math.max(16, Math.min(max, Math.floor((w * h) / FX.areaPerNode)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * FX.nodeSpeed * 2, vy: (Math.random() - 0.5) * FX.nodeSpeed * 2,
        r: FX.nodeRadius * (0.7 + Math.random() * 0.6),
        c: Math.random() < 0.7 ? "0,200,255" : "143,117,255",
        hit: 0
      }));
      packets = [];
    };

    const size = () => {
      const nw = window.innerWidth, nh = window.innerHeight;
      const widthChanged = nw !== w;
      const oldH = h || nh;
      w = nw; h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || !nodes.length) build();             // mobile URL bar: keep nodes, rescale
      else nodes.forEach((p) => { p.y = (p.y / oldH) * h; });
    };

    const linked = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < link;
    const send = (a, b, red) => packets.push({ a, b, t: 0, red, dur: FX.packetMs * (0.8 + Math.random() * 0.4) });

    const spawn = () => {
      for (let i = 0; i < 20; i++) {
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        const b = nodes[Math.floor(Math.random() * nodes.length)];
        if (a !== b && linked(a, b)) { send(a, b, Math.random() < FX.redChance); return; }
      }
    };

    // burst of red packets from the node nearest to (x, y)
    const attackFrom = (x, y) => {
      let src = null, best = Infinity;
      for (const n of nodes) { const d = Math.hypot(n.x - x, n.y - y); if (d < best) { best = d; src = n; } }
      if (!src) return;
      src.hit = 1;
      nodes.filter((n) => n !== src && linked(src, n)).slice(0, 6).forEach((n) => send(src, n, true));
    };

    const step = (n, k) => {
      n.x += n.vx * k; n.y += n.vy * k;
      if (finePointer) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < FX.repelRadius) { n.x += (dx / d) * FX.repelForce * k; n.y += (dy / d) * FX.repelForce * k; }
      }
      if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); } else if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx); }
      if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); } else if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy); }
      n.hit = Math.max(0, n.hit - 0.03 * k);
    };

    const render = (dtMs) => {
      const k = Math.min(dtMs / 16.7, 3);   // frame-rate independent: same speed on 60Hz and 144Hz screens
      ctx.clearRect(0, 0, w, h);
      if (dtMs) nodes.forEach((n) => step(n, k));

      const L2 = link * link;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j];
          const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < L2) {
            ctx.strokeStyle = "rgba(" + p.c + "," + ((1 - Math.sqrt(d2) / link) * 0.2).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }

      if (dtMs) {
        spawnAcc += dtMs;
        while (spawnAcc > FX.spawnEveryMs) { spawn(); spawnAcc -= FX.spawnEveryMs; }
        packets = packets.filter((pk) => {
          pk.t += dtMs / pk.dur;
          if (!linked(pk.a, pk.b)) return false;                 // link broke: packet dropped
          if (pk.t >= 1) {
            if (pk.red) { pk.b.hit = 1; pushAlert(); }
            return false;
          }
          const x = pk.a.x + (pk.b.x - pk.a.x) * pk.t, y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
          const col = pk.red ? "255,92,122" : "0,200,255";
          const g = ctx.createRadialGradient(x, y, 0, x, y, FX.packetGlow);
          g.addColorStop(0, "rgba(" + col + ",.85)"); g.addColorStop(1, "rgba(" + col + ",0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, FX.packetGlow, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, FX.packetCore, 0, Math.PI * 2); ctx.fill();
          return true;
        });
      }

      for (const n of nodes) {
        if (n.hit > 0.05) {
          ctx.fillStyle = "rgba(255,92,122," + (n.hit * 0.3).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(n.x, n.y, 4 + n.hit * 10, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = n.hit > 0.3 ? "rgba(255,92,122,.95)" : "rgba(" + n.c + ",.75)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = (t) => {
      const dt = lastT ? Math.min(t - lastT, 50) : 16.7;
      lastT = t;
      render(dt);
      raf = requestAnimationFrame(loop);
    };
    // runs on the whole page; pauses only when the tab is hidden
    const start = () => { if (!raf && !reduceMotion && !document.hidden) { lastT = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    size();
    render(0);

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { size(); render(0); }, 150);
    });

    const api = {
      // "simulate attack": a few bursts from random nodes near the top of the screen
      attack() {
        for (let i = 0; i < 3; i++) setTimeout(() => attackFrom(Math.random() * w, Math.random() * h * 0.8), i * 220);
      }
    };
    if (reduceMotion) return api;   // one static frame, still redrawn on resize

    if (finePointer) {
      window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      const reset = () => { mouse.x = mouse.y = -9999; };
      document.addEventListener("pointerout", (e) => { if (!e.relatedTarget) reset(); });
      window.addEventListener("blur", reset);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
    return api;
  }

  /* ---------- Run ---------- */
  initEmail();
  initOptionalFiles();
  initNav();
  initReveal();
  initSpotlight();
  initTabs();
  initCopy();
  initTerminal();
  initDecrypt();
  initAlertLog(initNetwork());
  initBoot(initHero);
})();
