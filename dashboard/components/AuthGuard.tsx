"use client";

import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { Brain } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 max-w-sm w-full text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">MCP Memory Server</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Sign in to view your personal AI memory dashboard
            </p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
