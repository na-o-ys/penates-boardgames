import type { Metadata } from "next";
import { Cinzel, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-mincho",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ワンナイト人狼",
  description: "ブラウザで遊べるワンナイト人狼ゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${cinzel.variable} ${shipporiMincho.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-game font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  );
}
