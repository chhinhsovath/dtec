import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សា TEC",
  description: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សាដែលប្រើបច្ចេកវិទ្យាលើកកម្ពស់ថ្នាក់រៀន",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Battambang:wght@100;300;400;700;900&family=Hanuman:wght@100..900&family=Noto+Serif+Khmer:wght@100..900&family=Ubuntu+Sans:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
