"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import EditorArea from "./EditorArea";
import { Doc } from "@/types";

export default function Editor({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const LAST_DOC_KEY = `minimal-journal-last-doc-id-${userId}`;

  useEffect(() => {
    const load = async () => {
      setLoadingDocs(true);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) return setLoadingDocs(false);

      let loaded = data || [];

      if (loaded.length === 0) {
        const { data: created } = await supabase
          .from("documents")
          .insert({
            user_id: userId,
            title: "Untitled",
            content_html: "",
          })
          .select()
          .single();

        loaded = [created];
      }

      setDocs(loaded);

      const last = localStorage.getItem(LAST_DOC_KEY);
      setSelectedId(last ?? loaded[0].id);

      setLoadingDocs(false);
    };

    load();
  }, [userId, LAST_DOC_KEY]);

  const selectedDoc = docs.find((d) => d.id === selectedId) || null;

  const updateDoc = async (id: string, fields: Partial<Doc>) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...fields } : d))
    );

    await supabase.from("documents").update(fields).eq("id", id);
  };

  const handleExportTxt = () => {
    if (!editorRef.current || !selectedDoc) return;

    const plainText = editorRef.current.innerText;
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const safeTitle =
      selectedDoc.title.trim().replace(/[^\w\-]+/g, "_") || "journal";

    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loadingDocs) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-100">
        <span className="text-neutral-400 text-xs">Loading documents…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-900 text-neutral-100">
      <Sidebar
        docs={docs}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={async () => {
          const { data } = await supabase
            .from("documents")
            .insert({
              user_id: userId,
              title: "Untitled",
              content_html: "",
            })
            .select()
            .single();

          setDocs((prev) => [...prev, data]);
          setSelectedId(data.id);
        }}
        onDelete={async (id) => {
          await supabase.from("documents").delete().eq("id", id);
          setDocs((prev) => prev.filter((d) => d.id !== id));
        }}
        userEmail={userEmail}
        onSignOut={() => supabase.auth.signOut()}
        onExportTxt={handleExportTxt}
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          selectedDoc={selectedDoc}
          onSignOut={() => supabase.auth.signOut()}
        />

        <EditorArea
          editorRef={editorRef}
          selectedDoc={selectedDoc}
          onChange={(html) =>
            updateDoc(selectedDoc!.id, {
              content_html: html,
              updated_at: new Date().toISOString(),
            })
          }
          onTitleChange={(title) =>
            updateDoc(selectedDoc!.id, {
              title,
              updated_at: new Date().toISOString(),
            })
          }
        />
      </div>
    </div>
  );
}
