// Chart.js: dikonfigurasi ulang tiap ganti tema agar warna ikut berubah.
import { fmtShort, fmtRp, fmtInt, shortVendor, esc } from "./utils.js";

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const instances = {};

function baseDefaults() {
  const Chart = window.Chart;
  Chart.defaults.font.family = '"Jakarta", system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = css("--ink-2");
  Chart.defaults.animation.duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
}

const tooltip = () => ({
  backgroundColor: css("--panel-solid"),
  titleColor: css("--ink"),
  bodyColor: css("--ink-2"),
  borderColor: css("--line-strong"),
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
  boxPadding: 5,
  usePointStyle: true,
});

// Label nilai di ujung batang (direct label)
const endLabels = {
  id: "endLabels",
  afterDatasetsDraw(chart, _a, opts) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = '600 11px "Jakarta", sans-serif';
    ctx.fillStyle = css("--ink");
    ctx.textBaseline = "middle";
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((bar, i) => {
        const v = ds.data[i];
        if (!v) return;
        ctx.fillText((opts.format || fmtShort)(v), bar.x + 8, bar.y);
      });
    });
    ctx.restore();
  },
};


function destroy(key) { if (instances[key]) { instances[key].destroy(); delete instances[key]; } }

function dataTable(headers, rows) {
  return `<details class="datatable"><summary>Lihat sebagai tabel</summary>
    <table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></details>`;
}

export function renderVendorChart(items) {
  if (!window.Chart) return;
  baseDefaults();
  destroy("vendor");
  const sums = new Map();
  items.forEach((i) => { if (i.cost > 0) sums.set(i.vendor, (sums.get(i.vendor) || 0) + i.cost); });
  const top = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const canvas = document.getElementById("vendorChart");
  document.getElementById("vendorTable").innerHTML = dataTable(["Vendor", "Nilai kontrak"], top.map(([v, c]) => [v, fmtRp(c)]));
  if (!top.length) return;

  instances.vendor = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: top.map(([v]) => shortVendor(v)),
      datasets: [{ label: "Nilai kontrak", data: top.map(([, c]) => c), backgroundColor: css("--bar-gold"), borderRadius: { topRight: 5, bottomRight: 5 }, barThickness: 16, borderSkipped: false }],
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 78 } },
      plugins: {
        legend: { display: false },
        endLabels: { format: fmtShort },
        tooltip: { ...tooltip(), callbacks: { title: (c) => top[c[0].dataIndex][0], label: (c) => ` ${fmtRp(c.raw)}` } },
      },
      scales: {
        x: { grid: { color: css("--line") }, border: { display: false }, ticks: { callback: (v) => (v ? fmtShort(v).replace("Rp ", "") : "0"), maxTicksLimit: 5 } },
        y: { grid: { display: false }, border: { color: css("--line-strong") }, ticks: { color: css("--ink") } },
      },
    },
    plugins: [endLabels],
  });
}

export function renderStatusChart(items) {
  if (!window.Chart) return;
  baseDefaults();
  destroy("status");
  let ongoing = 0, done = 0, other = 0;
  items.forEach((i) => {
    if (i.work.key === "done") done++;
    else if (i.work.key === "ongoing") ongoing++;
    else other++;
  });
  const rows = [
    { label: "On going", v: ongoing, c: css("--c1") },
    { label: "Selesai / Done", v: done, c: css("--c2") },
    { label: "Lainnya / Hold", v: other, c: css("--c3") },
  ];
  const total = ongoing + done + other;
  document.getElementById("donutCenter").innerHTML = `<b>${fmtInt(total)}</b><span>item</span>`;
  document.getElementById("statusLegend").innerHTML = rows.map((r) =>
    `<li><i style="background:${r.c}"></i><span>${esc(r.label)}</span><b>${r.v}</b></li>`).join("");
  document.getElementById("statusTable").innerHTML = dataTable(["Status", "Jumlah item"], rows.map((r) => [r.label, r.v]));

  instances.status = new window.Chart(document.getElementById("statusChart"), {
    type: "doughnut",
    data: { labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.v), backgroundColor: rows.map((r) => r.c), borderColor: css("--panel-solid"), borderWidth: 3, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { ...tooltip(), callbacks: { label: (c) => ` ${c.label}: ${c.raw} item` } } },
    },
  });
}

export function renderBudgetChart(items) {
  if (!window.Chart) return;
  baseDefaults();
  destroy("budget");
  const top = [...items].sort((a, b) => b.forecast2027 - a.forecast2027).slice(0, 8);
  document.getElementById("budgetTable").innerHTML = dataTable(["Produk", "Cost 2026", "Forecast 2027"], top.map((i) => [i.produk, fmtRp(i.cost2026), fmtRp(i.forecast2027)]));
  if (!top.length) return;
  const short = (s) => (s.length > 26 ? s.slice(0, 25) + "…" : s);

  instances.budget = new window.Chart(document.getElementById("budgetChart"), {
    type: "bar",
    data: {
      labels: top.map((i) => short(i.produk)),
      datasets: [
        { label: "Cost 2026", data: top.map((i) => i.cost2026), backgroundColor: css("--c2"), borderRadius: { topRight: 4, bottomRight: 4 }, borderSkipped: false, borderColor: css("--panel-solid"), borderWidth: 1 },
        { label: "Forecast 2027", data: top.map((i) => i.forecast2027), backgroundColor: css("--c3"), borderRadius: { topRight: 4, bottomRight: 4 }, borderSkipped: false, borderColor: css("--panel-solid"), borderWidth: 1 },
      ],
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 78 } },
      datasets: { bar: { categoryPercentage: 0.84, barPercentage: 0.94 } },
      plugins: {
        legend: { display: false },
        endLabels: { format: fmtShort },
        tooltip: { ...tooltip(), callbacks: { title: (c) => top[c[0].dataIndex].produk, label: (c) => ` ${c.dataset.label}: ${fmtRp(c.raw)}` } },
      },
      scales: {
        x: { grid: { color: css("--line") }, border: { display: false }, ticks: { callback: (v) => (v ? fmtShort(v).replace("Rp ", "") : "0"), maxTicksLimit: 6 } },
        y: { grid: { display: false }, border: { color: css("--line-strong") }, ticks: { color: css("--ink") } },
      },
    },
    plugins: [endLabels],
  });
}

export function destroyAll() { Object.keys(instances).forEach(destroy); }
