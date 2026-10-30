"use strict";
// Data uji lokal (salinan struktur sheet asli). Folder dev/ di-ignore oleh git.
const H = ["ID","Nama Project / Proker","Nama Task","Tahun","RKF","Tipe Pengadaan","Tipe Project","Vendor","PIC","Jenis Anggaran","Cost","Kuota","Total Pemakaian","Utlisisasi","Status Billing","Estimasi Kuota Habis","Start Kontrak","End Kontrak","End kontrak sebelumnya","Status","Quartal Expected","Expected Adm","Deskripsi","Next Action","Detail","Output Project"];
const d = (id) => `https://drive.google.com/drive/folders/${id}`;
const P = (id, prok, task, thn, rkf, tp, tpr, v, pic, ja, cost, start, end, st, desk, next, url, out) =>
  [id, prok, task, thn, rkf, tp, tpr, v, pic, ja, cost, "", "", "", "", "", start, end, "", st, "", "", desk, next, url, out];

const E = "Enhancing User Engagement and Satisfaction pada aplikasi Tring (Android & IOS)";
const M = "Monitoring dan evaluasi Produk Tring";
const G = "Tring! Growth Engine: Program Transformasi Engagement Digital";

const procurement = [
  H,
  P(1, E, "Enhancing User Engagement and Satisfaction pada Aplikasi Tring!", 2026, "RKF", "Eksternal", "Vendor", "I3 / PT. Inovasi Informatika Indonesia", "Pengadaan & Logistic ", "OPEX 2026", "3,650,000,000.00", "1/1/2026", "", "Done", "Dokuem SPK", "Dokumen SPK", d("1XGl33bnyyfIB0aF88kQzA5lZUCmXu_8w?usp=drive_link"), "Dokumen SPK"),
  P(2, "MMP pada Tring! (pooling)", "MMP pada Aplikasi Tring!", 2026, "RKF", "Eksternal", "Vendor ", "Appsflyer / PT. Magnus Digital Indonesia", "SAPTI", "OPEX 2026", "9,825,000,000.00", "1/1/2026", "", "Done", "Dokumen SPK", "Dokumen SPK", d("1rERB3QbR0StakFoGTkE2kkpILCzf4DGy?usp=drive_link"), "Dokumen SPK"),
  P(3, "Project Perluasan Nasabah Tring Melalui Akusisi nasabah External", "Project Perluasan Nasabah Tring Melalui Akusisi Nasabah Digital ", 2027, "RKF", "Eksternal", "Vendor ", "Google", "TBO", "CAPEX 2026", "4,000,000,000.00", "", "", "On going", "Dokumen TOR", "Pengadaan SAPTI", d("198YxTLTOd2TDglyWAgvStfBHxpnXolD6?usp=drive_link"), "Dokumen TOR & Kajian Teknis"),
  P(4, "Push Notification Tring! (pooling)", "Push Notification Aplikasi Tring!", 2026, "RKF", "Eksternal", "Vendor", "Moengage ", "TBO", "OPEX 2026", "949,050,000.00", "5/5/2026", "11/30/2026", "Done", "", "Terbit SPK", d("1rvgsnJmU-_nqugdy0rlTNncGJ5xgeB4U"), "Dokumen SPK"),
  P(5, M, "Pengembangan Data Jurnal Pendapatan Aplikasi Tring!", 2026, "RKF", "Internal", "Internal", "-", "IT PMO", "", "", "5/4/2026", "", "Done", "Done Execute ", "", d("1utggS6xMEY5eAZHEhUY72gJ8UGHdVWbI"), "Dashboard"),
  P(6, M, "Pengembangan Data Digital Warehouse Tring!", 2026, "RKF", "Internal", "Internal", "-", "TBO", "", "", "8/3/2026", "11/30/2026", "On going", "Finalization FLow ", "Draft Kajian dan BRD ", d("1gwts6Wdb3xEu-lRCnzjA3PjkVQPKfUOp"), "Dokumen Kajian Teknis"),
  P(7, M, "Pengembangan Dashboard & Data Magenta Tring!", 2026, "RKF", "Internal", "Internal", "-", "TBO", "", "", "6/8/2026", "", "Done", "Done Execute ", "", d("1Tou62C1p8nK2QjusRMfbcyJkaIDUjWx0"), "Dashboard"),
  P(8, M, "Pengembangan Flow Bisnis & Dashboard Produk GTE", 2026, "RKF", "Internal", "Internal", "-", "TBO", "", "", "8/3/2026", "11/30/2026", "On going", "Draft Kajian Business TBO ", "full signed off", d("1TvwN4KK_xPXI7T6luJNP1SMuxKq9fa_i"), "Dokumen Kajian Teknis & Flow Bisnis"),
  P(9, G, "Platform Customer Engagement & Data Activation untuk Aplikasi Tring! By Pegadaian", 2026, "RKF", "Eksternal", "Vendor ", "Insider / PT. Mastersystem Infotama", "Pengadaan & Logistic ", "OPEX 2026", "5,993,765,235.00", "8/14/2026", "7/31/2027", "Done", "Deployment", "Testing Push Notification", d("18Pgrao_fXOuHpLdGgD_zrZf7vYnAQ-RR"), "Dashboard"),
  P(10, G, "AI Engagement Platform / AI Customer Connect", 2026, "RKF", "Eksternal", "Vendor ", "KATA AI ", "SAPTI", "CAPEX 2026", "1,000,000,000.00", "9/1/2026", "", "Done", "Request POC", "Report POC", d("1yX0sGF8AzHUHX7VJzTzzG9l6tuuA9pPO"), "Dokumen POC"),
  P(11, G, "Pengembangan Dashboard Monitoring Rating & AI Insight", 2026, "RKF", "Eksternal", "Vendor ", "Cuan Pintar / PT. Primer Rectoverso Media", "TBO ", "CAPEX 2026", "418,470,000.00", "6/8/2026", "8/13/2026", "Done", "Deployment", "Maintenance", d("1ILnXKiOle7or3xJCFNPnzlutjItAH8ds?usp=drive_link"), "Dashboard"),
  P(12, M, "MIS Digital report 2026 ", 2026, "NON-RKF", "Internal", "Internal ", "-", "TBO x Mandati", "", "", "1/31/2026", "3/31/2026", "Done", "Done", "", d("1JD2i87lQriFZZ7L2NKiFxObvJv6x14Hc"), "Dashboard"),
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
];

