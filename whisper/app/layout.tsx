import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { TogetherApiKeyProvider } from "@/components/TogetherApiKeyProvider";
import { Footer } from "@/components/Footer";
import PlausibleProvider from "next-plausible";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noted - Capture Your Thoughts By Voice",
  description: "Convert your thoughts into text by voice with Noted.",
  icons: {
    icon: [
      { url: "/noted_icon2.png", sizes: "64x64", type: "image/png" },
      { url: "/noted_icon2.png", sizes: "128x128", type: "image/png" },
      { url: "/noted_icon2.png", sizes: "192x192", type: "image/png" },
      { url: "/noted_icon2.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/noted_icon2.png",
    apple: [
      { url: "/noted_icon2.png", sizes: "180x180", type: "image/png" },
      { url: "/noted_icon2.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    images: "https://usewhisper.io/og.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use client-side navigation for login/signup
  // This must be a Client Component to use useRouter, so we can use a workaround:
  // Place a ClientHeader component below
  return (
    <ClerkProvider>
      <TogetherApiKeyProvider>
        <TRPCReactProvider>
          <html lang="en">
            <head>
              <PlausibleProvider domain="usewhisper.io" />
            </head>
            <body className={`${raleway.variable} antialiased`}>
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                {children}
                <Footer />
                <Toaster richColors />
              </div>
            </body>
          </html>
        </TRPCReactProvider>
      </TogetherApiKeyProvider>
    </ClerkProvider>
  );
}
