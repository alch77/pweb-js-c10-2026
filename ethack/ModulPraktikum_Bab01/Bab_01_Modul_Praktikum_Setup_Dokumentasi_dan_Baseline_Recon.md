# Bab 1 (Praktikum) — Setup Dokumentasi & Baseline Recon

Oke, teori sudah cukup. Sekarang saatnya kotor-kotoran tangan sedikit.

Tujuan praktikum di bab ini sebenarnya sederhana, tapi jangan salah — ini fondasi yang akan kamu pakai berulang-ulang sampai bab terakhir buku ini: (1) membangun *cyber range* pribadi di laptopmu sendiri, dan (2) membiasakan diri mendokumentasikan setiap langkah sejak awal, bukan setelah "nanti kalau sempat" (yang biasanya artinya nggak pernah).

Kalau kamu langsung loncat ke bab-bab eksploitasi tanpa membiasakan diri dengan alur di bab ini, saya jamin nanti di tengah jalan kamu bakal kebingungan sendiri: "Tadi command yang berhasil itu yang mana ya?"

## 1.1 Yang Perlu Kamu Siapkan

Sebelum mulai, pastikan tiga hal ini sudah terpasang di laptopmu:

- **VirtualBox** dengan VM **Kali Linux** yang sudah jalan (kalau belum, unduh image resmi dari kali.org — pilih versi VirtualBox pre-built supaya tidak perlu instalasi manual dari ISO).
- **Docker** terpasang di Kali VM (atau di host, tergantung arsitektur lab kamu — panduan di bagian 1.4 di bawah pakai asumsi Docker jalan di dalam Kali).
- Koneksi jaringan **host-only** antara Kali VM dan container Docker yang akan kita jalankan — supaya lab kamu tetap terisolasi dari internet.

Kalau bagian jaringan host-only ini masih bikin bingung, tenang, semua langkah teknisnya sudah saya siapkan di paket resource yang menyertai bab ini (lihat bagian akhir bab ini).

## 1.2 Kenapa Kita Mulai dari Dokumentasi, Bukan Langsung Hacking?

Mungkin agak aneh — bab praktikum pertama malah bahas soal catat-mencatat, bukan langsung nge-scan atau nge-exploit. Tapi coba pikir lagi: kalau kebiasaan dokumentasi nggak dibangun sejak sesi pertama, kebiasaan itu nggak akan muncul tiba-tiba pas kamu sampai di bab Active Directory yang jauh lebih kompleks nanti.

Jadi, sebelum menyentuh target apapun, install dulu salah satu tool note-taking yang sudah dibahas di textbook Bab 1 — **Obsidian** atau **CherryTree**, keduanya gratis dan bisa jalan langsung di Kali.

Setelah terpasang, buat struktur folder seperti ini untuk setiap "engagement" (dalam konteks buku ini, satu folder per bab praktikum):

```
Lab-Notes/
└── Bab-01-Baseline-Recon/
    ├── 00-scope-dan-tujuan.md
    ├── 01-recon-notes.md
    ├── 02-screenshot/
    └── 03-laporan-final.md
```

Struktur ini kelihatan sepele, tapi percayalah, konsistensi struktur folder seperti ini yang bakal menyelamatkanmu waktu suatu saat harus balik lagi ke catatan lama entah kenapa.

## 1.3 Menjalankan Target Pertama: OWASP Juice Shop

**OWASP Juice Shop** adalah aplikasi web yang sengaja dibuat penuh kerentanan untuk keperluan latihan — dipelihara komunitas OWASP dan dipakai luas di seluruh dunia untuk belajar web security. Kita pakai ini sebagai "target pemanasan" karena instalasinya gampang (satu baris Docker) dan aman dijadikan sasaran latihan.

Dari dalam Kali VM, jalankan:

```bash
docker run --rm -d --name juice-shop -p 3000:3000 bkimminich/juice-shop
```

Setelah container jalan, buka browser di dalam Kali VM dan akses `http://localhost:3000`. Kalau muncul halaman toko online dengan judul "OWASP Juice Shop", berarti target sudah siap.

> Catatan: kalau kamu menjalankan Docker di *host* (bukan di dalam Kali VM), sesuaikan cara akses network-nya — pastikan Kali VM tetap bisa menjangkau container tersebut melalui jaringan host-only yang sudah kamu konfigurasi, bukan lewat internet.

## 1.4 Baseline Scan: Langkah Pertama yang (Hampir) Selalu Sama

Setiap kali kamu berhadapan dengan target baru — mau itu satu container sederhana atau jaringan korporat yang kompleks — hampir selalu langkah pertamanya sama: cari tahu dulu apa yang sebenarnya "hidup" dan terbuka di target itu.

Dari Kali, jalankan scan sederhana ke target:

```bash
nmap -sV -p 3000 <IP-target-atau-localhost>
```

Perhatikan outputnya. Kamu akan lihat informasi seperti port terbuka, service yang jalan di port tersebut, dan kalau beruntung, versi frameworknya juga (misalnya versi Express.js atau Node.js yang dipakai Juice Shop). Informasi sekecil ini sebenarnya sudah jadi "temuan" pertamamu — versi software yang ter-expose bisa jadi petunjuk kerentanan yang sudah dikenal publik (nanti kita bahas lebih dalam soal ini di Bab 4 saat masuk vulnerability scanning).

## 1.5 Menuliskan Temuan Pertamamu

Sekarang, bagian yang sering dilewatkan pemula: pindahkan hasil di atas ke dalam template laporan yang sudah kamu buat di Tantangan Mastery Bab 1 (textbook). Kalau kamu belum sempat membuat template sendiri, pakai dulu `template_laporan_pentest.md` yang sudah disediakan di paket resource bab ini sebagai starting point — tapi usahakan tetap modifikasi supaya jadi gaya kamu sendiri.

Isi minimal yang wajib ada di laporan baseline ini:

- **Scope**: satu container Juice Shop lokal, jaringan host-only, hanya untuk keperluan latihan.
- **Tools**: Nmap versi berapa, dijalankan dari Kali versi berapa.
- **Temuan awal**: port dan service yang terdeteksi, beserta versi software (jika ada).
- **Screenshot**: minimal satu tangkapan layar hasil scan dan satu tangkapan layar halaman Juice Shop yang berhasil diakses.

## Checkpoint Praktikum

Sebelum lanjut ke Bab 2, pastikan kamu sudah bisa mencentang semua ini:

- [ ] Kali Linux VM jalan normal dan bisa mengakses container Docker.
- [ ] Juice Shop berhasil diakses lewat browser dari dalam Kali.
- [ ] Kamu sudah menjalankan minimal satu scan Nmap dan memahami setiap kolom pada outputnya.
- [ ] Laporan baseline pertamamu sudah tersimpan rapi di folder `Bab-01-Baseline-Recon/03-laporan-final.md`.

Kalau salah satu poin di atas masih bolong, jangan buru-buru ke bab berikutnya. Kebiasaan yang dibangun (atau tidak dibangun) di sini akan kebawa terus sampai akhir buku.

## Sumber Daya Pendukung

Semua file teknis yang kamu butuhkan untuk praktikum bab ini — `docker-compose.yml`, script otomasi baseline scan, dan template laporan — sudah disiapkan dalam satu paket terpisah yang menyertai modul ini.


## Video Tutorial

https://youtu.be/SJBOK0tmA-I