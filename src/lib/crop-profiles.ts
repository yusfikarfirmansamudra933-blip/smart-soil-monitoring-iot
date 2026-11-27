import { SoilTelemetryRecord } from "./types";

export interface CropIdealProfile {
  key: string;
  cropName: string;
  keywords: string[];
  phMin: number;
  phMax: number;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
  tips: string;
}

export const INDONESIAN_CROP_PROFILES: CropIdealProfile[] = [
  {
    key: "cabai_berbuah",
    cropName: "Cabai (Fase Berbunga/Berbuah)",
    keywords: ["cabai berbuah", "cabe berbuah", "cabai berbunga", "cabe berbunga", "cabai generatif", "rawit berbuah"],
    phMin: 6.0,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 21,
    tempMax: 29,
    tips: "Jaga kelembapan stabil 55–70% agar bunga tidak rontok & bebas layu fusarium; rutin semprot MKP + Kalsium Boron.",
  },
  {
    key: "cabai",
    cropName: "Cabai",
    keywords: ["cabai", "cabe", "lombok", "rawit", "keriting"],
    phMin: 6.0,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 22,
    tempMax: 30,
    tips: "Cabai tumbuh optimal di tanah gembur pH 6.0–6.8 dengan bedengan tinggi agar akar tidak tergenang saat hujan.",
  },
  {
    key: "tomat",
    cropName: "Tomat",
    keywords: ["tomat", "cherry tomato"],
    phMin: 6.0,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 20,
    tempMax: 28,
    tips: "Jaga kelembapan stabil agar kulit buah tomat tidak pecah (cracking) dan cukupi kalsium untuk mencegah busuk pantat buah.",
  },
  {
    key: "padi",
    cropName: "Padi Sawah",
    keywords: ["padi", "gabah", "ciherang", "inpari"],
    phMin: 5.5,
    phMax: 7.0,
    moistureMin: 75,
    moistureMax: 95,
    tempMin: 24,
    tempMax: 32,
    tips: "Terapkan pengairan berselang (macak-macak) saat anakan aktif agar perakaran kuat dan hemat air.",
  },
  {
    key: "bawang_merah",
    cropName: "Bawang Merah",
    keywords: ["bawang merah", "brambang"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 25,
    tempMax: 32,
    tips: "Umbi bawang merah membutuhkan sinar matahari penuh dan tanah poros tidak menggenang.",
  },
  {
    key: "bawang_putih",
    cropName: "Bawang Putih",
    keywords: ["bawang putih"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 16,
    tempMax: 25,
    tips: "Optimal di dataran tinggi sejuk dengan tanah gembur kaya kompos matang.",
  },
  {
    key: "jagung",
    cropName: "Jagung",
    keywords: ["jagung", "jagung manis"],
    phMin: 5.8,
    phMax: 7.0,
    moistureMin: 50,
    moistureMax: 70,
    tempMin: 22,
    tempMax: 32,
    tips: "Pastikan air & pupuk Nitrogen-Kalium tercukupi saat pembentukan bunga jantan dan pengisian tongkol.",
  },
  {
    key: "melon",
    cropName: "Melon",
    keywords: ["melon", "golden melon"],
    phMin: 6.0,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 24,
    tempMax: 31,
    tips: "Kurangi penyiraman 7–10 hari menjelang panen agar rasa buah melon makin manis (Brix tinggi).",
  },
  {
    key: "semangka",
    cropName: "Semangka",
    keywords: ["semangka"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 50,
    moistureMax: 68,
    tempMin: 25,
    tempMax: 33,
    tips: "Cocok di tanah lempung berpasir hangat dengan drainase sangat lancar.",
  },
  {
    key: "kentang",
    cropName: "Kentang",
    keywords: ["kentang"],
    phMin: 5.2,
    phMax: 6.2,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 15,
    tempMax: 22,
    tips: "Tanah sedikit asam (pH 5.2–6.2) membantu menekan jamur kudis umbi kentang.",
  },
  {
    key: "stroberi",
    cropName: "Stroberi",
    keywords: ["stroberi", "strawberry"],
    phMin: 5.5,
    phMax: 6.5,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 16,
    tempMax: 24,
    tips: "Beri mulsa plastik/jerami agar buah stroberi bersih dan tidak busuk menyentuh tanah basah.",
  },
  {
    key: "durian",
    cropName: "Durian",
    keywords: ["durian", "musang king", "bawor", "montong"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 55,
    moistureMax: 72,
    tempMin: 23,
    tempMax: 31,
    tips: "Buat gundukan/busut agar leher akar durian tidak tergenang air pemicu kanker batang Phytophthora.",
  },
  {
    key: "anggur",
    cropName: "Anggur",
    keywords: ["anggur", "anggur import"],
    phMin: 6.2,
    phMax: 7.2,
    moistureMin: 45,
    moistureMax: 65,
    tempMin: 23,
    tempMax: 32,
    tips: "Anggur menyukai media sangat poros (sekam bakar + pasir + kompos) dan stres air terukur sebelum pemangkasan pembuahan.",
  },
  {
    key: "alpukat",
    cropName: "Alpukat",
    keywords: ["alpukat", "alpokat", "miki", "aligator"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 50,
    moistureMax: 68,
    tempMin: 20,
    tempMax: 30,
    tips: "Akar alpukat sangat peka busuk akar jika tergenang; pastikan lubang tanam kaya kompos & drainase tinggi.",
  },
  {
    key: "mangga",
    cropName: "Mangga / Kelengkeng",
    keywords: ["mangga", "kelengkeng", "lengkeng", "rambutan", "jambu"],
    phMin: 5.8,
    phMax: 7.0,
    moistureMin: 50,
    moistureMax: 68,
    tempMin: 23,
    tempMax: 32,
    tips: "Berikan pupuk tinggi Fosfat & Kalium setelah panen dan menjelang induksi pembungaan.",
  },
  {
    key: "pisang",
    cropName: "Pisang / Pepaya",
    keywords: ["pisang", "cavendish", "pepaya", "california"],
    phMin: 5.8,
    phMax: 7.0,
    moistureMin: 60,
    moistureMax: 78,
    tempMin: 23,
    tempMax: 31,
    tips: "Sangat membutuhkan bahan organik tinggi, Kalium cukup, dan parit drainase agar terhindar layu panama/busuk akar.",
  },
  {
    key: "jeruk",
    cropName: "Jeruk / Lemon",
    keywords: ["jeruk", "lemon", "nipis"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 22,
    tempMax: 31,
    tips: "Perhatikan unsur mikro Seng (Zn) dan Magnesium (Mg) agar daun jeruk tidak belang kekuningan.",
  },
  {
    key: "sawit",
    cropName: "Kelapa Sawit",
    keywords: ["sawit", "kelapa sawit", "kelapa"],
    phMin: 5.0,
    phMax: 6.5,
    moistureMin: 60,
    moistureMax: 80,
    tempMin: 24,
    tempMax: 32,
    tips: "Sawit membutuhkan Kalium (KCl), Magnesium (Kieserit/Dolomit), dan Boron rutin di piringan pohon.",
  },
  {
    key: "kopi",
    cropName: "Kopi / Kakao",
    keywords: ["kopi", "arabika", "robusta", "kakao", "cokelat", "teh", "vanili", "lada", "cengkeh"],
    phMin: 5.5,
    phMax: 6.5,
    moistureMin: 55,
    moistureMax: 75,
    tempMin: 18,
    tempMax: 28,
    tips: "Tanaman perkebunan menyukai tanah kaya humus sedikit asam dengan pohon penaung terukur.",
  },
  {
    key: "sawi",
    cropName: "Sawi / Pakcoy / Bayam",
    keywords: ["sawi", "pakcoy", "pokcoy", "caisim", "bayam"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 20,
    tempMax: 29,
    tips: "Sayuran daun membutuhkan kelembapan merata dan suplai Nitrogen organik/NPK ringan agar daun renyah.",
  },
  {
    key: "kangkung",
    cropName: "Kangkung",
    keywords: ["kangkung"],
    phMin: 5.8,
    phMax: 7.0,
    moistureMin: 70,
    moistureMax: 90,
    tempMin: 23,
    tempMax: 32,
    tips: "Tumbuh sangat cepat pada tanah basah kaya kompos dan Nitrogen.",
  },
  {
    key: "terong",
    cropName: "Terong / Okra",
    keywords: ["terong", "terung", "okra", "pare", "oyong", "gambas"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 22,
    tempMax: 31,
    tips: "Jaga kelembapan stabil selama pembungaan agar buah tumbuh lurus, mengkilap, dan tidak rontok.",
  },
  {
    key: "timun",
    cropName: "Mentimun / Labu",
    keywords: ["timun", "mentimun", "ketimun", "labu", "zucchini"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 22,
    tempMax: 30,
    tips: "Hindari kekeringan mendadak agar pangkal buah mentimun tidak terasa pahit.",
  },
  {
    key: "kedelai",
    cropName: "Kedelai / Kacang-kacangan",
    keywords: ["kedelai", "kacang tanah", "kacang panjang", "buncis", "edamame", "kacang hijau"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 50,
    moistureMax: 68,
    tempMin: 23,
    tempMax: 31,
    tips: "pH netral (6.0–7.0) mengoptimalkan bakteri Rhizobium pada bintil akar untuk mengikat Nitrogen alami.",
  },
  {
    key: "jahe",
    cropName: "Jahe / Rimpang / Porang",
    keywords: ["jahe", "kunyit", "kencur", "lengkuas", "temulawak", "porang"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 24,
    tempMax: 31,
    tips: "Bumbun tanah gembur di sekitar rumpun agar rimpang membesar dan tidak tersengat matahari langsung.",
  },
  {
    key: "singkong",
    cropName: "Singkong / Ubi Jalar / Talas",
    keywords: ["singkong", "ketela", "ubi jalar", "ubi", "talas"],
    phMin: 5.5,
    phMax: 6.8,
    moistureMin: 48,
    moistureMax: 68,
    tempMin: 23,
    tempMax: 32,
    tips: "Perbanyak unsur Kalium (abu sekam / KCl) pada umur 2–3 bulan untuk pembesaran umbi.",
  },
  {
    key: "selada",
    cropName: "Selada / Kubis / Brokoli / Wortel",
    keywords: ["selada", "kubis", "kol", "brokoli", "bunga kol", "wortel", "lobak", "seledri", "daun bawang"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 17,
    tempMax: 25,
    tips: "Pertahankan pH >= 6.0 untuk mencegah penyakit akar gada pada keluarga kubis-kubisan.",
  },
  {
    key: "tanaman_hias",
    cropName: "Tanaman Hias (Anggrek / Aglonema / Mawar)",
    keywords: ["anggrek", "aglonema", "monstera", "mawar", "krisan", "melati", "bougenville", "bonsai"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 50,
    moistureMax: 70,
    tempMin: 20,
    tempMax: 29,
    tips: "Gunakan media poros (sekam bakar, pakis, cocopeat tercuci) agar akar mendapat aerasi oksigen cukup.",
  },
];

export function matchCropProfileFromText(text: string): CropIdealProfile | null {
  const lower = text.toLowerCase();
  for (const profile of INDONESIAN_CROP_PROFILES) {
    for (const kw of profile.keywords) {
      if (lower.includes(kw)) {
        return profile;
      }
    }
  }
  return null;
}

export function buildSensorEvaluationSummary(
  latest: SoilTelemetryRecord | null,
  deviceOnline: boolean,
  target: {
    cropName: string;
    phMin: number;
    phMax: number;
    moistureMin: number;
    moistureMax: number;
    tempMin: number;
    tempMax: number;
  }
): string {
  if (!deviceOnline || !latest) {
    return `Saat ini ESP32-S3 sedang offline, namun target ideal **${target.cropName}** sudah tersimpan dan langsung aktif saat sensor online.`;
  }

  const lines: string[] = [];

  if (latest.soil_ph === null || latest.sensor_status?.ph === "not_connected") {
    lines.push(`- **Soil pH:** Belum terhubung (Target ideal: **${target.phMin.toFixed(1)} – ${target.phMax.toFixed(1)} pH**).`);
  } else if (latest.soil_ph < target.phMin) {
    const diff = target.phMin - latest.soil_ph;
    const dolomitTonHa = Math.max(0.5, Number((diff * 1.5).toFixed(1)));
    const dolomitGramTanaman = Math.max(15, Math.round(diff * 35));
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** Terlalu asam (target **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**). Taburkan **kapur dolomit ~${dolomitGramTanaman} gram/lubang tanam** (~${dolomitTonHa} ton/ha).`);
  } else if (latest.soil_ph > target.phMax) {
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** Terlalu basa (target **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**). Tambahkan kompos matang, asam humat, atau belerang pertanian.`);
  } else {
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** **Ideal** (sesuai target **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**).`);
  }

  if (latest.soil_moisture === null || latest.sensor_status?.dms === "not_connected") {
    lines.push(`- **Soil Moisture:** Belum terhubung (Target ideal: **${target.moistureMin}% – ${target.moistureMax}%**).`);
  } else if (latest.soil_moisture < target.moistureMin) {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** Kering (di bawah **${target.moistureMin}%**). Segera lakukan penyiraman.`);
  } else if (latest.soil_moisture > target.moistureMax) {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** Terlalu basah (di atas **${target.moistureMax}%**). Hentikan siram sementara & buka saluran drainase.`);
  } else {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** **Ideal** (masuk rentang **${target.moistureMin}%–${target.moistureMax}%**).`);
  }

  if (latest.soil_temperature === null || latest.sensor_status?.temperature === "not_connected") {
    lines.push(`- **Suhu Tanah:** DS18B20 belum terhubung (Target ideal: **${target.tempMin}°C – ${target.tempMax}°C**).`);
  } else if (latest.soil_temperature < target.tempMin) {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** Dingin (target **${target.tempMin}–${target.tempMax}°C**).`);
  } else if (latest.soil_temperature > target.tempMax) {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** Panas (di atas **${target.tempMax}°C**). Pasang mulsa jerami/perak & siram pagi/sore.`);
  } else {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** **Ideal** (masuk rentang **${target.tempMin}–${target.tempMax}°C**).`);
  }

  return lines.join("\n");
}
