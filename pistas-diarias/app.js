"use strict";

/*
  Configuracion principal:
  Cambie aqui el mes objetivo y los dias habilitados.
*/
const CONFIG = {
  month: 2,
  days: [12, 13, 14],
};

const DAY_DATA = {
  12: {
    badge: "Pista 1",
    title: "Dia 12",
    text: "Hoy me vino a la mente esa sensacion rara de cuando el aire se vuelve mas liviano y todo parece detenerse... como si el tiempo se estirara y nos dejara respirar con calma. Me gusta pensar que pronto tendremos un momento asi.",
    illustration: day12Svg,
  },
  13: {
    badge: "Pista 2",
    title: "Dia 13",
    text: "Anoche mire el cielo y me quede pegado... parecia un mapa infinito lleno de secretos. A veces pienso que el universo guarda sorpresas que solo se revelan cuando uno se aleja de las luces y se deja envolver por las estrellas.",
    illustration: day13Svg,
  },
  14: {
    badge: "Sorpresa",
    title: "Dia 14",
    text: "Bueno, llego el momento de contarle la verdad: este sabado nos vamos juntos al Valle de Elqui, lugar sorpresa. La idea es salir antes de almuerzo, en la mañana, dejar nuestras cositas e ir al rio... almorzar y ya en la tarde noche preparar un mini asadito. Cuando caiga la noche, disfrutaremos de las estrellas en el cielo mas despejado que existe... y luego tendremos nuestra noche de amor, solo usted y yo, en nuestra escapada especial de San Valentin...",
    illustration: day14Svg,
  },
};

const $ = (id) => document.getElementById(id);

const els = {
  mainCard: $("main-card"),
  contentShell: $("content-shell"),
  lockPanel: $("lock-panel"),
  cluePanel: $("clue-panel"),
  countdownText: $("countdown-text"),
  dayBadge: $("day-badge"),
  daySubtitle: $("day-subtitle"),
  dayIllustration: $("day-illustration"),
  dayText: $("day-text"),
  btnPrev: $("btn-prev"),
  btnNext: $("btn-next"),
  liveStatus: $("live-status"),
  canvas: $("hearts-canvas"),
};

const state = {
  unlockedDay: null,
  currentDay: null,
  isLocked: false,
  lastRenderedDay: null,
  prevBlocked: false,
  nextBlocked: false,
};

/* ---------- Hearts canvas ---------- */
const ctx = els.canvas.getContext("2d", { alpha: true });
let W = 0;
let H = 0;
let DPR = 1;
let heartsRaf = 0;

const hearts = [];
const MAX_FALLING = 28;
const HEART_CHARS = ["\u{1F496}", "\u{1F497}", "\u{1F495}", "\u{1F498}", "\u{1F49E}"];

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionQuery.matches;

function resizeCanvas() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);

  els.canvas.width = Math.floor(W * DPR);
  els.canvas.height = Math.floor(H * DPR);
  els.canvas.style.width = `${W}px`;
  els.canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function spawnFallingHeart() {
  hearts.push({
    type: "fall",
    x: Math.random() * W,
    y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 0.7,
    vy: 0.7 + Math.random() * 1.35,
    size: 14 + Math.random() * 12,
    alpha: 0.48 + Math.random() * 0.42,
    char: HEART_CHARS[(Math.random() * HEART_CHARS.length) | 0],
    rot: (Math.random() - 0.5) * 0.7,
    vrot: (Math.random() - 0.5) * 0.03,
    life: 0,
    maxLife: Number.POSITIVE_INFINITY,
  });
}

function spawnBurst(cx, cy, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 3.6;

    hearts.push({
      type: "burst",
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (0.4 + Math.random() * 1.2),
      gravity: 0.04 + Math.random() * 0.08,
      size: 16 + Math.random() * 12,
      alpha: 0.72 + Math.random() * 0.28,
      char: HEART_CHARS[(Math.random() * HEART_CHARS.length) | 0],
      rot: (Math.random() - 0.5) * 0.9,
      vrot: (Math.random() - 0.5) * 0.12,
      life: 0,
      maxLife: 55 + ((Math.random() * 24) | 0),
    });
  }
}

function triggerSurpriseBurst() {
  if (reduceMotion) return;

  const rect = els.dayIllustration.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  spawnBurst(cx, cy, 26);
  window.setTimeout(() => spawnBurst(cx, cy, 16), 180);
}

