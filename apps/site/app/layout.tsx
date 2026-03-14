import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduSync",
  description: "Public website for EduSync",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