const anggaran = [
  ["No","Produk / Brand / Pekerjaan","Anggaran","Mata Anggaran","Cost 2026","Forecasting Cost 2027"],
  [1,"Tring Digital Operations Technology Support","OPEX","5130801","Rp0","Rp1,000,000,000"],
  [2,"Pengadaan Device Testing","OPEX","5130801","Rp0","Rp100,000,000"],
  [3,"Chatbot AI","CAPEX","1530201","Rp1,000,000,000","Rp1,500,000,000"],
  [4,"Dashboard Monitoring Operation","OPEX","5130801","Rp418,470,000","Rp1,500,000,000"],
  [5,"Dashboard Behaviour Nasabah ","OPEX","5130801","Rp0","Rp10,000,000,000"],
  [6,"GoogleAds","OPEX","5130802","Rp10,000,000,000","Rp30,000,000,000"],
  [7,"Rating","OPEX","5130802","Rp4,873,455,000","Rp7,310,182,500"],
  [8,"Appsflyer","OPEX","5130802","Rp7,500,000,000","Rp11,250,000,000"],
  [9,"Insider ","OPEX","5130802","Rp5,993,765,235","Rp8,990,647,853"],
  [10,"KYC Tring (Liveness, Face Compare, OCR)","OPEX","5130802","Rp27,000,000,000","Rp65,000,000,000"],
  [11,"WA / SMS OTP","OPEX","5130802","Rp24,885,000,000","Rp37,327,500,000"],
  [12,"Email Blast","OPEX","5130802","Rp825,840,000","Rp1,238,760,000"],
];

