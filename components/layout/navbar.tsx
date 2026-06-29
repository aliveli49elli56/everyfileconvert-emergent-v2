"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Video,
  Music,
  Image,
  FileText,
  BookOpen,
  Home,
  Menu,
  Globe,
  ChevronDown,
  X,
  Eye,
} from "lucide-react";
import { locales, localeNames } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { useRouter, usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function getNavLinks(locale: string): NavLink[] {
  return [
    {
      href: `/${locale}`,
      label: "Home",
      icon: Home,
      iconColor: "text-blue-400",
      iconBg: "group-hover:bg-blue-500/10",
    },
    {
      href: `/${locale}/video-converter`,
      label: "Video",
      icon: Video,
      iconColor: "text-orange-400",
      iconBg: "group-hover:bg-orange-500/10",
    },
    {
      href: `/${locale}/audio-converter`,
      label: "Audio",
      icon: Music,
      iconColor: "text-violet-400",
      iconBg: "group-hover:bg-violet-500/10",
    },
    {
      href: `/${locale}/image-converter`,
      label: "Image",
      icon: Image,
      iconColor: "text-emerald-400",
      iconBg: "group-hover:bg-emerald-500/10",
    },
    {
      href: `/${locale}/pdf-tools`,
      label: "PDF",
      icon: FileText,
      iconColor: "text-red-400",
      iconBg: "group-hover:bg-red-500/10",
    },
    {
      href: `/${locale}/ebook-converter`,
      label: "eBook",
      icon: BookOpen,
      iconColor: "text-amber-400",
      iconBg: "group-hover:bg-amber-500/10",
    },
    {
      href: `/${locale}/view`,
      label: "Online Viewer",
      icon: Eye,
      iconColor: "text-cyan-400",
      iconBg: "group-hover:bg-cyan-500/10",
    },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href.endsWith(`/${pathname.split("/")[1]}`) && pathname.split("/").length <= 2) {
    return pathname === href || pathname === href + "/";
  }
  return pathname.startsWith(href + "/") || pathname === href;
}

export default function Navbar({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = getNavLinks(locale);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/") || `/${newLocale}`);
    setLangOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-slate-800/50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-black/10"
          : "bg-slate-900/70 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-cyan-500/20 transition-shadow group-hover:shadow-cyan-500/40">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 019.9-1.5M9 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Every<span className="text-cyan-400">File</span>Convert
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  active
                    ? "text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {/* Active background glow */}
                {active && (
                  <span className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/10" />
                )}
                {/* Hover background */}
                {!active && (
                  <span className="absolute inset-0 rounded-lg bg-transparent transition-colors duration-200 group-hover:bg-white/[0.04]" />
                )}
                <link.icon
                  className={`h-4 w-4 mr-2 transition-all duration-200 ${
                    active
                      ? link.iconColor
                      : "text-slate-400 group-hover:-translate-y-0.5"
                  } ${!active && `group-hover:${link.iconColor}`}`}
                />
                <span className="relative">{link.label}</span>
                {/* Active bottom indicator */}
                {active && (
                  <span
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-5/6 rounded-full ${link.iconColor.replace("text-", "bg-")} shadow-sm`}
                    style={{
                      boxShadow: `0 0 8px ${
                        link.iconColor === "text-blue-400"
                          ? "rgb(96,165,250,0.5)"
                          : link.iconColor === "text-orange-400"
                          ? "rgb(251,146,60,0.5)"
                          : link.iconColor === "text-violet-400"
                          ? "rgb(167,139,250,0.5)"
                          : link.iconColor === "text-emerald-400"
                          ? "rgb(52,211,153,0.5)"
                          : link.iconColor === "text-red-400"
                          ? "rgb(248,113,113,0.5)"
                          : link.iconColor === "text-amber-400"
                          ? "rgb(251,191,36,0.5)"
                          : "rgb(34,211,238,0.5)"
                      }`,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div ref={langDropdownRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase text-xs font-semibold tracking-wider">
                {locale}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/20 py-1.5 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 mb-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    Language
                  </p>
                </div>
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={`w-full text-left px-3 py-2 text-sm transition-all duration-150 flex items-center justify-between ${
                      l === locale
                        ? "text-cyan-400 bg-cyan-500/10 font-medium"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{localeNames[l]}</span>
                    <span className="text-xs text-slate-500 uppercase font-mono">
                      {l}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start Converting CTA */}
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200 font-semibold"
            asChild
          >
            <Link href={`/${locale}`}>Start Converting</Link>
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button className="flex items-center justify-center h-10 w-10 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[360px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/50 p-0"
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800/50">
              <Link
                href={`/${locale}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 019.9-1.5M9 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Every<span className="text-cyan-400">File</span>Convert
                </span>
              </Link>
            </div>

            {/* Mobile nav links */}
            <div className="flex flex-col py-4 px-3">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                      active
                        ? "text-white bg-white/[0.06] ring-1 ring-white/10"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? `${link.iconBg} ${link.iconColor}`
                          : "bg-white/[0.04] text-slate-400 group-hover:-translate-y-0.5"
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                    </div>
                    <span>{link.label}</span>
                    {active && (
                      <span
                        className={`ml-auto h-1.5 w-1.5 rounded-full ${link.iconColor.replace("text-", "bg-")}`}
                        style={{
                          boxShadow: `0 0 6px ${
                            link.iconColor === "text-blue-400"
                              ? "rgb(96,165,250,0.6)"
                              : link.iconColor === "text-orange-400"
                              ? "rgb(251,146,60,0.6)"
                              : link.iconColor === "text-violet-400"
                              ? "rgb(167,139,250,0.6)"
                              : link.iconColor === "text-emerald-400"
                              ? "rgb(52,211,153,0.6)"
                              : link.iconColor === "text-red-400"
                              ? "rgb(248,113,113,0.6)"
                              : "rgb(251,191,36,0.6)"
                          }`,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile language switcher */}
            <div className="border-t border-slate-800/50 px-5 py-4">
              <button
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex items-center justify-between w-full text-sm text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-semibold">
                    {localeNames[locale]}
                  </span>
                  <span className="text-xs text-slate-500 uppercase font-mono">
                    ({locale})
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    mobileLangOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileLangOpen && (
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        switchLocale(l);
                        setIsOpen(false);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        l === locale
                          ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile CTA */}
            <div className="px-5 pb-6">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20 font-semibold h-11"
                asChild
              >
                <Link
                  href={`/${locale}`}
                  onClick={() => setIsOpen(false)}
                >
                  Start Converting
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
