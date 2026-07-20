Dalam mengerjakan proyek ini, ada beberapa kriteria yang perlu Anda penuhi. Kriteria-kriteria tersebut diperlukan agar Anda dapat lulus dari tugas ini.

Setiap kriteria dapat bernilai 0 sampai 4 points (pts). Untuk lulus dari submission ini, Anda harus mendapatkan minimal 2 points dari setiap kriteria. Submission akan ditolak jika masih terdapat kriteria dengan 0 points.

Berikut adalah daftar kriteria yang harus Anda penuhi. 

Kriteria 1: Mengembangkan Fitur Deteksi Sayuran (Computer Vision)
Memastikan aplikasi berhasil melihat dan memprediksi sayuran menggunakan TensorFlow.js.

Rejected (0):
Aplikasi gagal meminta atau mengakses izin kamera (MediaStream API).
Model TensorFlow.js tidak berhasil dimuat (terjadi error pada console).
Aplikasi tidak menampilkan label hasil prediksi sama sekali pada antarmuka pengguna (UI).
Basic (2):
Fitur streaming kamera aktif dan model TensorFlow.js berhasil dimuat.
Aplikasi dapat menampilkan label nama sayuran secara otomatis saat objek dideteksi.
Skilled (3):
Memenuhi kriteria Basic.
Menerapkan fitur FPS Limit yang dapat dikonfigurasi melalui UI atau kode.
Menampilkan indikator loading atau status seperti "Menunggu Model..." disertai persentase saat inisialisasi awal.
Advanced (4):
Memenuhi kriteria Skilled.
Menerapkan Backend Adaptif: Kode mampu melakukan pengecekan `navigator.gpu` untuk menggunakan WebGPU dengan fallback otomatis ke WebGL.
Manajemen Memori: Secara disiplin menggunakan `tf.tidy()` atau `.dispose()` pada setiap siklus prediksi agar aplikasi tetap ringan di peramban pengguna.
Menggunakan arsitektur MVP atau library React.
Kriteria 2: Mengintegrasikan Generative AI untuk Konten Fun Fact
Memastikan aplikasi dapat memproses label prediksi menjadi teks kreatif menggunakan Transformers.js. 

Rejected (0):
Konten Fun Fact bersifat statis (teks yang sama muncul untuk semua jenis sayuran).
Aplikasi tidak menggunakan pustaka Generative AI lokal (Transformers.js) sesuai materi modul.
Teks hasil generasi tidak muncul di UI setelah objek berhasil dideteksi.
Basic (2):
Aplikasi berhasil mengirimkan hasil deteksi (label) ke dalam prompt AI secara dinamis.
Berhasil menampilkan teks Fun Fact unik yang relevan dengan jenis sayuran yang dideteksi.
Skilled (3):
Memenuhi kriteria Basic.
Menerapkan fitur Salin ke Papan Klip (Copy to Clipboard) untuk teks hasil AI.
Mengatur parameter `temperature`, `max_new_tokens`, `top_p`, dan `do_sample` untuk menjaga performa.
Advanced (4):
Memenuhi kriteria Skilled.
Fitur Persona Dinamis: Menyediakan pilihan gaya bahasa (contoh: Gaya "Lucu" atau "Sejarah") melalui elemen dropdown/radio button yang secara otomatis mengubah gaya penulisan AI.
Menerapkan Backend Adaptif: Kode mampu melakukan pengecekan `navigator.gpu` untuk menggunakan WebGPU dengan fallback otomatis ke WebGL.
Kriteria 3: Menerapkan Offline Capability dan Deployment
Memastikan aplikasi dapat diakses menggunakan URL publik dan berjalan secara luring (offline).

Rejected (0):
Aplikasi tidak dapat diakses melalui URL production (Netlify).
Berkas Web App Manifest tidak valid atau tidak terdeteksi oleh peramban (ikon dan nama tidak muncul di DevTools Manifest).
Aplikasi langsung blank atau error 404 saat koneksi internet dimatikan (sebelum data masuk cache).
Tidak melampirkan URL hasil deployment dalam STUDENT.txt
Basic (2):
Aplikasi berhasil di-deploy ke Netlify.
Berhasil mengonfigurasi Web App Manifest dan Service Worker menggunakan Workbox.
Menerapkan Precaching pada aset inti (HTML, CSS, dan JS) agar aplikasi tetap dapat terbuka meski tanpa internet.
Melampirkan URL hasil deployment dalam STUDENT.txt
Skilled (3):
Memenuhi kriteria Basic.
Implementasi Linter: Menyertakan konfigurasi linter (seperti ESLint) di dalam proyek untuk menjaga konsistensi gaya penulisan kode di seluruh berkas.
Aplikasi Dapat Diinstal: Berhasil mengonfigurasi Web App Manifest secara lengkap dan meregistrasikan Service Worker dengan benar sehingga aplikasi dikenali oleh browser sebagai aplikasi yang dapat diinstal (muncul tombol "Install" di address bar atau perintah "Add to Home Screen").
Advanced (4):
Memenuhi kriteria Skilled.
Offline AI Model: Berhasil melakukan Precaching pada berkas model AI (file `.json` dan `.bin`) di `sw.js` sehingga proses deteksi tetap berfungsi meski dalam mode pesawat/tanpa internet.