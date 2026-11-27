import {
  buildSensorEvaluationSummary,
  matchCropProfileFromText,
} from "./crop-profiles";
import { SoilDeviceConfig, SoilTelemetryRecord } from "./types";

export interface LeafColorMetrics {
  greenPct: number;
  yellowPct: number;
  brownPct: number;
  whitePct: number;
}

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

export function buildLeafVisualDiagnosis(
  cropName: string,
  metrics: LeafColorMetrics,
  latest: SoilTelemetryRecord | null,
  isOnline: boolean,
  phMin: number
): string {
  const { greenPct, yellowPct, brownPct, whitePct } = metrics;
  const findings: string[] = [];
  const actions: string[] = [];

  if (brownPct >= 12) {
    findings.push(
      `Terdeteksi area **cokelat/hitam nekrosis cukup tinggi (${brownPct.toFixed(
        0
      )}%)** yang mengindikasikan gejala **Bercak Daun (*Cercospora* / *Alternaria*) atau Patek (*Antraknosa*)**.`
    );
    actions.push(
      "Pangkas daun yang bercak parah agar spora tidak menular, lalu semprot fungisida kontak **Mankozeb / Klorotalonil** atau kocor **Trichoderma**."
    );
  }

  if (yellowPct >= 15) {
    findings.push(
      `Terdeteksi warna **kuning klorosis (${yellowPct.toFixed(
        0
      )}%)** yang menandakan **kekurangan unsur Nitrogen (N) / Magnesium (Mg)** atau indikasi awal **Virus Kuning (Gemini)**.`
    );
    if (
      isOnline &&
      latest?.soil_ph !== null &&
      latest?.soil_ph !== undefined &&
      latest.sensor_status?.ph !== "not_connected" &&
      latest.soil_ph < phMin
    ) {
      actions.push(
        `Sensor pH tanah Anda sedang asam (**${latest.soil_ph.toFixed(
          2
        )}** < ${phMin.toFixed(
          1
        )}), sehingga akar gagal menyerap hara! Taburkan **Kapur Dolomit 25–40g/tanaman** terlebih dahulu sebelum memupuk NPK.`
      );
    } else {
      actions.push(
        "Berikan kocor **NPK 16-16-16 (3–5 g/L)** ditambah semprot pupuk mikro **Magnesium Sulfat + Fe/Zn** pada pagi hari."
      );
    }
  }

  if (whitePct >= 14) {
    findings.push(
      `Terdeteksi bercak **keperakan / putih (${whitePct.toFixed(
        0
      )}%)** yang sering berkaitan dengan hisapan **Thrips, Kutu Kebul (*Bemisia*), atau Embun Tepung** di permukaan daun.`
    );
    actions.push(
      "Periksa balik daun; pasang **Yellow Trap** dan semprot ekstrak **Bawang Putih + Daun Mimba** (atau bahan aktif **Abamektin / Imidakloprid** bila populasi padat) pada sore hari."
    );
  }

  if (findings.length === 0) {
    findings.push(
      `Dominasi pigmen **hijau klorofil sehat (${greenPct.toFixed(
        0
      )}%)** tampak baik tanpa bercak nekrosis maupun klorosis berat.`
    );
    actions.push(
      "Pertahankan jadwal penyiraman sesuai target kelembapan tanah serta semprot **Kalsium + Pupuk Hayati** preventif 10 hari sekali."
    );
  }

  return `**Hasil Analisis Dokter Daun AI (${cropName}):**
- **Komposisi Visual Daun:** Hijau Sehat \`${greenPct.toFixed(
    0
  )}%\` • Kuning Klorosis \`${yellowPct.toFixed(
    0
  )}%\` • Cokelat/Bercak \`${brownPct.toFixed(
    0
  )}%\` • Putih/Keperakan \`${whitePct.toFixed(0)}%\`
- **Diagnosis Utama:** ${findings.join(" ")}
- **Tindakan Disarankan:** ${actions.join(" ")}`;
}

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
        )}). **Taburkan Kapur Dolomit 20–40 gram/tanaman terlebih dahulu** 5–7 hari sebelum pupuk NPK agar pupuk tidak terkunci di tanah!`
      : "";

  if (hasAny(lowerMsg, ["dolomit", "kapur", "asam", "naikkan ph", "menaikkan ph"])) {
    return `**Panduan Menaikkan pH Tanah Asam (Kapur Dolomit) untuk ${cropName}:**
