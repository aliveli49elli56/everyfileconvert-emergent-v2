"use client";

import AdSlot from "./ad-slot";

export default function SidebarAds() {
  return (
    <>
      <div className="hidden xl:block fixed left-0 top-20 h-[calc(100vh-5rem)] z-10">
        <div className="sticky top-20">
          <AdSlot adUnit="left-sidebar-160x600" height={600} width={160} />
        </div>
      </div>
      <div className="hidden xl:block fixed right-0 top-20 h-[calc(100vh-5rem)] z-10">
        <div className="sticky top-20">
          <AdSlot adUnit="right-sidebar-160x600" height={600} width={160} />
        </div>
      </div>
    </>
  );
}
