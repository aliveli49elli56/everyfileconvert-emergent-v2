"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatRegistry } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import type { FormatCategory } from "@/lib/types/formats";

// All categories handled by the image converter page
const IMAGE_CONVERTER_CATEGORIES: FormatCategory[] = ["image", "raw", "vector", "icon", "cad"];

// Derive flat list of source extensions that have at least one conversion target
const ALL_IMAGE_SOURCES: string[] = formatRegistry.getAll()
  .filter((f) => IMAGE_CONVERTER_CATEGORIES.includes(f.category))
  .filter((f) => conversionRegistry.getTargets(f.ext).length > 0)
  .map((f) => f.ext);

// Group source formats by tier for the dropdown
const SOURCE_TIER_GROUPS = {
  popular:  ALL_IMAGE_SOURCES.filter((ext) => formatRegistry.get(ext)?.tier === "popular"),
  standard: ALL_IMAGE_SOURCES.filter((ext) => formatRegistry.get(ext)?.tier === "standard"),
  advanced: ALL_IMAGE_SOURCES.filter((ext) => formatRegistry.get(ext)?.tier === "advanced"),
} as const;

function getLabel(ext: string): string {
  const entry = formatRegistry.get(ext);
  if (!entry) return ext.toUpperCase();
  // Use the short first word of the name (e.g. "PNG" from "PNG Image")
  return entry.name.split(" ")[0];
}

interface ImageFormatSelectorProps {
  initialSourceFormat?: string;
  initialTargetFormat?: string;
  onSelectionChange?: (source: string, target: string) => void;
}

export default function ImageFormatSelector({
  initialSourceFormat = "png",
  initialTargetFormat,
  onSelectionChange,
}: ImageFormatSelectorProps) {
  const router = useRouter();

  const [sourceFormat, setSourceFormat] = useState<string>(initialSourceFormat);
  const [targetFormat, setTargetFormat] = useState<string>(() => {
    if (initialTargetFormat) return initialTargetFormat;
    const targets = conversionRegistry.getTargets(initialSourceFormat);
    return targets[0] ?? "";
  });

  const targetOptions = conversionRegistry.getTargets(sourceFormat);

  // Group target options by tier
  const targetTierGroups = {
    popular:  targetOptions.filter((ext) => formatRegistry.get(ext)?.tier === "popular"),
    standard: targetOptions.filter((ext) => formatRegistry.get(ext)?.tier === "standard"),
    advanced: targetOptions.filter((ext) => formatRegistry.get(ext)?.tier === "advanced"),
  };

  useEffect(() => {
    if (!targetOptions.includes(targetFormat) && targetOptions.length > 0) {
      setTargetFormat(targetOptions[0]);
    }
  }, [sourceFormat]);

  const handleSourceChange = (value: string) => {
    setSourceFormat(value);
    const newTargets = conversionRegistry.getTargets(value);
    if (!newTargets.includes(targetFormat) && newTargets.length > 0) {
      setTargetFormat(newTargets[0]);
    }
  };

  const handleNavigate = () => {
    const slug = `${sourceFormat}-to-${targetFormat}`;
    router.push(`/${slug}`);
    onSelectionChange?.(sourceFormat, targetFormat);
  };

  const TIER_LABELS = { popular: "Popular", standard: "Standard", advanced: "Advanced" } as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Source Format</label>
          <Select value={sourceFormat} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select source format" />
            </SelectTrigger>
            <SelectContent>
              {(["popular", "standard", "advanced"] as const).map((tier) =>
                SOURCE_TIER_GROUPS[tier].length > 0 ? (
                  <SelectGroup key={tier}>
                    <SelectLabel>{TIER_LABELS[tier]}</SelectLabel>
                    {SOURCE_TIER_GROUPS[tier].map((ext) => (
                      <SelectItem key={ext} value={ext}>
                        <span className="font-medium">.{getLabel(ext)}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Target format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Target Format</label>
          <Select value={targetFormat} onValueChange={setTargetFormat}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select target format" />
            </SelectTrigger>
            <SelectContent>
              {(["popular", "standard", "advanced"] as const).map((tier) =>
                targetTierGroups[tier].length > 0 ? (
                  <SelectGroup key={tier}>
                    <SelectLabel>{TIER_LABELS[tier]}</SelectLabel>
                    {targetTierGroups[tier].map((ext) => (
                      <SelectItem key={ext} value={ext}>
                        <span className="font-medium">.{getLabel(ext)}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sourceFormat && targetFormat && (
        <button
          onClick={handleNavigate}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
        >
          <Badge variant="outline" className="text-sm font-mono font-semibold px-3 py-1">
            .{getLabel(sourceFormat)}
          </Badge>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <Badge variant="outline" className="text-sm font-mono font-semibold px-3 py-1">
            .{getLabel(targetFormat)}
          </Badge>
        </button>
      )}
    </div>
  );
}
