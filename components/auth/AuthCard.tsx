"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setErrorMsg(null);
    setLoading(true);

    try {
      let error = null;

      if (mode === "login") {
        ({ error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
      } else {
        ({ error } = await supabase.auth.signUp({
          email,
          password,
        }));
      }

      if (error) setErrorMsg(error.message);
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-sm border border-neutral-800 rounded-lg p-6 bg-neutral-950">
        <h1 className="text-xl font-semibold mb-4 text-center">Teemo</h1>

        <div className="flex justify-center gap-4 text-xs mb-4">
          <button
            className={
              mode === "login"
                ? "font-semibold text-sky-400"
                : "text-neutral-500"
            }
            onClick={() => setMode("login")}
          >
            login
          </button>

          <button
            className={
              mode === "signup"
                ? "font-semibold text-sky-400"
                : "text-neutral-500"
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
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="password"
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-red-400 whitespace-pre-line">
              {errorMsg}
            </p>
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
