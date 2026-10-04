"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const livesEl = document.querySelector("#lives");
const highScoreEl = document.querySelector("#highScore");
const screen = document.querySelector("#screen");
const screenTitle = document.querySelector("#screenTitle");
const screenText = document.querySelector("#screenText");
const startButton = document.querySelector("#startButton");

const W = canvas.width, H = canvas.height;
let running = false, lastTime = 0, elapsed = 0, score = 0, combo = 0, lives = 3;
let highScore = Number(localStorage.getItem("starDeliveryHighScore")) || 0;
let ship, stars, rocks, particles, keys, spawnStar, spawnRock;

function reset() {
  ship = { x: W / 2, y: H - 100, r: 25, speed: 370, hitUntil: 0 };
  stars = []; rocks = []; particles = []; keys = new Set();
  elapsed = score = combo = 0; lives = 3; spawnStar = 0.3; spawnRock = 0.8;
  updateHud();
}
function updateHud() {
  scoreEl.textContent = score;
  comboEl.textContent = `x${Math.min(1 + Math.floor(combo / 4), 6)}`;
  livesEl.textContent = "♥".repeat(lives) + "♡".repeat(3 - lives);
  highScoreEl.textContent = highScore;
}
function rand(min, max) { return Math.random() * (max - min) + min; }
function addBurst(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: rand(-130, 130), vy: rand(-130, 130), life: rand(.25, .55), color });
}
function circleHit(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }
function start() { reset(); running = true; screen.classList.add("hidden"); lastTime = performance.now(); requestAnimationFrame(loop); }
function finish() {
  running = false;
  if (score > highScore) { highScore = score; localStorage.setItem("starDeliveryHighScore", highScore); }
  updateHud(); screenTitle.textContent = score >= highScore && score > 0 ? "新的最高分！" : "任務結束";
  screenText.innerHTML = `你送回了 <b>${score}</b> 點星光。<br>再試一次，挑戰更高連擊！`;
  startButton.textContent = "再玩一次"; screen.classList.remove("hidden");
}
function update(dt) {
  elapsed += dt;
  let dx = (keys.has("ArrowRight") || keys.has("d")) - (keys.has("ArrowLeft") || keys.has("a"));
  let dy = (keys.has("ArrowDown") || keys.has("s")) - (keys.has("ArrowUp") || keys.has("w"));
  const length = Math.hypot(dx, dy) || 1; ship.x += dx / length * ship.speed * dt; ship.y += dy / length * ship.speed * dt;
  ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x)); ship.y = Math.max(80 + ship.r, Math.min(H - ship.r, ship.y));
  spawnStar -= dt; spawnRock -= dt;
  if (spawnStar <= 0) { stars.push({ x: rand(35, W - 35), y: -30, r: 16, vy: rand(90, 145), spin: rand(0, 6) }); spawnStar = rand(.48, .88); }
  if (spawnRock <= 0) { const r = rand(22, 43); rocks.push({ x: rand(r, W - r), y: -r, r, vy: rand(125, 195) + elapsed * 5, rot: rand(0, 6), vr: rand(-2, 2) }); spawnRock = Math.max(.34, rand(.72, 1.3) - elapsed * .018); }
  for (const star of stars) { star.y += star.vy * dt; star.spin += dt * 3; if (circleHit(ship, star)) { const multi = Math.min(1 + Math.floor(combo / 4), 6); score += 10 * multi; combo++; addBurst(star.x, star.y, "#ffe772"); star.y = H + 100; updateHud(); } }
  for (const rock of rocks) { rock.y += rock.vy * dt; rock.rot += rock.vr * dt; if (performance.now() > ship.hitUntil && circleHit(ship, rock)) { lives--; combo = 0; ship.hitUntil = performance.now() + 900; addBurst(ship.x, ship.y, "#ff698b", 22); rock.y = H + 100; updateHud(); if (lives <= 0) return finish(); } }
  stars = stars.filter(o => o.y < H + 60); rocks = rocks.filter(o => o.y < H + 80);
  particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); particles = particles.filter(p => p.life > 0);
}
function starPath(x, y, outer, inner, rotation = -Math.PI / 2) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? inner : outer, a = rotation + i * Math.PI / 5; ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
function draw() {
  ctx.clearRect(0, 0, W, H); const gradient = ctx.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, "#061638"); gradient.addColorStop(1, "#14275a"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 95; i++) { const x = (i * 79) % W, y = (i * 137) % H, glow = (Math.sin(elapsed * 2 + i) + 1) / 2; ctx.fillStyle = `rgba(215,235,255,${.18 + glow * .45})`; ctx.fillRect(x, y, 2, 2); }
  ctx.fillStyle = "#5676c4"; ctx.beginPath(); ctx.arc(55, 110, 42, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#86a7ef"; ctx.beginPath(); ctx.arc(42, 96, 13, 0, Math.PI * 2); ctx.fill();
  stars.forEach(s => { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin); ctx.shadowBlur = 18; ctx.shadowColor = "#ffd95e"; ctx.fillStyle = "#ffe36c"; starPath(0, 0, s.r, s.r * .45); ctx.fill(); ctx.restore(); });
  rocks.forEach(r => { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot); ctx.fillStyle = "#6f688d"; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, radius = r.r * (i % 2 ? .85 : 1.06); ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * radius, Math.sin(a) * radius); } ctx.closePath(); ctx.fill(); ctx.fillStyle = "#4e486b"; ctx.beginPath(); ctx.arc(-r.r * .23, -r.r * .1, r.r * .18, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  particles.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
  const blink = performance.now() < ship.hitUntil && Math.floor(performance.now() / 90) % 2 === 0; if (!blink) { ctx.save(); ctx.translate(ship.x, ship.y); ctx.fillStyle = "#ffbf61"; ctx.beginPath(); ctx.moveTo(-12, 23); ctx.lineTo(0, 53 + Math.sin(elapsed * 20) * 5); ctx.lineTo(12, 23); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#d9e9ff"; ctx.beginPath(); ctx.moveTo(0, -33); ctx.quadraticCurveTo(27, -3, 20, 27); ctx.quadraticCurveTo(0, 36, -20, 27); ctx.quadraticCurveTo(-27, -3, 0, -33); ctx.fill(); ctx.fillStyle = "#5ad5ff"; ctx.beginPath(); ctx.arc(0, -5, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ff7795"; ctx.fillRect(-23, 6, 8, 19); ctx.fillRect(15, 6, 8, 19); ctx.restore(); }
}
function loop(now) { if (!running) return; const dt = Math.min(.034, (now - lastTime) / 1000); lastTime = now; update(dt); draw(); if (running) requestAnimationFrame(loop); }
addEventListener("keydown", e => { const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)) { e.preventDefault(); keys.add(key); } });
addEventListener("keyup", e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
document.querySelectorAll("[data-direction]").forEach(button => { const key = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[button.dataset.direction]; ["pointerdown", "pointerenter"].forEach(type => button.addEventListener(type, e => { if (type === "pointerenter" && e.buttons !== 1) return; keys.add(key); e.preventDefault(); })); ["pointerup", "pointercancel", "pointerleave"].forEach(type => button.addEventListener(type, () => keys.delete(key))); });
startButton.addEventListener("click", start); reset(); draw();
