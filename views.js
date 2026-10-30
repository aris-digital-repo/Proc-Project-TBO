// Pembangun HTML untuk tiap tab. Semua teks dari sheet lewat esc().
import {
  $, esc, safeHref, fmtRp, fmtShort, fmtInt, fmtDate, fmtDateShort, isoToMs, DAY, diffDays,
  PRIORITY, countdownText, countUp, shortVendor, isDone,
} from "./utils.js";
import { icon } from "./icons.js";

const norm = (s) => String(s ?? "").toLowerCase();
const hit = (q, ...fields) => !q || fields.some((f) => norm(f).includes(q));
const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
const text = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

/* ───────────── Potongan UI kecil ───────────── */
export const statusBadge = (it) => `<span class="badge badge--${it.work.tone}">${esc(it.status)}</span>`;
export const rkfBadge = (it) => `<span class="badge ${it.rkf === "RKF" ? "badge--ok" : ""}">${esc(it.rkf)}</span>`;
const toneOf = (p) => PRIORITY[p].tone;

const docLink = (url, label = "Dokumen") =>
  url ? `<a class="btn btn--sm" href="${safeHref(url)}" target="_blank" rel="noopener noreferrer">${icon("file-text", 14)}<span>${label}</span></a>` : `<span class="na">-</span>`;

const emptyState = (title, body, extra = "") =>
  `<div class="empty-state"><h3>${esc(title)}</h3><p>${body}</p>${extra}</div>`;

/* ───────────── Kartu kontrak ───────────── */
function contractCard(it) {
  const tone = toneOf(it.priority);
  const meter = it.elapsed !== null
    ? `<div><div class="meter" style="--tone:var(--${tone === "muted" ? "muted" : tone})"><i style="width:${it.elapsed.toFixed(0)}%"></i></div>
       <div class="meter__labels"><span>${fmtDate(it.start)}</span><span>${it.elapsed.toFixed(0)}% waktu berjalan</span><span>${fmtDate(it.end)}</span></div></div>`
    : `<div class="meter__labels"><span>${it.start ? "Mulai " + fmtDate(it.start) : "Tanggal mulai kosong"}</span><span>${it.end ? "Berakhir " + fmtDate(it.end) : "End Kontrak belum diisi"}</span></div>`;

  return `
  <article class="card tone-${tone}">
    <header class="card__head">
      <span class="card__vendor" title="${esc(it.vendor)}">${esc(it.vendor)}</span>
      <span class="countdown">${esc(countdownText(it))}</span>
    </header>
    <h3 class="card__title">${esc(it.namaTask)}</h3>
    <p class="card__sub">${esc(it.namaProker)}</p>
    <p class="card__out">${icon("layers", 14)}<span>Output: ${esc(it.outputProject)}</span></p>
    ${meter}
    <dl class="facts">
      <div><dt>Tahun</dt><dd>${esc(it.tahun || "-")}</dd></div>
      <div><dt>Nilai</dt><dd class="money">${it.cost ? fmtShort(it.cost) : "-"}</dd></div>
      <div><dt>PIC</dt><dd>${esc(it.pic)}</dd></div>
    </dl>
    <div class="card__badges">${rkfBadge(it)}${statusBadge(it)}</div>
    <footer class="card__foot">
      <span class="card__next" title="${esc(it.nextAction)}"><b>Next:</b> ${esc(it.nextAction || "-")}</span>
      <span class="card__acts">
        ${it.detailUrl ? `<a class="btn btn--sm btn--icon" href="${safeHref(it.detailUrl)}" target="_blank" rel="noopener noreferrer" title="Buka dokumen" aria-label="Buka dokumen">${icon("file-text", 14)}</a>` : ""}
        <button class="btn btn--sm" type="button" data-action="open-project" data-id="${esc(it.id)}">Detail${icon("chevron-right", 14)}</button>
      </span>
    </footer>
  </article>`;
}

const byDeadline = (a, b) =>
  PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || (a.days ?? 9e9) - (b.days ?? 9e9);

