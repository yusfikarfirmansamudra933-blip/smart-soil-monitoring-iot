import {
  buildSensorEvaluationSummary,
  matchCropProfileFromText,
} from "./crop-profiles";
import { SoilDeviceConfig, SoilTelemetryRecord } from "./types";

export interface AgronomyExpertResult {
  shouldUpdateCrop: boolean;
  cropName: string;
  phMin: number;
  phMax: number;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
  reply: string;
}

const hasAny = (text: string, words: string[]) =>
  words.some((w) => text.includes(w));

function buildFertilizerGuide(
  cropName: string,
  lowerMsg: string,
  latest: SoilTelemetryRecord | null,
  isOnline: boolean,
  phMin: number
): string {
  const phNote =
    isOnline &&
    latest?.soil_ph !== null &&
    latest?.soil_ph !== undefined &&
    latest.sensor_status?.ph !== "not_connected" &&
    latest.soil_ph < phMin
      ? `\n\n**Catatan Penting dari Sensor pH Live (${latest.soil_ph.toFixed(
          2
        )}):** Tanah Anda sedang asam (< ${phMin.toFixed(
          1
        )}). **Taburkan Kapur Dolomit 20–40 gram/tanaman terlebih dahulu** 5–7 hari sebelum pupuk NPK agar pupuk tidak terkunci di tanah dan bisa diserap akar!`
      : "";

  if (hasAny(lowerMsg, ["dolomit", "kapur", "asam", "naikkan ph", "menaikkan ph"])) {
    return `**Panduan Menaikkan pH Tanah Asam (Kapur Dolomit) untuk ${cropName}:**
1. **Dosis Umum:** Untuk menaikkan pH sebesar \`0.5 – 1.0\` poin, taburkan **Kapur Pertanian / Dolomit \`CaMg(CO3)2\` sebanyak \`1.5 – 2 ton/ha\`** (sekitar **\`25 – 50 gram per lubang tanam\`** atau \`1 genggam per meter persegi\`).
2. **Cara Aplikasi pada Tanaman yang Sudah Tumbuh:** Kocor larutan **\`1 sendok makan Dolomit + 2 ml Asam Humat per liter air\`** (200 ml per pohon) di sekeliling tajuk daun, ulangi tiap 10 hari sampai sensor pH naik ke rentang ideal.
3. **Hindari Mencampur Langsung:** Jangan mencampur dolomit bersamaan dengan Urea/ZA karena memicu penguapan Nitrogen — beri jeda minimal 5–7 hari.${phNote}`;
  }

  return `**Rekomendasi Program Pemupukan ${cropName}:**
1. **Pupuk Dasar (Sebelum / Awal Tanam):**
   - **Pupuk Kandang Fermentasi / Kompos Matang:** \`0.5 – 1 kg\` per lubang tanam + **Dolomit** \`25 gram\` + **TSP/SP-36** \`5 gram\` (campur merata di media tanah).
2. **Fase Vegetatif (Umur 7 – 30 HST — Pertumbuhan Akar & Daun):**
   - Kocor **NPK \`16-16-16\`** dosis **\`3 – 5 gram per liter air\`** (\`200 ml\`/tanaman) setiap **7–10 hari sekali**.
   - Opsional tambahkan **POC / Asam Humat** agar tanah tetap gembur.
3. **Fase Generatif (Mulai Berbunga & Berbuah):**
   - Kocor **NPK \`16-16-16\` + \`MKP\` / \`KNO3 Putih\`** (\`5 gram/liter\`, \`250 ml\`/tanaman) tiap **10 hari**.
   - Semprot daun dengan **Pupuk \`Kalsium + Boron\`** setiap **7–10 hari** untuk memperkuat tangkai bunga, mencegah rontok, dan mencegah busuk buah.${phNote}`;
}

