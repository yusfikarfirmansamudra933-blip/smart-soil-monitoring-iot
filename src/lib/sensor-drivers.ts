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
  status: SensorConnectionState,
  minIdeal = 6.0,
  maxIdeal = 7.2
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
  if (ph < minIdeal) {
    return {
      label: "Asam",
      badgeColor:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: `pH di bawah target ideal (${minIdeal.toFixed(1)}).`,
    };
  }
  if (ph <= maxIdeal) {
    return {
      label: "Ideal",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Kondisi pH sesuai target tanaman.",
    };
  }
  return {
    label: "Basa",
    badgeColor:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    description: `pH melebihi target ideal (${maxIdeal.toFixed(1)}).`,
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
  calibrated: boolean,
  minIdeal = 35,
  maxIdeal = 75
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
      description: "Sensor kelembapan belum terhubung.",
    };
  }

  if (!calibrated || moisturePct === null) {
    return {
      label: "Raw Data",
      badgeColor:
        "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      description: "Menampilkan nilai mentah sensor.",
    };
  }

  if (moisturePct < minIdeal) {
    return {
      label: "Kering",
      badgeColor:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Kelembapan tanah di bawah target ideal.",
    };
  }
  if (moisturePct <= maxIdeal) {
    return {
      label: "Ideal",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Kelembapan tanah sesuai target tanaman.",
    };
  }
  return {
    label: "Basah",
    badgeColor:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    description: "Kelembapan tanah melebihi target ideal.",
  };
}

export function evaluateTemperatureCategory(
  tempC: number | null,
  status: SensorConnectionState,
  minIdeal = 18,
  maxIdeal = 33
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
  if (tempC < minIdeal) {
    return {
      label: "Dingin",
      badgeColor:
        "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      description: "Suhu tanah di bawah rentang target tanaman.",
    };
  }
  if (tempC <= maxIdeal) {
    return {
      label: "Ideal",
      badgeColor:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Suhu tanah sesuai target tanaman.",
    };
  }
  return {
    label: "Panas",
    badgeColor:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "Suhu tanah di atas rentang target tanaman.",
  };
}

/**
 * Estimates 3S Li-ion (9.6V - 12.6V) battery percentage from operating voltage.
 * Returns null if voltage sensor is not available.
 */
export function estimateBatteryPercentage(voltage: number | null): number | null {
  if (voltage === null || isNaN(voltage)) return null;
  // 3S Li-ion 18650 Pack (9.6V = 0%, 12.6V = 100%)
  const minV = 9.6;
  const maxV = 12.6;
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
  if (params.batteryVoltage >= 12.45) return "Battery Full";
  if (
    params.solarVoltage !== null &&
    params.solarVoltage > params.batteryVoltage + 0.5
  ) {
    return "Charging";
  }
  return "Discharging";
}
