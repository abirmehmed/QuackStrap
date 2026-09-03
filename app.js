const API = /^https/.test(location.protocol) ? "https://ducky-api-suf3.onrender.com/api" : "http://localhost:4001/api";
const $ = (s) => document.querySelector(s);

async function get(p) { return (await fetch(API + p)).json(); }
async function post(p, body) {
  await fetch(API + p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
async function remove(p) { await fetch(API + p, { method: "DELETE" }); }

async function loadStats() {
  const s = await get("/stats");
  $("#stToday").textContent = s.eggsToday;
  $("#stAvg").textContent = s.avg7 + "/day";
  $("#stLay").textContent = s.layRate + "%";
  const el = $("#stProfit");
  el.textContent = "৳" + s.profitMonth;
  el.classList.toggle("text-success", s.profitMonth >= 0);
  el.classList.toggle("text-danger", s.profitMonth < 0);
}

async function loadEggs() {
  const rows = await get("/eggs");
  $("#eggList").innerHTML = rows.length
    ? rows.map((r) => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${r.date}: <b>${r.count}</b> eggs</span>
        <button class="btn btn-sm btn-outline-danger" data-del="eggs/${r.id}">✕</button>
      </li>`).join("")
    : '<li class="list-group-item text-muted">No eggs yet. The ducks are resting.</li>';
}

async function loadExpenses() {
  const rows = await get("/expenses");
  $("#expTable").innerHTML = rows.map((r) => `
    <tr>
      <td>${r.date}</td><td>${r.item}</td>
      <td class="text-end">৳${r.cost}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del="expenses/${r.id}">✕</button></td>
    </tr>`).join("") || '<tr><td colspan="4" class="text-muted">No expenses.</td></tr>';
}

async function loadSales() {
  const rows = await get("/sales");
  $("#saleTable").innerHTML = rows.map((r) => `
    <tr>
      <td>${r.date}</td><td>${r.eggs}</td>
      <td class="text-end">৳${r.amount}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del="sales/${r.id}">✕</button></td>
    </tr>`).join("") || '<tr><td colspan="4" class="text-muted">No sales yet.</td></tr>';
}

function loadAll() { loadStats(); loadEggs(); loadExpenses(); loadSales(); }

$("#eggForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await post("/eggs", { count: Number($("#eggCount").value) });
  $("#eggCount").value = "";
  loadAll();
});

$("#expForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await post("/expenses", { item: $("#expItem").value, cost: Number($("#expCost").value) });
  $("#expItem").value = "";
  $("#expCost").value = "";
  loadAll();
});

$("#saleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await post("/sales", { eggs: Number($("#saleEggs").value), amount: Number($("#saleAmount").value) });
  $("#saleEggs").value = "";
  $("#saleAmount").value = "";
  loadAll();
});

let pending = null;
const modalEl = document.getElementById("confirmModal");

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-del]");
  if (!b) return;
  pending = b.dataset.del;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
});

$("#confirmDelete").addEventListener("click", async () => {
  if (pending) await remove("/" + pending);
  pending = null;
  bootstrap.Modal.getInstance(modalEl).hide();
  loadAll();
});

loadAll();

// farm-at-a-glance strip
fetch(API + "/stats").then((r) => r.json()).then((s) => {
  const g = (id) => document.getElementById(id);
  if (g("gzToday")) {
    g("gzToday").textContent = s.eggsToday;
    g("gzLayers").textContent = s.layers;
    g("gzUpcoming").textContent = s.upcoming;
  }
});

// farm-at-a-glance: live flock + feed estimate
fetch(API + "/stats").then((r) => r.json()).then((s) => {
  const g = (id) => document.getElementById(id);
  const ducks = s.layers + s.upcoming + 1;
  if (g("gzLayers")) g("gzLayers").textContent = s.layers;
  if (g("gzUpcoming")) g("gzUpcoming").textContent = s.upcoming;
  if (g("gzFeed")) g("gzFeed").textContent = (ducks * 0.12).toFixed(1) + " kg";
});
