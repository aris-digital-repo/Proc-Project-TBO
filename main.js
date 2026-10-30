// Titik masuk: ambil data dari /api/sheet, simpan di state, dan atur navigasi.
import { $, $$, esc, debounce, enrich, todayMs, fmtInt, copyText, downloadCSV, fmtDate } from "./utils.js";
import { icon } from "./icons.js";
import * as V from "./views.js";
import { renderVendorChart, renderStatusChart, renderBudgetChart, destroyAll } from "./charts.js";

const TABS = ["overview", "payments", "quota", "ledger", "anggaran", "datamart", "audit"];
const REFRESH_MS = 5 * 60 * 1000;

const S = {
  data: null,
  items: [],
  today: todayMs(),
  tab: "overview",
  f: {
    overview: { q: "" },
    payments: { q: "", status: "ALL", rkf: "ALL", pri: "ALL" },
    quota: { q: "", year: "ALL", status: "ALL", tipe: "ALL", rkf: "ALL" },
    ledger: { q: "", year: "ALL", status: "ALL", rkf: "ALL" },
    anggaran: { q: "", type: "ALL" },
    datamart: { q: "", state: "ALL" },
    audit: { q: "" },
  },
};

/* ───────────── Ikon statis ───────────── */
function hydrateIcons(root = document) {
  $$("i[data-icon]", root).forEach((el) => {
    const tpl = document.createElement("template");
    tpl.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 16);
    const svg = tpl.content.firstElementChild;
    if (el.id) svg.id = el.id;
    el.replaceWith(svg);
  });
}

/* ───────────── Toast ───────────── */
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon("check", 15)}<span>${esc(msg)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/* ───────────── Render ───────────── */
function renderData(which) {
  if (!S.data) return;
  const all = !which;
  if (all || which === "overview") V.renderOverview(S);
  if (all || which === "payments") V.renderPayments(S);
  if (all || which === "quota") V.renderQuota(S);
  if (all || which === "ledger") V.renderLedger(S);
  if (all || which === "anggaran") V.renderAnggaran(S);
  if (all || which === "datamart") V.renderDatamart(S);
  if (all || which === "audit") V.renderAudit(S);
}

function renderCharts() {
  if (!S.data) return;
  if (S.tab === "overview") { renderVendorChart(S.items); renderStatusChart(S.items); }
  if (S.tab === "anggaran") renderBudgetChart(S.data.anggaran);
}

function updateCounts() {
  const alert = S.items.filter((i) => i.priority === "urgent" || i.priority === "overdue").length;
  const set = (id, n, isAlert) => { const el = $(id); el.textContent = n ? fmtInt(n) : ""; el.classList.toggle("is-alert", !!isAlert); };
  set("#cnt-payments", alert, true);
  set("#cnt-ledger", S.items.length);
  set("#cnt-anggaran", S.data.anggaran.length);
  set("#cnt-datamart", S.data.datamart.length);
  set("#cnt-audit", S.data.auditPromo.length);
}

function syncSegments() {
  $$("[data-seg]").forEach((b) => {
    const [g, k] = b.dataset.seg.split(".");
    b.setAttribute("aria-pressed", String(S.f[g][k] === b.dataset.v));
  });
}

/* ───────────── Navigasi tab ───────────── */
function moveInk() {
  const btn = $(`.tabs [data-tab="${S.tab}"]`);
  const ink = $("#tabsInk");
  if (!btn) return;
  ink.style.width = `${btn.offsetWidth}px`;
  ink.style.transform = `translateX(${btn.offsetLeft}px)`;
}

function setTab(tab, { push = true } = {}) {
  if (!TABS.includes(tab)) tab = "overview";
  S.tab = tab;
  TABS.forEach((t) => { $(`#view-${t}`).hidden = t !== tab; });
  $$(".tabs [data-tab]").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
  });
  moveInk();
  $(`.tabs [data-tab="${tab}"]`).scrollIntoView({ inline: "nearest", block: "nearest" });
  if (push && location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
  renderCharts();
}

/* ───────────── Pengambilan data ───────────── */
function setLive(state, label) {
  const b = $("#liveBadge");
  b.dataset.state = state;
  $("#liveText").textContent = label;
}