/* ───────────── Overview ───────────── */
export function renderOverview(S) {
  const items = S.items;
  const total = items.reduce((s, i) => s + i.cost, 0);
  const opex = items.filter((i) => /OPEX/i.test(i.jenisAnggaran)).reduce((s, i) => s + i.cost, 0);
  const capex = items.filter((i) => /CAPEX/i.test(i.jenisAnggaran)).reduce((s, i) => s + i.cost, 0);
  const split = opex + capex || 1;

  countUp($("#kpiTotalCost"), total, fmtRp, 1100);
  text("kpiOpex", fmtRp(opex));
  text("kpiCapex", fmtRp(capex));
  requestAnimationFrame(() => {
    $(".split__opex").style.width = `${(opex / split) * 100}%`;
    $(".split__capex").style.width = `${(capex / split) * 100}%`;
  });

  const rkf = items.filter((i) => i.rkf === "RKF");
  const urgent = items.filter((i) => i.priority === "urgent");
  const overdue = items.filter((i) => i.priority === "overdue");
  const upcoming = items.filter((i) => i.priority === "upcoming");
  const ongoing = items.filter((i) => i.work.key === "ongoing");
  const rkfOngoing = rkf.filter((i) => i.work.key === "ongoing").length;
  const rkfDone = rkf.filter((i) => i.work.key === "done").length;
  const rkfIdle = rkf.length - rkfOngoing - rkfDone;

  text("heroItems", `${items.length} item pengadaan`);
  countUp($("#kpiTotalItems"), items.length, fmtInt);
  text("kpiRkfBreakdown", `RKF: ${rkf.length} dan Non-RKF: ${items.length - rkf.length}`);
  countUp($("#kpiUrgentCount"), urgent.length + overdue.length, fmtInt);
  text("kpiUrgentSub", urgent.length + overdue.length
    ? `${overdue.length} terlambat, ${urgent.length} dalam 30 hari`
    : upcoming.length ? `Aman. ${upcoming.length} kontrak jatuh tempo dalam 31 sampai 60 hari` : "Tidak ada jatuh tempo dekat");
  countUp($("#kpiOngoingCount"), ongoing.length, fmtInt);
  countUp($("#kpiRkfOngoing"), rkfOngoing, fmtInt);
  text("kpiRkfSub", `${rkfIdle} belum mulai, ${rkfDone} selesai`);

  // Tenggat terdekat (di hero)
  const queue = items.filter((i) => ["overdue", "urgent", "upcoming", "safe"].includes(i.priority)).sort(byDeadline);
  const next = queue[0];
  const heroNext = $("#heroNext");
  if (next) {
    const t = toneOf(next.priority);
    heroNext.innerHTML = `Tenggat terdekat: <b>${esc(shortVendor(next.vendor) === "In-House" ? next.namaTask : next.vendor)}</b>, <span class="tone-${t}">${esc(countdownText(next))}</span> (${fmtDate(next.end)}).`;
  } else heroNext.textContent = "Belum ada kontrak dengan End Kontrak di depan.";

  // Kartu kritis
  const q = norm(S.f.overview.q);
  const pool = items.filter((i) => hit(q, i.namaProker, i.namaTask, i.vendor, i.pic, i.outputProject, i.rkf, i.status));
  const shown = q ? [...pool].sort(byDeadline) : queue.slice(0, 3);
  set("overviewCards", shown.length
    ? shown.map(contractCard).join("")
    : emptyState("Tidak ada jadwal yang cocok", q ? "Coba kata kunci lain." : "Isi kolom End Kontrak di sheet agar tenggat muncul di sini."));

  set("runway", runwayHtml(items, S.today));
  runwayNote(items);
}

/* ───────────── Runway ───────────── */
function runwayNote(items) {
  const open = items.filter((i) => i.start && !i.end).length;
  const blank = items.filter((i) => !i.start && !i.end).length;
  const parts = [];
  if (open) parts.push(`${open} kontrak belum punya End Kontrak (garis putus-putus), jadi belum bisa dipantau tenggatnya.`);
  if (blank) parts.push(`${blank} item tanpa tanggal tidak ditampilkan.`);
  text("runwayNote", parts.join(" "));
}

