import { SoilDeviceStatus, SoilTelemetryRecord } from "./types";

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
    tips: "Jaga kelembapan stabil 55–70% (jangan terlalu becek agar bunga tidak rontok & terhindar layu fusarium), tambahkan kalium & kalsium.",
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
    tips: "Cabai tumbuh optimal di tanah gembur agak netral (pH 6.0–6.8). Jika pH < 5.8 berikan kapur dolomit, dan pastikan drainase bedengan lancar.",
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
    tips: "Tomat membutuhkan kelembapan konsisten agar buah tidak pecah (cracking) dan kalsium cukup untuk mencegah busuk ujung buah.",
  },
  {
    key: "padi",
    cropName: "Padi Sawah",
    keywords: ["padi", "gabah", "beras", "ciherang", "inpari"],
    phMin: 5.5,
    phMax: 7.0,
    moistureMin: 75,
    moistureMax: 95,
    tempMin: 24,
    tempMax: 32,
    tips: "Padi membutuhkan tanah jenuh air pada fase vegetatif (75–95%) dan pengeringan berkala (intermittent) menjelang pemasakan bulir.",
  },
  {
    key: "bawang_merah",
    cropName: "Bawang Merah",
    keywords: ["bawang merah", "brambang", "bawang"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 70,
    tempMin: 25,
    tempMax: 32,
    tips: "Umbi bawang merah sensitif terhadap genangan air; jaga tanah lembap namun poros agar umbi tidak busuk.",
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
    tips: "Cocok di dataran tinggi berhawa sejuk dengan tanah gembur kaya bahan organik.",
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
    tips: "Pastikan kecukupan air terutama saat fase pembentukan tongkol dan pengisian biji.",
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
    tips: "Kurangi penyiraman menjelang panen agar kadar kemanisan (Brix) buah melon meningkat optimal.",
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
    tips: "Semangka menyukai tanah berpasir hangat dengan drainase baik dan sinar matahari penuh.",
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
    tips: "Kentang menyukai tanah sedikit asam (pH 5.2–6.2) untuk menekan penyakit kudis umbi (scab).",
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
    tips: "Gunakan mulsa agar buah tidak menyentuh tanah lembap secara langsung.",
  },
  {
    key: "kopi",
    cropName: "Kopi",
    keywords: ["kopi", "arabika", "robusta"],
    phMin: 5.5,
    phMax: 6.5,
    moistureMin: 55,
    moistureMax: 75,
    tempMin: 18,
    tempMax: 28,
    tips: "Kopi tumbuh subur pada tanah kaya humus sedikit asam dengan naungan terukur.",
  },
  {
    key: "sawi",
    cropName: "Sawi / Pakcoy",
    keywords: ["sawi", "pakcoy", "pokcoy", "caisim"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 20,
    tempMax: 29,
    tips: "Sayuran daun membutuhkan kelembapan tanah merata agar daun tetap renyah dan tidak pahit.",
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
    tips: "Kangkung darat maupun air sangat responsif terhadap nitrogen dan tanah basah.",
  },
  {
    key: "terong",
    cropName: "Terong",
    keywords: ["terong", "terung"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 22,
    tempMax: 31,
    tips: "Jaga kelembapan stabil selama pembungaan agar bakal buah terong mengkilap dan tidak kerdil.",
  },
  {
    key: "timun",
    cropName: "Mentimun",
    keywords: ["timun", "mentimun", "ketimun"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 22,
    tempMax: 30,
    tips: "Kekurangan air pada mentimun dapat memicu rasa pahit pada pangkal buah.",
  },
  {
    key: "kedelai",
    cropName: "Kedelai / Kacang Tanah",
    keywords: ["kedelai", "kacang tanah", "kacang panjang", "buncis"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 50,
    moistureMax: 68,
    tempMin: 23,
    tempMax: 31,
    tips: "pH mendekati netral membantu bintil akar Rhizobium mengikat nitrogen secara maksimal.",
  },
  {
    key: "jahe",
    cropName: "Jahe / Rimpang",
    keywords: ["jahe", "kunyit", "kencur", "lengkuas", "temulawak"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 60,
    moistureMax: 75,
    tempMin: 24,
    tempMax: 31,
    tips: "Gemburkan tanah sekitar rimpang secara berkala dan hindari genangan air.",
  },
  {
    key: "selada",
    cropName: "Selada / Kubis",
    keywords: ["selada", "kubis", "kol", "brokoli"],
    phMin: 6.0,
    phMax: 7.0,
    moistureMin: 65,
    moistureMax: 80,
    tempMin: 17,
    tempMax: 25,
    tips: "pH di atas 6.0 penting untuk mencegah penyakit akar gada (Plasmodiophora) pada kubis-kubisan.",
  },
  {
    key: "jeruk",
    cropName: "Jeruk / Pepaya",
    keywords: ["jeruk", "pepaya", "mangga", "alpukat"],
    phMin: 5.8,
    phMax: 6.8,
    moistureMin: 55,
    moistureMax: 72,
    tempMin: 22,
    tempMax: 31,
    tips: "Pastikan perakaran tidak tergenang air hujan lebih dari 24 jam.",
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
    return `Saat ini perangkat ESP32-S3 sedang offline atau belum mengirim data baru, namun target ideal untuk **${target.cropName}** sudah tersimpan dan langsung aktif begitu sensor online.`;
  }

  const lines: string[] = [];

  if (latest.soil_ph === null || latest.sensor_status?.ph === "not_connected") {
    lines.push(`- **Soil pH:** Sensor belum terhubung (Target ideal: **${target.phMin.toFixed(1)} – ${target.phMax.toFixed(1)} pH**).`);
  } else if (latest.soil_ph < target.phMin) {
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** Terlalu asam dibanding target **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**. Disarankan pemberian kapur pertanian/dolomit.`);
  } else if (latest.soil_ph > target.phMax) {
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** Terlalu basa dibanding target **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**. Tambahkan kompos matang/bahan organik.`);
  } else {
    lines.push(`- **Soil pH (${latest.soil_ph.toFixed(2)}):** **Ideal** (masuk rentang **${target.phMin.toFixed(1)}–${target.phMax.toFixed(1)}**).`);
  }

  if (latest.soil_moisture === null || latest.sensor_status?.dms === "not_connected") {
    lines.push(`- **Soil Moisture:** Sensor belum terhubung (Target ideal: **${target.moistureMin}% – ${target.moistureMax}%**).`);
  } else if (latest.soil_moisture < target.moistureMin) {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** Tanah kering (di bawah **${target.moistureMin}%**). Segera lakukan penyiraman.`);
  } else if (latest.soil_moisture > target.moistureMax) {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** Terlalu basah (di atas **${target.moistureMax}%**). Kurangi penyiraman & cek drainase.`);
  } else {
    lines.push(`- **Soil Moisture (${latest.soil_moisture.toFixed(1)}%):** **Ideal** (masuk rentang **${target.moistureMin}%–${target.moistureMax}%**).`);
  }

  if (latest.soil_temperature === null || latest.sensor_status?.temperature === "not_connected") {
    lines.push(`- **Suhu Tanah:** Sensor DS18B20 belum terhubung (Target ideal: **${target.tempMin}°C – ${target.tempMax}°C**).`);
  } else if (latest.soil_temperature < target.tempMin) {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** Lebih dingin dari target (**${target.tempMin}–${target.tempMax}°C**).`);
  } else if (latest.soil_temperature > target.tempMax) {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** Lebih panas dari target (**${target.tempMin}–${target.tempMax}°C**). Gunakan mulsa penutup tanah.`);
  } else {
    lines.push(`- **Suhu Tanah (${latest.soil_temperature.toFixed(1)}°C):** **Ideal** (masuk rentang **${target.tempMin}–${target.tempMax}°C**).`);
  }

  return lines.join("\n");
}
