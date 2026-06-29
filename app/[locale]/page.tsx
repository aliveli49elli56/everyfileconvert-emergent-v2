import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const hreflangs = getHreflangLinks("");

  return {
    title: meta?.homeTitle,
    description: meta?.homeDesc,
    openGraph: {
      url: `https://everyfileconvert.com/${locale}`,
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function LocaleHome({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return <HomeClient dict={dict} locale={locale as Locale} />;
}
