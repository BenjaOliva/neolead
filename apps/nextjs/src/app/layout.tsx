import type { Metadata } from "next";

import "~/styles/globals.css";

import { cache } from "react";
import { headers } from "next/headers";
import { Lato } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neolead",
  description: "Plan smarter. Train better. Grow together.",
  openGraph: {
    title: "Neolead",
    description: "Plan smarter. Train better. Grow together.",
    url: "https://neolead.com",
    siteName: "Neolead",
    images: [
      {
        url: "https://neolead.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neolead Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

// Lazy load headers
const getHeaders = cache(async () => headers());

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lato.className}`}>
      <body>
        <TRPCReactProvider headersPromise={getHeaders()}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {props.children}
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
