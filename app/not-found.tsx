"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100">
            <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              404
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
              Page Not Found
            </h1>
            <p className="text-lg text-slate-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Link href="/">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>
          <Link href="/image-converter">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-slate-300 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Explore Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Popular conversions:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "PNG to JPG", href: "/png-to-jpg" },
              { label: "MP4 to WebM", href: "/mp4-to-webm" },
              { label: "MP3 to WAV", href: "/mp3-to-wav" },
              { label: "PDF to DOCX", href: "/pdf-to-docx" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
