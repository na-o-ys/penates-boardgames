import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
