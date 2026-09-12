# SBBL Jawa Barat

Prototipe visualisasi interaktif penelitian skrining bayi baru lahir, responsif untuk mobile dan desktop. Jalankan `python -m http.server 8080 --bind 127.0.0.1`, lalu buka http://localhost:8080. Di workspace pengembangan Windows, tersedia pula `start-server.ps1`. Peta online memerlukan internet dan akses melalui HTTP, bukan file://.

Fitur: navigasi Beranda/Peta/Data/Analisis, filter wilayah dan periode, peta geografis Leaflet/OpenStreetMap dengan geser, pinch zoom, skala, dan detail titik, pilihan K-Means/DBSCAN, filter legenda, pencarian dan filter risiko, detail fasilitas, grafik distribusi dan tren, serta ekspor CSV sesuai filter. Tanpa build step. Leaflet 1.9.4 disimpan lokal di vendor/leaflet beserta lisensinya. Font Google bersifat opsional dengan fallback lokal.

## Batasan penelitian

Semua 812 fasilitas, nilai, dan koordinat adalah data sintetis. Peta dasar menampilkan geografi nyata OpenStreetMap (https://www.openstreetmap.org/copyright). Titik fasilitas tersebar secara sintetis di sekitar tujuh pusat kota, bukan koordinat alamat fasyankes. Warna menunjukkan klaster titik fasilitas, bukan poligon zonasi administratif. Label K-Means dan DBSCAN dipersiapkan sebagai simulasi; aplikasi tidak menjalankan algoritma clustering. Silhouette 0,5006 adalah referensi mockup. Periode memakai subset sintetis. Tren volume merupakan skenario ilustratif. Tidak digunakan untuk diagnosis maupun keputusan klinis. Belum ada backend, autentikasi, atau penyimpanan data pasien.

## Demo publik dan portofolio

Siap dihosting sebagai situs statis melalui GitHub Pages. Ikuti [panduan publikasi](PUBLISH.md) untuk mengunggah aplikasi dan mengaktifkan URL publik. Repositori: [miftahillahx3/prototypegis](https://github.com/miftahillahx3/prototypegis). Alamat demo setelah deployment berhasil: https://miftahillahx3.github.io/prototypegis/ (belum aktif sebelum GitHub Pages diaktifkan).

Teknologi: HTML, CSS responsif, JavaScript, Leaflet 1.9.4, dan OpenStreetMap. Data simulasi diproses di browser. Ringkasan K-Means/DBSCAN mengikuti kategori, wilayah, serta periode yang dipilih.