function runwayHtml(items, today) {
  const rows = items.filter((i) => i.start || i.end);
  if (!rows.length) return emptyState("Belum ada tanggal kontrak", "Isi Start Kontrak dan End Kontrak di sheet DATA_PENGADAAN.");

  const ms = (iso) => isoToMs(iso);
  const stamps = [today, today + 90 * DAY];
  rows.forEach((i) => { if (i.start) stamps.push(ms(i.start)); if (i.end) stamps.push(ms(i.end)); });
  const lo = new Date(Math.min(...stamps)); const hi = new Date(Math.max(...stamps));
  const t0 = Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1);
  const t1 = Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth() + 1, 1);
  const span = t1 - t0;
  const pct = (t) => ((t - t0) / span) * 100;

  const ticks = [];
  for (let d = new Date(t0); d.getTime() < t1; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) ticks.push(new Date(d));
  const mon = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });
  const tickHtml = ticks.map((d, i) => {
    const showYear = i === 0 || d.getUTCMonth() === 0;
    return `<div class="rw-tick" style="left:${pct(d.getTime()).toFixed(2)}%"><b>${mon.format(d)}</b>${showYear ? d.getUTCFullYear() : ""}</div>`;
  }).join("");

  const sorted = [...rows].sort((a, b) => (a.start || a.end).localeCompare(b.start || b.end)).slice(0, 24);
  const rowHtml = sorted.map((it, idx) => {
    const s = it.start ? ms(it.start) : ms(it.end);
    const open = !it.end;
    const e = it.end ? ms(it.end) : t1;
    const left = pct(s); const width = Math.max(0.5, pct(e) - left);
    const cls = open ? "open" : it.priority === "overdue" || it.priority === "urgent" ? "danger" : it.priority === "upcoming" ? "warn" : it.priority === "safe" ? "ok" : "muted";
    const label = open ? "End date belum diisi" : width > 16 ? countdownText(it) : "";
    const lead = it.vendor === "In-House" ? it.namaTask : it.vendor;
    const title = `${it.namaTask}: ${it.start ? fmtDate(it.start) : "?"} sampai ${it.end ? fmtDate(it.end) : "belum diisi"}`;
    return `<div class="rw-row" role="button" tabindex="0" data-action="open-project" data-id="${esc(it.id)}" title="${esc(title)}" aria-label="${esc(title)}">
      <div class="rw-label"><b>${esc(lead)}</b><span>${esc(it.vendor === "In-House" ? it.namaProker : it.namaTask)}</span></div>
      <div class="rw-track"><div class="rw-bar rw-bar--${cls}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;--i:${idx}">${esc(label)}</div></div>
    </div>`;
  }).join("");

  const todayLabel = `Hari ini, ${fmtDateShort(today)}`;
  const grid = ticks.map((d) => `<i class="rw-gline" style="left:${pct(d.getTime()).toFixed(2)}%"></i>`).join("");
  return `<div class="rw-inner">
    <div class="rw-axis"><div></div><div class="rw-axis__track">${tickHtml}</div></div>
    ${rowHtml}
    <div class="rw-overlay" aria-hidden="true">${grid}<div class="rw-today" style="left:${pct(today).toFixed(2)}%"><span>${esc(todayLabel)}</span></div></div></div>`;
}

/* ───────────── Payment Deadlines ───────────── */
export function renderPayments(S) {
  const f = S.f.payments; const q = norm(f.q);
  const list = S.items.filter((i) =>
    hit(q, i.namaProker, i.namaTask, i.vendor, i.pic, i.outputProject, i.rkf, i.status) &&
    (f.status === "ALL" || norm(i.status) === norm(f.status)) &&
    (f.rkf === "ALL" || i.rkf === f.rkf) &&
    (f.pri === "ALL" || i.priority === f.pri)).sort(byDeadline);
  text("payCount", `Menampilkan ${list.length} dari ${S.items.length} jadwal`);
  set("paymentCards", list.length ? list.map(contractCard).join("") : emptyState("Tidak ada jadwal yang cocok", "Ubah atau kosongkan filter untuk melihat semua jadwal."));
}

