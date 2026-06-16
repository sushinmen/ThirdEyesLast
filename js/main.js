/* =====================================================================
   제3의 눈 · THIRD EYE — ENGINE
   ---------------------------------------------------------------------
   Vanilla JS. GSAP is used only for optional polish; everything works
   (and remains readable) if GSAP fails to load. Story data lives in
   js/story.js (window.STORY).
   ===================================================================== */
(function () {
  "use strict";

  var STORY = window.STORY;
  var hasGSAP = typeof window.gsap !== "undefined";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, ev, fn, o) { el && el.addEventListener(ev, fn, o); };
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* =====================================================================
     CUSTOM CURSOR  (manual lerp — no library required)
     ===================================================================== */
  (function cursor() {
    var wrap = $("[data-cursor]");
    var dot = $("[data-cursor-dot]");
    var ring = $("[data-cursor-ring]");
    if (!wrap || matchMedia("(hover: none)").matches) return;

    var mx = innerWidth / 2, my = innerHeight / 2;
    var rx = mx, ry = my;

    on(window, "mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      // subtle iris tracking on the brand eye
      brandLook(e.clientX, e.clientY);
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    on(window, "mousedown", function () { wrap.classList.add("is-down"); });
    on(window, "mouseup", function () { wrap.classList.remove("is-down"); });

    // hover state via event delegation for anything labelled
    function hoverable(t) { return t.closest && t.closest("a,button,[data-cursor-label],.choice"); }
    on(document, "mouseover", function (e) {
      var el = hoverable(e.target);
      if (!el) return;
      wrap.classList.add("is-hover");
      ring.setAttribute("data-label", el.getAttribute("data-cursor-label") || "");
    });
    on(document, "mouseout", function (e) {
      if (hoverable(e.target)) { wrap.classList.remove("is-hover"); ring.removeAttribute("data-label"); }
    });
  })();

  // brand eye iris follows the pointer a little
  function brandLook(px, py) {
    var eye = $(".brand__eye");
    if (!eye) return;
    var r = eye.getBoundingClientRect();
    var dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / 220));
    var dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / 220));
    var t = "translate(" + dx * 8 + "px," + dy * 6 + "px)";
    $$(".brand__eye .eye__iris, .brand__eye .eye__pupil, .brand__eye .eye__spec, .brand__eye .eye__rays").forEach(function (n) {
      n.style.transform = t;
    });
  }

  /* =====================================================================
     EFFECTS — flash, glitch
     ===================================================================== */
  var flashEl = $("[data-flash]");
  function flash() {
    if (!flashEl || reduceMotion) return;
    flashEl.style.transition = "none";
    flashEl.style.opacity = "0.92";
    requestAnimationFrame(function () {
      flashEl.style.transition = "opacity .7s ease";
      flashEl.style.opacity = "0";
    });
  }
  function glitch(el) {
    if (!el || reduceMotion) return;
    el.classList.remove("is-glitch");
    void el.offsetWidth; // reflow to restart animation
    el.classList.add("is-glitch");
    setTimeout(function () { el.classList.remove("is-glitch"); }, 950);
  }

  /* =====================================================================
     AMBIENT SOUND  (WebAudio — generated, no asset files)
     ===================================================================== */
  var Sound = (function () {
    var ctx, master, drone = [], heartGain, heartTimer, started = false, on_ = false;

    function build() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

      // low detuned drone through a lowpass
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 6;
      lp.connect(master);
      [55, 55.4, 82.5].forEach(function (f) {
        var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
        var g = ctx.createGain(); g.gain.value = f < 60 ? 0.14 : 0.06;
        o.connect(g); g.connect(lp); o.start(); drone.push(o);
      });
      // slow filter sweep for unease
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      var lfoG = ctx.createGain(); lfoG.gain.value = 180;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();

      // sub "heartbeat"
      heartGain = ctx.createGain(); heartGain.gain.value = 0; heartGain.connect(master);
      var sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = 46;
      sub.connect(heartGain); sub.start();
      heartTimer = setInterval(beat, 1500);
      return true;
    }
    function beat() {
      if (!ctx || !on_) return;
      var t = ctx.currentTime;
      [0, 0.22].forEach(function (off) {
        var g = heartGain.gain;
        g.cancelScheduledValues(t + off);
        g.setValueAtTime(0.0001, t + off);
        g.exponentialRampToValueAtTime(0.5, t + off + 0.04);
        g.exponentialRampToValueAtTime(0.0001, t + off + 0.30);
      });
    }
    return {
      toggle: function () {
        if (!started) { if (!build()) return false; started = true; }
        if (ctx.state === "suspended") ctx.resume();
        on_ = !on_;
        master.gain.setTargetAtTime(on_ ? 0.5 : 0.0, ctx.currentTime, 0.6);
        return on_;
      },
      isOn: function () { return on_; },
      duck: function (depth) { // louder/tenser as the story goes deeper
        if (!ctx || !on_) return;
        master.gain.setTargetAtTime(0.4 + (depth / 100) * 0.35, ctx.currentTime, 1.2);
      },
    };
  })();

  (function soundBtn() {
    var btn = $("[data-sound]"); if (!btn) return;
    on(btn, "click", function () {
      var state = Sound.toggle();
      if (state === false) return;
      btn.setAttribute("aria-pressed", String(state));
      $(".sound__txt", btn).textContent = state ? "SOUND ON" : "SOUND OFF";
    });
  })();

  /* =====================================================================
     PROCEDURAL VISUALS  (inline SVG — swap with real images via story.js)
     ===================================================================== */
  var INK = "#e8e4dd", DIM = "#6b6b6b", BLOOD = "#b0242e", BLOOD2 = "#e23b46";
  var EYE_GIF = "https://media.giphy.com/media/j9d6swYZVM0gi9tp8S/giphy.gif";
  var ART = {
    figure: function () {
      return svg(220, 300,
        '<defs><radialGradient id="gfg" cx="50%" cy="32%" r="60%"><stop offset="0%" stop-color="#16171a"/><stop offset="100%" stop-color="#0a0b0d"/></radialGradient></defs>' +
        '<ellipse cx="110" cy="150" rx="120" ry="150" fill="url(#gfg)"/>' +
        '<path d="M110 60 C70 60 60 110 62 150 C64 200 60 250 60 300 L160 300 C160 250 156 200 158 150 C160 110 150 60 110 60 Z" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6" opacity="0.9"/>' +
        '<ellipse cx="110" cy="70" rx="34" ry="40" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<circle cx="110" cy="58" r="5.5" fill="' + BLOOD + '"><animate attributeName="r" values="5;6.5;5" dur="3s" repeatCount="indefinite"/></circle>' +
        '<circle cx="110" cy="58" r="11" fill="none" stroke="' + BLOOD + '" stroke-width="0.5" opacity="0.5"><animate attributeName="r" values="9;16;9" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/></circle>'
      );
    },
    drill: function () {
      return svg(240, 240,
        '<ellipse cx="120" cy="135" rx="92" ry="70" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<g transform="translate(120 95)">' +
        '<circle r="3" fill="#000"/>' +
        '<circle r="9" fill="none" stroke="' + BLOOD2 + '" stroke-width="1"><animate attributeName="r" values="4;11;4" dur="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></circle>' +
        '<path d="M0 -60 L6 -20 L-6 -20 Z" fill="' + INK + '"><animateTransform attributeName="transform" type="translate" values="0 -6;0 2;0 -6" dur="0.18s" repeatCount="indefinite"/></path>' +
        '<g stroke="' + INK + '" stroke-width="1">' +
        '<line x1="-3" y1="-22" x2="-3" y2="-58"/><line x1="3" y1="-22" x2="3" y2="-58"/></g>' +
        '<g stroke="' + BLOOD + '" stroke-width="0.8" opacity="0.8">' +
        '<line x1="0" y1="0" x2="-34" y2="34"/><line x1="0" y1="0" x2="30" y2="40"/><line x1="0" y1="0" x2="44" y2="6"/></g>' +
        "</g>"
      );
    },
    awaken: function () {
      return '<span class="eyegif"><img src="' + EYE_GIF + '" alt="제3의 눈" onerror="this.style.display=\'none\'"></span>';
    },
    street: function () {
      var people = "";
      for (var i = 0; i < 9; i++) {
        var x = 18 + i * 28 + (i % 2) * 6;
        var h = 120 + (i % 3) * 40;
        people += '<rect x="' + x + '" y="' + (300 - h) + '" width="16" height="' + h + '" rx="8" fill="#0d0e11" stroke="' + DIM + '" stroke-width="0.4" opacity="' + (0.5 + (i % 3) * 0.15) + '"/>' +
          '<circle cx="' + (x + 8) + '" cy="' + (300 - h - 8) + '" r="7" fill="#0d0e11" stroke="' + DIM + '" stroke-width="0.4"/>';
      }
      var beams = "";
      for (var j = 0; j < 6; j++) beams += '<rect x="' + (20 + j * 45) + '" y="0" width="1.5" height="300" fill="' + BLOOD + '" opacity="0.12"/>';
      return svg(280, 300, beams + people);
    },
    money: function () {
      var bills = "";
      for (var i = 0; i < 12; i++) {
        var x = 40 + (i * 37) % 160, y = 10 + (i * 53) % 250, r = (i * 35) % 40 - 20, d = (i % 5) * 0.4;
        bills += '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" opacity="0.8">' +
          '<rect x="-16" y="-8" width="32" height="16" fill="none" stroke="' + INK + '" stroke-width="0.6"/>' +
          '<circle r="4" fill="none" stroke="' + INK + '" stroke-width="0.5"/>' +
          '<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 26;0 0" dur="' + (3 + d) + 's" begin="' + d + 's" repeatCount="indefinite"/>' +
          '<animate attributeName="opacity" values="0.9;0.1;0.9" dur="' + (3 + d) + 's" begin="' + d + 's" repeatCount="indefinite"/></g>';
      }
      return svg(220, 300,
        '<path d="M110 70 C78 70 70 110 74 150 C78 210 74 260 74 300 L146 300 C146 260 142 210 146 150 C150 110 142 70 110 70 Z" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<ellipse cx="110" cy="58" rx="26" ry="30" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<circle cx="101" cy="56" r="2.5" fill="' + DIM + '"/><circle cx="119" cy="56" r="2.5" fill="' + DIM + '"/>' +
        bills
      );
    },
    threads: function () {
      var th = "";
      for (var i = 0; i < 16; i++) {
        var x = 70 + i * 5;
        th += '<path d="M' + x + ' 0 Q' + (x + (i - 8) * 2) + ' 120 ' + (80 + (i % 9) * 7) + ' 178" stroke="' + INK + '" stroke-width="0.5" fill="none" opacity="0.5"/>';
      }
      return svg(220, 300,
        th +
        '<ellipse cx="110" cy="170" rx="58" ry="68" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<path d="M84 162 q6 -8 14 0" stroke="' + INK + '" stroke-width="1" fill="none"/>' +
        '<path d="M122 162 q6 -8 14 0" stroke="' + INK + '" stroke-width="1" fill="none"/>' +
        '<path d="M80 196 Q110 182 140 196" stroke="' + BLOOD2 + '" stroke-width="1.4" fill="none"/>' +
        '<circle cx="80" cy="196" r="2" fill="' + INK + '"/><circle cx="140" cy="196" r="2" fill="' + INK + '"/>'
      );
    },
    mirror: function () {
      return svg(300, 300,
        '<rect x="150" y="20" width="2" height="260" fill="' + DIM + '" opacity="0.4"/>' +
        // real
        '<g opacity="0.9"><path d="M96 80 C70 80 64 120 66 160 C68 220 64 280 64 300 L128 300 C128 280 124 220 126 160 C128 120 122 80 96 80 Z" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<ellipse cx="96" cy="70" rx="24" ry="28" fill="#0c0d10" stroke="' + DIM + '" stroke-width="0.6"/>' +
        '<circle cx="89" cy="68" r="2.4" fill="' + INK + '"/><circle cx="103" cy="68" r="2.4" fill="' + INK + '"/></g>' +
        // reflection (faceless, hole)
        '<g opacity="0.85"><path d="M204 80 C178 80 172 120 174 160 C176 220 172 280 172 300 L236 300 C236 280 232 220 234 160 C236 120 230 80 204 80 Z" fill="#070809" stroke="' + BLOOD + '" stroke-width="0.5"/>' +
        '<ellipse cx="204" cy="70" rx="24" ry="28" fill="#070809" stroke="' + BLOOD + '" stroke-width="0.5"/>' +
        '<circle cx="204" cy="68" r="9" fill="#000"/>' +
        '<circle cx="204" cy="68" r="13" fill="none" stroke="' + BLOOD2 + '" stroke-width="0.6"><animate attributeName="r" values="10;18;10" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0;0.7" dur="3.2s" repeatCount="indefinite"/></circle></g>'
      );
    },
    void: function () {
      return svg(300, 300,
        '<circle cx="150" cy="150" r="46" fill="#000"/>' +
        '<circle cx="150" cy="150" r="46" fill="none" stroke="' + BLOOD + '" stroke-width="0.8"><animate attributeName="r" values="44;120;44" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="6s" repeatCount="indefinite"/></circle>' +
        '<circle cx="150" cy="150" r="70" fill="none" stroke="' + BLOOD + '" stroke-width="0.4" opacity="0.4"><animate attributeName="r" values="60;150;60" dur="6s" begin="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="6s" begin="2s" repeatCount="indefinite"/></circle>'
      );
    },
  };
  function svg(w, h, body) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + "</svg>";
  }
  function useEye(w, h, big) {
    return svg(w, h,
      '<g transform="translate(' + (w / 2 - 110) + ' ' + (h / 2 - 60) + ')">' +
      '<use href="#eye" style="--s:1"></use></g>'
    );
  }

  /* =====================================================================
     STAGE ELEMENTS
     ===================================================================== */
  var els = {
    preloader: $("[data-preloader]"),
    count: $("[data-count]"),
    skip: $("[data-skip]"),
    title: $("[data-title]"),
    begin: $("[data-begin]"),
    stage: $("[data-stage]"),
    figure: $("[data-figure]"),
    speaker: $("[data-speaker]"),
    text: $("[data-text]"),
    textEn: $("[data-text-en]"),
    choices: $("[data-choices]"),
    ending: $("[data-ending]"),
    restart: $("[data-restart]"),
    back: $("[data-back]"),
    depthFill: $("[data-depth-fill]"),
    credits: $("[data-credits]"),
    year: $("[data-year]"),
    notes: $("[data-notes]"),
    notesBtn: $("[data-notes-btn]"),
  };
  if (els.year) els.year.textContent = new Date().getFullYear();

  /* =====================================================================
     PRELOADER
     ===================================================================== */
  function runPreloader() {
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return; done = true;
        els.preloader.classList.add("is-done");
        setTimeout(resolve, reduceMotion ? 0 : 600);
      }
      on(els.skip, "click", finish);

      if (reduceMotion) { els.count.textContent = "100"; return finish(); }

      var n = 0, dur = 3000, t0 = performance.now();
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        n = Math.floor(p * 100);
        els.count.textContent = (n < 10 ? "0" : "") + n;
        if (p < 1 && !done) requestAnimationFrame(tick);
        else finish();
      })(t0);
    });
  }

  /* ---------- reveal helper (staggered, CSS-transition based) ---------- */
  function revealIn(scope, stagger) {
    var items = $$("[data-reveal]", scope);
    items.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("is-in"); }, i * (stagger || 130));
    });
  }

  /* =====================================================================
     TYPEWRITER
     ===================================================================== */
  function parseSegs(str) {
    var segs = [], re = /\[\[(.+?)\]\]/g, last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) segs.push({ t: str.slice(last, m.index), hl: false });
      segs.push({ t: m[1], hl: true });
      last = re.lastIndex;
    }
    if (last < str.length) segs.push({ t: str.slice(last), hl: false });
    return segs;
  }
  function renderUpto(segs, n, caret) {
    var out = "", count = 0;
    for (var i = 0; i < segs.length; i++) {
      if (count >= n) break;
      var take = Math.min(segs[i].t.length, n - count);
      var piece = escapeHtml(segs[i].t.slice(0, take));
      out += segs[i].hl ? '<span class="cy">' + piece + "</span>" : piece;
      count += take;
    }
    if (caret) out += '<span class="caret">▍</span>';
    return out;
  }

  var typer = null;
  function typewrite(el, str, onDone) {
    if (typer) typer.cancel();
    var segs = parseSegs(str);
    var total = segs.reduce(function (a, s) { return a + s.t.length; }, 0);
    var n = 0, cancelled = false;

    function jump() { n = total; render(false); cleanup(); }
    function cleanup() { typer = null; if (!cancelled && onDone) onDone(); }
    function render(caret) { el.innerHTML = renderUpto(segs, n, caret); }

    if (reduceMotion) { render(false); return cleanup(); }

    var iv = setInterval(function () {
      n++;
      render(true);
      if (n >= total) { clearInterval(iv); render(false); cleanup(); }
    }, 26);

    typer = {
      cancel: function () { cancelled = true; clearInterval(iv); },
      complete: function () { clearInterval(iv); jump(); },
    };
  }

  /* =====================================================================
     ENGINE STATE + RENDER
     ===================================================================== */
  var state = { current: null, history: [], visited: new Set(), busy: false };

  function setDepth(d) {
    if (els.depthFill) els.depthFill.style.width = (d || 0) + "%";
    Sound.duck(d || 0);
  }
  function resolve(v) { return typeof v === "function" ? v(state) : v; }

  function setVisual(scene) {
    var fig = els.figure;
    els.stage.classList.toggle("is-image", !!(scene.video || scene.image));
    fig.style.backgroundImage = "";
    if (scene.video) {
      fig.classList.add("has-image");
      fig.innerHTML = '<video src="' + scene.video + '" autoplay muted loop playsinline style="object-fit:' + (scene.videoFit || "cover") + '"></video>';
    } else if (scene.image) {
      fig.classList.add("has-image");
      fig.style.backgroundImage = "url('" + scene.image + "')";
      fig.innerHTML = "";
    } else {
      fig.classList.remove("has-image");
      fig.innerHTML = (ART[scene.art] || ART.figure)();
    }
    if (scene.glitch) glitch(fig);
  }

  var CHOICE_TIME = 14000;   // Detroit-style countdown before a choice auto-resolves (ms); 0 = off

  function buildChoices(scene) {
    var list = resolve(scene.choices) || [];
    // filter by requires / hideIfVisited
    list = list.filter(function (c) {
      if (c.hideIfVisited && state.visited.has(c.to)) return false;
      if (c.requires && !c.requires.every(function (id) { return state.visited.has(id); })) return false;
      return true;
    });
    els.choices.innerHTML = "";

    // countdown timer (skip single choices, reduced motion, or scenes that opt out)
    var timed = CHOICE_TIME > 0 && list.length > 1 && scene.timer !== false && !reduceMotion;
    if (timed) {
      var bar = document.createElement("div");
      bar.className = "choice-timer";
      bar.style.setProperty("--dur", (CHOICE_TIME / 1000) + "s");
      bar.innerHTML = "<i></i>";
      els.choices.appendChild(bar);
    }

    list.forEach(function (c, i) {
      var b = document.createElement("button");
      b.className = "choice" + (c.tone === "danger" ? " choice--danger" : c.tone === "whisper" ? " choice--whisper" : "");
      b.style.setProperty("--i", i);
      b.setAttribute("data-cursor-label", "선택");
      b.innerHTML =
        '<span class="choice__mark" aria-hidden="true"></span>' +
        '<span class="choice__body">' +
          '<span class="choice__ko">' + escapeHtml(c.ko) + "</span>" +
          '<span class="choice__en">' + escapeHtml(c.en) + "</span>" +
        "</span>";
      on(b, "click", function () { if (!state.busy) goTo(c.to); });
      els.choices.appendChild(b);
    });

    // stagger-in
    requestAnimationFrame(function () { els.choices.classList.add("is-in"); });

    // time runs out -> resolve to the last (most passive) option
    if (timed) {
      state._choiceTimer = setTimeout(function () {
        var btns = $$(".choice", els.choices);
        if (btns.length && !state.busy) btns[btns.length - 1].click();
      }, CHOICE_TIME);
    }
  }

  function showEnding(scene) {
    els.ending.hidden = false;
    els.ending.textContent = scene.ending.ko + "  ·  " + scene.ending.en;
    els.restart.hidden = false;
    if (els.notesBtn) els.notesBtn.hidden = false;
    els.choices.innerHTML = "";
    if (els.credits) els.credits.classList.add("is-in");
  }

  function goTo(id, push) {
    var scene = STORY.scenes[id];
    if (!scene) { console.warn("Unknown scene:", id); return; }
    state.busy = true;
    if (push !== false && state.current) state.history.push(state.current);
    state.current = id;
    state.visited.add(id);

    // reset panel
    if (state._auto) clearTimeout(state._auto);
    if (state._choiceTimer) clearTimeout(state._choiceTimer);
    els.choices.classList.remove("is-in");
    els.choices.innerHTML = "";
    els.textEn.classList.remove("is-in");
    els.ending.hidden = true;
    els.restart.hidden = true;
    if (els.notesBtn) els.notesBtn.hidden = true;
    els.back.hidden = state.history.length === 0;

    // enter effects
    setDepth(scene.depth);
    if (scene.flash) flash();
    setVisual(scene);

    // speaker
    var sp = resolve(scene.speaker);
    els.speaker.textContent = sp ? sp.ko + "  /  " + sp.en : "";

    // text
    var txt = resolve(scene.text);
    els.textEn.textContent = txt.en;

    typewrite(els.text, txt.ko, function () {
      els.textEn.classList.add("is-in");
      state.busy = false;
      if (scene.ending) { showEnding(scene); return; }
      if (scene.auto) {
        state._auto = setTimeout(function () { goTo(scene.next); }, scene.auto);
        return;
      }
      buildChoices(scene);
    });
  }

  // tap-to-skip typing
  on(els.stage, "click", function (e) {
    if (typer && !e.target.closest(".choice,button")) typer.complete();
  });

  /* ---------- back / restart ---------- */
  on(els.back, "click", function () {
    if (state._auto) clearTimeout(state._auto);
    if (!state.history.length) return;
    var prev = state.history.pop();
    goTo(prev, false);
  });
  on(els.restart, "click", function () { resetToTitle(); });

  /* =====================================================================
     FLOW: title -> stage
     ===================================================================== */
  function begin() {
    els.title.classList.add("is-gone");
    setTimeout(function () {
      els.title.style.display = "none";
      els.stage.hidden = false;
      requestAnimationFrame(function () {
        els.stage.classList.add("is-active");
        goTo(STORY.start, false);
      });
    }, 600);
  }
  on(els.begin, "click", begin);

  function resetToTitle() {
    if (state._auto) clearTimeout(state._auto);
    state = { current: null, history: [], visited: new Set(), busy: false };
    setDepth(0);
    els.stage.classList.remove("is-active");
    setTimeout(function () {
      els.stage.hidden = true;
      els.title.style.display = "";
      els.title.classList.remove("is-gone");
    }, 600);
  }

  /* =====================================================================
     KEYBOARD a11y — number keys pick choices, Esc = back
     ===================================================================== */
  on(document, "keydown", function (e) {
    if (notesOpen) { if (e.key === "Escape") closeNotes(); return; }
    if (els.stage.hidden) return;
    if (e.key === "Escape" && !els.back.hidden) { els.back.click(); return; }
    if (typer && (e.key === "Enter" || e.key === " ")) { typer.complete(); e.preventDefault(); return; }
    var num = parseInt(e.key, 10);
    if (num >= 1) {
      var btns = $$(".choice", els.choices);
      if (btns[num - 1]) btns[num - 1].click();
    }
  });

  /* =====================================================================
     해설 / NOTES  — open / close + placeholder art
     ===================================================================== */
  function noteSkull() {
    return svg(200, 200,
      '<g fill="none" stroke="' + INK + '" stroke-width="1.4">' +
      '<path d="M40 96 C40 54 74 34 108 34 C150 34 168 64 168 96 C168 116 158 126 150 132 L150 150 C150 158 144 162 136 162 L128 162 L128 150 L116 150 L116 162 L104 162 L104 150 L92 150 L92 164 C92 170 86 172 80 170 C70 166 64 152 62 138 C50 132 40 118 40 96 Z"/>' +
      '<circle cx="92" cy="106" r="14" fill="#000"/>' +
      '<path d="M120 102 l16 9 l-16 8"/>' +
      '<g stroke="' + DIM + '"><line x1="102" y1="150" x2="102" y2="162"/><line x1="114" y1="150" x2="114" y2="162"/><line x1="126" y1="150" x2="126" y2="162"/></g>' +
      "</g>" +
      '<circle cx="92" cy="56" r="11" fill="#000" stroke="' + BLOOD2 + '" stroke-width="1.4"/>' +
      '<g stroke="' + BLOOD2 + '" stroke-width="1"><line x1="92" y1="40" x2="92" y2="72"/><line x1="76" y1="56" x2="108" y2="56"/></g>'
    );
  }
  function noteHomun() {
    return svg(200, 200,
      '<g fill="none" stroke="' + INK + '" stroke-width="1.4">' +
      '<circle cx="100" cy="56" r="32"/>' +
      '<path d="M100 88 L100 140"/>' +
      '<path d="M100 104 L72 120 L40 116"/><path d="M100 104 L128 120 L160 116"/>' +
      '<path d="M100 140 L86 178"/><path d="M100 140 L114 178"/>' +
      "</g>" +
      '<g fill="none" stroke="' + BLOOD2 + '" stroke-width="1.4">' +
      '<path d="M40 116 q-18 -10 -22 4 q-2 14 14 16 q18 2 24 -8"/>' +
      '<path d="M160 116 q18 -10 22 4 q2 14 -14 16 q-18 2 -24 -8"/>' +
      '<path d="M86 66 q14 11 28 0"/></g>'
    );
  }
  function noteManga() {
    return svg(200, 200,
      '<g fill="none" stroke="' + INK + '" stroke-width="1.4">' +
      '<rect x="34" y="44" width="132" height="112"/>' +
      '<line x1="100" y1="44" x2="100" y2="156"/>' +
      '<rect x="44" y="56" width="46" height="40"/><rect x="44" y="104" width="46" height="44"/>' +
      '<rect x="110" y="56" width="46" height="88"/></g>' +
      '<g transform="translate(110 92)">' +
      '<path d="M2 8 C20 -6 44 -6 60 8 C44 22 20 22 2 8 Z" fill="none" stroke="' + BLOOD2 + '" stroke-width="1.4"/>' +
      '<circle cx="31" cy="8" r="6" fill="' + BLOOD2 + '"/></g>'
    );
  }
  var NOTE_ART = { skull: noteSkull, homunculus: noteHomun, manga: noteManga };
  if (els.notes) {
    $$("[data-art]", els.notes).forEach(function (ph) {
      var fn = NOTE_ART[ph.getAttribute("data-art")];
      if (fn) ph.innerHTML = fn();
    });
  }

  var notesOpen = false;
  function openNotes() {
    if (!els.notes) return;
    els.notes.hidden = false;
    els.notes.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { els.notes.classList.add("is-open"); });
    revealIn(els.notes, 110);
    notesOpen = true;
  }
  function closeNotes() {
    if (!els.notes) return;
    els.notes.classList.remove("is-open");
    els.notes.setAttribute("aria-hidden", "true");
    notesOpen = false;
    setTimeout(function () { if (!notesOpen) els.notes.hidden = true; }, 600);
  }
  $$("[data-notes-open]").forEach(function (b) { on(b, "click", openNotes); });
  on($("[data-notes-close]"), "click", closeNotes);

  /* =====================================================================
     BOOT
     ===================================================================== */
  runPreloader().then(function () {
    revealIn(els.title, 150);
    if (els.credits) els.credits.classList.add("is-in");
  });

  // optional GSAP flourish on the title eye / brand (purely decorative)
  if (hasGSAP && !reduceMotion) {
    window.gsap.fromTo(".brand", { opacity: 0 }, { opacity: 0.85, duration: 1.2, delay: 0.4 });
  }
})();
