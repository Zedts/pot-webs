"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutProvider } from "@/context/LayoutContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated visitors directly to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <LayoutProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F3F6FA]">
        {/* Reusable Collapsible / Mobile Sidebar */}
        <Sidebar />

        {/* Content Column with Fixed Header and Scrollable Viewport */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
