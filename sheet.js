"use strict";
/**
 * api/_lib/sheet.js
 * Mengambil 4 tab Google Sheet (CSV), mem-parse dengan benar (RFC 4180),
 * lalu menormalkan jadi JSON bersih untuk frontend.
 * Dipakai oleh api/sheet.js (Vercel) dan dev/server.js (lokal).
 */

/* ───────────── CSV parser (mendukung kutip, koma, & baris baru dalam sel) ───────────── */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
}

/* ───────────── Helper pembersih ───────────── */
const clean = (v) => (v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim());
const cleanKeepLines = (v) => (v === null || v === undefined ? "" : String(v).trim());

function parseNum(val) {
  let s = clean(val).replace(/rp\.?\s?/gi, "").replace(/[^\d.,-]/g, "");
  if (!s || s === "-") return 0;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // pemisah desimal = yang paling akhir muncul
    if (s.lastIndexOf(".") > s.lastIndexOf(",")) s = s.replace(/,/g, "");
    else s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot) {
    s = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function safeUrl(val) {
  const s = clean(val);
  if (!s) return "";
  const m = s.match(/HYPERLINK\("([^"]+)"/i) || s.match(/(https?:\/\/[^\s",)]+)/i);
  const url = m ? m[1] : "";
  return /^https?:\/\//i.test(url) ? url : "";
}

/* ───────────── Tanggal: tahan beda locale (M/D/Y, D/M/Y, ISO, "30 Nov 2026") ───────────── */
const MONTHS = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10, nov: 11, november: 11, des: 12, dec: 12, desember: 12, december: 12,
};

function detectDateOrder(values) {
  for (const v of values) {
    const m = clean(v).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    if (!m) continue;
    if (+m[1] > 12) return "DMY";
    if (+m[2] > 12) return "MDY";
  }
  return "MDY"; // sheet ini menghasilkan M/D/YYYY
}