function showBanner(kind, title, msg, withRetry = true) {
  $("#banner").innerHTML = `<div class="banner ${kind === "warn" ? "banner--warn" : ""}" role="alert">${icon("triangle-alert", 18)}
    <div><strong>${esc(title)}</strong><p>${esc(msg)}</p></div>
    ${withRetry ? `<button class="btn btn--sm" type="button" data-action="reload">Coba lagi</button>` : ""}</div>`;
}

let loading = false;
async function load({ refresh = false, silent = false } = {}) {
  if (loading) return;
  loading = true;
  const btn = $("#refreshBtn");
  btn.classList.add("is-spinning");
  if (!S.data) setLive("loading", "Memuat data");
  try {
    const res = await fetch(`/api/sheet${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
    let body = null;
    try { body = await res.json(); } catch { /* bukan JSON */ }
    if (!res.ok || !body || body.error) throw new Error((body && body.error) || `Server membalas HTTP ${res.status}.`);

    S.data = body;
    S.today = todayMs();
    S.items = body.procurement.map((i) => enrich(i, S.today));
    $("#banner").innerHTML = "";
    if (body.warnings && body.warnings.length) showBanner("warn", "Sebagian tab tidak terbaca", body.warnings.join(" "), false);

    setLive("ok", "Live Google Sheet");
    $("#syncLabel").textContent = `Sinkronisasi: ${new Date(body.fetchedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
    populate();
    renderData();
    renderCharts();
    updateCounts();
    syncSegments();
    moveInk();
  } catch (err) {
    console.error("[dashboard]", err);
    setLive("error", S.data ? "Gagal memperbarui" : "Gagal memuat");
    showBanner("error", S.data ? "Data belum diperbarui" : "Data tidak bisa dimuat", `${err.message} ${S.data ? "Menampilkan data terakhir." : ""}`);
  } finally {
    loading = false;
    btn.classList.remove("is-spinning");
    if (!silent) btn.blur();
  }
}

function populate() { V.populateSelects(S); }

/* ───────────── Filter (input, select, segmented) ───────────── */
function setFilter(path, value) {
  const [g, k] = path.split(".");
  S.f[g][k] = value;
  renderData(g === "overview" ? "overview" : g);
}
const onType = debounce((el) => setFilter(el.dataset.f, el.value), 120);
document.addEventListener("input", (e) => { const el = e.target.closest("[data-f]"); if (el && el.tagName === "INPUT") onType(el); });
document.addEventListener("change", (e) => { const el = e.target.closest("[data-f]"); if (el && el.tagName === "SELECT") setFilter(el.dataset.f, el.value); });

/* ───────────── Dialog ───────────── */
function openDialog(id, bodyId, html) {
  const dlg = $(id);
  $(bodyId).innerHTML = html;
  hydrateIcons(dlg);
  if (!dlg.open) dlg.showModal();
}
$$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

/* ───────────── Ekspor ───────────── */
function exportCurrent() {
  if (!S.data) return;
  const day = new Date().toISOString().slice(0, 10);
  if (S.tab === "anggaran") {
    downloadCSV(`Anggaran_${day}.csv`, ["No", "Produk", "Anggaran", "Mata Anggaran", "Cost 2026", "Forecast 2027"],
      S.data.anggaran.map((i) => [i.no, i.produk, i.anggaran, i.mataAnggaran, i.cost2026, i.forecast2027]));
  } else if (S.tab === "datamart") {
    downloadCSV(`Request_Datamart_${day}.csv`, ["No", "ID Tiket", "Nama", "Output", "Link Tiket", "Status / Table", "Keterangan"],
      S.data.datamart.map((i) => [i.no, i.idTiket, i.nama, i.output, i.linkTiket, i.statusTable, i.keterangan]));
  } else if (S.tab === "audit") {
    downloadCSV(`Data_Audit_Promo_${day}.csv`, ["No", "Nama Promo", "Deskripsi", "Kode Promo", "Link Dokumen", "Budgeting", "Penyerapan Budgeting"],
      S.data.auditPromo.map((i) => [i.no, i.namaPromo, i.deskripsi, i.kodePromo.join(", "), i.linkDokumen, i.budgeting, i.penyerapan]));
  } else {
    downloadCSV(`Procurement_${day}.csv`,
      ["ID", "Tahun", "Nama Proker", "Nama Task", "Output Project", "RKF", "Vendor", "PIC", "Jenis Anggaran", "Cost", "Start Kontrak", "End Kontrak", "Status", "Next Action"],
      S.items.map((i) => [i.id, i.tahun, i.namaProker, i.namaTask, i.outputProject, i.rkf, i.vendor, i.pic, i.jenisAnggaran, i.cost, i.start || "", i.end || "", i.status, i.nextAction]));
  }
  toast("File CSV diunduh");
}

/* ───────────── Klik, keyboard ───────────── */
const GOTO = {
  "goto-payments": () => setTab("payments"),
  "goto-ledger": () => setTab("ledger"),
  "goto-urgent": () => { S.f.payments.pri = "urgent"; $("#selPayPri").value = "urgent"; renderData("payments"); setTab("payments"); },
  "goto-ongoing": () => { S.f.ledger.status = "On going"; $("#selLedgerStatus").value = "On going"; renderData("ledger"); setTab("ledger"); },
  "goto-rkf": () => { S.f.ledger.rkf = "RKF"; $("#view-ledger [data-f='ledger.rkf']").value = "RKF"; renderData("ledger"); setTab("ledger"); },
};

document.addEventListener("click", async (e) => {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) { setTab(tabBtn.dataset.tab); return; }

  const seg = e.target.closest("[data-seg]");
  if (seg) { const [g, k] = seg.dataset.seg.split("."); S.f[g][k] = seg.dataset.v; syncSegments(); renderData(g); return; }

  const act = e.target.closest("[data-action]");
  if (!act) return;
  const stop = e.target.closest("[data-stop]");
  if (stop && act.contains(stop) && act !== stop) return; // klik tautan/tombol di dalam baris

  switch (act.dataset.action) {
    case "open-project": {
      const it = S.items.find((i) => String(i.id) === act.dataset.id);
      if (it) openDialog("#projectDialog", "#projectBody", V.projectDialog(it));
      break;
    }
    case "open-promo": {
      const p = S.data.auditPromo.find((i) => String(i.no) === act.dataset.no);
      if (p) openDialog("#promoDialog", "#promoBody", V.promoDialog(p));
      break;
    }
    case "copy": {
      const ok = await copyText(act.dataset.text);
      toast(ok ? act.dataset.msg || "Tersalin" : "Gagal menyalin, salin manual");
      break;
    }
    case "export": exportCurrent(); break;
    case "reload": load({ refresh: true }); break;
    default: if (GOTO[act.dataset.action]) GOTO[act.dataset.action]();
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".rw-row")) { e.preventDefault(); e.target.click(); }
  if (e.target.matches(".tabs [data-tab]") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const i = TABS.indexOf(S.tab) + (e.key === "ArrowRight" ? 1 : -1);
    const next = TABS[(i + TABS.length) % TABS.length];
    setTab(next); $(`.tabs [data-tab="${next}"]`).focus();
  }
});

/* ───────────── Tombol header ───────────── */
$("#refreshBtn").addEventListener("click", () => load({ refresh: true }));
$("#exportBtn").addEventListener("click", exportCurrent);
$("#insightBtn").addEventListener("click", () => { if (S.data) openDialog("#insightDialog", "#insightBody", V.insightsDialog(S)); });

function applyTheme(theme, persist) {
  document.documentElement.dataset.theme = theme;
  if (persist) { try { localStorage.setItem("tbo-theme", theme); } catch { /* abaikan */ } }
  const btn = $("#themeBtn");
  btn.innerHTML = icon(theme === "dark" ? "sun" : "moon", 16);
  btn.title = theme === "dark" ? "Pakai tema terang" : "Pakai tema gelap";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#06110d" : "#eef4f0";
  destroyAll();
  renderCharts();
}
$("#themeBtn").addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));

/* ───────────── Boot ───────────── */
hydrateIcons();
applyTheme(document.documentElement.dataset.theme || "dark", false);
setTab(location.hash.slice(1) || "overview", { push: false });
window.addEventListener("hashchange", () => setTab(location.hash.slice(1), { push: false }));
window.addEventListener("resize", debounce(moveInk, 100));
document.fonts && document.fonts.ready.then(moveInk);

load();
setInterval(() => load({ silent: true }), REFRESH_MS);

// Jika halaman dibiarkan terbuka lewat tengah malam, hitung ulang tenggat.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && S.data && todayMs() !== S.today) load({ silent: true });
});
