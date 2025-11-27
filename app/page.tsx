"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SupabaseUser = {
  id: string;
  email: string;
};

type Doc = {
  id: string;
  user_id: string;
  title: string;
  content_html: string;
  created_at: string;
  updated_at: string;
};

export default function Page() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth session on load
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
        });
      } else {
        setUser(null);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
          });
        } else {
          setUser(null);
        }
      });

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
        <span className="text-xs text-neutral-400">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }

  return <Editor userId={user.id} userEmail={user.email} />;
}

function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setErrorMsg(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-sm border border-neutral-800 rounded-lg p-6 bg-neutral-950">
        <h1 className="text-xl font-semibold mb-4 text-center">Teemo</h1>

        <div className="flex justify-center gap-4 text-xs mb-4">
          <button
            className={
              mode === "login" ? "font-semibold text-sky-400" : "text-neutral-500"
            }
            onClick={() => setMode("login")}
          >
            login
          </button>
          <button
            className={
              mode === "signup" ? "font-semibold text-sky-400" : "text-neutral-500"
            }
            onClick={() => setMode("signup")}
          >
            sign up
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="email"
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm outline-none focus:border-sky-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm outline-none focus:border-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-red-400 whitespace-pre-line">{errorMsg}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 rounded bg-sky-600 text-sm font-medium hover:bg-sky-500 transition disabled:opacity-60"
          >
            {loading ? "…" : mode === "login" ? "login" : "sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Editor({ userId, userEmail }: { userId: string; userEmail: string }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const LAST_DOC_KEY = `minimal-journal-last-doc-id-${userId}`;

  // Load documents from Supabase
  useEffect(() => {
    const loadDocs = async () => {
      setLoadingDocs(true);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading docs:", error.message);
        setLoadingDocs(false);
        return;
      }

      let loaded = (data || []) as Doc[];

      // If no documents: create one "Untitled"
      if (loaded.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from("documents")
          .insert({
            user_id: userId,
            title: "Untitled",
            content_html: "",
          })
          .select()
          .single();

        if (insertError || !inserted) {
          console.error("Error creating initial doc:", insertError?.message);
          setLoadingDocs(false);
          return;
        }

        loaded = [inserted as Doc];
      }

      setDocs(loaded);

      const lastId = localStorage.getItem(LAST_DOC_KEY);
      if (lastId && loaded.some((d) => d.id === lastId)) {
        setSelectedId(lastId);
      } else {
        setSelectedId(loaded[0].id);
      }

      setLoadingDocs(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadDocs();
  }, [userId, LAST_DOC_KEY]);

  // Sync editor content when selected doc changes
  useEffect(() => {
    if (!editorRef.current) return;
    const current = docs.find((d) => d.id === selectedId);

    if (current) {
      if (editorRef.current.innerHTML !== current.content_html) {
        editorRef.current.innerHTML = current.content_html || "";
      }
      localStorage.setItem(LAST_DOC_KEY, current.id);
    } else {
      editorRef.current.innerHTML = "";
    }
  }, [selectedId, docs, LAST_DOC_KEY]);

  const selectedDoc = docs.find((d) => d.id === selectedId) || null;

  const handleInput = () => {
    if (!editorRef.current || !selectedDoc) return;
    const html = editorRef.current.innerHTML;
    const updatedAt = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === selectedDoc.id
          ? { ...doc, content_html: html, updated_at: updatedAt }
          : doc
      )
    );

    (async () => {
      const { error } = await supabase
        .from("documents")
        .update({ content_html: html, updated_at: updatedAt })
        .eq("id", selectedDoc.id);

      if (error) {
        console.error("Error updating doc content:", error.message);
      }
    })();
  };

  // Markdown-style heading: "#", "##", "###" + Space på en tom linje
  const applyMarkdownHeading = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return false;

    const anchorNode = sel.anchorNode;
    const parentElement =
      anchorNode.nodeType === Node.TEXT_NODE
        ? (anchorNode.parentElement as HTMLElement | null)
        : (anchorNode as HTMLElement | null);

    if (!parentElement) return false;

    const block = parentElement.closest(
      "p, div, h1, h2, h3, li"
    ) as HTMLElement | null;
    if (!block) return false;

    const raw = block.textContent || "";
    const text = raw.replace(/\u00a0/g, " ");
    const match = text.match(/^(#+)\s*$/);
    if (!match) return false;

    const level = Math.min(match[1].length, 3); // 1–3
    const tag = `H${level}` as const;

    // eslint-disable-next-line deprecation/deprecation
    document.execCommand("formatBlock", false, tag);

    const sel2 = window.getSelection();
    if (!sel2 || !sel2.anchorNode) return true;

    const anchorNode2 = sel2.anchorNode;
    const container =
      anchorNode2.nodeType === Node.TEXT_NODE
        ? (anchorNode2.parentElement as HTMLElement | null)
        : (anchorNode2 as HTMLElement | null);

    const headingEl = container?.closest(tag.toLowerCase()) as HTMLElement | null;
    if (!headingEl) return true;

    headingEl.innerHTML = "&nbsp;";

    const range = document.createRange();
    range.selectNodeContents(headingEl);
    range.collapse(true);
    sel2.removeAllRanges();
    sel2.addRange(range);

    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key.toLowerCase();

    // Enter inside heading -> new paragraph below
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node: Node | null = sel.anchorNode;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

        const heading = (node as HTMLElement)?.closest("h1, h2, h3");
        if (heading) {
          e.preventDefault();

          const p = document.createElement("p");
          p.innerHTML = "<br>";
          heading.insertAdjacentElement("afterend", p);

          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);

          const sel2 = window.getSelection();
          sel2?.removeAllRanges();
          sel2?.addRange(range);

          handleInput();
          return;
        }
      }
    }

    // Markdown-style: "#"/"##"/"###" + Space på tom linje
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === " ") {
      const transformed = applyMarkdownHeading();
      if (transformed) {
        e.preventDefault();
        handleInput();
        return;
      }
    }

    // Bold: Ctrl+B / Cmd+B
    if ((e.ctrlKey || e.metaKey) && key === "b") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("bold");
      handleInput();
      return;
    }

    // Italic: Ctrl+I / Cmd+I
    if ((e.ctrlKey || e.metaKey) && key === "i") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("italic");
      handleInput();
      return;
    }

    // Headings: Ctrl+Shift+1/2/3
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "1") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("formatBlock", false, "H1");
      handleInput();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "2") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("formatBlock", false, "H2");
      handleInput();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "3") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("formatBlock", false, "H3");
      handleInput();
      return;
    }

    // Normal paragraph: Ctrl+0 / Cmd+0
    if ((e.ctrlKey || e.metaKey) && key === "0") {
      e.preventDefault();
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand("formatBlock", false, "p");
      handleInput();
      return;
    }
  };

  const handleNewDoc = async () => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title: "Untitled",
        content_html: "",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating new doc:", error?.message);
      return;
    }

    const newDoc = data as Doc;
    setDocs((prev) => [...prev, newDoc]);
    setSelectedId(newDoc.id);
  };

  const handleTitleChange = (id: string, title: string) => {
    const updatedAt = new Date().toISOString();

    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, title, updated_at: updatedAt } : doc
      )
    );

    (async () => {
      const { error } = await supabase
        .from("documents")
        .update({ title, updated_at: updatedAt })
        .eq("id", id);

      if (error) {
        console.error("Error updating title:", error.message);
      }
    })();
  };

  const handleDeleteDoc = async (id: string) => {
    if (docs.length <= 1) return;

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      console.error("Error deleting doc:", error.message);
      return;
    }

    setDocs((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) return prev;
      if (selectedId === id) {
        setSelectedId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loadingDocs) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center">
        <span className="text-xs text-neutral-400">Loading documents…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-200"
        >
          Files
        </button>
        <span className="text-[11px] text-neutral-500 truncate max-w-[60%]">
          {selectedDoc?.title || "Untitled"}
        </span>
        <button
          onClick={handleSignOut}
          className="text-[11px] text-neutral-500"
        >
          sign out
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/60"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-10 flex items-center justify-between px-3 text-[11px] text-neutral-400 border-b border-neutral-800">
              <span className="font-medium">documents</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[11px] text-neutral-500 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto text-sm">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedId(doc.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 border-b border-neutral-900 hover:bg-neutral-900 ${
                    selectedId === doc.id ? "bg-neutral-900" : ""
                  }`}
                >
                  <input
                    className="bg-transparent text-xs outline-none flex-1"
                    value={doc.title}
                    onChange={(e) => handleTitleChange(doc.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {docs.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      className="text-[10px] text-neutral-500 hover:text-red-400 cursor-pointer"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-neutral-800 text-[10px] text-neutral-500 flex flex-col">
              <div className="h-6 flex items-center justify-center px-2 truncate">
                {userEmail}
              </div>
              <div className="h-7 flex items-center justify-center border-t border-neutral-800">
                Ctrl+B / I · Ctrl+Shift+1/2/3 · Ctrl+0 · "#"+Space
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 border-r border-neutral-800 bg-neutral-950 flex-col">
        <div className="h-10 flex items-center justify-between px-3 text-[11px] text-neutral-400 border-b border-neutral-800">
          <span className="font-medium">minimal journal</span>
          <button
            onClick={handleNewDoc}
            className="px-2 py-1 rounded border border-neutral-700 hover:border-sky-500"
          >
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto text-sm">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 border-b border-neutral-900 hover:bg-neutral-900 ${
                selectedId === doc.id ? "bg-neutral-900" : ""
              }`}
            >
              <input
                className="bg-transparent text-xs outline-none flex-1"
                value={doc.title}
                onChange={(e) => handleTitleChange(doc.id, e.target.value)}
              />
              {docs.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDoc(doc.id);
                  }}
                  className="text-[10px] text-neutral-500 hover:text-red-400 cursor-pointer"
                >
                  ×
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-800 text-[10px] text-neutral-500 flex flex-col">
          <div className="h-6 flex items-center justify-center px-2 truncate">
            {userEmail}
          </div>
          <div className="h-7 flex items-center justify-between px-2 border-t border-neutral-800">
            <button
              onClick={handleExportTxt}
              className="text-[10px] hover:text-neutral-200"
            >
              export .txt
            </button>
            <button
              onClick={handleSignOut}
              className="text-[10px] text-neutral-500 hover:text-red-400"
            >
              sign out
            </button>
          </div>
          <div className="h-7 flex items-center justify-center border-t border-neutral-800">
            Ctrl+B / I · Ctrl+Shift+1/2/3 · Ctrl+0 · "#"+Space
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex justify-center py-6 md:py-10">
        <div className="w-full max-w-3xl px-2 md:px-4">
          <div
            ref={editorRef}
            contentEditable
            spellCheck={false}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            dir="ltr"
            className="
              min-h-[70vh]
              bg-neutral-900
              border border-neutral-800
              rounded-xl
              px-4 md:px-8
              py-8 md:py-16
              focus:outline-none
              prose prose-invert
              max-w-none
              text-left
              break-words
              overflow-hidden
            "
          />
        </div>
      </div>
    </div>
  );
}
