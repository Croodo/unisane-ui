import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@unisane/ui";

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <ThemeProvider
          config={{
            density: "standard",
            theme: "light",
            radius: "standard",
          }}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