function buildPestAndDiseaseGuide(cropName: string, lowerMsg: string): string {
  // 1. Daun keriting / Thrips / Tungau / Kutu Kebul
  if (
    hasAny(lowerMsg, [
      "keriting",
      "kriting",
      "thrips",
      "trips",
      "tungau",
      "mite",
      "kutu kebul",
      "kutu putih",
      "bemisia",
      "afid",
      "aphid",
      "kutu daun",
    ])
  ) {
    return `**Cara Mengatasi Daun Keriting, Thrips, Tungau & Kutu Kebul pada ${cropName}:**
1. **Kenali Penyebabnya:**
   - **Melengkung ke atas + warna keperakan:** Serangan **Thrips**.
   - **Melengkung ke bawah seperti sendok terbalik + kaku:** Serangan **Tungau (*Mites*)**.
   - **Beterbangan putih di balik daun + memicu virus kuning:** **Kutu Kebul (*Bemisia tabaci*)**.
2. **Solusi Organik / Murah (Pencegahan & Serangan Ringan):**
   - Pasang **Perangkap Likat Kuning (*Yellow Trap*)** di atas tajuk tanaman.
   - Semprot ekstrak **Bawang Putih + Daun Mimba/Sirsak + sedikit Sabun Cuci Piring Cair (\`1 ml/liter\` sebagai perekat)** ke **balik permukaan daun** pada sore hari tiap 3–4 hari.
3. **Solusi Kimia Tepat Sasaran (Jika Serangan Berat — Rotasi Bahan Aktif):**
   - **Thrips & Tungau:** Gunakan bahan aktif **Abamektin** atau **Spinetoram** (sore hari).
   - **Kutu Kebul & Kutu Daun:** Gunakan bahan aktif **Imidakloprid** atau **Asetamiprid** (pagi hari).
   - Hindari pupuk tinggi Nitrogen (Urea berlebih) saat tanaman terserang karena membuat pucuk makin lunak disukai kutu.`;
  }

  // 2. Bunga / Buah Rontok
  if (hasAny(lowerMsg, ["rontok", "gugur", "tidak jadi buah"])) {
    return `**Cara Mencegah & Mengatasi Bunga / Bakal Buah Rontok pada ${cropName}:**
1. **Cukupi Kalsium (Ca), Kalium (K), & Boron (B):** Semprot **Kalsium + Boron** dan **MKP (\`Mono Kalium Phosphate\`, \`2–3 gram/liter\`)** setiap 7 hari sekali; hentikan sementara pupuk Urea tinggi Nitrogen.
2. **Jaga Kelembapan Tanah Stabil:** Tanah yang terlalu kering lalu tiba-tiba disiram berlebihan membuat tanaman stres dan menggugurkan bunga (pantau angka *Soil Moisture* di dashboard agar stabil).
3. **Waspadai Hama Penyerang Bunga:** Cek apakah ada **Thrips** di dalam kelopak bunga atau **Lalat Buah** pada pentil buah.`;
  }

  // 3. Patek / Antraknosa / Busuk Buah / Lalat Buah
  if (
    hasAny(lowerMsg, [
      "patek",
      "antraknosa",
      "busuk buah",
      "bercak hitam",
      "lalat buah",
    ])
  ) {
    return `**Cara Mengatasi Patek (Antraknosa), Busuk Buah & Lalat Buah pada ${cropName}:**
1. **Sanitasi Kebun (Wajib Pertama):** Petik semua buah yang busuk/terkena patek, masukkan ke kantong tertutup, lalu bakar atau kubur jauh dari lahan (jangan dibuang di parit kebun agar spora jamur tidak menyebar).
2. **Jika Berlubang Kecil & Ada Belatung (Lalat Buah):** Pasang botol perangkap kapas bertetes **Metil Eugenol (*Petrogenol*)** di pinggir kebun.
3. **Jika Bercak Cekung Hitam/Oranye Melingkar (Jamur Patek/Antraknosa):**
   - Semprot **Kalsium** untuk mempertebal dinding sel buah.
   - Aplikasikan fungisida kontak **Mankozeb / Klorotalonil** bergantian (rotasi) dengan fungisida sistemik **Azoksistrobin / Difenokonazol** setiap 5–7 hari terutama setelah hujan.`;
  }

  // 4. Layu Fusarium / Layu Bakteri / Busuk Akar
  if (
    hasAny(lowerMsg, [
      "layu",
      "fusarium",
      "bakteri",
      "busuk akar",
      "busuk batang",
      "rebah semai",
    ])
  ) {
    return `**Cara Mengatasi Penyakit Layu (Fusarium / Bakteri) & Busuk Akar pada ${cropName}:**
1. **Tes Cepat 1 Menit (Bedakan Jamur vs Bakteri):** Potong pangkal batang tanaman yang layu lalu celupkan ke segelas air bening. Jika keluar **cairan putih keruh seperti asap susu**, itu **Layu Bakteri (*Ralstonia*)**; jika tidak keluar asap namun cincin pembuluh batang cokelat, itu **Layu Jamur Fusarium**.
2. **Langkah Penanganan:**
   - Cabut tanaman yang sudah layu parah beserta tanah perakarannya, lalu taburi bekas lubangnya dengan **Kapur Dolomit** segenggam penuh.
   - Kocor tanaman sehat di sekitarnya dengan agen hayati **Trichoderma sp. + PGPR (*Pseudomonas fluorescens*)** yang dicampur kompos/air cucian beras.
   - Pastikan pH tanah tidak asam (target \`>= 6.0\`) dan kurangi kelembapan berlebih / genangan air.`;
  }

  // 5. Ulat / Wereng / Daun Berlubang / Daun Kuning Umum
  if (
    hasAny(lowerMsg, [
      "ulat",
      "bolong",
      "berlubang",
      "wereng",
      "walang",
      "belalang",
      "keong",
    ])
  ) {
    return `**Cara Mengatasi Serangan Ulat, Wereng & Pemakan Daun pada ${cropName}:**
1. **Pengendalian Ramah Lingkungan:** Semprot agen hayati *Bacillus thuringiensis* (Bt) atau ekstrak daun pepaya + serai wangi pada **sore menjelang malam** (karena ulat aktif makan di malam hari).
2. **Pengendalian Kimia (Jika Populasi Tinggi):** Gunakan insektisida berbahan aktif **Emamektin Benzoat** atau **Klorantraniliprol** untuk ulat grayak/penggerek buah, atau **Buprofezin / Pimetrozin** khusus wereng pada padi.`;
  }

  if (hasAny(lowerMsg, ["kuning", "menguning", "pucat", "kerdil", "bercak daun"])) {
    return `**Diagnosis Daun Menguning / Kerdil pada ${cropName}:**
1. **Daun Tua (Bawah) Menguning Merata:** Biasanya kekurangan **Nitrogen (N)** atau **Magnesium (Mg)**, atau akar terhambat karena **pH tanah terlalu asam (< 5.5)** → cek sensor pH, beri Dolomit bila asam lalu susul NPK \`16-16-16\`.
2. **Pucuk Daun Muda Kuning Cerah / Belang Mosaik + Kaku:** Gejala **Virus Kuning (Gemini)** yang ditularkan **Kutu Kebul** → kendalikan kutu kebul segera & semprot pupuk mikro (\`Zn, Fe, Mn\`) + asam amino untuk memulihkan daya tahan tanaman.
3. **Bercak Cokelat Bertepi Kuning:** Gejala jamur bercak daun (*Cercospora*) → pangkas daun bawah yang tua agar sirkulasi udara lancar dan semprot fungisida Mankozeb.`;
  }

  // Panduan umum Hama & Penyakit
  return `**Panduan Pengendalian Hama & Penyakit Terpadu (PHT) untuk ${cropName}:**
1. **Pencegahan Dasar:** Jaga pH tanah ideal (\`6.0–6.8\`), hindari jarak tanam terlalu rapat, dan pasang **Perangkap Likat Kuning (*Yellow Trap*)** untuk memantau kutu sejak dini.
2. **Pestisida Nabati Rutin (1x Seminggu):** Rebusan/fermentasi **Bawang Putih + Daun Mimba/Sirsak + Serai** disemprotkan sore hari efektif menekan kutu kebul, thrips, dan ulat ringan.
3. **Penyakit Jamur Musim Hujan:** Kocor perakaran dengan **Trichoderma** sebulan sekali dan semprot **Kalsium** agar jaringan daun & buah tebal tahan jamur patek/layu.
*(Sebutkan gejala spesifiknya — misalnya **"daun keriting"**, **"bunga rontok"**, **"buah busuk hitam"**, atau **"tanaman layu"** — agar saya berikan obat yang paling tepat!)*`;
}

