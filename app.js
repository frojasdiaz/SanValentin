"use strict";

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.random() * (max - min) + min;

/* ---------- screens ---------- */
const screens = {
  intro: $("screen-intro"),
  game: $("screen-game"),
  question: $("screen-question"),
  thanks: $("screen-thanks"),
};

function showScreen(key) {
  for (const k of Object.keys(screens)) {
    const el = screens[k];
    const active = k === key;
    el.classList.toggle("is-active", active);
    el.setAttribute("aria-hidden", active ? "false" : "true");
  }
}

/* ---------- elements ---------- */
const introStartBtn = $("intro-start");
const btnSkip = $("btn-skip"); // (si existe en HTML, lo ocultamos)
const btnYes = $("btn-yes");
const btnNo = $("btn-no");
const btnReplay = $("btn-replay");
const btnLetter = $("btn-letter");
const btnPromise = $("btn-promise");
const btnPistas = $("btn-pistas");
const toast = $("toast");
const qActions = $("q-actions");

const loveLetter = $("love-letter");
const letterText = $("letter-text");
const promiseText = $("promise-text");
const pistasHint = $("pistas-hint");
const entryCaption = $("entry-caption");

const door = $("door") || document.querySelector(".door");
const house = document.querySelector(".house");

/* ---------- motion preferences ---------- */
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionQuery.matches;

/* ---------- state ---------- */
let dogTimer = null;
let inviteTimer = null;
let transitionTimer = null;
let letterTimer = null;
let opening = false;
let pistasTargetHref = "./pistas-diarias/index.html";

const PISTAS_CONFIG = {
  month: 2,
  days: [12, 13, 14],
  path: "./pistas-diarias/index.html",
};

/* ---------- thanks content ---------- */
const letterMessage = [
  "Gracias por estar conmigo en cada momento mi amor.",
  "Prometo cuidarte, escucharte y elegirte cada día.",
  "Con usted, lo cotidiano se vuelve magia.",
  "Hoy y siempre: mi lugar favorito es a su ladito.",
].join("\n\n");

const promiseMessages = [
  "Promesa #1: mas abrazos largos y besitos sorpresa.",
  "Promesa #2: siempre voy a celebrar sus logros con usted.",
  "Promesa #3: una cita bonita, aunque sea en casa.",
  "Promesa #4: escucharla con calma en dias buenos y malos.",
  "Promesa #5: seguir construyendo recuerdos con usted.",
  "Promesa #6: tomarla de la mano en cada aventura siempre.",
];
let lastPromiseIndex = -1;

/* ---------- canvases ---------- */
const heartsCanvas = $("hearts");
const heartsCtx = heartsCanvas.getContext("2d", { alpha: true });

let W = 0;
let H = 0;
let DPR = 1;

/* ---------- hearts particles ---------- */
const heartChars = [
  "\u{1F497}",
  "\u{1F496}",
  "\u{1F495}",
  "\u{1F493}",
  "\u{1F49E}",
  "\u{1F498}",
  "\u{1F49D}",
];
const heartsParticles = [];
const HEARTS_MAX = 44;
let heartsRafId = 0;

function onMotionPreferenceChange(e) {
  reduceMotion = e.matches;
  syncHeartsAnimation();

  if (reduceMotion) {
    finishLetterImmediately();
  }
}

if (typeof motionQuery.addEventListener === "function") {
  motionQuery.addEventListener("change", onMotionPreferenceChange);
} else if (typeof motionQuery.addListener === "function") {
  motionQuery.addListener(onMotionPreferenceChange);
}

function setCanvasSize(canvas, ctx) {
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function resizeCanvases() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);

  setCanvasSize(heartsCanvas, heartsCtx);
}

window.addEventListener("resize", resizeCanvases, { passive: true });
resizeCanvases();

function clearGameTimers() {
  clearTimeout(dogTimer);
  clearTimeout(inviteTimer);
  clearTimeout(transitionTimer);
}

function setEntryCaption(text = "", visible = false) {
  if (!entryCaption) return;
  entryCaption.textContent = text;
  entryCaption.classList.toggle("is-show", Boolean(visible && text));
}

function setDoorActive(active) {
  if (!house) return;
  house.classList.toggle("is-door-active", active);
}

/* ---------- THANKS helpers ---------- */
function clearLetterTyping() {
  clearTimeout(letterTimer);
  letterTimer = null;
}

