import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Soil Monitoring IoT | Industrial ESP32 & 4G Dashboard",
  description:
    "Sistem Pemantauan Tanah Berbasis Industrial IoT menggunakan ESP32, Sensor pH Tanah, Sensor DMS, DS18B20 Waterproof, Modem 4G, dan Tenaga Surya.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartSoil IoT",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