export function runLocalAgronomyExpert(
  message: string,
  currentCfg: SoilDeviceConfig,
  latest: SoilTelemetryRecord | null,
  isDeviceOnline: boolean
): AgronomyExpertResult {
  const lower = message.toLowerCase();
  const matchedCrop = matchCropProfileFromText(message);

  // Tentukan apakah pesan ini juga bertanya tentang pupuk / hama / penyakit / siram
  const asksFertilizer = hasAny(lower, [
    "pupuk",
    "mupuk",
    "pemupukan",
    "npk",
    "urea",
    "kcl",
    "mkp",
    "kno3",
    "dolomit",
    "kapur",
    "kompos",
    "kandang",
    "poc",
    "nutrisi",
    "dosis",
    "takaran",
    "subur",
  ]);

  const asksPestOrDisease = hasAny(lower, [
    "hama",
    "penyakit",
    "obat",
    "pestisida",
    "fungisida",
    "insektisida",
    "keriting",
    "kriting",
    "kutu",
    "thrips",
    "trips",
    "tungau",
    "ulat",
    "lalat",
    "wereng",
    "patek",
    "antraknosa",
    "layu",
    "busuk",
    "jamur",
    "rontok",
    "gugur",
    "kuning",
    "menguning",
    "bercak",
    "kerdil",
    "bolong",
  ]);

  const asksWateringOrSoil = hasAny(lower, [
    "siram",
    "penyiraman",
    "air",
    "kering",
    "basah",
    "becek",
    "kondisi",
    "cek tanah",
    "kesehatan tanah",
    "bagus",
    "cocok",
  ]);

  // Hanya ganti konfigurasi tanaman otomatis jika petani menyebut tanaman DAN bukan sekadar nanya hama tanaman aktif yang sama
  const targetCropName = matchedCrop
    ? matchedCrop.cropName
    : currentCfg.active_crop || "Tanaman Umum";

  const shouldUpdateCrop = Boolean(
    matchedCrop &&
      (matchedCrop.cropName !== currentCfg.active_crop ||
        (!asksFertilizer && !asksPestOrDisease))
  );

  const phMin = matchedCrop ? matchedCrop.phMin : currentCfg.ph_min_alarm;
  const phMax = matchedCrop ? matchedCrop.phMax : currentCfg.ph_max_alarm;
  const moistureMin = matchedCrop
    ? matchedCrop.moistureMin
    : currentCfg.moisture_min_alarm;
  const moistureMax = matchedCrop
    ? matchedCrop.moistureMax
    : currentCfg.moisture_max_alarm;
  const tempMin = matchedCrop ? matchedCrop.tempMin : currentCfg.temp_min_alarm;
  const tempMax = matchedCrop ? matchedCrop.tempMax : currentCfg.temp_max_alarm;

  const sections: string[] = [];

  if (shouldUpdateCrop && matchedCrop) {
    sections.push(
      `Target ideal sistem telah saya kalibrasi otomatis untuk **${matchedCrop.cropName}**:\n- **pH Tanah Ideal:** ${phMin.toFixed(
        1
      )} – ${phMax.toFixed(
        1
      )}\n- **Soil Moisture Ideal:** ${moistureMin}% – ${moistureMax}%\n- **Suhu Tanah Ideal:** ${tempMin}°C – ${tempMax}°C`
    );
  }

  if (asksFertilizer) {
    sections.push(
      buildFertilizerGuide(targetCropName, lower, latest, isDeviceOnline, phMin)
    );
  }

  if (asksPestOrDisease) {
    sections.push(buildPestAndDiseaseGuide(targetCropName, lower));
  }

  if (asksWateringOrSoil || shouldUpdateCrop || (!asksFertilizer && !asksPestOrDisease)) {
    const evalSummary = buildSensorEvaluationSummary(latest, isDeviceOnline, {
      cropName: targetCropName,
      phMin,
      phMax,
      moistureMin,
      moistureMax,
      tempMin,
      tempMax,
    });
    sections.push(`**Evaluasi Sensor Live (${currentCfg.device_id} — ${targetCropName}):**\n${evalSummary}`);
    if (matchedCrop && !asksFertilizer && !asksPestOrDisease) {
      sections.push(`**Tips Budidaya:** ${matchedCrop.tips}`);
    } else if (!matchedCrop && !asksFertilizer && !asksPestOrDisease && !asksWateringOrSoil) {
      sections.push(
        `Anda dapat bertanya langsung tanpa batas — contohnya:\n- *"Saya menanam cabai rawit"* (otomatis kalibrasi target ideal)\n- *"Jadwal dan dosis pupuk supaya berbuah lebat"*\n- *"Cara mengatasi daun keriting dan kutu kebul"*\n- *"Kenapa bunga cabai saya rontok?"*`
      );
    }
  }

  return {
    shouldUpdateCrop,
    cropName: targetCropName,
    phMin,
    phMax,
    moistureMin,
    moistureMax,
    tempMin,
    tempMax,
    reply: sections.join("\n\n"),
  };
}
