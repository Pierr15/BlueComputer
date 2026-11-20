import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "BlueComputer — Built for the way you work",
  description: "Hardware dan accessories terkurasi untuk setup yang benar-benar terasa milikmu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <Script id="theme-preference" strategy="beforeInteractive">{`try { const t = localStorage.getItem('bluecomputer-theme'); document.documentElement.dataset.theme = t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}`}</Script>
        {children}
      </body>
    </html>
  );
}
