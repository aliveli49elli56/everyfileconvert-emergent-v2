import Link from "next/link";
import { FileVideo, FileAudio, Image, FileText } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

interface FooterProps {
  locale: Locale;
}

const categories = [
  { name: "Video", icon: FileVideo, count: "16 formats" },
  { name: "Audio", icon: FileAudio, count: "13 formats" },
  { name: "Image", icon: Image, count: "22 formats" },
  { name: "Document", icon: FileText, count: "24 formats" },
];

export default function Footer({ locale }: FooterProps) {
  const footerLinks = {
    product: [
      { label: "Video Converter", href: `/${locale}/video-converter` },
      { label: "Audio Converter", href: `/${locale}/audio-converter` },
      { label: "Image Converter", href: `/${locale}/image-converter` },
      { label: "Document Converter", href: `/${locale}/pdf-tools` },
    ],
    popular: [
      { label: "MP4 to WebM", href: `/${locale}/mp4-to-webm` },
      { label: "MP3 to WAV", href: `/${locale}/mp3-to-wav` },
      { label: "PNG to JPG", href: `/${locale}/png-to-jpg` },
      { label: "PDF to DOCX", href: `/${locale}/pdf-to-docx` },
      { label: "HEIC to JPG", href: `/${locale}/heic-to-jpg` },
    ],
    company: [
      { label: "About Us", href: `/${locale}/about` },
      { label: "Privacy Policy", href: `/${locale}/privacy` },
      { label: "Terms of Service", href: `/${locale}/terms` },
      { label: "Contact", href: `/${locale}/contact` },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center space-x-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 019.9-1.5M9 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">EveryFileConvert</span>
            </Link>
            <p className="text-slate-400 text-sm mb-6 max-w-md">
              Convert any file format directly in your browser. No uploads to servers, no privacy concerns. Your files stay on your device.
            </p>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-sm">
                  <cat.icon className="h-4 w-4 text-cyan-400" />
                  <span>{cat.name}</span>
                  <span className="text-slate-500">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Popular Conversions</h3>
            <ul className="space-y-2">
              {footerLinks.popular.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EveryFileConvert. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              100% Client-Side Processing
            </span>
            <span>|</span>
            <span>No Server Uploads</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
