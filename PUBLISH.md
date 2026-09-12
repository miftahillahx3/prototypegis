# Publikasi portofolio di GitHub Pages

## Pembaruan langsung dari VS Code

Workspace `D:\PrototypeGIS` sudah disiapkan untuk remote `https://github.com/miftahillahx3/prototypegis.git` pada branch `main`.

1. Buka folder `D:\PrototypeGIS` di VS Code. Jika sebelumnya sudah terbuka, jalankan **Ctrl+Shift+P → Developer: Reload Window** agar Git Portable terdeteksi.
2. Buka **Source Control** dengan **Ctrl+Shift+G**.
3. Pada pengiriman pertama, klik **Publish Branch** atau jalankan **Git: Push** dari Command Palette. Remote `origin` sudah mengarah ke repositori yang ada; tidak perlu membuat repositori baru. Jika diminta, login ke akun GitHub `miftahillahx3` melalui browser.
4. Untuk pembaruan berikutnya: edit dan simpan file, klik **+** pada file yang ingin dikirim, isi pesan perubahan, lalu klik **Commit**. Pengaturan lokal `git.postCommitCommand: sync` menjalankan sinkronisasi setelah commit. Ikuti dialog konfirmasi VS Code bila muncul.
5. Aktifkan GitHub Pages satu kali melalui langkah di bawah. Setiap push berikutnya ke `main` akan memicu pembaruan situs.

Menyimpan file tidak langsung mengirimnya. Commit mencatat versi yang siap dipublikasikan. Bila sinkronisasi gagal atau ada konflik, selesaikan masalah di Source Control, lalu pilih **Sync Changes**.

Git Portable tersimpan di `.tools/git`. `git.path` diatur di User Settings VS Code karena pengaturan ini tidak didukung pada tingkat workspace. Pengaturan sinkronisasi dan PATH terminal berada di `.vscode/settings.json`. Kedua folder lokal tersebut diabaikan oleh Git. Jika folder proyek dipindah, sesuaikan `git.path` di User Settings serta PATH terminal di pengaturan workspace. Identitas commit lokal menggunakan username GitHub dan alamat noreply; pengaturan Git global komputer tidak diubah.

Aplikasi ini adalah situs statis. Tidak memerlukan Node.js, backend, atau API key. Peta memerlukan koneksi internet.

## Cara unggah melalui browser

1. Masuk ke GitHub dan buka repositori Anda: https://github.com/miftahillahx3/prototypegis. Repositori ini sudah Public.
2. Ekstrak `sbbl-jawa-barat-github.zip` di komputer. Jangan unggah ZIP-nya sebagai aplikasi.
3. Buka https://github.com/miftahillahx3/prototypegis/upload/main (atau pilih **uploading an existing file** pada halaman repositori kosong). Unggah **isi** hasil ekstraksi: `index.html`, `style.css`, `app.js`, `.nojekyll`, `README.md`, `PUBLISH.md`, serta folder `vendor`. Pastikan `index.html` langsung di root repositori dan struktur folder `vendor/leaflet` tetap sama.
4. Pilih **Commit changes** ke branch `main`.
5. Buka https://github.com/miftahillahx3/prototypegis/settings/pages (**Settings → Pages → Build and deployment**). Pilih **Deploy from a branch**, branch **main**, folder **/(root)**, kemudian **Save**.
6. Tunggu deployment selesai. Buka URL yang ditampilkan pada halaman Settings → Pages. URL proyek ini setelah deployment berhasil: https://miftahillahx3.github.io/prototypegis/. GitHub Pages telah dikonfigurasi untuk branch main dan folder root. Setelah push, tunggu deployment selesai sebelum memeriksa versi terbaru.
7. Salin URL tersebut ke bagian **About → Website** repositori atau ke README portofolio Anda. Coba juga URL dari HP.

Jika repository bernama `USERNAME.github.io`, URL situs adalah `https://USERNAME.github.io/`. Jangan menimpa situs portofolio yang sudah ada tanpa menyesuaikan strukturnya.

## Verifikasi setelah publikasi

- Halaman, navigasi, dan peta dapat dibuka dari URL HTTPS.
- Tombol +/−, reset, dan filter wilayah berfungsi.
- Tab DBSCAN mengganti ringkasan menjadi Normal/Outlier.
- Ekspor CSV dapat diunduh dan dialog detail dapat dibuka.

## Memperbarui versi

Di folder proyek lokal, jalankan `powershell -ExecutionPolicy Bypass -File .\prepare-public.ps1`. Unggah ulang file hasil paket yang berubah ke branch publikasi. Paket hanya menyertakan file aplikasi dan dokumentasi; profil browser serta log pengujian tidak disertakan.

## Deskripsi portofolio

> SBBL Jawa Barat — prototipe dashboard penelitian kerentanan neonatal yang responsif, dengan peta geografis interaktif, eksplorasi kategori K-Means/DBSCAN, statistik, pencarian fasilitas kesehatan, serta ekspor CSV. Dibangun menggunakan HTML, CSS, JavaScript, dan Leaflet. Menggunakan data sintetis untuk demonstrasi; belum menjalankan algoritma clustering pada data penelitian nyata.

Dokumentasi resmi: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
