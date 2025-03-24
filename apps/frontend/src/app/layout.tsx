import type { Metadata, Viewport } from "next";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { VercelAnalytics } from "@/lib/analytics/vercel";
import { geistMono, geistSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProviderWrapper } from "@/providers/trpc-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Webapp Starter Template",
  description: "A monorepo template for building webapps - optimized for ai.",
};
interface RootLayoutProps {
  children: React.ReactNode;
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <TRPCProviderWrapper>
        <html suppressHydrationWarning lang="en">
          <head />
          <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              geistMono.variable,
              geistSans.variable,
            )}
          >
            <Providers attribute="class" defaultTheme="system" enableSystem>
              {children}
              <TailwindIndicator />
              <Toaster />
            </Providers>
            <VercelAnalytics />
          </body>
        </html>
      </TRPCProviderWrapper>
    </ClerkProvider>
  );
}