const J = (n) => `https://pegadaian.atlassian.net/servicedesk/customer/portal/3/ARIANA-${n}?created=true`;
const T = (n) => `pgd-prd-dtmg-digital.datamart_operasional.${n}`;
const OK = "Done - Project & table sudah tersedia";
const datamart = [
  ["No","ID Tiket","Nama","Output","Link Tiket","Status / Table Datamart","Keterangan Status"],
  [1,"TKT-0001","Gramasi Nasabah >5gr (Deposito)","Datamart Gramasi Nasabah",J(1379826),T("dm_det_digital_nasabah_deposito"),OK],
  [2,"TKT-0002","Data seluruh TE Nasabah","Datamart seluruh TE Nasabah",J(1391194),"Rejected","Diminta dibuatkan project agar dapat ditesting dengan QA"],
  [3,"TKT-0003","Data Customer Demografi Tring","Datamart Customer Demografi",J(1393544),T("dm_rekap_tring_cust_demografi"),OK],
  [4,"TKT-0004","Data TRX, Amount, CIF Tring","Datamart TRX",J(1386065),T("dm_rekap_transaksi_tring"),OK],
  [5,"TKT-0005","Data CIF Nasabah Sudah/Belum Install Tring!","Datamart CIF Nasabah Sudah/Belum Install Tring!",J(1399684),"","On Submit"],
  [6,"TKT-0006","Data Referral Promo ","Datamart Referral Promo",J(1420052),"pgd-prd-dtmg-digital.datalake.greward_reward_transactions",OK],
  [7,"TKT-0007","Datamart TE Nasabah","Datamart TE Nasabah",J(1429026),T("dm_rekap_nasabah_tab_emas"),OK],
  [8,"TKT-0008","Datamart Pembukaan TE Nasabah","Datamart Pembukaan TE Nasabah",J(1436119),T("dm_rekap_nasabah_tab_emas"),OK],
  [9,"TKT-0009","Datamart Cicil Emas","Datamart Cicil Emas",J(1436137),T("dm_rekap_mulia_kredit"),OK],
  [10,"TKT-0010","Datamart Nasabah Chanelling","Datamart Nasabah Chanelling",J(1459790),T("dm_det_tring_saldo_emas"),OK],
  [11,"TKT-0011","Datamart GTE ","Datamart GTE",J(1462517),"","On Submit"],
];

