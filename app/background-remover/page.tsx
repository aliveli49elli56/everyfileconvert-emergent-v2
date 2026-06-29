"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Eraser,
  Palette,
  Layers,
  ImagePlus,
  Wand2,
  Download,
} from "lucide-react";

const tools = [
  {
    name: "Background Remover",
    description: "Remove backgrounds from any image instantly with AI",
    icon: Eraser,
    href: "/background-remover/remove",
    color: "from-indigo-500 to-violet-500",
    popular: true,
  },
  {
    name: "Background Replacer",
    description: "Replace backgrounds with solid colors or images",
    icon: Palette,
    href: "/background-remover/replace",
    color: "from-rose-500 to-pink-500",
  },
  {
    name: "Batch Background Remover",
    description: "Remove backgrounds from multiple images at once",
    icon: Layers,
    href: "/background-remover/batch",
    color: "from-cyan-500 to-teal-500",
  },
  {
    name: "Transparent PNG Maker",
    description: "Convert any image to transparent PNG format",
    icon: Wand2,
    href: "/background-remover/transparent",
    color: "from-emerald-500 to-green-500",
  },
  {
    name: "Portrait Mode",
    description: "Add blur effect similar to portrait mode photography",
    icon: ImagePlus,
    href: "/background-remover/portrait",
    color: "from-amber-500 to-orange-500",
  },
];

const useCases = [
  { title: "E-commerce Product Photos", description: "Create clean product images for online stores" },
  { title: "Profile Pictures", description: "Professional headshots with custom backgrounds" },
  { title: "Social Media Graphics", description: "Eye-catching images for marketing" },
  { title: "Presentations", description: "Remove distracting backgrounds from slides" },
  { title: "Graphic Design", description: "Isolate subjects for compositing" },
  { title: "ID Photos", description: "Create passport-ready photos with white backgrounds" },
];

export default function BackgroundRemoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-4 px-3 py-1 bg-indigo-100 text-indigo-700 border-indigo-200"
            >
              AI-Powered
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Background Remover
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Remove image backgrounds instantly with AI. Perfect for product photos, profile pictures, and graphic design.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-xl mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    AI-Powered Background Removal
                  </h2>
                  <p className="text-slate-600 mb-6 max-w-lg">
                    Our advanced AI detects subjects in your photos and removes backgrounds with precision. No manual editing required.
                  </p>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90"
                  >
                    <Eraser className="mr-2 h-5 w-5" />
                    Remove Background
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {tools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110`}
                      >
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">
                            {tool.name}
                          </h3>
                          {tool.popular && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200"
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-indigo-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                      Open Tool
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Popular Use Cases
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all"
                >
                  <h3 className="font-medium text-slate-900 text-sm">
                    {useCase.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Try It Now
          </h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Upload an image and see the magic happen in seconds
          </p>
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90"
            >
              <Download className="mr-2 h-5 w-5" />
              Upload Image
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
