import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import "../globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlbionCreator - Opportunités économiques Albion Online",
  description: "Trouvez les meilleures opportunités de profit dans Albion Online : transport, craft, flipper et Black Market.",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "fr" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen bg-background flex flex-col">
            <Header locale={locale} />
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t border-albion-blue/30 py-6 mt-8">
              <div className="container mx-auto px-4 text-center text-xs text-muted-foreground space-y-1">
                <p>Ce site n&apos;est pas affilié avec Sandbox Interactive ou Albion Online.</p>
                <p>Données fournies par l&apos;API Albion Online Data Project.</p>
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
