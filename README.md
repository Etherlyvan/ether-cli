# Ether CLI

Ether CLI adalah aplikasi pengelola tugas melalui terminal yang dibuat dengan **TypeScript dan Node.js**. Kamu bisa menambah tugas, melihat daftar, menandai tugas selesai, dan menghapusnya. Data tersimpan dalam file JSON sehingga tetap ada setelah terminal ditutup.

Proyek ini merupakan bagian dari Engineering Journey untuk mempelajari CLI arguments, filesystem, JSON persistence, validasi, dan error handling melalui aplikasi yang dapat langsung digunakan. Aplikasi berjalan lokal tanpa database, koneksi internet, atau dependency runtime tambahan.

## Fitur

- Menambahkan tugas dengan ID otomatis yang tidak digunakan ulang setelah penghapusan.
- Menampilkan semua tugas atau memfilter berdasarkan status.
- Menandai tugas selesai dan menghapus tugas berdasarkan ID.
- Menyimpan data secara otomatis ke file JSON.
- Memvalidasi input dan struktur data sebelum menyimpan perubahan.
- Menampilkan error melalui stderr dengan exit code `1`.

## Instalasi

Gunakan **Node.js 22 atau lebih baru** dan npm. Jalankan dari folder proyek:

```sh
npm ci
npm run build
node dist/cli.js help
```

`npm ci` menginstal dependency sesuai `package-lock.json`. Sertakan file lock tersebut dalam Git agar instalasi konsisten.

## Contoh penggunaan

Saat development, gunakan `npm run dev --`:

```sh
npm run dev -- add "Belajar filesystem Node.js"
# Added #1: Belajar filesystem Node.js

npm run dev -- list
# [ ] #1 Belajar filesystem Node.js

npm run dev -- done 1
# Completed #1: Belajar filesystem Node.js

npm run dev -- list --done
# [x] #1 Belajar filesystem Node.js

npm run dev -- remove 1
# Removed #1: Belajar filesystem Node.js
```

Contoh di atas mengasumsikan penyimpanan masih kosong. Gunakan ID yang ditampilkan saat menambahkan atau melihat tugas.

### Menggunakan perintah ether

Pasang perintah dari proyek lokal:

```sh
npm run build
npm link
ether help
ether add "Tulis dokumentasi"
ether list
```

Setelah mengubah source, jalankan `npm run build` lagi agar perintah `ether` menggunakan hasil terbaru. Untuk melepas perintah lokal, jalankan `npm unlink --global ether-cli`.

### Daftar perintah

| Perintah | Fungsi |
| --- | --- |
| `ether add <title>` | Menambahkan tugas; judul tidak boleh kosong |
| `ether list` | Menampilkan semua tugas |
| `ether list --pending` | Menampilkan tugas yang belum selesai |
| `ether list --done` | Menampilkan tugas yang sudah selesai |
| `ether done <id>` | Menandai tugas selesai |
| `ether remove <id>` | Menghapus tugas secara permanen |
| `ether help` | Menampilkan bantuan; tersedia juga `--help` dan `-h` |

ID harus berupa bilangan bulat positif. Menjalankan `done` kembali pada tugas yang sudah selesai tetap aman. Jika daftar kosong, CLI menampilkan `No tasks found.`.

## Penyimpanan data

Lokasi default adalah `.ether-cli/tasks.json` di home directory pengguna:

- Windows: `%USERPROFILE%\.ether-cli\tasks.json`
- Linux/macOS: `~/.ether-cli/tasks.json`

Lokasi ini tidak bergantung pada folder tempat perintah dijalankan. Folder dan file dibuat saat perubahan pertama disimpan.

Gunakan environment variable `ETHER_TASKS_FILE` untuk memilih file lain. Contoh PowerShell:

```powershell
$env:ETHER_TASKS_FILE = "$PWD/tasks.json"
npm run dev -- add "Coba penyimpanan lokal"
npm run dev -- list

# Kembali ke lokasi default
Remove-Item Env:ETHER_TASKS_FILE
```

Path relatif dihitung dari working directory saat perintah dijalankan. `tasks.json` di root proyek sudah diabaikan oleh Git. Jika memilih nama atau lokasi lain di dalam repo, tambahkan path tersebut ke `.gitignore`.

Format file:

```json
{
  "nextId": 2,
  "tasks": [
    {
      "id": 1,
      "title": "Belajar filesystem Node.js",
      "done": false
    }
  ]
}
```

`nextId` menyimpan ID berikutnya. Aplikasi menulis ke file sementara lalu mengganti file tujuan melalui rename. Jika JSON atau struktur datanya tidak valid, operasi ditolak dan file lama tidak ditimpa. Perbaiki file atau pulihkan dari salinan yang valid sebelum mencoba lagi.

## Struktur proyek

```text
ether-cli/
  src/
    cli.ts               # Argumen, output terminal, dan exit code
    store.ts             # Validasi data dan penyimpanan JSON
  tests/
    cli.test.ts          # Tes perilaku CLI dan data rusak
  .gitignore
  .nvmrc                 # Versi Node.js untuk development
  package.json
  package-lock.json
  tsconfig.json          # Type check source dan tes
  tsconfig.build.json    # Build source aplikasi ke dist/
  README.md
```

`cli.ts` membaca argumen terminal, meneruskan operasi data ke `TaskStore` dalam `store.ts`, lalu menampilkan hasil atau error. Pemisahan ini menjaga logika penyimpanan terpisah dari tampilan CLI.

## Development dan verifikasi

| Script | Fungsi |
| --- | --- |
| `npm run dev -- <perintah>` | Menjalankan TypeScript melalui `tsx` |
| `npm run check` | Memeriksa tipe source dan tes tanpa menghasilkan output |
| `npm test` | Menjalankan Node.js test runner melalui `tsx` |
| `npm run build` | Mengompilasi source aplikasi ke folder `dist/` |

Jalankan sebelum menyiapkan perubahan untuk commit:

```sh
npm run check
npm test
npm run build
```

Tes menggunakan folder sementara yang terpisah dari data pribadi. Cakupannya meliputi persistensi antarproses, filter status, penghapusan, ID yang tidak digunakan ulang, input tidak valid, ID yang tidak ditemukan, dan file rusak yang tidak boleh ditimpa.

## Konsep yang dipelajari

- Membaca `process.argv` untuk mengenali perintah dan argumen.
- Menggunakan filesystem API asinkron untuk membaca dan menulis file.
- Mengubah JSON menjadi objek dan memvalidasi data saat runtime.
- Menangani error melalui stderr dan exit code.
- Memisahkan tanggung jawab CLI dari penyimpanan data.
- Menguji aplikasi terminal melalui proses terpisah dengan data terisolasi.

## Batasan

Aplikasi ini ditujukan untuk penggunaan lokal oleh satu pengguna. Jalankan satu perintah perubahan pada satu waktu: belum ada penguncian file, sehingga proses yang menulis bersamaan dapat saling menimpa perubahan. Seluruh data dimuat ke memori, sehingga format penyimpanan ini ditujukan untuk daftar tugas kecil.

Fitur edit judul, tenggat waktu, pengembalian status ke pending, dan sinkronisasi belum tersedia. Data tidak dienkripsi dan belum memiliki backup otomatis.
