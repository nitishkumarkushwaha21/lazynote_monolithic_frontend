import React from "react";

const badgeClasses = {
  Easy: "border-emerald-400/15 bg-emerald-500/10 text-emerald-300",
  Medium: "border-amber-400/15 bg-amber-500/10 text-amber-300",
  Hard: "border-rose-400/15 bg-rose-500/10 text-rose-300",
};

const PlaylistDifficultyBadge = ({ difficulty }) => {
  const className =
    badgeClasses[difficulty] ||
    "border-white/10 bg-white/[0.03] text-zinc-400";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
      {difficulty || "Unknown"}
    </span>
  );
};

export default PlaylistDifficultyBadge;
