// ===== personality layer =====

// scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("revealed"); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll("section, .card, .box").forEach((el) => {
  el.classList.add("reveal");
  io.observe(el);
});

// count-up stats
function countUp(el, target, prefix = "", suffix = "") {
  const start = performance.now();
  const dur = 900;
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsIO = new IntersectionObserver((entries) => {
  entries.forEach(async (en) => {
    if (!en.isIntersecting) return;
    statsIO.disconnect();
    const s = await (await fetch(API + "/stats")).json();
    countUp(document.getElementById("stToday"), s.eggsToday);
    countUp(document.getElementById("stAvg"), Math.round(s.avg7), "", "/day");
    countUp(document.getElementById("stLay"), s.layRate, "", "%");
    const pe = document.getElementById("stProfit");
    countUp(pe, Math.abs(s.profitMonth), s.profitMonth < 0 ? "৳-" : "৳");
    pe.classList.toggle("text-success", s.profitMonth >= 0);
    pe.classList.toggle("text-danger", s.profitMonth < 0);
  });
}, { threshold: 0.3 });
statsIO.observe(document.getElementById("stats"));

// egg rhythm: last 7 days
(async () => {
  const box = document.getElementById("eggChart");
  if (!box) return;
  const rows = await (await fetch(API + "/eggs")).json();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const sums = days.map((day) => rows.filter((r) => r.date === day).reduce((s, r) => s + r.count, 0));
  const max = Math.max(...sums, 1);
  box.innerHTML = sums.map((v, i) => {
    const label = new Date(days[i] + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
    return `<div class="bar" style="height:${Math.round((v / max) * 130) + 6}px"><span>${v || ""}</span><em>${label}</em></div>`;
  }).join("");
})();