function toISO(y, m, d) {
  y = +y; m = +m; d = +d;
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

function parseDate(val, order) {
  const s = clean(val);
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return toISO(m[1], m[2], m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return order === "DMY" ? toISO(m[3], m[2], m[1]) : toISO(m[3], m[1], m[2]);
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) return toISO(m[3], MONTHS[m[2].toLowerCase()], m[1]);
  return null;
}

/* ───────────── Pencari kolom berdasarkan header (fallback ke posisi) ───────────── */
function makeFinder(headerRow) {
  const headers = headerRow.map((h) => clean(h).toLowerCase());
  return (patterns, fallback = -1, { exact = false } = {}) => {
    for (const p of patterns) {
      const i = headers.findIndex((h) => h === p || (!exact && h.startsWith(p)));
      if (i !== -1) return i;
    }
    if (!exact) {
      for (const p of patterns) {
        const i = headers.findIndex((h) => h.includes(p));
        if (i !== -1) return i;
      }
    }
    return fallback;
  };
}

/* ───────────── Normalisasi per tab ───────────── */
function normalizeProcurement(rows) {
  if (!rows || rows.length < 2) return [];
  const find = makeFinder(rows[0]);
  const body = rows.slice(1);

  const c = {
    id: find(["id"], 0, { exact: true }),
    proker: find(["nama project", "proker"], 1),
    task: find(["nama task", "task"], 2),
    tahun: find(["tahun", "year"], 3),
    rkf: find(["rkf"], 4, { exact: true }),
    tipePengadaan: find(["tipe pengadaan"], 5),
    tipeProject: find(["tipe project"], 6),
    vendor: find(["vendor"], 7, { exact: true }),
    pic: find(["pic"], 8, { exact: true }),
    jenisAnggaran: find(["jenis anggaran"], 9),
    cost: find(["cost", "biaya", "nilai"], 10, { exact: true }),
    kuota: find(["kuota"], 11, { exact: true }),
    pemakaian: find(["total pemakaian", "pemakaian"], 12),
    utilisasi: find(["utlisisasi", "utilisasi"], 13),
    statusBilling: find(["status billing"], 14),
    estimasiHabis: find(["estimasi kuota"], 15),
    start: find(["start kontrak", "mulai"], 16),
    end: find(["end kontrak"], 17, { exact: true }),
    endPrev: find(["end kontrak sebelumnya"], 18),
    status: find(["status"], 19, { exact: true }),
    quartal: find(["quartal", "kuartal"], 20),
    expectedAdm: find(["expected adm"], 21),
    deskripsi: find(["deskripsi", "keterangan"], 22),
    nextAction: find(["next action", "tindakan"], 23),
    detail: find(["detail", "link dokumen"], 24),
    output: find(["output project", "output"], 25),
  };

  const order = detectDateOrder(body.flatMap((r) => [r[c.start], r[c.end], r[c.endPrev]]));
  const cell = (r, i) => (i >= 0 ? r[i] : "");

  const items = [];
  body.forEach((r, idx) => {
    const proker = clean(cell(r, c.proker));
    const task = clean(cell(r, c.task));
    const vendorRaw = clean(cell(r, c.vendor));
    // Filter SEBELUM mengisi default, agar baris kosong tidak jadi item hantu.
    if (!proker && !task) return;
    if (/^total\b/i.test(task) || /^total\b/i.test(proker)) return;

    const kuotaRaw = clean(cell(r, c.kuota));
    const pakaiRaw = clean(cell(r, c.pemakaian));
    const kuota = kuotaRaw ? parseNum(kuotaRaw) : null;
    const pemakaian = pakaiRaw ? parseNum(pakaiRaw) : null;
    let utilisasi = null;
    const utRaw = clean(cell(r, c.utilisasi));
    if (utRaw) utilisasi = parseNum(utRaw.replace("%", ""));
    else if (kuota && pemakaian != null) utilisasi = Math.round((pemakaian / kuota) * 100);

    const rkfRaw = clean(cell(r, c.rkf)).toUpperCase();
    const rkf = rkfRaw && !rkfRaw.includes("NON") && (rkfRaw.includes("RKF") || ["YA", "YES", "1"].includes(rkfRaw))
      ? "RKF" : "Non-RKF";

    items.push({
      id: clean(cell(r, c.id)) || String(idx + 1),
      tahun: clean(cell(r, c.tahun)) || "",
      namaProker: proker || task,
      namaTask: task || proker,
      rkf,
      tipePengadaan: clean(cell(r, c.tipePengadaan)) || "-",
      tipeProject: clean(cell(r, c.tipeProject)) || "-",
      vendor: vendorRaw && vendorRaw !== "-" ? vendorRaw : "In-House",
      pic: clean(cell(r, c.pic)) || "-",
      jenisAnggaran: clean(cell(r, c.jenisAnggaran)),
      cost: parseNum(cell(r, c.cost)),
      kuota,
      totalPemakaian: pemakaian,
      utilisasi,
      statusBilling: clean(cell(r, c.statusBilling)),
      estimasiKuotaHabis: clean(cell(r, c.estimasiHabis)),
      start: parseDate(cell(r, c.start), order),
      end: parseDate(cell(r, c.end), order),
      endPrev: parseDate(cell(r, c.endPrev), order),
      status: clean(cell(r, c.status)) || "On going",
      quartalExpected: clean(cell(r, c.quartal)),
      expectedAdm: clean(cell(r, c.expectedAdm)),
      deskripsi: cleanKeepLines(cell(r, c.deskripsi)),
      nextAction: cleanKeepLines(cell(r, c.nextAction)),
      detailUrl: safeUrl(cell(r, c.detail)),
      outputProject: clean(cell(r, c.output)) || "-",
    });
  });
  return items;
}

function normalizeAnggaran(rows) {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).map((r, i) => ({
    no: clean(r[0]) || String(i + 1),
    produk: clean(r[1]),
    anggaran: clean(r[2]).toUpperCase() || "OPEX",
    mataAnggaran: clean(r[3]) || "-",
    cost2026: parseNum(r[4]),
    forecast2027: parseNum(r[5]),
  })).filter((a) => a.produk && !/^total\b/i.test(a.produk));
}

function classifyDatamart(statusTable, keterangan) {
  const t = `${statusTable} ${keterangan}`.toLowerCase();
  if (t.includes("reject")) return "rejected";
  if (t.includes("done") || t.includes("pgd-prd")) return "done";
  return "progress";
}

