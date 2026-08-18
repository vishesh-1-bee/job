"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/signin");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-lg text-sm font-medium transition active:scale-[0.98] disabled:opacity-50"
    >
      {isLoggingOut ? (
        <div className="h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
      <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}
