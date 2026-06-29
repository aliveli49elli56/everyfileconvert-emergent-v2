"use client";

import AdSlot from "./ad-slot";

interface MediumRectangleAdProps {
  className?: string;
}

export default function MediumRectangleAd({
  className = "",
}: MediumRectangleAdProps) {
  return (
    <div className={`flex justify-center z-[1] relative ${className}`}>
      <AdSlot adUnit="medium-rectangle-300x250" height={250} width={300} />
    </div>
  );
}
