"use client";

import React, { useEffect } from "react";
import { Doc } from "@/types";

export default function EditorArea({
  editorRef,
  selectedDoc,
  onChange,
  onTitleChange,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  selectedDoc: Doc | null;
  onChange: (html: string) => void;
  onTitleChange: (title: string) => void;
}) {
  // Sync editor when selected doc changes
  useEffect(() => {
    if (!editorRef.current) return;
    if (!selectedDoc) {
      editorRef.current.innerHTML = "";
      return;
    }

    if (editorRef.current.innerHTML !== selectedDoc.content_html) {
      editorRef.current.innerHTML = selectedDoc.content_html ?? "";
    }
  }, [selectedDoc, editorRef]);

  const handleInput = () => {
    if (!editorRef.current || !selectedDoc) return;
    onChange(editorRef.current.innerHTML);
  };

  const applyMarkdownHeading = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return false;

    const anchorNode = sel.anchorNode;
    const parentElement =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : (anchorNode as HTMLElement);

    if (!parentElement) return false;

    const block = parentElement.closest(
      "p, div, h1, h2, h3, li"
    ) as HTMLElement | null;
    if (!block) return false;

    const raw = block.textContent || "";
    const text = raw.replace(/\u00a0/g, " ");
    const match = text.match(/^(#+)\s*$/);
    if (!match) return false;

    const level = Math.min(match[1].length, 3);

    document.execCommand("formatBlock", false, `H${level}`);

    const sel2 = window.getSelection();
    if (!sel2 || !sel2.anchorNode) return true;

    const anchorNode2 = sel2.anchorNode;
    const container =
      anchorNode2.nodeType === Node.TEXT_NODE
        ? anchorNode2.parentElement
        : (anchorNode2 as HTMLElement);

    const headingEl = container?.closest(
      `h${level}`
    ) as HTMLElement | null;

    if (headingEl) {
      headingEl.innerHTML = "&nbsp;";
      const range = document.createRange();
      range.selectNodeContents(headingEl);
      range.collapse(true);
      sel2.removeAllRanges();
      sel2.addRange(range);
    }

    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key.toLowerCase();

    // Enter inside heading → create paragraph after
    if (e.key === "Enter") {
      const sel = window.getSelection();
      const node = sel?.anchorNode;

      if (node) {
        const parent =
          node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : (node as HTMLElement);

        const heading = parent?.closest("h1, h2, h3");
        if (heading) {
          e.preventDefault();

          const p = document.createElement("p");
          p.innerHTML = "<br>";
          heading.insertAdjacentElement("afterend", p);

          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);

          sel?.removeAllRanges();
          sel?.addRange(range);

          handleInput();
          return;
        }
      }
    }

    // Markdown "#", "##", "###" + space
    if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (applyMarkdownHeading()) {
        e.preventDefault();
        handleInput();
        return;
      }
    }

    // Bold Ctrl+B / Cmd+B
    if ((e.ctrlKey || e.metaKey) && key === "b") {
      e.preventDefault();
      document.execCommand("bold");
      handleInput();
      return;
    }

    // Italic Ctrl+I / Cmd+I
    if ((e.ctrlKey || e.metaKey) && key === "i") {
      e.preventDefault();
      document.execCommand("italic");
      handleInput();
      return;
    }

    // Headings Ctrl+Shift+1/2/3
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      if (key === "1") {
        e.preventDefault();
        document.execCommand("formatBlock", false, "H1");
        handleInput();
        return;
      }
      if (key === "2") {
        e.preventDefault();
        document.execCommand("formatBlock", false, "H2");
        handleInput();
        return;
      }
      if (key === "3") {
        e.preventDefault();
        document.execCommand("formatBlock", false, "H3");
        handleInput();
        return;
      }
    }

    // Paragraph Ctrl+0 / Cmd+0
    if ((e.ctrlKey || e.metaKey) && key === "0") {
      e.preventDefault();
      document.execCommand("formatBlock", false, "p");
      handleInput();
      return;
    }
  };

  if (!selectedDoc) return null;

  return (
    <div className="flex-1 flex justify-center py-6 md:py-10">
      <div className="w-full max-w-3xl px-2 md:px-4">
        <div className="min-h-[70vh] bg-neutral-900 border border-neutral-800 rounded-xl px-4 md:px-8 py-6 md:py-10 flex flex-col">
          {/* Title */}
          <input
            className="bg-transparent text-sm md:text-base font-medium mb-4 outline-none border-b border-neutral-800/60 pb-1"
            value={selectedDoc.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
          />

          {/* ContentEditable */}
          <div
            ref={editorRef}
            contentEditable
            spellCheck={false}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="
              flex-1
              mt-2
              prose prose-invert
              max-w-none
              text-left
              break-words
              focus:outline-none
            "
          />
        </div>
      </div>
    </div>
  );
}
