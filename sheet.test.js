"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCSV, parseNum, parseDate, normalizeAll } = require("../api/_lib/sheet");
const fixture = require("../dev/fixture");

const toCSV = (m) => m.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
const load = () => {
  const m = {};
  for (const k of Object.keys(fixture)) m[k] = parseCSV(toCSV(fixture[k]));
  return normalizeAll(m);
};

test("parseNum membaca format angka sheet", () => {
  assert.equal(parseNum("3,650,000,000.00"), 3650000000);
  assert.equal(parseNum("Rp1,000,000,000"), 1e9);
  assert.equal(parseNum("Rp0"), 0);
  assert.equal(parseNum("1.000.000"), 1000000);
  assert.equal(parseNum(""), 0);
});

test("parseDate membaca M/D/YYYY dan teks Indonesia", () => {
  assert.equal(parseDate("11/30/2026", "MDY"), "2026-11-30");
  assert.equal(parseDate("5/4/2026", "MDY"), "2026-05-04");
  assert.equal(parseDate("30/11/2026", "DMY"), "2026-11-30");
  assert.equal(parseDate("30 Nov 2026"), "2026-11-30");
  assert.equal(parseDate("31/02/2026", "DMY"), null);
  assert.equal(parseDate(""), null);
});

test("parseCSV menangani kutip, koma, dan baris baru dalam sel", () => {
  const rows = parseCSV('a,"b, c","baris1\nbaris2","x ""kutip"""\r\n1,2,3,4\r\n,,,\r\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ["a", "b, c", "baris1\nbaris2", 'x "kutip"']);
});

test("normalisasi data fixture", () => {
  const d = load();
  assert.equal(d.procurement.length, 12);
  assert.equal(d.procurement.reduce((s, i) => s + i.cost, 0), 25836285235);
  assert.equal(d.procurement.filter((i) => i.vendor === "In-House").length, 5);
  assert.equal(d.procurement.find((i) => i.vendor === "Moengage").end, "2026-11-30");
  assert.equal(d.anggaran.length, 12);
  assert.equal(d.datamart.filter((i) => i.state === "done").length, 8);
  assert.equal(d.datamart.filter((i) => i.state === "progress").length, 2);
  assert.equal(d.datamart.filter((i) => i.state === "rejected").length, 1);
  assert.equal(d.auditPromo.length, 12);
});

test("link berbahaya dibuang, hanya http(s) yang lolos", () => {
  const rows = parseCSV("Nama Promo,Link Dokumen\nA,javascript:alert(1)\nB,https://drive.google.com/x");
  const d = normalizeAll({ audit: [["No", "Nama promo", "Deskripsi", "Kode promo", "Link dokumen", "Budgeting", "Penyerapan"], ["1", "A", "", "X", "javascript:alert(1)", "", ""], ["2", "B", "", "Y", "https://drive.google.com/x", "", ""]] });
  assert.equal(d.auditPromo[0].linkDokumen, "");
  assert.equal(d.auditPromo[1].linkDokumen, "https://drive.google.com/x");
  assert.equal(rows.length, 3);
});
