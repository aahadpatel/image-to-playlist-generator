import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spotify Artist to Song Generator",
  description: "Generate playlists from festival lineups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