function setLetterOpen(open) {
  if (!loveLetter || !btnLetter) return;

  loveLetter.classList.toggle("is-open", open);
  loveLetter.setAttribute("aria-hidden", open ? "false" : "true");
  btnLetter.setAttribute("aria-expanded", open ? "true" : "false");
  btnLetter.textContent = open ? "Cerrar carta" : "Abrir carta secreta";
}

function finishLetterImmediately() {
  if (!loveLetter || !loveLetter.classList.contains("is-open") || !letterText) return;
  clearLetterTyping();
  letterText.textContent = letterMessage;
}

function typeLetterMessage() {
  if (!letterText) return;

  clearLetterTyping();
  letterText.textContent = "";

  if (reduceMotion) {
    letterText.textContent = letterMessage;
    return;
  }

  let i = 0;
  const write = () => {
    if (!loveLetter || !loveLetter.classList.contains("is-open")) return;
    i++;
    letterText.textContent = letterMessage.slice(0, i);
    if (i < letterMessage.length) {
      letterTimer = setTimeout(write, rand(14, 28));
    }
  };

  write();
}

function toggleLetter() {
  if (!loveLetter) return;

  const willOpen = !loveLetter.classList.contains("is-open");
  setLetterOpen(willOpen);

  if (willOpen) {
    typeLetterMessage();
    return;
  }

  clearLetterTyping();
}

function showPromise() {
  if (!promiseText || promiseMessages.length === 0) return;

  let index = (Math.random() * promiseMessages.length) | 0;
  if (promiseMessages.length > 1 && index === lastPromiseIndex) {
    index = (index + 1) % promiseMessages.length;
  }
  lastPromiseIndex = index;

  promiseText.textContent = promiseMessages[index];
  promiseText.classList.remove("is-pop");
  void promiseText.offsetWidth;
  promiseText.classList.add("is-pop");
}

function resetThanksExperience() {
  clearLetterTyping();
  setLetterOpen(false);
  if (letterText) letterText.textContent = "";
  if (pistasHint) pistasHint.textContent = "";
  if (promiseText) {
    promiseText.textContent = "";
    promiseText.classList.remove("is-pop");
  }
}

function getPistasPortalData(now) {
  const [day12, day13, day14] = PISTAS_CONFIG.days;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const firstUnlock = new Date(now.getFullYear(), PISTAS_CONFIG.month - 1, day12, 0, 0, 0, 0);

  let targetDay = null;
  if (month === PISTAS_CONFIG.month) {
    if (day < day12) targetDay = null;
    else if (day > day14) targetDay = day14;
    else targetDay = day;
  } else if (now < firstUnlock) {
    targetDay = null;
  } else {
    targetDay = day14;
  }

  const href = PISTAS_CONFIG.path;

  if (targetDay === day12) {
    return {
      href,
      cta: "Abrir pista de hoy",
      hint: "Hoy ya puede ver la Pista 1 en su tablero de pistas.",
      live: true,
    };
  }

  if (targetDay === day13) {
    return {
      href,
      cta: "Abrir pista de hoy",
      hint: "Hoy ya puede ver la Pista 2 en su tablero de pistas.",
      live: true,
    };
  }

  if (targetDay === day14) {
    return {
      href,
      cta: "Abrir sorpresa final",
      hint: "La sorpresa final ya esta disponible en su tablero de pistas.",
      live: true,
    };
  }

  return {
    href,
    cta: "Ir al tablero de pistas",
    hint: "Las pistas se desbloquean desde el 12 de febrero. Muy pronto se abriran.",
    live: false,
  };
}

function refreshPistasPortal() {
  if (!btnPistas) return;

  const data = getPistasPortalData(new Date());
  pistasTargetHref = data.href;
  btnPistas.textContent = data.cta;
  btnPistas.classList.toggle("is-live", data.live);
  if (pistasHint) pistasHint.textContent = data.hint;
}

function openPistasPortal() {
  refreshPistasPortal();
  window.location.href = pistasTargetHref;
}

