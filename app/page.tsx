"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthCard from "@/components/auth/AuthCard";
import Editor from "@/components/editor/Editor";
import { SupabaseUser } from "@/types";

export default function Page() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(
            session?.user
              ? { id: session.user.id, email: session.user.email ?? "" }
              : null
          );
        }
      );

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xs text-neutral-400">Loading…</span>
      </div>
    );
  }

  return user ? (
    <Editor userId={user.id} userEmail={user.email} />
  ) : (
    <AuthCard />
  );
}
