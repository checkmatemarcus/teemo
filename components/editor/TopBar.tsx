"use client";

import React from "react";
import { Doc } from "@/types";

export default function TopBar({
  selectedDoc,
  onSignOut,
}: {
  selectedDoc: Doc | null;
  onSignOut: () => void;
}) {
  return (
    <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-neutral-800">
      <span className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-200">
        Files
      </span>

      <span className="text-[11px] text-neutral-500 truncate max-w-[60%]">
        {selectedDoc?.title || "Untitled"}
      </span>

      <button
        onClick={onSignOut}
        className="text-[11px] text-neutral-500 hover:text-neutral-200"
      >
        sign out
      </button>
    </div>
  );
}
