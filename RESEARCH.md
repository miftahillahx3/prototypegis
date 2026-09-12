# Penerapan Excel dan makalah penelitian

Sumber metode: `MAKALAH KTI FIX.docx`, bagian Metode Penelitian dan tabel hasil. Sumber data: `hasil-pemeriksaan-hk-2026-08-10-12-19-01.xlsx`, sheet Hasil Pemeriksaan. Naskah dipakai sebagai spesifikasi metode, bukan instruksi operasional untuk menjalankan tindakan eksternal.

## Rekonsiliasi sumber

| Ukuran | Excel / perhitungan aplikasi | Naskah |
| --- | --- | --- |
| Pemeriksaan | 418 baris | Tabel 1: 418; abstrak: 12.940 |
| Fasyankes | 91 nama unik | Tabel 1: 91; abstrak: 812 |
| Sampling | 4 Juni–5 Agustus 2026 | Sesuai Tabel 1 |
| TSH | 0–14 µU/mL | Sesuai Tabel 1; abstrak menyebut hingga 114 |
| Status | Validated 375, Verified 22, Finished 21 | Sesuai Tabel 1 |
| K-Means silhouette | 0,5503314615 | Tabel 2: 0,5503; abstrak: 0,5006 |
| DBSCAN | 81 anggota klaster, 10 noise | Sesuai bagian hasil; abstrak: 791/21 |
| DBSCAN silhouette tanpa noise | Tidak terdefinisi: hanya 1 klaster | Tabel 2: 0,4210, tidak dapat direproduksi dengan definisi tersebut |

Angka aplikasi selalu dihitung dari Excel. Hasil tidak dipaksa mengikuti jumlah dalam naskah. Histogram memakai seluruh hasil pemeriksaan, bukan hanya maksimum per fasilitas. Volume bulanan memakai tanggal sampling aktual. Tidak ada interpolasi tren atau subset buatan.

## Implementasi algoritma

1. Agregasi pada nama fasyankes dan bulan. Setiap baris sumber adalah satu rekam pemeriksaan. Kolom hasil dibaca sebagai angka sebelum satuan, bukan angka batas referensi `< 20`. Teks satuan µU/mL dipertahankan. Tidak ada interpretasi ambang medis.
2. Pada periode terpilih, gabungkan total sampel V, jumlah TSH untuk menghitung rata-rata T, dan maksimum Tmax per fasilitas. Semua status pada Tabel 1 disertakan; Finished tidak dilabel ulang menjadi Validated.
3. Standardisasi tiap kolom: `(x-mean)/sd`, menggunakan simpangan baku populasi antar-fasyankes. Kolom konstan menjadi nol.
4. K-Means Euclidean, k=3. Detail yang tidak disebut dalam Word ditetapkan untuk reproduksi: k-means++, seed awal 42 dengan 20 restart deterministik, maksimum 300 iterasi; pilih SSE terkecil. Konvergensi ketika keanggotaan tidak berubah. Bila profil unik kurang dari tiga, jumlah klaster menyesuaikan.
5. Penamaan rendah–tinggi mengikuti rerata komponen centroid z-score, bobot sama untuk V, T, Tmax. Ini **pilihan implementasi**, bukan formulasi tingkat risiko yang ditetapkan oleh naskah. Volume besar dapat menaikkan urutan klaster; label tidak bermakna risiko penyakit per bayi.
6. DBSCAN memakai matriks z-score yang sama, epsilon=0,8, minPts=3 termasuk titik sendiri. Noise bernilai -1; titik batas dapat bergabung dengan klaster. Koordinat tidak menjadi fitur jarak karena metode naskah mendefinisikan V, T, Tmax sebagai variabel. Koordinat tambahan hanya digunakan untuk visualisasi; hasil tetap merupakan anomali profil, bukan clustering jarak geografis.
7. Silhouette memakai jarak Euclidean pada data ternormalisasi. Singleton bernilai nol. Kurang dari dua klaster atau jumlah klaster sama dengan jumlah titik menghasilkan nilai tidak terdefinisi. Evaluasi DBSCAN mengeluarkan noise.

Seluruh data menghasilkan 65/21/5 anggota klaster rendah/sedang/tinggi, SSE 87,2811876007; DBSCAN satu klaster utama dan 10 noise. Ini hasil data sumber, bukan konstanta dalam logika aplikasi.

## Ruang lingkup data browser

Hanya agregat fasyankes/bulan, histogram, jumlah status, dan metadata sumber yang dimuat. Identitas bayi/ibu, LAB ID, nomor RM, kode pasien, dan catatan tidak masuk `research-data.js`. Berkas Excel dan Word asli tidak disalin atau dimodifikasi. Data koordinat tambahan harus merujuk fasyankes; impor CSV tervalidasi menurut nama dan rentang koordinat, tetapi tidak memverifikasi kebenaran alamat di lapangan.

## Pengujian

`tests/research-check.html` memeriksa algoritma pada contoh terhitung, z-score, isi sumber, periode, tabel, ekspor, HTML escaping, penolakan koordinat salah, impor marker, dan filter wilayah. `tests/verify-research.py` menghitung ulang z-score, penugasan centroid, SSE, silhouette, serta noise DBSCAN dengan implementasi Python standar yang terpisah dari JavaScript, sekaligus memeriksa daftar field data browser.

## Pencocokan lokasi Cianjur

39 nama dipadankan dengan 31 lokasi referensi publik; 52 nama belum dipetakan. 91 unit analisis merupakan nama unik Excel, bukan jumlah institusi yang sudah dideduplikasi. Alias tidak digabung otomatis karena akan mengubah hasil penelitian. Lihat [LOCATIONS.md](LOCATIONS.md) dan audit CSV untuk sumber dan keterbatasan.
