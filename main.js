// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Nav: background on scroll + mobile toggle
const nav = document.getElementById("nav");
const links = document.getElementById("nav-links");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 30));
document.getElementById("nav-toggle").addEventListener("click", () => links.classList.toggle("open"));
links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

// Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  io.observe(el);
});

// Hero canvas: drifting neural network + ECG heartbeat line
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
let w, h, nodes, t = 0;
const dpr = Math.min(devicePixelRatio || 1, 2);

function resize() {
  w = canvas.clientWidth; h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(90, Math.floor((w * h) / 16000));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.8 + 0.8,
  }));
}

// One ECG beat shape, phase 0..1 -> amplitude
function ecg(p) {
  if (p < 0.10) return Math.sin(p / 0.10 * Math.PI) * 0.12;          // P wave
  if (p < 0.16) return 0;
  if (p < 0.18) return -(p - 0.16) / 0.02 * 0.15;                    // Q
  if (p < 0.21) return -0.15 + (p - 0.18) / 0.03 * 1.15;             // R up
  if (p < 0.24) return 1 - (p - 0.21) / 0.03 * 1.3;                  // R down to S
  if (p < 0.27) return -0.3 + (p - 0.24) / 0.03 * 0.3;
  if (p < 0.45) return Math.sin((p - 0.27) / 0.18 * Math.PI) * 0.22; // T wave
  return 0;
}

function draw() {
  t += 1;
  ctx.clearRect(0, 0, w, h);

  // Pulse factor syncs network glow with heartbeat
  const beat = (t % 120) / 120;
  const pulse = beat > 0.18 && beat < 0.3 ? 1 - Math.abs(beat - 0.22) / 0.08 : 0;

  for (const n of nodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
  }
  const maxD = 140;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < maxD) {
        const alpha = (1 - d / maxD) * (0.18 + pulse * 0.25);
        ctx.strokeStyle = `rgba(95,168,240,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  for (const n of nodes) {
    ctx.fillStyle = `rgba(46,230,201,${0.55 + pulse * 0.45})`;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r + pulse * 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // ECG trace across lower third
  const baseY = h * 0.78, amp = Math.min(90, h * 0.1), period = 360;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "rgba(46,230,201,0)");
  grad.addColorStop(0.5, "rgba(46,230,201,0.7)");
  grad.addColorStop(1, "rgba(139,92,246,0.9)");
  ctx.strokeStyle = grad; ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(46,230,201,0.8)"; ctx.shadowBlur = 10;
  ctx.beginPath();
  const offset = t * 3;
  for (let x = 0; x <= w; x += 2) {
    const p = (((x + offset) % period) + period) % period / period;
    const y = baseY - ecg(p) * amp;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  requestAnimationFrame(draw);
}

addEventListener("resize", resize);
resize();
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) draw();
