import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Release",
  description: "Gerador de currículos profissionais otimizados para ATS."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