1. **Dosis Umum:** Untuk menaikkan pH \`0.5 – 1.0\` poin, taburkan **Kapur Dolomit \`1.5 – 2 ton/ha\`** (sekitar **\`25 – 50 gram per lubang tanam\`**).
2. **Aplikasi Tanaman Aktif:** Kocor larutan **\`1 sdm Dolomit + 2 ml Asam Humat per liter air\`** (200 ml/tanaman) di sekeliling tajuk tiap 10 hari.
3. **Jeda Pupuk:** Beri jeda 5–7 hari sebelum memupuk Urea/ZA agar Nitrogen tidak menguap.${phNote}`;
  }

  return `**Rekomendasi Program Pemupukan ${cropName}:**
1. **Pupuk Dasar (Sebelum / Awal Tanam):**
   - **Pupuk Kandang Fermentasi / Kompos Matang:** \`0.5 – 1 kg\`/lubang + **Dolomit** \`25 gram\` + **TSP/SP-36** \`5 gram\`.
2. **Fase Vegetatif (7 – 30 HST — Akar & Daun):**
   - Kocor **NPK \`16-16-16\`** dosis **\`3 – 5 gram/liter air\`** (\`200 ml\`/tanaman) tiap **7–10 hari**.
3. **Fase Generatif (Berbunga & Berbuah):**
   - Kocor **NPK \`16-16-16\` + \`MKP\` / \`KNO3 Putih\`** (\`5 gram/liter\`, \`250 ml\`/tanaman) tiap **10 hari**.
   - Semprot daun dengan **\`Kalsium + Boron\`** tiap **7–10 hari** untuk mencegah bunga rontok & busuk buah.${phNote}`;
}