const f = (id) => `https://drive.google.com/drive/folders/${id}`;
const audit = [
  ["No","Nama Promo","Deskripsi","Kode Promo","Link Dokumen","Budgeting","Penyerapan Budgeting"],
  [1,"Program Tebar Emas","Reward dan ketentuan umum dalam rangka meningkatkan daya tarik program promo serta mendorong peningkatan transaksi Top Up Tabungan Emas melalui aplikasi Tring!","TEBAREMAS1, TEBAREMAS17, TEBAREMAS45, TEBAREMAS89, TEBAREMAS1G, TEBAREMAS5G, TEBAREMAS10G",f("1UHyifjddOqcdtpB9BsLhXWRoMISX9cAf?usp=drive_link"),"",""],
  [2,"Program Cuan Awal Bulan","Program ini ditujukan kepada nasabah Tabungan Emas dengan saldo ≤1 gram yang ditetapkan berdasarkan segmentasi nasabah oleh Unit Kerja yang membidangi Digital.","DOBELCUAN",f("1Skts423y051gtmQp7rPUf_6AN0ANy1xU?usp=drive_link"),"",""],
  [3,"Program BoostUp Tring","Program dan penambahan kuota promo sebagai bentuk optimalisasi program guna mendukung pencapaian target transaksi digital melalui aplikasi Tring!.","CUANTE2, CUANTE5, CUANTE10, CICILHEMAT30, CICILHEMAT25, CICILHEMAT15","https://drive.google.com/file/d/1FY8x1NB885enqxGVRPcgMJZAjUOup8Yh/view?usp=sharing","",""],
  [4,"Program Gratis Biaya Layanan","Program Selalu di Tring! Tahun 2026 dalam mendorong partisipasi aktif dan peningkatan frekuensi transaksi aplikasi Tring!","SELALUDITRING, SELALUDITRING2, SELALUDITRING3","https://drive.google.com/file/d/1wXMh4hJkBdqMwZlaRJXcE6VDWqti-20E/view?usp=sharing","",""],
  [5,"Program Transaksi Ulang Gadai","Program Promo Transaksi Ulang Gadai Pada Aplikasi Tring! Tahun 2026 dalam rangka menjaga stabilitas Outstanding Loan (OSL) Perusahaan guna mengurangi potensi kredit jatuh tempo dan proses lelang","BYARGADAI5, BYARGADAI10",f("1E3NFEBngV59q-ScSH_s1diVEJBKXlW4P?usp=drive_link"),"",""],
  [6,"Program Referral Tring","Meningkatkan akuisisi nasabah digital, mendorong aktivasi transaksi, serta mendukung pencapaian target bisnis digital melalui aplikasi Tring!","Referral Akun Tring",f("1KFTBIfHXR-N4viHP5y7aQFwcour55Izq?usp=drive_link"),"",""],
  [7,"Promo Kanwill I - Medan","Meningkatan dengan penggunaan aplikasi TRING serta memberikan customer experience yang menarik bagi nasabah Wilayah Kanwil I - Medan dengan membuat program kode promo Diskon TE, sales promotion untuk meningkatkan","TRINGACEH10, TRINGACEH15, ACEHBLTE, ACEHBLCCL, ACEHBLALL, ACEHBLALL, Referral Akun Tring",f("18qi-yCZeJV2YWG3E_bz27nI0-K_JXLYd"),"",""],
  [8,"Promo Kanwill II - Pekanbaru","Meningkatan Transaksi Tring serta memperluas Jaringan Pengguna Aplikasi Tring di Wilayah Kanwil II - Pekanbaru dengan membuat program bebas biaya administrasi pembukaan Tabungan Emas, mengadakan diskon Voucher, dan Kode promo TE","TRINGKEPRI, TRINGKEPRI2, Referaral Akun Tring",f("1GGyEHr7TBn4A8hnLPXM04fOi4Jli7uO7"),"",""],
  [9,"Promo Kanwill III - Palembang","Meningkatan Transaksi Tring serta memperluas Jaringan Pengguna Aplikasi Tring di Wilayah Kanwil III - Palembang dengan membuat program gratis biaya layanan Tring!,","SELALUPLM, SELALUPLM2, SELALUPLM3",f("1jFK54qFFpMYDxM52yh5roAl72KvYzE7W"),"",""],
  [10,"Promo Kanwill IV - Balikpapan","Meningkatan Transaksi Tring serta memperluas Jaringan Pengguna Aplikasi Tring di Wilayah Kanwil IV - Balikpapan dengan membuat Free Biaya Transaksi Pembukaan TE, Voucher TE Tarakan, Akselerasi Pencapaian KPI Area Tarakan, Free Administrasi pembukaan TE","TRINGTARAKAN125, TRINGTRK1, TRINGTRK2, TRINGTRK3, Referral Akun Tring",f("1ZxA4nOVhjJ_AdnSs2ONFoJeVYoA5Dk9K"),"",""],
  [11,"Promo Kanwill V - Manado ","Meningkatan Transaksi Tring serta memperluas Jaringan Pengguna Aplikasi Tring di Wilayah Kanwil V - Manado dengan membuat kegiatan Jambore Pemuda Gereja Bethel Indonesia se-Sulawesi Utara dan Gorontalo dalam melaksanakan sponsorship untuk mendukung peningkatan literasi dan inklus...","TRINGBI10, MANADO1BL, Referral Akun Tring",f("1rlFOPq9YMa_kbld--wIVbSN3Whe_ViNO"),"",""],
  [12,"Promo Kanwill VI - Makassar","Meningkatan Transaksi Tring serta memperluas Jaringan Pengguna Aplikasi Tring di Wilayah Kanwil VI - Makassar dengan membuat Event GoldRun Voucher Free Pembukaan Tabungan Emas, GENCAR (Gerakan cari Nasabah baru),","TRINGAZR10, GENCARPARE26, MKS5K, MKS10K, GOLDRMKS, RefeRral Akun Tring",f("1JqcEFy7HYy_02vt3CwogWLkl3TJOaF27"),"",""],
];

module.exports = { procurement, anggaran, datamart, audit };
