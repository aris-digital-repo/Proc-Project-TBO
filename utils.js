// Utilitas umum: escape HTML, format angka/tanggal, klasifikasi tenggat.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
export const safeHref = (u) => (/^https?:\/\//i.test(u || "") ? esc(u) : "");

/* ───── Angka ───── */
const rpFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const fmtRp = (n) => (n ? rpFmt.format(n).replace(/ /g, " ") : "Rp 0");

export function fmtShort(n) {
  const v = Math.abs(n);
  const f = (x, d = 2) => x.toLocaleString("id-ID", { maximumFractionDigits: d });
  if (v >= 1e12) return `Rp ${f(n / 1e12)} T`;
  if (v >= 1e9) return `Rp ${f(n / 1e9)} M`;
  if (v >= 1e6) return `Rp ${f(n / 1e6, 1)} Jt`;
  return fmtRp(n);
}
export const fmtInt = (n) => Number(n || 0).toLocaleString("id-ID");

/* ───── Tanggal (semua dihitung di zona waktu lokal browser) ───── */
const DAY = 86400000;
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateFmtShort = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

export const isoToMs = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export function todayMs() {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}
export const fmtDate = (iso) => (iso ? dateFmt.format(isoToMs(iso)) : "-");
export const fmtDateShort = (ms) => dateFmtShort.format(ms);
export const diffDays = (a, b) => Math.round((a - b) / DAY);
export { DAY };

/* ───── Status & tenggat ───── */
export const isDone = (s) => /done|selesai/i.test(s || "");

export function workState(status) {
  const s = (status || "").toLowerCase();
  if (/done|selesai/.test(s)) return { key: "done", tone: "ok" };
  if (/hold|not started|belum/.test(s)) return { key: "hold", tone: "warn" };
  if (/adendum|tender/.test(s)) return { key: "process", tone: "violet" };
  return { key: "ongoing", tone: "info" };
}

export const PRIORITY = {
  overdue:  { label: "Terlambat",       tone: "danger", rank: 0 },
  urgent:   { label: "Urgent",          tone: "danger", rank: 1 },
  upcoming: { label: "Segera",          tone: "warn",   rank: 2 },
  safe:     { label: "Aman",            tone: "ok",     rank: 3 },
  nodate:   { label: "End date kosong", tone: "muted",  rank: 5 },
  ended:    { label: "Berakhir",        tone: "muted",  rank: 6 },
};

/**
 * Menambahkan hasil hitung tenggat. Status pekerjaan (Done/On going) dipisah dari
 * status kontrak: kontrak berstatus Done tetap dihitung jatuh temponya selama
 * End Kontrak masih di depan, karena kontrak masih berjalan.
 */
export function enrich(item, today) {
  const start = isoToMs(item.start);
  const end = isoToMs(item.end);
  let days = null;
  let priority = "nodate";
  if (end !== null) {
    days = diffDays(end, today);
    if (days < 0) priority = isDone(item.status) ? "ended" : "overdue";
    else if (days <= 30) priority = "urgent";
    else if (days <= 60) priority = "upcoming";
    else priority = "safe";
  }
  let elapsed = null;
  if (start !== null && end !== null && end > start) {
    elapsed = Math.max(0, Math.min(100, ((today - start) / (end - start)) * 100));
  }
  return { ...item, days, priority, elapsed, work: workState(item.status) };
}

export function countdownText(it) {
  switch (it.priority) {
    case "overdue": return `Terlambat ${Math.abs(it.days)} hari`;
    case "ended": return "Berakhir";
    case "nodate": return "End date kosong";
    default: return it.days === 0 ? "Berakhir hari ini" : `${it.days} hari lagi`;
  }
}

/* ───── Lain-lain ───── */
export const debounce = (fn, ms = 120) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function countUp(el, to, format, ms = 800) {
  if (!el) return;
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (prefersReducedMotion() || from === to) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = format(Math.round(from + (to - from) * e));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function shortVendor(v) {
  const s = String(v || "").split(" / ")[0].trim();
  return s.length > 22 ? s.slice(0, 21) + "…" : s;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/* ───── CSV aman (BOM untuk Excel, cegah formula injection) ───── */
const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};
export function downloadCSV(filename, headers, rows) {
  const body = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