function normalizeDatamart(rows) {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).map((r, i) => {
    const statusTable = clean(r[5]);
    const keterangan = clean(r[6]);
    return {
      no: clean(r[0]) || String(i + 1),
      idTiket: clean(r[1]) || `DM-${i + 1}`,
      nama: clean(r[2]),
      output: clean(r[3]) || "-",
      linkTiket: safeUrl(r[4]),
      statusTable,
      hasTable: /pgd-prd|\./.test(statusTable) && !/reject/i.test(statusTable),
      keterangan,
      state: classifyDatamart(statusTable, keterangan),
    };
  }).filter((d) => d.nama);
}

function normalizeAudit(rows) {
  if (!rows || rows.length < 2) return [];
  const find = makeFinder(rows[0]);
  const c = {
    no: find(["no"], 0, { exact: true }),
    nama: find(["nama promo", "promo"], 1),
    deskripsi: find(["deskripsi", "keterangan"], 2),
    kode: find(["kode promo", "kode"], 3),
    link: find(["link dokumen", "dokumen", "link"], 4),
    budget: find(["budgeting", "budget"], 5, { exact: true }),
    serap: find(["penyerapan"], 6),
  };
  return rows.slice(1).map((r, i) => {
    const budgeting = parseNum(r[c.budget]);
    const penyerapan = parseNum(r[c.serap]);
    const kode = [...new Set(clean(r[c.kode]).split(",").map((x) => x.trim()).filter(Boolean))];
    return {
      no: clean(r[c.no]) || String(i + 1),
      namaPromo: clean(r[c.nama]),
      deskripsi: cleanKeepLines(r[c.deskripsi]),
      kodePromo: kode,
      linkDokumen: safeUrl(r[c.link]),
      budgeting,
      penyerapan,
      persen: budgeting > 0 ? Math.round((penyerapan / budgeting) * 100) : 0,
      sisa: Math.max(0, budgeting - penyerapan),
    };
  }).filter((a) => a.namaPromo);
}

function normalizeAll(m) {
  return {
    procurement: normalizeProcurement(m.procurement),
    anggaran: normalizeAnggaran(m.anggaran),
    datamart: normalizeDatamart(m.datamart),
    auditPromo: normalizeAudit(m.audit),
  };
}

/* ───────────── Pengambilan dari Google Sheet ───────────── */
async function fetchTab(sheetId, tabName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&headers=1` +
    (tabName ? `&sheet=${encodeURIComponent(tabName)}` : "");
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "dashboard-tbo/1.0" }, signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`Google Sheet menolak permintaan (HTTP ${res.status}) untuk tab "${tabName}".`);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error(
      'Google Sheet meminta login. Atur Share sheet ke "Anyone with the link: Viewer", lalu coba lagi.'
    );
  }
  return parseCSV(text);
}

async function loadAll(env = process.env) {
  const sheetId = env.SHEET_ID || "1MgeRBXOfYrK3aN3sMhodMwxmJjX7OOlRqNYOZ-H3gpA";
  if (!sheetId) throw new Error("Environment variable SHEET_ID belum diisi di Vercel.");
  const tabs = {
    procurement: env.TAB_PROCUREMENT || "DATA_PENGADAAN",
    anggaran: env.TAB_ANGGARAN || "Anggaran",
    datamart: env.TAB_DATAMART || "Request Datamart",
    audit: env.TAB_AUDIT || "Data Audit Promo",
  };
  const entries = await Promise.all(
    Object.entries(tabs).map(async ([key, name]) => {
      try { return [key, await fetchTab(sheetId, name), null]; }
      catch (e) { return [key, [], e.message]; }
    })
  );
  const matrices = {};
  const warnings = [];
  for (const [k, rows, err] of entries) { matrices[k] = rows; if (err) warnings.push(err); }
  // Tab utama wajib ada; tab lain boleh kosong.
  if (!matrices.procurement.length && warnings.length) throw new Error(warnings[0]);
  return { ...normalizeAll(matrices), warnings, fetchedAt: new Date().toISOString() };
}

module.exports = { parseCSV, parseNum, parseDate, detectDateOrder, normalizeAll, loadAll };
