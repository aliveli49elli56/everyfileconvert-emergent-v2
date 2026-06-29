"use client";

import AdSlot from "./ad-slot";

export default function LeaderboardAd() {
  return (
    <div className="flex justify-center w-full py-4">
      <AdSlot adUnit="leaderboard-728x90" height={90} width={728} />
    </div>
  );
}
