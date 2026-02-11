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
const toast = $("toast");
const qActions = $("q-actions");

const door = $("door") || document.querySelector(".door");
const house = document.querySelector(".house");

/* ---------- state ---------- */
let hintTimer = null;
let opening = false;

/* ---------- GAME helpers ---------- */
function ensureKnockHint() {
  let hint = document.querySelector(".knock-hint");
  if (!hint) {
    hint = document.createElement("div");
    hint.className = "knock-hint";
    hint.textContent = "Toc! Toc! 👊🚪";
    const stage = document.querySelector(".stage");
    if (stage) stage.appendChild(hint);
  }
  return hint;
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
  const hint = ensureKnockHint();

  if (inviteCard) inviteCard.classList.remove("is-show");
  if (dog) dog.classList.remove("is-show");
  if (house) house.classList.remove("is-opening");
  if (door) door.classList.remove("is-open");
  if (stage) stage.classList.remove("is-zooming");
  if (sky) sky.classList.remove("is-zooming");
  if (hint) hint.classList.remove("is-show");

// 1) aparece el perro
setTimeout(() => {
  if (dog) dog.classList.add("is-show");
}, 900);

// 2) aparece la invitación
setTimeout(() => {
  if (inviteCard) inviteCard.classList.add("is-show");
}, 2400);

// 3) “Toc! Toc!” -> 1 segundo después de la invitación
clearTimeout(hintTimer);
hintTimer = setTimeout(() => {
  if (hint) hint.classList.add("is-show");
}, 2400 + 1000);

}

function showQuestion() {
  showScreen("question");
  toast.textContent = "";
  noMoves = 0;
  resetNoButton();
  btnYes.focus({ preventScroll: true });
}

function showThanks() {
  showScreen("thanks");
  btnReplay.focus({ preventScroll: true });
}

function startFromIntro() {
  if (screens.intro.classList.contains("is-active")) startGameFlow();
}

/* ---------- door open + zoom + transition ---------- */
function openDoorAndGo() {
  if (opening) return;
  if (!screens.game.classList.contains("is-active")) return;

  opening = true;
  clearTimeout(hintTimer);

  const hint = document.querySelector(".knock-hint");
  if (hint) hint.classList.remove("is-show");

  if (house) house.classList.add("is-opening");
  if (door) door.classList.add("is-open");

  const stage = document.querySelector(".stage");
  const sky = document.querySelector(".sky");
  if (stage) stage.classList.add("is-zooming");
  if (sky) sky.classList.add("is-zooming");

  // deja ver la animación antes de pasar
  setTimeout(() => {
    if (stage) stage.classList.remove("is-zooming");
    if (sky) sky.classList.remove("is-zooming");
    showQuestion();
  }, 1100);
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

  door.addEventListener(
    "pointerdown",
    (e) => {
      // mejor respuesta en móvil
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

/* yes/replay */
btnYes.addEventListener("click", showThanks);
btnReplay.addEventListener("click", () => showScreen("intro"));

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
    "Intente de nuevo, porfi 🙈",
    "Quiere elegir el NO… 😞",
    "Al cabo que ni quería 😭",
    "Parece que se equivocó 😜",
    "Amorcito si no quiere me dice 😢",
    "Ahí se ven... 💔"
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

/* ---------- hearts particles (canvas + rAF) ---------- */
const canvas = $("hearts");
const ctx = canvas.getContext("2d", { alpha: true });

let W = 0,
  H = 0,
  DPR = 1;

function resizeCanvas() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);

  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();

const heartChars = ["💗", "💖", "💕", "💓", "💞", "💘", "💝"];
const particles = [];
const MAX = 44;

function spawnHeart() {
  const size = rand(16, 28);
  particles.push({
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
  while (particles.length < MAX) spawnHeart();

  ctx.clearRect(0, 0, W, H);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;

    if (p.y > H + 40 || p.x < -60 || p.x > W + 60) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.font = `${p.size}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(p.ch, 0, 0);
    ctx.restore();
  }

  requestAnimationFrame(animateHearts);
}
requestAnimationFrame(animateHearts);

/* init */
showScreen("intro");