/* ---------- flow ---------- */
function startGameFlow() {
  showScreen("game");
  opening = false;

  // ocultar skip si existe
  if (btnSkip) btnSkip.style.display = "none";

  // reset visual
  const inviteCard = $("invite-card");
  const dog = $("dog");
  const stage = document.querySelector(".stage");
  const sky = document.querySelector(".sky");

  if (inviteCard) inviteCard.classList.remove("is-show");
  if (dog) dog.classList.remove("is-show");
  if (house) house.classList.remove("is-opening");
  if (door) door.classList.remove("is-open");
  if (stage) stage.classList.remove("is-zooming");
  if (sky) sky.classList.remove("is-zooming");
  setDoorActive(false);
  setEntryCaption("", false);

  resetThanksExperience();
  clearGameTimers();

  if (reduceMotion) {
    if (dog) dog.classList.add("is-show");
    if (inviteCard) inviteCard.classList.add("is-show");
    return;
  }

  // 1) aparece el perro
  dogTimer = setTimeout(() => {
    if (dog) dog.classList.add("is-show");
  }, 900);

  // 2) aparece la invitacion
  inviteTimer = setTimeout(() => {
    if (inviteCard) inviteCard.classList.add("is-show");
  }, 2400);
}

function showQuestion() {
  showScreen("question");
  setEntryCaption("", false);
  toast.textContent = "";
  noMoves = 0;
  resetNoButton();
  btnYes.focus({ preventScroll: true });
}

function showThanks() {
  showScreen("thanks");

  resetThanksExperience();
  showPromise();
  refreshPistasPortal();

  if (btnPistas && btnPistas.classList.contains("is-live")) {
    btnPistas.focus({ preventScroll: true });
  } else if (btnLetter) {
    btnLetter.focus({ preventScroll: true });
  } else {
    btnReplay.focus({ preventScroll: true });
  }
}

function startFromIntro() {
  if (screens.intro.classList.contains("is-active")) startGameFlow();
}

function replayFromStart() {
  clearGameTimers();
  resetThanksExperience();
  opening = false;
  showScreen("intro");
}

/* ---------- door open + zoom + transition ---------- */
function openDoorAndGo() {
  if (opening) return;
  if (!screens.game.classList.contains("is-active")) return;

  opening = true;
  clearGameTimers();

  if (house) house.classList.add("is-opening");
  if (door) door.classList.add("is-open");
  setEntryCaption("Entrando a su invitacion especial...", true);

  const stage = document.querySelector(".stage");
  const sky = document.querySelector(".sky");

  if (!reduceMotion) {
    if (stage) stage.classList.add("is-zooming");
    if (sky) sky.classList.add("is-zooming");
  }

  if (reduceMotion) {
    setEntryCaption("", false);
    showQuestion();
    return;
  }

  // deja ver la animacion y el mensaje de entrada antes de pasar
  transitionTimer = setTimeout(() => {
    if (stage) stage.classList.remove("is-zooming");
    if (sky) sky.classList.remove("is-zooming");
    setEntryCaption("", false);
    showQuestion();
  }, 2600);
}

/* intro triggers */
window.addEventListener("keydown", () => {
  if (screens.intro.classList.contains("is-active")) startFromIntro();
});

window.addEventListener(
  "pointerdown",
  () => {
    if (screens.intro.classList.contains("is-active")) startFromIntro();
  },
  { passive: true }
);

introStartBtn.addEventListener("click", startFromIntro);

/* door listeners */
if (door) {
  door.addEventListener("click", openDoorAndGo);

  door.addEventListener("mouseenter", () => setDoorActive(true));
  door.addEventListener("mouseleave", () => setDoorActive(false));
  door.addEventListener("focus", () => setDoorActive(true));
  door.addEventListener("blur", () => setDoorActive(false));

  door.addEventListener(
    "pointerdown",
    (e) => {
      // mejor respuesta en movil
      e.preventDefault();
      openDoorAndGo();
    },
    { passive: false }
  );

  // accesibilidad: Enter/Space
  door.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDoorAndGo();
    }
  });
}

/* yes/replay/thanks actions */
btnYes.addEventListener("click", showThanks);
btnReplay.addEventListener("click", replayFromStart);

if (btnLetter) {
  btnLetter.addEventListener("click", toggleLetter);
}

if (btnPromise) {
  btnPromise.addEventListener("click", showPromise);
}

if (btnPistas) {
  btnPistas.addEventListener("click", openPistasPortal);
}

/* ---------- NO button escape (robust) ---------- */
let noMoves = 0;

function resetNoButton() {
  btnNo.style.position = "relative";
  btnNo.style.left = "0px";
  btnNo.style.top = "0px";
}

