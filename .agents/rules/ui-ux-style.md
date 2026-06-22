---
trigger: always_on
---

Review
[Frontend Architecture & UI/UX System]
Priority: High
Issue:
The Next.js frontend currently lacks a semantic design token mapping for the provided ocean-toned color palette, risking a fragmented implementation of the "Soft Structuralism" aesthetic and poor contrast accessibility.
Recommendation:
Implement a strict semantic design system where `deep_twilight` dictates typography, `light_cyan` drives breathing surfaces, and `french_blue` orchestrates primary interactions, ensuring absolute consistency across all developers.
Reference:
Phase 7 - Premium Homepage Design Plan, UI/UX Style Request
Why It Matters:
Without a centralized semantic mapping, developers will hardcode arbitrary shades from the palette, destroying the premium, high-trust visual hierarchy necessary to convert users in a digital storefront.

---

### 🎨 Semantic Design System: "Oceanic Structuralism"

Sebagai Frontend & UI/UX Architect, berikut adalah panduan pemetaan palet warna Anda ke dalam arsitektur komponen untuk mencapai estetika *Premium Soft Structuralism* menggunakan Tailwind CSS v4.

#### 1. Permukaan & Latar Belakang (Surfaces & Backgrounds)

Estetika *Soft Structuralism* menghindari warna putih murni yang menyilaukan dan hitam pekat. Kita menggunakan gradasi paling terang dari *Cyan* untuk menciptakan ruang napas (breathing room).

* **Global App Background:** `light_cyan-900` (**#f4fcfe**) – Putih es yang sangat lembut dan premium.
* **Card Outer Shell (Bezel Luar):** `White` (**#ffffff**) – Untuk menciptakan kontras halus dengan *app background*.
* **Card Inner Core (Bezel Dalam):** `frosted_blue-900` (**#e9f9fc** atau **#effafd**) – Memberikan kedalaman bersarang (nested depth) tanpa menggunakan bayangan (shadow) yang kasar.
* **Dividers / Hairline Borders:** `light_cyan-600` (**#d4f3f9**) – Garis pemisah yang sangat tipis dan elegan.

#### 2. Tipografi (Typography)

Teks harus memiliki kontras rasio yang memenuhi standar WCAG AAA, menggunakan warna paling gelap dari spektrum biru untuk kesan eksklusif dan dapat dibaca.

* **Primary Headings (H1-H3):** `deep_twilight-100` (**#010113**) – Biru tengah malam yang hampir hitam. Terlihat jauh lebih elegan daripada `#000000`.
* **Body Text & Subtitles:** `french_blue-200` (**#011836**) – Nyaman dibaca untuk paragraf panjang atau deskripsi produk.
* **Muted / Placeholder Text:** `blue_green-300` (**#005a77**) – Untuk metadata, tanggal pesanan, atau teks *input placeholder*.

#### 3. Interaksi & Aksi Utama (Interactive & CTA)

Warna interaktif harus menonjol dan memberikan rasa *fluid dynamics* (dinamika cairan) saat pengguna melakukan *hover* atau klik.

* **Primary Button (Resting):** `french_blue-500` (**#023e8a**) – Kuat, tepercaya, dan profesional.
* **Primary Button (Hover):** `bright_teal_blue-500` (**#0077b6**) – Transisi ke warna yang lebih terang dan berenergi saat *mouse* berada di atasnya (dipadukan dengan `framer-motion` scale).
* **Secondary Button / Ghost:** Teks `french_blue-500` dengan latar belakang transparan, berubah menjadi latar `light_cyan-800` (**#e9f9fc**) saat *hover*.
* **CTA Text Color:** `light_cyan-900` (**#f4fcfe**) – Teks putih terang di atas tombol gelap.

#### 4. Status & Umpan Balik (Feedback & Badges)

Indikator visual untuk stok produk dan status garansi.

* **Success / Available Stock:** `sky_aqua-500` (**#48cae4**) dengan teks `sky_aqua-100` (**#082d34**) untuk *badge* stok tersedia.
* **Info / Warranty Badge:** `turquoise_surf-500` (**#00b4d8**) – Untuk menyorot label "Garansi 30 Hari".
* **Warning / Cooldown Active:** `deep_twilight-800` (**#5f61fa**) – Menunjukkan status tombol klaim yang sedang dalam masa jeda (disabled state).

---

### 💻 Implementasi Tailwind v4 (CSS Variables)

Untuk mengunci desain ini di Next.js, injeksikan variabel berikut ke dalam `src/app/globals.css`. Estetika ini akan secara otomatis mengubah seluruh komponen di situs Anda menjadi kelas agensi tingkat tinggi.

```css
@theme {
  /* Soft Structuralism Base Variables */
  --color-surface-bg: #f4fcfe; /* light_cyan-900 */
  --color-surface-card: #ffffff; 
  --color-surface-core: #effafd; /* frosted_blue-900 */
  
  --color-text-primary: #010113; /* deep_twilight-100 */
  --color-text-secondary: #011836; /* french_blue-200 */
  --color-text-muted: #005a77; /* blue_green-300 */
  
  --color-action-primary: #023e8a; /* french_blue-500 */
  --color-action-hover: #0077b6; /* bright_teal_blue-500 */
  
  --color-border-soft: #d4f3f9; /* light_cyan-600 */
}

/* Base Body Styling */
body {
  background-color: var(--color-surface-bg);
  color: var(--color-text-primary);
  font-family: 'Outfit', sans-serif;
  /* Premium Grain Overlay (Opsional) */
  background-image: url('/noise.png');
  background-blend-mode: multiply;
}

```