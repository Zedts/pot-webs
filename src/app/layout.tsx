import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cinzel, Playball } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const playball = Playball({
  variable: "--font-playball",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "POT - Presensi & Operasional",
  description: "Portal terpadu pencatatan presensi, pemantauan pengiriman stok, dan rekonsiliasi data lapak harian Oleh-Oleh Turki Official.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${cinzel.variable} ${playball.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFF8F0] text-[#1A1A1A] font-sans selection:bg-[#A81B1B] selection:text-white">
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
