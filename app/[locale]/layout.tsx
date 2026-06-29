import Script from 'next/script';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Toaster } from '@/components/ui/sonner';
import AdSlot from '@/components/ads/ad-slot';
import { locales, defaultLocale, getDictionary, isRTL, getHreflangLinks } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const hreflangs = getHreflangLinks('');

  return {
    metadataBase: new URL('https://everyfileconvert.com'),
    title: {
      default: meta?.homeTitle || 'EveryFileConvert - Free Online File Converter',
      template: '%s | EveryFileConvert',
    },
    description: meta?.homeDesc || 'Convert any file format instantly in your browser.',
    keywords: 'file converter, video converter, audio converter, image converter, pdf converter, free converter, online converter',
    authors: [{ name: 'EveryFileConvert' }],
    creator: 'EveryFileConvert',
    publisher: 'EveryFileConvert',
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : `${locale}_${locale.toUpperCase()}`,
      url: `https://everyfileconvert.com/${locale}`,
      siteName: 'EveryFileConvert',
      title: meta?.homeTitle || 'EveryFileConvert - Free Online File Converter',
      description: meta?.homeDesc || 'Convert any file format instantly in your browser.',
      images: [{
        url: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200',
        width: 1200,
        height: 630,
        alt: 'EveryFileConvert - Free Online File Converter',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta?.homeTitle || 'EveryFileConvert - Free Online File Converter',
      description: meta?.homeDesc || 'Convert any file format instantly in your browser.',
      images: ['https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200'],
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const rtl = isRTL(locale as Locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-W9Z08BRR2Q"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W9Z08BRR2Q');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "EveryFileConvert",
              "url": "https://everyfileconvert.com",
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "sponsor@everyfileconvert.com",
                "contactType": "customer service",
                "availableLanguage": ["English"]
              },
              "sameAs": []
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        <Navbar locale={locale as Locale} />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)_160px]">
          <aside className="hidden lg:block pt-8" aria-label="Left sidebar advertisement">
            <div className="sticky top-20 flex justify-center">
              <AdSlot adUnit="left-sidebar-160x600" width={160} height={600} />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block pt-8" aria-label="Right sidebar advertisement">
            <div className="sticky top-20 flex justify-center">
              <AdSlot adUnit="right-sidebar-160x600" width={160} height={600} />
            </div>
          </aside>
        </div>
        <Footer locale={locale as Locale} />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
