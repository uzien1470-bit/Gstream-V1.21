import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Gstream — Premium Streaming",
  description:
    "Gstream is a premium cinematic streaming platform. Watch movies, TV series and anime in stunning quality with unlimited streaming servers.",
  keywords: [
    "Gstream", "streaming", "movies", "TV series", "anime", "watch online",
    "premium streaming", "cinema",
  ],
  authors: [{ name: "Gstream" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Gstream — Premium Streaming",
    description:
      "Movies, TV series and anime in a luxurious cinematic experience.",
    siteName: "Gstream",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gstream — Premium Streaming",
    description: "Movies, TV series and anime in a luxurious cinematic experience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
