import type { Metadata } from "next";

import "~/styles/globals.css";

import { cache } from "react";
import { headers } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "T3 turbo x Supabase",
  description: "Simple monorepo with shared backend for web & mobile apps",
};

// Lazy load headers
const getHeaders = cache(async () => headers());

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider headersPromise={getHeaders()}>
          {props.children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
