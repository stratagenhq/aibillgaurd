import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI Bill Guard – Stop Getting Surprised by Your AI Bill",
  description:
    "Connect once. See exactly where every dollar goes across OpenAI, Anthropic, Groq, Gemini, and 10+ more. Get AI-powered savings suggestions. Never get a $4k shock again.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
