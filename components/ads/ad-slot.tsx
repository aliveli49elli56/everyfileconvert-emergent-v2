"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  adUnit: string;
  height: number;
  width: number;
  className?: string;
}

export default function AdSlot({
  adUnit,
  height,
  width,
  className = "",
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isProduction = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (isProduction && adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, [isProduction]);

  if (isProduction) {
    return (
      /* <!-- REKLAM KODU BURAYA GELECEK --> */
      <ins
        ref={adRef}
        className={`adsbygoogle ${className}`}
        style={{
          display: "inline-block",
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adUnit}
        data-ad-format="auto"
        data-full-width-responsive="false"
      />
    );
  }

  // Development placeholder
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-lg overflow-hidden ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      data-testid={`ad-slot-${adUnit}`}
    >
      {/* <!-- REKLAM KODU BURAYA GELECEK --> */}
      <p className="text-[10px] text-gray-400 tracking-widest uppercase font-medium">
        Advertisement
      </p>
      <p className="text-[9px] text-gray-300 mt-1 tracking-wide">
        {width} × {height}
      </p>
    </div>
  );
}