/* ───────────── Quota Tracker ───────────── */
export function renderQuota(S) {
  const f = S.f.quota; const q = norm(f.q);
  const all = S.items.filter((i) => i.kuota && i.kuota > 0);
  if (!all.length) {
    const cand = S.data.anggaran.filter((a) => /kyc|otp|ocr|liveness|face|gateway|sms|wa\b/i.test(a.produk)).slice(0, 3).map((a) => a.produk);
    set("quotaCards", emptyState("Belum ada data kuota",
      "Tracker ini terisi otomatis begitu kolom kuota di tab DATA_PENGADAAN diisi.",
      `<ul><li>Kuota</li><li>Total Pemakaian</li><li>Estimasi Kuota Habis (opsional)</li><li>Status Billing (opsional)</li></ul>` +
      (cand.length ? `<p style="margin-top:14px" class="muted">Kandidat dari tab Anggaran: ${cand.map(esc).join(", ")}.</p>` : "")));
    return;
  }
  const list = all.filter((i) =>
    hit(q, i.namaTask, i.vendor, i.namaProker) &&
    (f.year === "ALL" || i.tahun === f.year) && (f.status === "ALL" || norm(i.status) === norm(f.status)) &&
    (f.tipe === "ALL" || i.tipePengadaan === f.tipe) && (f.rkf === "ALL" || i.rkf === f.rkf));
  set("quotaCards", list.length ? list.map((it) => {
    const use = Math.round(it.utilisasi ?? 0);
    const cls = use >= 100 ? "is-over" : use >= 80 ? "is-warn" : "";
    const sisa = Math.max(0, it.kuota - (it.totalPemakaian || 0));
    return `<article class="card qcard ${cls}">
      <div class="qcard__row"><div><h3 class="card__title">${esc(it.namaTask)}</h3><p class="card__sub">${esc(it.vendor)}</p></div><span class="qcard__pct">${use}%</span></div>
      <div class="meter" style="--tone:var(--${use >= 100 ? "danger" : use >= 80 ? "warn" : "ok"})"><i style="width:${Math.min(use, 100)}%"></i></div>
      <dl class="facts"><div><dt>Kuota</dt><dd>${fmtInt(it.kuota)}</dd></div><div><dt>Terpakai</dt><dd>${fmtInt(it.totalPemakaian || 0)}</dd></div><div><dt>Sisa</dt><dd>${fmtInt(sisa)}</dd></div></dl>
      <div class="card__badges">${rkfBadge(it)}${statusBadge(it)}${it.statusBilling ? `<span class="badge badge--gold">${esc(it.statusBilling)}</span>` : ""}</div>
      ${it.estimasiKuotaHabis ? `<p class="card__next"><b>Estimasi habis:</b> ${esc(it.estimasiKuotaHabis)}</p>` : ""}
    </article>`;
  }).join("") : emptyState("Tidak ada kuota yang cocok", "Ubah filter untuk melihat layanan lain."));
}

/* ───────────── Procurement Ledger ───────────── */
export function renderLedger(S) {
  const f = S.f.ledger; const q = norm(f.q);
  const list = S.items.filter((i) =>
    hit(q, i.namaProker, i.namaTask, i.vendor, i.outputProject, i.pic) &&
    (f.year === "ALL" || i.tahun === f.year) &&
    (f.status === "ALL" || norm(i.status).includes(norm(f.status))) &&
    (f.rkf === "ALL" || i.rkf === f.rkf));
  text("ledgerCount", `Menampilkan ${list.length} dari ${S.items.length} item`);
  set("ledgerBody", list.length ? list.map((it) => {
    const due = it.priority === "overdue" || it.priority === "urgent" ? "due-danger" : it.priority === "upcoming" ? "due-warn" : "";
    return `<tr data-action="open-project" data-id="${esc(it.id)}">
      <td class="c mono muted">${esc(it.id)}</td>
      <td class="c num" style="color:var(--warn)">${esc(it.tahun || "-")}</td>
      <td><div class="title clamp">${esc(it.namaTask)}</div><div class="sub clamp">${esc(it.namaProker)}</div>
        <div class="pill-row">${rkfBadge(it)}<span class="tag">${esc(it.tipePengadaan)}</span></div></td>
      <td style="color:var(--violet);font-weight:600;max-width:180px">${esc(it.outputProject)}</td>
      <td><div class="title">${esc(it.vendor)}</div><div class="sub">PIC: ${esc(it.pic)}</div></td>
      <td class="r num money">${it.cost ? fmtRp(it.cost) : '<span class="na">-</span>'}</td>
      <td style="white-space:nowrap"><div class="sub">Start: ${fmtDate(it.start)}</div><div class="${due}">Due: ${fmtDate(it.end)}</div></td>
      <td class="c">${statusBadge(it)}</td>
      <td class="c" data-stop>${docLink(it.detailUrl)}</td>
      <td><div class="clamp" style="font-size:12.5px">${esc(it.nextAction || it.deskripsi || "-")}</div></td>
      <td class="c" data-stop><button class="btn btn--sm btn--icon" type="button" data-action="open-project" data-id="${esc(it.id)}" aria-label="Lihat detail ${esc(it.namaTask)}">${icon("maximize-2", 14)}</button></td>
    </tr>`;
  }).join("") : `<tr><td class="empty" colspan="11">Tidak ada data yang cocok dengan filter.</td></tr>`);
}

