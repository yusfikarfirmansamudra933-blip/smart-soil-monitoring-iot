import {
  ChargingState,
  DmsInterfaceMode,
  PhInterfaceMode,
  SensorConnectionState,
  SoilDeviceConfig,
} from "./types";

export interface ModularDriverInfo {
  id: string;
  name: string;
  hardwareModel: string;
  interfaceMode: string;
  datasheetConfirmed: boolean;
  notes: string;
}

export const PH_INTERFACE_OPTIONS: {
  value: PhInterfaceMode;
  label: string;
  description: string;
}[] = [
  {
    value: "pending_datasheet",
    label: "Pending Datasheet Inspection (Modular Default)",
    description:
      "Menunggu konfirmasi spesifikasi fisik sensor pH tanah (belum diasumsikan RS485 atau Analog).",
  },
  {
    value: "analog_adc",
    label: "Analog Voltage Output (ESP32 ADC 12-bit)",
    description:
      "Jika datasheet sensor pH tanah menggunakan keluaran tegangan analog 0–3.3V / 0–5V.",
  },
  {
    value: "rs485_modbus",
    label: "RS485 Modbus RTU (MAX485 Transceiver)",
    description:
      "Jika datasheet sensor pH tanah mengonfirmasi protokol RS485 Modbus RTU.",
  },
  {
    value: "uart",
    label: "UART Serial TTL",
    description:
      "Jika datasheet sensor pH tanah menggunakan komunikasi serial TTL langsung.",
  },
];

export const DMS_INTERFACE_OPTIONS: {
  value: DmsInterfaceMode;
  label: string;
  description: string;
}[] = [
  {
    value: "pending_datasheet",
    label: "Pending Datasheet Inspection (Modular Default)",
    description:
      "Menunggu pemeriksaan spesifikasi sensor DMS (belum diasumsikan analog/digital sebelum kalibrasi).",
  },
  {
    value: "analog_adc",
    label: "Analog Resistance / Voltage Probe (ESP32 ADC)",
    description:
      "Pembacaan nilai mentah ADC (0–4095) dengan konversi kalibrasi Dry/Wet ke persentase.",
  },
  {
    value: "digital_gpio",
    label: "Digital Threshold / Pulse Output (GPIO)",
    description:
      "Pembacaan sinyal digital atau frekuensi pulsa pada pin GPIO ESP32.",
  },
  {
    value: "rs485_modbus",
    label: "RS485 Modbus Register",
    description:
      "Pembacaan nilai kelembapan DMS melalui register komunikasi industri.",
  },
];

export function evaluatePhCategory(
  ph: number | null,
  status: SensorConnectionState
): {
  label: string;
  badgeColor: string;
  description: string;
} {
  if (status === "not_connected" || status === "offline" || ph === null) {
    return {
      label: "Sensor Not Connected",
      badgeColor:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-400",
      description: "Sensor pH tanah belum terhubung atau belum mengirim data.",
    };
  }
  if (ph < 6.0) {
    return {
      label: "Asam (Acidic)",
      badgeColor:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Tanah bersifat asam (pH < 6.0). Perlu pemantauan kapur/dolomit.",
    };
  }
  if (ph <= 7.2) {
    return {
      label: "Netral (Optimal)",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Kondisi pH tanah netral & ideal untuk penyerapan unsur hara.",
    };
  }
  return {
    label: "Basa (Alkaline)",
    badgeColor:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    description: "Tanah bersifat basa (pH > 7.2).",
  };
}

export function convertDmsRawToPercent(
  raw: number | null,
  config: Pick<SoilDeviceConfig, "dms_calibrated" | "dms_raw_dry" | "dms_raw_wet">
): number | null {
  if (raw === null || !config.dms_calibrated) return null;
  const span = config.dms_raw_dry - config.dms_raw_wet;
  if (Math.abs(span) < 1) return null;
  const pct = ((config.dms_raw_dry - raw) / span) * 100;
  return Number(Math.max(0, Math.min(100, pct)).toFixed(1));
}

export function evaluateMoistureCategory(
  moisturePct: number | null,
  rawDms: number | null,
  status: SensorConnectionState,
  calibrated: boolean
): {
  label: string;
  badgeColor: string;
  description: string;
} {
  if (
    status === "not_connected" ||
    status === "offline" ||
    (moisturePct === null && rawDms === null)
  ) {
    return {
      label: "Sensor Not Connected",
      badgeColor:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-400",
      description: "Sensor DMS belum terhubung atau menunggu integrasi.",
    };
  }

  if (!calibrated || moisturePct === null) {
    return {
      label: "Raw Data (Uncalibrated)",
      badgeColor:
        "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      description:
        "Menampilkan nilai mentah sensor DMS. Aktifkan kalibrasi setelah batas kering/basah ditentukan.",
    };
  }

  if (moisturePct < 35) {
    return {
      label: "Kering (Dry)",
      badgeColor:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Kelembapan tanah rendah, membutuhkan penyiraman.",
    };
  }
  if (moisturePct <= 75) {
    return {
      label: "Normal (Optimal)",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Kelembapan tanah berada pada rentang ideal.",
    };
  }
  return {
    label: "Basah (Wet)",
    badgeColor:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    description: "Kelembapan tanah tinggi / jenuh air.",
  };
}

export function evaluateTemperatureCategory(
  tempC: number | null,
  status: SensorConnectionState
): {
  label: string;
  badgeColor: string;
  description: string;
} {
  if (status === "not_connected" || status === "offline" || tempC === null) {
    return {
      label: "Sensor Not Connected",
      badgeColor:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-400",
      description: "Sensor suhu DS18B20 Waterproof belum terhubung.",
    };
  }
  if (tempC < 18) {
    return {
      label: "Dingin (Cool)",
      badgeColor:
        "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      description: "Suhu tanah di bawah rentang optimal pertumbuhan akar.",
    };
  }
  if (tempC <= 33) {
    return {
      label: "Normal / Optimal",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Suhu tanah optimal untuk aktivitas mikroorganisme & akar.",
    };
  }
  return {
    label: "Panas (High Temp)",
    badgeColor:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "Suhu tanah tinggi, potensi evaporasi berlebih.",
  };
}

/**
 * Estimates 12V 7Ah SLA/VRLA battery percentage from resting/operating voltage.
 * Returns null if voltage sensor is not available.
 */
export function estimateBatteryPercentage(voltage: number | null): number | null {
  if (voltage === null || isNaN(voltage)) return null;
  // Standard 12V 7Ah Lead-Acid (11.5V = 0%, 12.8V+ = 100%)
  const minV = 11.4;
  const maxV = 12.85;
  const pct = ((voltage - minV) / (maxV - minV)) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export function determineChargingStatus(params: {
  esp32Online: boolean;
  batteryVoltage: number | null;
  solarVoltage: number | null;
  batteryLowThreshold: number;
  explicitStatus?: ChargingState | null;
}): ChargingState {
  if (!params.esp32Online) return "System Offline";
  if (params.explicitStatus) return params.explicitStatus;
  if (params.batteryVoltage === null) return "Not Available";
  if (params.batteryVoltage <= params.batteryLowThreshold) return "Battery Low";
  if (params.batteryVoltage >= 13.6) return "Battery Full";
  if (
    params.solarVoltage !== null &&
    params.solarVoltage > params.batteryVoltage + 0.5
  ) {
    return "Charging";
  }
  if (params.batteryVoltage >= 13.1) return "Charging";
  return "Discharging";
}