function moveNoButton() {
  const area = qActions.getBoundingClientRect();
  const btn = btnNo.getBoundingClientRect();

  const pad = 8;
  const maxX = Math.max(pad, area.width - btn.width - pad);
  const maxY = Math.max(pad, area.height - btn.height - pad);

  const x = clamp(rand(pad, maxX), pad, maxX);
  const y = clamp(rand(pad, maxY), pad, maxY);

  btnNo.style.position = "absolute";
  btnNo.style.left = `${x}px`;
  btnNo.style.top = `${y}px`;
}

function funnyNoMessage() {
  const msgs = [
    "Intente de nuevo, porfi \u{1F648}",
    "Quiere elegir el NO... \u{1F61E}",
    "Al cabo que ni queria \u{1F62D}",
    "Parece que se equivoco \u{1F61C}",
    "Amorcito, si no quiere me dice \u{1F622}",
    "Ahi se ven... \u{1F494}",
  ];
  toast.textContent = msgs[(Math.random() * msgs.length) | 0];
}

function escapeNo() {
  if (!screens.question.classList.contains("is-active")) return;
  noMoves++;
  moveNoButton();
  if (noMoves % 2 === 0) funnyNoMessage();
}

btnNo.addEventListener("mouseenter", escapeNo);

btnNo.addEventListener(
  "pointerdown",
  (e) => {
    if (!screens.question.classList.contains("is-active")) return;
    e.preventDefault();
    escapeNo();
  },
  { passive: false }
);

btnNo.addEventListener("click", (e) => {
  e.preventDefault();
  funnyNoMessage();
  escapeNo();
});

qActions.addEventListener(
  "pointermove",
  (e) => {
    if (!screens.question.classList.contains("is-active")) return;
    const b = btnNo.getBoundingClientRect();
    const dx = Math.abs(e.clientX - (b.left + b.width / 2));
    const dy = Math.abs(e.clientY - (b.top + b.height / 2));
    if (dx < 80 && dy < 55) escapeNo();
  },
  { passive: true }
);

/* ---------- hearts animation ---------- */
function spawnHeart() {
  const size = rand(16, 28);
  heartsParticles.push({
    x: rand(0, W),
    y: rand(-H * 0.2, -20),
    vy: rand(0.7, 2.2),
    vx: rand(-0.6, 0.6),
    size,
    a: rand(0.65, 0.95),
    r: rand(-0.6, 0.6),
    vr: rand(-0.04, 0.04),
    ch: heartChars[(Math.random() * heartChars.length) | 0],
  });
}

function animateHearts() {
  if (reduceMotion) {
    heartsRafId = 0;
    heartsParticles.length = 0;
    heartsCtx.clearRect(0, 0, W, H);
    return;
  }

  while (heartsParticles.length < HEARTS_MAX) spawnHeart();

  heartsCtx.clearRect(0, 0, W, H);

  for (let i = heartsParticles.length - 1; i >= 0; i--) {
    const p = heartsParticles[i];
    if (typeof p.life === "number") {
      p.life += 1;
      if (typeof p.ttl === "number" && p.life > p.ttl) {
        heartsParticles.splice(i, 1);
        continue;
      }
    }
    if (typeof p.g === "number") {
      p.vy += p.g;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;

    if (p.y > H + 40 || p.x < -60 || p.x > W + 60) {
      heartsParticles.splice(i, 1);
      continue;
    }

    heartsCtx.save();
    heartsCtx.globalAlpha = p.a;
    heartsCtx.translate(p.x, p.y);
    heartsCtx.rotate(p.r);
    heartsCtx.font = `${p.size}px ui-monospace, Menlo, Consolas, monospace`;
    heartsCtx.fillText(p.ch, 0, 0);
    heartsCtx.restore();
  }

  heartsRafId = requestAnimationFrame(animateHearts);
}

function stopHeartsAnimation() {
  if (heartsRafId) {
    cancelAnimationFrame(heartsRafId);
    heartsRafId = 0;
  }
  heartsParticles.length = 0;
  heartsCtx.clearRect(0, 0, W, H);
}

function syncHeartsAnimation() {
  if (reduceMotion) {
    stopHeartsAnimation();
    return;
  }
  if (!heartsRafId) {
    heartsRafId = requestAnimationFrame(animateHearts);
  }
}

/* init */
showScreen("intro");
syncHeartsAnimation();
