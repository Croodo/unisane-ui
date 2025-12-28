import "./globals.css";
import "material-symbols/outlined.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider, Toaster } from "@unisane/ui";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Unisane UI - Material 3 Design System",
  description:
    "Production-ready React components with sophisticated theming, accessibility, and exceptional developer experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-scheme="monochrome"
      data-density="standard"
      data-radius="standard"
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