function buildPestAndDiseaseGuide(cropName: string, lowerMsg: string): string {
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
   - **Melengkung ke atas + keperakan:** **Thrips**.
   - **Melengkung ke bawah seperti sendok terbalik:** **Tungau (*Mites*)**.
   - **Serangga putih halus di balik daun:** **Kutu Kebul (*Bemisia tabaci*)**.
2. **Solusi Organik / Murah:**
   - Pasang **Perangkap Likat Kuning (*Yellow Trap*)** & semprot ekstrak **Bawang Putih + Daun Mimba/Sirsak + perekat sabun cair (\`1 ml/L\`)** ke balik daun sore hari tiap 3–4 hari.
3. **Solusi Kimia (Rotasi Bahan Aktif):**
   - **Thrips & Tungau:** **Abamektin** atau **Spinetoram** (sore hari).
   - **Kutu Kebul:** **Imidakloprid** atau **Asetamiprid** (pagi hari).`;
  }

  if (hasAny(lowerMsg, ["rontok", "gugur", "tidak jadi buah"])) {
    return `**Cara Mencegah Bunga / Bakal Buah Rontok pada ${cropName}:**
1. **Nutrisi Penguat Tangkai:** Semprot **Kalsium + Boron** dan **MKP (\`2–3 g/L\`)** tiap 7 hari; kurangi pupuk tinggi Nitrogen (Urea).
2. **Jaga Kelembapan Tanah Stabil:** Hindari tanah kekeringan ekstrem lalu disiram berlebihan mendadak.
3. **Cek Hama Bunga:** Waspadai Thrips di kelopak bunga dan pasang perangkap **Petrogenol** untuk Lalat Buah.`;
  }

  if (hasAny(lowerMsg, ["patek", "antraknosa", "busuk buah", "bercak hitam", "lalat buah"])) {
    return `**Cara Mengatasi Patek (Antraknosa), Busuk Buah & Lalat Buah pada ${cropName}:**
1. **Sanitasi Kebun:** Petik & musnahkan buah yang terkena bercak hitam jauh dari lahan.
2. **Perangkap Lalat Buah:** Pasang botol **Metil Eugenol (*Petrogenol*)** di tepi lahan.
3. **Fungisida Terjadwal:** Semprot **Kalsium** + rotasi fungisida kontak (**Mankozeb / Klorotalonil**) dengan sistemik (**Azoksistrobin / Difenokonazol**) tiap 5–7 hari.`;
  }

  if (hasAny(lowerMsg, ["layu", "fusarium", "bakteri", "busuk akar", "busuk batang", "rebah semai"])) {
    return `**Cara Mengatasi Penyakit Layu (Fusarium / Bakteri) & Busuk Akar pada ${cropName}:**
1. **Tes Cepat Batang di Air Bening:** Jika keluar cairan putih seperti asap susu = **Layu Bakteri (*Ralstonia*)**; jika pembuluh cokelat tanpa asap = **Layu Jamur Fusarium**.
2. **Penanganan:** Cabut tanaman sakit, taburi lubang dengan **Dolomit**, lalu kocor tanaman sehat dengan **Trichoderma + PGPR** dan jaga pH tanah \`>= 6.0\`.`;
  }

  if (hasAny(lowerMsg, ["ulat", "bolong", "berlubang", "wereng", "walang", "belalang", "keong"])) {
    return `**Cara Mengatasi Ulat, Wereng & Pemakan Daun pada ${cropName}:**
1. **Hayati/Nabati:** Semprot *Bacillus thuringiensis* (Bt) atau ekstrak daun pepaya + serai pada sore hari.
2. **Kimia Terukur:** Gunakan bahan aktif **Emamektin Benzoat** untuk ulat, atau **Pimetrozin / Buprofezin** untuk wereng.`;
  }

  if (hasAny(lowerMsg, ["kuning", "menguning", "pucat", "kerdil", "bercak daun"])) {
    return `**Diagnosis Daun Menguning / Kerdil pada ${cropName}:**
1. **Daun Tua Menguning:** Kekurangan **Nitrogen/Magnesium** atau **pH tanah terlalu asam (< 5.5)** → cek pH, beri Dolomit + NPK \`16-16-16\`.
2. **Pucuk Muda Kuning Cerah Kaku:** Gejala **Virus Gemini** (vektor Kutu Kebul) → basmi kutu kebul & semprot pupuk mikro + asam amino.`;
  }

  return `**Panduan Pengendalian Hama & Penyakit Terpadu (PHT) untuk ${cropName}:**
1. Pasang **Yellow Trap**, jaga pH tanah ideal (\`6.0–6.8\`), dan kocor **Trichoderma** sebulan sekali.
2. Semprot pestisida nabati (**Bawang Putih + Daun Mimba + Serai**) rutin seminggu sekali pada sore hari.
3. Anda juga dapat **memotret daun tanaman lewat tombol Kamera** di bawah untuk dianalisis oleh **Dokter Daun AI**!`;
}

export function runLocalAgronomyExpert(
  message: string,
  currentCfg: SoilDeviceConfig,
  latest: SoilTelemetryRecord | null,
  isDeviceOnline: boolean,
  leafMetrics?: LeafColorMetrics | null
): AgronomyExpertResult {
  const lower = message.toLowerCase();
  const matchedCrop = matchCropProfileFromText(message);

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

  const targetCropName = matchedCrop
    ? matchedCrop.cropName
    : currentCfg.active_crop || "Tanaman Umum";

  const shouldUpdateCrop = Boolean(
    matchedCrop &&
      (matchedCrop.cropName !== currentCfg.active_crop ||
        (!asksFertilizer && !asksPestOrDisease && !leafMetrics))
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

  if (leafMetrics) {
    sections.push(
      buildLeafVisualDiagnosis(targetCropName, leafMetrics, latest, isDeviceOnline, phMin)
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

  if (
    asksWateringOrSoil ||
    shouldUpdateCrop ||
    Boolean(leafMetrics) ||
    (!asksFertilizer && !asksPestOrDisease)
  ) {
    const evalSummary = buildSensorEvaluationSummary(latest, isDeviceOnline, {
      cropName: targetCropName,
      phMin,
      phMax,
      moistureMin,
      moistureMax,
      tempMin,
      tempMax,
    });
    sections.push(
      `**Evaluasi Sensor Live (${currentCfg.device_id} — ${targetCropName}):**\n${evalSummary}`
    );
    if (matchedCrop && !asksFertilizer && !asksPestOrDisease && !leafMetrics) {
      sections.push(`**Tips Budidaya:** ${matchedCrop.tips}`);
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
