"use client";

import React from "react";
import { Doc } from "@/types";

export default function DocumentList({
  docs,
  selectedId,
  onSelect,
  onDelete,
}: {
  docs: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto text-sm">
      {docs.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 
            border-b border-neutral-900 hover:bg-neutral-900 
            ${selectedId === doc.id ? "bg-neutral-900" : ""}`}
        >
          <span className="text-xs flex-1 truncate">
            {doc.title || "Untitled"}
          </span>

          {docs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              className="text-[10px] text-neutral-500 hover:text-red-400 cursor-pointer"
            >
              ×
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