function animateHearts() {
  if (reduceMotion) {
    hearts.length = 0;
    ctx.clearRect(0, 0, W, H);
    heartsRaf = 0;
    return;
  }

  while (hearts.filter((p) => p.type === "fall").length < MAX_FALLING) {
    spawnFallingHeart();
  }

  ctx.clearRect(0, 0, W, H);

  for (let i = hearts.length - 1; i >= 0; i--) {
    const p = hearts[i];
    p.life += 1;

    if (p.type === "burst") p.vy += p.gravity;

    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;

    const expiredByLife = p.life > p.maxLife;
    const expiredByBounds = p.y > H + 40 || p.x < -60 || p.x > W + 60;

    if (expiredByLife || expiredByBounds) {
      hearts.splice(i, 1);
      continue;
    }

    const lifeAlpha = p.type === "burst" ? Math.max(0, 1 - p.life / p.maxLife) : 1;

    ctx.save();
    ctx.globalAlpha = p.alpha * lifeAlpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.font = `${p.size}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(p.char, 0, 0);
    ctx.restore();
  }

  heartsRaf = window.requestAnimationFrame(animateHearts);
}

function syncHeartsAnimation() {
  if (reduceMotion) {
    if (heartsRaf) {
      window.cancelAnimationFrame(heartsRaf);
      heartsRaf = 0;
    }
    hearts.length = 0;
    ctx.clearRect(0, 0, W, H);
    return;
  }

  if (!heartsRaf) {
    heartsRaf = window.requestAnimationFrame(animateHearts);
  }
}

/* ---------- Date logic ---------- */
function getUnlockedDay(now) {
  const firstDay = CONFIG.days[0];
  const lastDay = CONFIG.days[CONFIG.days.length - 1];
  const month = now.getMonth() + 1;

  if (month === CONFIG.month) {
    const day = now.getDate();
    if (day < firstDay) return null;
    if (day > lastDay) return lastDay;
    return Math.min(day, lastDay);
  }

  const target = new Date(now.getFullYear(), CONFIG.month - 1, firstDay, 0, 0, 0, 0);
  if (now < target) return null;

  return lastDay;
}

function formatCountdown(now) {
  const target = new Date(now.getFullYear(), CONFIG.month - 1, CONFIG.days[0], 0, 0, 0, 0);
  const ms = target - now;

  if (ms <= 0) return "Falta muy poquito para que se desbloquee la pista.";

  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `Faltan ${days} dia(s), ${hours} hora(s) y ${minutes} min para el dia ${CONFIG.days[0]}.`;
}

function maxAllowedDay() {
  return state.unlockedDay;
}

function setBlockedButton(button, blocked) {
  button.disabled = false;
  button.classList.toggle("is-disabled", blocked);
  button.setAttribute("aria-disabled", blocked ? "true" : "false");
}

function applyButtonState() {
  setBlockedButton(els.btnPrev, state.prevBlocked);
  setBlockedButton(els.btnNext, state.nextBlocked);
}

function setStatus(text) {
  els.liveStatus.textContent = text;
}

function animateContentSwap(cb) {
  els.contentShell.classList.add("is-swapping");
  window.setTimeout(() => {
    cb();
    window.requestAnimationFrame(() => {
      els.contentShell.classList.remove("is-swapping");
    });
  }, 170);
}

function renderLockView(now) {
  state.isLocked = true;
  state.prevBlocked = true;
  state.nextBlocked = true;

  els.lockPanel.hidden = false;
  els.cluePanel.hidden = true;

  els.dayBadge.textContent = "Aun no";
  els.daySubtitle.textContent = "Esperando Dia 12";
  els.countdownText.textContent = formatCountdown(now);

  applyButtonState();
  setStatus("Todavia no se desbloquea la primera pista.");

  els.mainCard.classList.remove("is-surprise");
  els.dayIllustration.classList.remove("is-surprise");
}

function renderClueView() {
  state.isLocked = false;

  const day = state.currentDay;
  const data = DAY_DATA[day];
  const minDay = CONFIG.days[0];
  const maxDay = maxAllowedDay();

  els.lockPanel.hidden = true;
  els.cluePanel.hidden = false;

  els.dayBadge.textContent = data.badge;
  els.daySubtitle.textContent = data.title;
  els.dayText.textContent = data.text;
  els.dayIllustration.innerHTML = data.illustration();

  state.prevBlocked = day <= minDay;
  state.nextBlocked = day >= maxDay;
  applyButtonState();

  const isSurprise = day === CONFIG.days[CONFIG.days.length - 1];
  els.mainCard.classList.toggle("is-surprise", isSurprise);
  els.dayIllustration.classList.toggle("is-surprise", isSurprise);

  setStatus(`Mostrando ${data.badge} (${data.title}).`);

  if (isSurprise && state.lastRenderedDay !== day) {
    triggerSurpriseBurst();
  }

  state.lastRenderedDay = day;
}

function normalizeCurrentDay() {
  const minDay = CONFIG.days[0];
  const maxDay = maxAllowedDay();

  if (maxDay === null || maxDay === undefined) {
    state.currentDay = null;
    return;
  }

  if (!CONFIG.days.includes(state.currentDay)) {
    state.currentDay = maxDay;
  }

  if (state.currentDay < minDay) state.currentDay = minDay;
  if (state.currentDay > maxDay) state.currentDay = maxDay;
}

function render({ animate = false } = {}) {
  const now = new Date();
  state.unlockedDay = getUnlockedDay(now);

  const apply = () => {
    if (state.unlockedDay === null) {
      renderLockView(now);
      return;
    }

    normalizeCurrentDay();
    renderClueView();
  };

  if (animate) {
    animateContentSwap(apply);
  } else {
    apply();
  }
}

function goToPreviousDay() {
  if (state.prevBlocked) {
    setStatus("Ya esta en la primera pista disponible, mi amorcito.");
    return;
  }

  const idx = CONFIG.days.indexOf(state.currentDay);
  if (idx <= 0) return;

  state.currentDay = CONFIG.days[idx - 1];
  render({ animate: true });
}

function lockedNextMessage() {
  return "Aun no es el dia de la siguiente pista, mi amorcito. Por favor, vuelva manana.";
}

function goToNextDay() {
  if (state.nextBlocked) {
    const lastDay = CONFIG.days[CONFIG.days.length - 1];

    if (state.isLocked) {
      setStatus(lockedNextMessage());
      return;
    }

    if (state.currentDay >= lastDay) {
      setStatus("Ya esta en la sorpresa final, mi amorcito.");
      return;
    }

    setStatus(lockedNextMessage());
    return;
  }

  const idx = CONFIG.days.indexOf(state.currentDay);
  if (idx < 0 || idx >= CONFIG.days.length - 1) return;

  const candidate = CONFIG.days[idx + 1];
  const maxDay = maxAllowedDay();
  if (candidate > maxDay) {
    setStatus(lockedNextMessage());
    return;
  }

  state.currentDay = candidate;
  render({ animate: true });
}

/* ---------- Inline illustrations ---------- */
function day12Svg() {
  return `
    <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Brisa suave con nubes y corazon flotando">
      <defs>
        <linearGradient id="g12a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e9f7ff"/>
          <stop offset="100%" stop-color="#d2efff"/>
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#g12a)" rx="14"/>

      <g fill="#ffffff" opacity="0.95">
        <ellipse cx="130" cy="96" rx="54" ry="28"/>
        <ellipse cx="172" cy="98" rx="38" ry="22"/>
        <ellipse cx="104" cy="106" rx="34" ry="18"/>

        <ellipse cx="466" cy="84" rx="56" ry="28"/>
        <ellipse cx="510" cy="88" rx="36" ry="20"/>
        <ellipse cx="440" cy="95" rx="28" ry="15"/>
      </g>

      <g stroke="#9ed7f2" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.78">
        <path d="M70 190 C170 160, 260 222, 360 192"/>
        <path d="M126 236 C226 210, 320 268, 420 236"/>
        <path d="M200 286 C286 260, 370 312, 458 286"/>
      </g>

      <path d="M336 150c0-20 16-34 34-34 13 0 24 7 30 18 6-11 17-18 30-18 18 0 34 14 34 34 0 35-44 59-64 79-20-20-64-44-64-79z"
        fill="#ff77ba" stroke="#b3407f" stroke-width="5"/>
    </svg>
  `;
}

function day13Svg() {
  return `
    <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cielo estrellado con constelacion de corazon">
      <defs>
        <linearGradient id="g13a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#08122e"/>
          <stop offset="100%" stop-color="#141f4b"/>
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#g13a)" rx="14"/>

      <g fill="#fdfbff" opacity="0.9">
        <circle cx="56" cy="44" r="2.2"/>
        <circle cx="96" cy="74" r="2"/>
        <circle cx="140" cy="56" r="1.8"/>
        <circle cx="210" cy="84" r="2.4"/>
        <circle cx="252" cy="48" r="1.8"/>
        <circle cx="300" cy="70" r="2"/>
        <circle cx="352" cy="52" r="1.7"/>
        <circle cx="430" cy="80" r="2.6"/>
        <circle cx="486" cy="52" r="2.2"/>
        <circle cx="548" cy="76" r="2.1"/>
        <circle cx="600" cy="58" r="2.4"/>
        <circle cx="88" cy="148" r="2"/>
        <circle cx="168" cy="172" r="2.1"/>
        <circle cx="234" cy="136" r="2.5"/>
        <circle cx="300" cy="164" r="1.8"/>
        <circle cx="372" cy="136" r="2.3"/>
        <circle cx="444" cy="164" r="1.9"/>
        <circle cx="512" cy="138" r="2.4"/>
        <circle cx="574" cy="166" r="2.1"/>
      </g>

      <g stroke="#b5d2ff" stroke-width="3" fill="none" opacity="0.85" stroke-linecap="round">
        <path d="M246 244 L286 210 L320 226 L354 210 L394 244 L320 312 Z"/>
      </g>
      <g fill="#fbeaff">
        <circle cx="246" cy="244" r="5"/>
        <circle cx="286" cy="210" r="5"/>
        <circle cx="320" cy="226" r="5"/>
        <circle cx="354" cy="210" r="5"/>
        <circle cx="394" cy="244" r="5"/>
        <circle cx="320" cy="312" r="5"/>
      </g>

      <ellipse cx="320" cy="382" rx="220" ry="26" fill="rgba(122, 141, 207, 0.35)"/>
    </svg>
  `;
}

function day14Svg() {
  return `
    <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Casita en valle con rio y estrellas">
      <defs>
        <linearGradient id="g14a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#18234f"/>
          <stop offset="62%" stop-color="#2c3d72"/>
          <stop offset="100%" stop-color="#3e6a86"/>
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#g14a)" rx="14"/>

      <g fill="#f9f4ff" opacity="0.95">
        <circle cx="86" cy="62" r="2.2"/>
        <circle cx="132" cy="48" r="1.8"/>
        <circle cx="170" cy="68" r="2.1"/>
        <circle cx="228" cy="52" r="1.9"/>
        <circle cx="284" cy="70" r="2.1"/>
        <circle cx="334" cy="54" r="1.8"/>
        <circle cx="394" cy="69" r="2.2"/>
        <circle cx="454" cy="46" r="1.9"/>
        <circle cx="514" cy="64" r="2.2"/>
        <circle cx="562" cy="50" r="2"/>
      </g>

      <path d="M0 282 C140 244, 280 292, 400 252 C486 224, 566 238, 640 212 L640 400 L0 400 Z" fill="#4e6b4f" opacity="0.78"/>
      <path d="M0 316 C126 286, 286 340, 420 304 C510 280, 574 288, 640 274 L640 400 L0 400 Z" fill="#3f5a41" opacity="0.88"/>

      <path d="M84 340 C220 310, 312 364, 442 336 C512 320, 582 332, 640 326" stroke="#62c7ff" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M84 340 C220 310, 312 364, 442 336 C512 320, 582 332, 640 326" stroke="#b8ecff" stroke-width="2.8" fill="none" opacity="0.9" stroke-linecap="round"/>

      <g transform="translate(246 182)">
        <polygon points="-76,36 0,-18 76,36" fill="#d66576" stroke="#6f2f3e" stroke-width="4"/>
        <rect x="-58" y="36" width="116" height="78" rx="10" fill="#f6d8a9" stroke="#7d5f44" stroke-width="4"/>
        <rect x="-12" y="72" width="24" height="42" rx="6" fill="#7d5f44"/>
        <rect x="-44" y="58" width="22" height="20" rx="4" fill="#9ee6ff" stroke="#4d7e95" stroke-width="3"/>
        <rect x="22" y="58" width="22" height="20" rx="4" fill="#9ee6ff" stroke="#4d7e95" stroke-width="3"/>
      </g>

      <path d="M506 126c0-18 14-30 30-30 11 0 21 6 26 16 5-10 15-16 26-16 16 0 30 12 30 30 0 31-38 52-56 70-18-18-56-39-56-70z"
        fill="#ff89c8" stroke="#913f6b" stroke-width="4"/>
    </svg>
  `;
}

/* ---------- Events ---------- */
els.btnPrev.addEventListener("click", goToPreviousDay);
els.btnNext.addEventListener("click", goToNextDay);

window.addEventListener("resize", resizeCanvas, { passive: true });

const onMotionChange = (e) => {
  reduceMotion = e.matches;
  syncHeartsAnimation();
};

if (typeof motionQuery.addEventListener === "function") {
  motionQuery.addEventListener("change", onMotionChange);
} else if (typeof motionQuery.addListener === "function") {
  motionQuery.addListener(onMotionChange);
}

/* ---------- Init ---------- */
resizeCanvas();
syncHeartsAnimation();
render({ animate: false });
