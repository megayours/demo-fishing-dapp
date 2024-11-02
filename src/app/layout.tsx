import { Inter } from "next/font/google";
import { ClientProviders } from "./client-providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Crypto Fishing Game",
  description: "A Web3 Fishing Game built on Chromia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