/* ───────────── Anggaran ───────────── */
export function renderAnggaran(S) {
  const a = S.data.anggaran;
  const t26 = a.reduce((s, i) => s + i.cost2026, 0);
  const t27 = a.reduce((s, i) => s + i.forecast2027, 0);
  const o26 = a.filter((i) => i.anggaran === "OPEX").reduce((s, i) => s + i.cost2026, 0);
  const c26 = a.filter((i) => i.anggaran === "CAPEX").reduce((s, i) => s + i.cost2026, 0);
  const growth = t26 > 0 ? ((t27 - t26) / t26) * 100 : null;

  text("kpiAng2026", fmtRp(t26));
  text("kpiAngSplit", `OPEX ${fmtShort(o26)} dan CAPEX ${fmtShort(c26)}`);
  text("kpiAng2027", fmtRp(t27));
  text("kpiAngGrowth", growth === null ? "Baru" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`);
  text("kpiAngDiff", `Selisih: ${t27 - t26 >= 0 ? "+" : "-"}${fmtRp(Math.abs(t27 - t26))}`);
  countUp($("#kpiAngItems"), a.length, fmtInt);

  const f = S.f.anggaran; const q = norm(f.q);
  const list = a.filter((i) => hit(q, i.produk, i.mataAnggaran) && (f.type === "ALL" || i.anggaran === f.type));
  set("anggaranBody", list.length ? list.map((i) => {
    const g = i.cost2026 > 0 ? ((i.forecast2027 - i.cost2026) / i.cost2026) * 100 : null;
    const gCell = g === null
      ? (i.forecast2027 > 0 ? `<span class="badge badge--gold" title="Belum ada biaya 2026">Baru</span>` : `<span class="na">-</span>`)
      : `<span class="num" style="color:${g >= 0 ? "var(--violet)" : "var(--ok)"}">${g >= 0 ? "+" : ""}${g.toFixed(0)}%</span>`;
    return `<tr>
      <td class="c mono muted">${esc(i.no)}</td>
      <td class="title">${esc(i.produk)}</td>
      <td class="c"><span class="badge ${i.anggaran === "CAPEX" ? "badge--info" : "badge--ok"}">${esc(i.anggaran)}</span></td>
      <td class="c mono muted">${esc(i.mataAnggaran)}</td>
      <td class="r num ${i.cost2026 ? "money" : ""}">${i.cost2026 ? fmtRp(i.cost2026) : '<span class="na">Rp 0</span>'}</td>
      <td class="r num" style="color:var(--info)">${fmtRp(i.forecast2027)}</td>
      <td class="r">${gCell}</td>
    </tr>`;
  }).join("") : `<tr><td class="empty" colspan="7">Tidak ada item anggaran yang cocok.</td></tr>`);
}

/* ───────────── Request Datamart ───────────── */
const DM_BADGE = { done: ["ok", "Done"], progress: ["info", "On going"], rejected: ["danger", "Rejected"] };
export function renderDatamart(S) {
  const d = S.data.datamart;
  const n = (k) => d.filter((i) => i.state === k).length;
  countUp($("#kpiDmTotal"), d.length, fmtInt); countUp($("#kpiDmDone"), n("done"), fmtInt);
  countUp($("#kpiDmProgress"), n("progress"), fmtInt); countUp($("#kpiDmRejected"), n("rejected"), fmtInt);

  const f = S.f.datamart; const q = norm(f.q);
  const list = d.filter((i) => hit(q, i.idTiket, i.nama, i.output, i.statusTable, i.keterangan) && (f.state === "ALL" || i.state === f.state));
  set("datamartBody", list.length ? list.map((i) => {
    const [tone, label] = DM_BADGE[i.state];
    return `<tr>
      <td class="c mono muted">${esc(i.no)}</td>
      <td class="c"><span class="tag mono">${esc(i.idTiket)}</span></td>
      <td><div class="title">${esc(i.nama)}</div><div class="sub" style="color:var(--ok)">Output: ${esc(i.output)}</div></td>
      <td class="c">${i.linkTiket ? `<a class="btn btn--sm" href="${safeHref(i.linkTiket)}" target="_blank" rel="noopener noreferrer">${icon("external-link", 13)}Jira</a>` : '<span class="na">-</span>'}</td>
      <td>${i.hasTable
        ? `<div class="tblid"><span>${esc(i.statusTable)}</span><button class="btn btn--sm btn--icon" type="button" data-action="copy" data-text="${esc(i.statusTable)}" data-msg="Table ID tersalin" aria-label="Salin table ID">${icon("copy", 13)}</button></div>`
        : `<span class="badge badge--${i.state === "rejected" ? "danger" : "warn"}">${esc(i.statusTable || "Belum ada table")}</span>`}</td>
      <td><span class="badge badge--${tone}" style="margin-bottom:4px">${label}</span><div class="sub">${esc(i.keterangan || "-")}</div></td>
    </tr>`;
  }).join("") : `<tr><td class="empty" colspan="6">Tidak ada tiket yang cocok.</td></tr>`);

  // sinkronkan tombol segmented
}

/* ───────────── Data Audit Promo ───────────── */
export function renderAudit(S) {
  const a = S.data.auditPromo;
  const codes = new Set(a.flatMap((i) => i.kodePromo.map((c) => c.toLowerCase())));
  const withBudget = a.filter((i) => i.budgeting > 0).length;
  text("auditSummary", `${a.length} promo, ${codes.size} kode unik, ${withBudget} dengan budgeting terisi.`);
  const q = norm(S.f.audit.q);
  const list = a.filter((i) => hit(q, i.no, i.namaPromo, i.deskripsi, i.kodePromo.join(" ")));
  text("auditCount", `Menampilkan ${list.length} dari ${a.length} item promo`);
  set("auditBody", list.length ? list.map((i) => `<tr>
    <td class="c mono muted">${esc(i.no)}</td>
    <td class="title" style="min-width:170px">${esc(i.namaPromo)}</td>
    <td><div class="clamp" style="font-size:12.5px;color:var(--ink-2);-webkit-line-clamp:3">${esc(i.deskripsi)}</div></td>
    <td><div class="codes">${i.kodePromo.map((c) => `<span class="code">${esc(c)}</span>`).join("") || '<span class="na">-</span>'}</div></td>
    <td class="c">${docLink(i.linkDokumen, "Buka Drive")}</td>
    <td class="r num">${i.budgeting ? fmtRp(i.budgeting) : '<span class="na">Belum diisi</span>'}</td>
    <td class="r">${i.budgeting
      ? `<div class="num money">${fmtRp(i.penyerapan)}</div><div style="margin-top:4px"><span class="bar-mini"><i style="width:${Math.min(i.persen, 100)}%"></i></span> <span class="sub">${i.persen}%</span></div>`
      : '<span class="na">-</span>'}</td>
    <td class="c"><button class="btn btn--sm btn--icon" type="button" data-action="open-promo" data-no="${esc(i.no)}" aria-label="Detail ${esc(i.namaPromo)}">${icon("maximize-2", 14)}</button></td>
  </tr>`).join("") : `<tr><td class="empty" colspan="8">Tidak ada promo yang cocok${q ? ` dengan "${esc(S.f.audit.q)}"` : ""}.</td></tr>`);
}

/* ───────────── Dialog ───────────── */
const kv = (dt, dd, cls = "") => `<div class="${cls}"><dt>${dt}</dt><dd>${dd}</dd></div>`;

export function projectDialog(it) {
  const t = toneOf(it.priority);
  const quota = it.kuota
    ? kv("Kuota dan pemakaian", `${fmtInt(it.totalPemakaian || 0)} dari ${fmtInt(it.kuota)} (${Math.round(it.utilisasi ?? 0)}%)`) : "";
  return `<div class="dialog__body">
    <div class="dialog__top">${rkfBadge(it)}<span class="badge">${esc(it.tipePengadaan)}, ${esc(it.tipeProject)}</span>${statusBadge(it)}<span class="badge badge--gold">${esc(it.tahun || "-")}</span></div>
    <div><h2 id="pdTitle">${esc(it.namaTask)}</h2><p class="muted" style="margin-top:4px">Proker: ${esc(it.namaProker)}</p></div>
    <dl class="kv">
      ${kv("Output project", esc(it.outputProject))}
      ${kv("Vendor / mitra", esc(it.vendor))}
      ${kv("PIC unit kerja", esc(it.pic))}
      ${kv("Nilai kontrak", it.cost ? fmtRp(it.cost) : "-", "money-cell")}
      ${kv("Jenis anggaran", esc(it.jenisAnggaran || "-"))}
      ${kv("Start kontrak", fmtDate(it.start))}
      ${kv("Jatuh tempo (End Kontrak)", `${fmtDate(it.end)} <span class="badge badge--${t === "muted" ? "" : t}" style="margin-left:6px">${esc(countdownText(it))}</span>`)}
      ${it.endPrev ? kv("End kontrak sebelumnya", fmtDate(it.endPrev)) : ""}
      ${it.quartalExpected ? kv("Quartal expected", esc(it.quartalExpected)) : ""}
      ${it.expectedAdm ? kv("Expected administrasi", esc(it.expectedAdm)) : ""}
      ${it.statusBilling ? kv("Status billing", esc(it.statusBilling)) : ""}
      ${quota}${it.estimasiKuotaHabis ? kv("Estimasi kuota habis", esc(it.estimasiKuotaHabis)) : ""}
    </dl>
    <section><h3>Deskripsi dan progres</h3><div class="note">${esc(it.deskripsi || "-")}</div></section>
    <section><h3>Tindakan selanjutnya</h3><div class="note">${esc(it.nextAction || "-")}</div></section>
    <section><h3>Dokumen dan lampiran</h3>
      ${it.detailUrl
        ? `<div class="linkbox"><code>${esc(it.detailUrl)}</code>
            <button class="btn btn--sm" type="button" data-action="copy" data-text="${esc(it.detailUrl)}" data-msg="Link tersalin">${icon("copy", 14)}Salin URL</button>
            <a class="btn btn--sm btn--gold" href="${safeHref(it.detailUrl)}" target="_blank" rel="noopener noreferrer">${icon("external-link", 14)}Buka link</a></div>`
        : `<div class="note muted">Belum ada link dokumen di kolom Detail.</div>`}
    </section>
  </div>`;
}

export function promoDialog(p) {
  const sisa = `Sisa: ${fmtRp(p.sisa)}`;
  return `<div class="dialog__body">
    <div class="dialog__top"><span class="badge badge--violet">Promo no. ${esc(p.no)}</span></div>
    <h2 id="prTitle">${esc(p.namaPromo)}</h2>
    <section><h3>Deskripsi promo</h3><div class="note">${esc(p.deskripsi || "-")}</div></section>
    <section><h3>Kode promo (${p.kodePromo.length})</h3><div class="codes">${p.kodePromo.map((c) => `<span class="code">${esc(c)}</span>`).join("") || '<span class="na">-</span>'}</div></section>
    <dl class="kv">
      ${kv("Budgeting", p.budgeting ? fmtRp(p.budgeting) : "Belum diisi")}
      ${kv("Penyerapan budgeting", p.budgeting ? fmtRp(p.penyerapan) : "Belum diisi")}
    </dl>
    ${p.budgeting ? `<section><h3>Tingkat penyerapan: ${p.persen}%</h3><div class="big-meter"><i style="width:${Math.min(p.persen, 100)}%"></i></div>
      <div class="meter__labels"><span>Terpakai: ${fmtRp(p.penyerapan)}</span><span>${sisa}</span></div></section>` : ""}
    <section><h3>Link dokumen</h3>
      ${p.linkDokumen
        ? `<div class="linkbox"><code>${esc(p.linkDokumen)}</code>
            <button class="btn btn--sm" type="button" data-action="copy" data-text="${esc(p.linkDokumen)}" data-msg="Link tersalin">${icon("copy", 14)}Salin URL</button>
            <a class="btn btn--sm btn--gold" href="${safeHref(p.linkDokumen)}" target="_blank" rel="noopener noreferrer">${icon("folder-open", 14)}Buka Drive</a></div>`
        : `<div class="note muted">Belum ada link dokumen.</div>`}
    </section>
  </div>`;
}

/* ───────────── AI Insights (dihitung dari aturan, bukan model) ───────────── */
export function insightsDialog(S) {
  const it = S.items; const d = S.data;
  const total = it.reduce((s, i) => s + i.cost, 0);
  const list = (arr, tone, ic) => arr.length
    ? `<ul>${arr.map((t) => `<li class="tone-${tone}">${icon(ic, 14)}<span style="color:var(--ink)">${t}</span></li>`).join("")}</ul>`
    : "";

  const risk = it.filter((i) => ["overdue", "urgent", "upcoming"].includes(i.priority)).sort(byDeadline).map((i) =>
    `<b>${esc(i.vendor === "In-House" ? i.namaTask : i.vendor)}</b>${i.vendor === "In-House" ? "" : ": " + esc(i.namaTask)}. ${esc(countdownText(i))} (${fmtDate(i.end)}). ${i.priority === "upcoming" ? "Siapkan perpanjangan atau adendum." : "Segera tindak lanjuti SPK atau adendum."}`);

  const noEnd = it.filter((i) => i.priority === "nodate" && i.cost > 0);
  const yearMismatch = it.filter((i) => { const y = (i.jenisAnggaran.match(/20\d\d/) || [])[0]; return y && i.tahun && y !== i.tahun; });
  const quotaMissing = it.filter((i) => !i.kuota).length === it.length;
  const noBudgetPromo = d.auditPromo.filter((p) => !p.budgeting).length;
  const newBudget = d.anggaran.filter((a) => a.cost2026 === 0 && a.forecast2027 > 0);
  const quality = [
    noEnd.length ? `<b>${noEnd.length} kontrak bernilai</b> belum punya End Kontrak (${noEnd.slice(0, 3).map((i) => esc(shortVendor(i.vendor))).join(", ")}${noEnd.length > 3 ? ", dan lainnya" : ""}), sehingga tenggatnya tidak terpantau.` : "",
    yearMismatch.length ? `${yearMismatch.length} item punya tahun yang berbeda dengan Jenis Anggaran (${yearMismatch.map((i) => esc(shortVendor(i.vendor))).join(", ")}). Mohon dicek.` : "",
    quotaMissing ? "Kolom Kuota dan Total Pemakaian masih kosong, jadi Quota Tracker belum menampilkan apa pun." : "",
    noBudgetPromo ? `${noBudgetPromo} dari ${d.auditPromo.length} promo belum mengisi Budgeting dan Penyerapan Budgeting.` : "",
    newBudget.length ? `${newBudget.length} item anggaran belum punya cost 2026 tetapi sudah ada forecast 2027.` : "",
  ].filter(Boolean);

  const dm = (k) => d.datamart.filter((x) => x.state === k);
  const dmOpen = [...dm("progress"), ...dm("rejected")].map((x) =>
    `<b>${esc(x.idTiket)}</b> ${esc(x.nama)}: ${x.state === "rejected" ? "ditolak, " + esc(x.keterangan) : "masih " + esc(x.keterangan || "diproses")}.`);

  return `<div class="dialog__body">
    <div class="dialog__top"><span class="badge badge--gold">${icon("sparkles", 13)}Ringkasan otomatis</span></div>
    <h2 id="inTitle">Executive insights</h2>
    <p>Dashboard memantau <b>${it.length} item pengadaan</b> dengan total komitmen <b style="color:var(--gold)">${fmtRp(total)}</b>,
      ${d.anggaran.length} pos anggaran, ${d.datamart.length} tiket request datamart, dan ${d.auditPromo.length} program promo.</p>
    <div class="insight-grid">
      <section class="insight"><h3>Jatuh tempo dan risiko</h3>
        ${risk.length ? list(risk, "warn", "triangle-alert") : `<p class="tone-ok" style="margin-top:6px">Tidak ada kontrak yang jatuh tempo dalam 60 hari ke depan.</p>`}</section>
      <section class="insight"><h3>Request datamart</h3>
        <p class="muted">${dm("done").length} selesai, ${dm("progress").length} berjalan, ${dm("rejected").length} ditolak.</p>
        ${list(dmOpen, "info", "hourglass")}</section>
      <section class="insight insight--wide"><h3>Perlu dilengkapi di Google Sheet</h3>
        ${quality.length ? list(quality, "warn", "circle-alert") : `<p class="tone-ok" style="margin-top:6px">Data sheet sudah lengkap.</p>`}</section>
    </div>
    <p class="muted" style="font-size:12.5px">Dihitung otomatis dari data sheet dan tanggal hari ini. Tidak memakai model AI, jadi angkanya selalu bisa ditelusuri ke sheet.</p>
  </div>`;
}

/* ───────────── Isi dropdown dari data ───────────── */
export function populateSelects(S) {
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const statuses = uniq(S.items.map((i) => i.status.trim()));
  const years = uniq(S.items.map((i) => i.tahun)).sort().reverse();
  const tipes = uniq(S.items.map((i) => i.tipePengadaan));
  const fill = (id, first, opts) => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value;
    el.innerHTML = `<option value="ALL">${first}</option>` + opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    el.value = [...el.options].some((o) => o.value === cur) ? cur : "ALL";
  };
  const withCount = statuses.map((s) => [s, `${s} (${S.items.filter((i) => norm(i.status) === norm(s)).length})`]);
  fill("selPayStatus", `Semua status (${S.items.length})`, withCount);
  fill("selQuotaStatus", "Semua status", statuses.map((s) => [s, s]));
  fill("selLedgerStatus", "Semua status", statuses.map((s) => [s, s]));
  fill("selQuotaYear", "Semua tahun", years.map((y) => [y, `Tahun ${y}`]));
  fill("selLedgerYear", "Semua tahun", years.map((y) => [y, `Tahun ${y}`]));
  fill("selQuotaTipe", "Semua tipe", tipes.map((t) => [t, t]));
}
