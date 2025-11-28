"use client";

import React from "react";
import { Doc } from "@/types";
import DocumentList from "./DocumentList";

export default function Sidebar({
  docs,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  userEmail,
  onSignOut,
  onExportTxt,
}: {
  docs: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  userEmail: string;
  onSignOut: () => void;
  onExportTxt: () => void;
}) {
  return (
    <div className="hidden md:flex w-56 border-r border-neutral-800 bg-neutral-950 flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 text-[11px] text-neutral-400 border-b border-neutral-800">
        <span className="font-medium">minimal journal</span>

        <button
          onClick={onCreate}
          className="px-2 py-1 rounded border border-neutral-700 hover:border-sky-500"
        >
          New
        </button>
      </div>

      {/* Document List */}
      <DocumentList
        docs={docs}
        selectedId={selectedId}
        onSelect={onSelect}
        onDelete={onDelete}
      />

      {/* Footer */}
      <div className="border-t border-neutral-800 text-[10px] text-neutral-500 flex flex-col">
        <div className="h-6 flex items-center justify-center px-2 truncate">
          {userEmail}
        </div>

        {/* export + sign out */}
        <div className="h-7 flex items-center justify-between px-2 border-t border-neutral-800">
          <button
            onClick={onExportTxt}
            className="text-[10px] hover:text-neutral-200"
          >
            export .txt
          </button>

          <button
            onClick={onSignOut}
            className="text-[10px] text-neutral-500 hover:text-red-400"
          >
            sign out
          </button>
        </div>

        <div className="h-7 flex items-center justify-center border-t border-neutral-800">
          glizzy?
        </div>
      </div>
    </div>
  );
}
