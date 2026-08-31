# 📘 LearnCKB Indonesia

> **Platform Pembelajaran Interaktif Nervos CKB Berbahasa Indonesia**  
> Mengadaptasi kurikulum komprehensif dari *CKB Builder Handbook* untuk developer Web3 dan ekosistem blockchain di Indonesia.

---

## 🌐 Live Deployment
- **Live URL**: [https://learnckb.vercel.app/](https://learnckb.vercel.app/)
- **Platform**: Vercel
- **Status**: 🟢 Active / Live

---

## 💡 Overview & Latar Belakang
**LearnCKB Indonesia** dibuat untuk menjembatani developer Indonesia dalam memahami arsitektur unik Nervos Network (CKB). Materi disadur langsung dari panduan resmi **CKB Builder Handbook**, dikemas dengan gaya bahasa yang mudah dipahami, dilengkapi *code snippet*, visualisasi konsep, dan kuis interaktif di setiap modul.

---

## 📸 Preview / Screenshots
*(Screenshot tampilan aplikasi dapat disisipkan di bawah)*

```
[Tambahkan Screenshot Landing Page / Lesson View di sini]
```

---

## 🚀 Fitur Utama & Struktur Kurikulum

Platform ini membagi materi belajar menjadi **3 Fase Utama** dan **1 Resource Hub**:

### 🟢 1. Phase 1: Beginner
Fokus pada pengenalan konsep fundamental, setup environment lokal, dan transaksi dasar.
- **Lesson 1**: Pengenalan Nervos CKB & Fundamental Arsitektur Layered / Cell Model.
- **Lesson 2**: Quick Start & Setup Lingkungan Lokal dengan **OffCKB**.
- **Lesson 3**: Pengenalan CKB Script (Lock Script & Type Script).
- **Lesson 4**: Tutorial Praktis - Transfer CKB & Store Data on Cell.
- **Lesson 5**: Tutorial Praktis - Penerbitan Token (sUDT) & Spore DOB Dasar.
- **Lesson 6**: Membangun Simple Lock & Eksplorasi CKB DevTools (Faucet, Debugger, Explorer).
- **Lesson 7**: Pembangunan DApp Frontend menggunakan JavaScript/TypeScript & **CCC (Common Chain Connector)**.
- **Lesson 8**: Pengembangan Smart Contract Intensif menggunakan **Rust SDK** & **CKB-CLI**.
- **Lesson 9**: Eksplorasi SDK Alternatif (Go & Java).
- **Lesson 10**: Pengenalan Payment Channels Layer 2 di CKB (**Fiber Network** & **Perun**).

### 🟡 2. Phase 2: Intermediate
Fokus pada teori scripting mendalam, optimasi siklus komputasi VM, dan standar token ekosistem.
- **Script Development Course**: Model Validasi VM RISC-V, WebAssembly di CKB, Debugging Lanjutan, Type ID.
- **Optimasi VM**: Penggunaan Duktape C untuk JavaScript on-chain & optimasi cycle.
- **Serialisasi Molecule**: Format serialisasi data on-chain deterministik dan hemat ruang.
- **Standar Ekosistem**: Deep dive sUDT (RFC 0025), Mekanisme Nervos DAO (RFC 0023 & smart contract `dao.c`), serta implementasi DOB Spore Protocol & Decoder.

### 🔴 3. Phase 3: Advance
Fokus pada inovasi lapisan pengembangan tingkat tinggi dan interoperabilitas Bitcoin.
- **xUDT (Extensible UDT - RFC 0052)**: Programmable token dengan custom validation logic.
- **SSRI Protocol**: Script-Sourced Rich Information untuk metadata dan logika on-chain terdesentralisasi.
- **RGB++ Protocol**: Isomorphic binding untuk mengaktifkan smart contract dan aset Bitcoin via CKB.
- **iCKB**: Protokol liquid staking untuk deposit Nervos DAO.

### 📚 4. Resource Hub & Extra Reading List
Koleksi materi pendukung konsep arsitektural:
- Nervos Nation Visual Concepts
- Layered Blockchain Modularity
- Tokenomics & Sustainable Security (PoW + Cell Model)
- Account Abstraction tanpa Account
- Komparasi Virtual Machine (CKB-VM vs EVM vs SVM vs WASM)

---

## 🛠️ Tech Stack
- **Framework**: Next.js / React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Content Format**: Structured Markdown / JSON Data

---

## 📈 Status & Next Progress
- [x] Kurikulum lengkap 3 fase (Beginner, Intermediate, Advance) berhasil dipetakan.
- [x] Deployment versi interaktif ke Vercel ([learnckb.vercel.app](https://learnckb.vercel.app/)).
- [ ] Penambahan modul praktik interaktif live-code playground CCC di browser.
