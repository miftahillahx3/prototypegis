# SBBL Jawa Barat

Aplikasi penelitian skrining bayi baru lahir dengan K-Means dan DBSCAN yang dijalankan di browser. Data aplikasi berasal dari Excel penelitian: 418 pemeriksaan, 91 fasyankes, tanggal sampling 4 Juni–5 Agustus 2026.

Jalankan `powershell -ExecutionPolicy Bypass -File .\start-server.ps1`, kemudian buka http://localhost:8080. Tidak memerlukan build step. HTML, CSS, JavaScript, dan Leaflet lokal digunakan untuk antarmuka; peta dasar memerlukan koneksi internet.

## Data dan metode

`import-research.py` membaca Excel lokal dan menghasilkan `research-data.js` berisi agregat fasyankes per bulan: jumlah sampel, jumlah nilai TSH, TSH maksimum, histogram, dan jumlah per status. Nama bayi/ibu, LAB ID, nomor RM, kode pasien, dan catatan tidak diekspor. Setiap baris dihitung sebagai satu pemeriksaan; aplikasi tidak mengklaim menghitung pasien unik. Status Validated, Verified, dan Finished disertakan sesuai tabel makalah.

Kedua algoritma memakai tiga variabel per fasyankes: total sampel, rata-rata TSH, TSH maksimum; normalisasi z-score (simpangan baku populasi). K-Means k=3; DBSCAN epsilon=0,8, minPts=3. Pemilihan bulan menggunakan tanggal sampling, lalu menghitung ulang agregat, normalisasi, dan model. Filter wilayah dan pencarian hanya menyaring hasil model seluruh fasyankes pada periode itu.

Hasil seluruh data: K-Means 65 rendah, 21 sedang, 5 tinggi; silhouette 0,5503314615. DBSCAN: 81 bukan outlier dan 10 outlier. Silhouette DBSCAN tanpa noise tidak terdefinisi karena hanya satu klaster non-noise. Penamaan rendah–tinggi mengikuti rerata tiga komponen centroid z-score berbobot sama; ini aturan operasional aplikasi yang tidak dijelaskan dalam makalah, bukan ambang risiko klinis.

Lihat [catatan penerapan penelitian](RESEARCH.md) untuk parameter reproduksi dan perbedaan dengan naskah.

## Koordinat fasyankes

Wilayah penelitian adalah Kabupaten Cianjur sesuai keterangan pengguna. Aplikasi memuat koordinat referensi untuk **39 dari 91 nama unik Excel**, pada **31 lokasi fisik**. Sebanyak 52 nama belum cukup pasti untuk dipetakan. Sumber, tahun referensi, dan padanan nama tersedia pada detail serta [audit lokasi](facility-location-audit.csv); baca [LOCATIONS.md](LOCATIONS.md). Referensi publik belum diperiksa di lapangan. Nama berbeda pada lokasi yang sama tetap dianalisis terpisah dan dapat dipilih dari satu marker. Warna marker mengikuti klaster tertinggi atau adanya outlier di lokasi itu.

Lokasi bawaan tersimpan dalam aplikasi. CSV melalui template dapat menambah atau mengganti koordinat selama sesi browser, tanpa menghapus referensi lainnya. Nama harus cocok dengan template; gunakan titik untuk desimal. Lokasi yang digunakan adalah fasyankes, bukan pasien.

## Memperbarui data

```powershell
python import-research.py "C:\path\hasil-pemeriksaan.xlsx"
```

Gunakan Python yang tersedia (di komputer pengembangan: `C:\Program Files\QGIS 4.2.1\apps\Python312\python.exe`). Parser menolak header, status, tanggal, atau format hasil yang tidak sesuai, agar data tidak dibuang diam-diam. Dataset sumber tidak disalin ke folder aplikasi.

## Verifikasi dan paket

Buka `tests/research-check.html` melalui server lokal untuk pengujian algoritma, jumlah sumber, periode, ekspor, dan koordinat. Setelah hasil headless browser ditulis ke `tests/research-result.html`, jalankan `python tests/verify-research.py` untuk pemeriksaan numerik independen.

`prepare-public.ps1` membuat paket lokal aplikasi dan agregat penelitian. Perubahan ini tidak otomatis mengirim data ke situs publik. Panduan hosting ada di [PUBLISH.md](PUBLISH.md).
