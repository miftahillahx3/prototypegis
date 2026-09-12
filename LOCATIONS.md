# Referensi lokasi fasilitas Kabupaten Cianjur

Ditelaah 13 September 2026. Wilayah Cianjur berasal dari keterangan pengguna, bukan kolom koordinat Excel. 39 dari 91 nama memiliki referensi koordinat pada 31 lokasi; 52 belum dipetakan. Data lengkap: `facility-locations.js` dan `facility-location-audit.csv`. Status `referensi` berarti kecocokan sumber publik, bukan verifikasi lapangan atau jaminan lokasi terkini.

## Sumber

- BIG, [Gazeter 2022](https://sinar.big.go.id/assets/document/gazeter/gazeter_1674633462.pdf), halaman cetak 139–141; [Gazeter 2023](https://sinar.big.go.id/assets/document/gazeter/gazeter_1703639768.pdf), halaman 154–155. Koordinat DMS dikonversi ke desimal (lintang selatan negatif).
- [SIRS Kemenkes](https://sirs.kemkes.go.id/fo/home/profile_rs/3203015) mengidentifikasi kode 3203015 sebagai RSUD Sayang. Lokasi kompleks berasal dari [OpenStreetMap](https://www.openstreetmap.org/way/286012485).
- [Pusdokkes Polri](https://pusdokkes.polri.go.id/Facility/50/rumah-sakit-bhayangkara-tk-iv-cianjur): koordinat tujuan Google Maps yang ditautkan langsung situs resmi.
- [Puskesmas Sindangkerta](https://pkmsindangkerta.cianjurkab.go.id/): koordinat POI dalam tautan Google Maps situs resmi, bukan pusat viewport.
- OpenStreetMap: bangunan bernama [UPTD Puskesmas Cilaku](https://www.openstreetmap.org/way/1285194671) dan [Puskesmas DTP Sindangbarang](https://www.openstreetmap.org/way/1281522784). Titik representatif adalah rata-rata simpul unik poligon, bukan pintu masuk. © OpenStreetMap contributors, data tersedia di bawah ODbL: https://www.openstreetmap.org/copyright.
- [Kemenkes, Buku Informasi Mudik 2018](https://sehatnegeriku.kemkes.go.id/wp-content/uploads/2018/06/BUKU-INFORMASI-MUDIK-TAHUN-2018-FINAL.pdf), halaman 92: Gekbrong, Ciranjang, Mande. Referensi historis, perlu konfirmasi terkini.

## Aturan pencocokan

Nama resmi yang cocok langsung digunakan. Salah ketik CAMAPAKAMULYA, SAYANAG, RATWAT INAP diperjelas dalam catatan padanan. Laboratorium RSUD Cimacan ditempatkan pada kompleks rumah sakit, bukan ruang laboratorium. Kode 3203015 menggunakan identitas resmi Kemenkes. Nama asli dan 418 pemeriksaan tidak diubah; algoritma tetap menghitung 91 nama unik, termasuk alias.

CIRANJANG tanpa jenis fasilitas, PERINA tanpa rumah sakit induk, PERINA RSDH, dan nama pribadi yang belum memiliki identitas lokasi praktik pasti dibiarkan belum terpetakan. Daftar pegawai tidak digunakan untuk menebak lokasi praktik bidan. Hasil pencarian ambigu di kabupaten lain ditolak. Cijedil belum dipetakan karena referensi lokasi yang ditemukan belum cukup konsisten. Tidak menggunakan lokasi pasien.

Puskesmas Nagrak menggunakan referensi BIG 2023. [Berita 21 Mei 2026](https://wartaparahyangan.com/agar-lebih-representatif-puskesmas-nagrak-akan-direlokasi-ke-jl-kh-abdullah-bin-nuh/) menyebut rencana relokasi; lokasi baru belum terkonfirmasi. Titik lama diberi catatan, tidak digeser berdasarkan perkiraan.

Nama pada koordinat sama ditampilkan sebagai satu marker dengan pilihan detail masing-masing. Warna marker memakai klaster tertinggi atau adanya outlier di lokasi tersebut; ini aturan tampilan, bukan penggabungan model. Legenda tetap menghitung seluruh nama, termasuk yang belum terpetakan. CSV pengguna menambah/mengganti referensi selama sesi dan menandai sumber sebagai CSV pengguna. Dataset referensi kembali saat halaman dimuat ulang.
