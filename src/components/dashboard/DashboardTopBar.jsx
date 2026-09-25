import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { ArrowDownWideNarrow, ChevronDown, LogOut, Plus, Search } from "lucide-react";

const THEME_OPTIONS = [
  { value: "default", label: "Default theme" },
  { value: "sky", label: "Soft sky blue" },
  { value: "green", label: "Grey + white" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "problems", label: "Most problems" },
];

const formatCount = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`;

const DashboardTopBar = ({
  searchValue,
  sortValue,
  themeValue,
  folderCount,
  problemCount,
  hasLoadedFileSystem,
  onSearchChange,
  onSortChange,
  onThemeChange,
  onCreateFolder,
}) => {
  const clerk = useClerk();
  const { user } = useUser();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const displayName = useMemo(() => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();

    if (first || last) {
      return [first, last].filter(Boolean).join(" ");
    }

    return user?.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  const initials = useMemo(() => {
    const source =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      user?.primaryEmailAddress?.emailAddress ||
      "U";

    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  const summary = hasLoadedFileSystem
    ? `${formatCount(folderCount, "folder", "folders")} · ${formatCount(problemCount, "problem", "problems")}`
    : "Loading workspace";

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await clerk.signOut({ redirectUrl: "/sign-in" });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-mono text-[1.18rem] font-semibold tracking-[-0.03em] text-white">
          Home
        </h1>
        <p className="mt-0.5 text-[12px] text-white/42">{summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1 sm:w-72 sm:flex-none">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/34"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search folders..."
            className="h-9 w-full rounded-xl border border-white/10 bg-[#0c121c] pr-3 pl-9 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-400/24"
          />
        </div>

        <div className="relative">
          <ArrowDownWideNarrow
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/34"
          />
          <select
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort folders"
            className="h-9 appearance-none rounded-xl border border-white/10 bg-[#0c121c] pr-8 pl-9 text-sm text-white outline-none transition-colors focus:border-blue-400/24"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-white/40"
          />
        </div>

        <button
          type="button"
          onClick={onCreateFolder}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-300/30 bg-sky-400/15 px-3 text-sm font-medium text-sky-50 transition hover:border-sky-300/45 hover:bg-sky-400/25"
        >
          <Plus size={15} />
          New folder
        </button>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 text-white/90 transition hover:border-white/18 hover:bg-white/[0.06]"
            title={displayName}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/30 to-cyan-300/20 text-[11px] font-semibold text-sky-100 ring-1 ring-white/12">
              {initials}
            </span>
            <ChevronDown size={14} className="text-white/55" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-56 rounded-2xl border border-white/12 bg-[#0b111b] p-2 shadow-[0_18px_48px_rgba(0,0,0,0.48)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="truncate text-sm font-medium text-white/95">
                  {displayName}
                </p>
                <p className="truncate text-xs text-white/50">
                  {user?.primaryEmailAddress?.emailAddress || ""}
                </p>
              </div>

              <div className="mt-2 px-1">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Card theme
                </p>
                {THEME_OPTIONS.map((option) => {
                  const isActive = themeValue === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onThemeChange(option.value)}
                      className={`mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white/82 transition hover:border-red-300/25 hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-65"
              >
                <LogOut size={14} />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
