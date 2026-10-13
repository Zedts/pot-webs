"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserModel, getUserDisplayName } from "@/types/user";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

interface HomeContentProps {
  initialUser?: UserModel | null;
}

export function HomeContent({ initialUser }: HomeContentProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const activeUser = user || initialUser;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !activeUser) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, activeUser, router]);

  if (!activeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#A81B1B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#1A1A1A]">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const displayName = getUserDisplayName(activeUser);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0] selection:bg-[#A81B1B] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-card border border-[#F3E7D8] text-center">
        {/* Brand Logo */}
        <div className="w-20 h-20 mx-auto mb-4 drop-shadow-sm">
          <Logo width={80} height={80} className="w-20 h-20 object-contain mx-auto" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Selamat Datang!</h1>
        <p className="text-sm font-semibold text-[#A81B1B] mt-1">{displayName}</p>
        <p className="text-xs text-[#6B7280] mt-1">Portal Presensi & Operasional (POT)</p>

        {/* User Info Card */}
        <div className="mt-6 p-4 rounded-2xl bg-[#FDF6EE] border border-[#F3E7D8] text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Username:</span>
            <span className="font-semibold text-[#1A1A1A]">@{activeUser.username || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Email:</span>
            <span className="font-semibold text-[#1A1A1A]">{activeUser.email || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Role:</span>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#A81B1B]/10 text-[#A81B1B] font-bold text-[11px] uppercase">
              {activeUser.role}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Status:</span>
            <span className="inline-flex items-center space-x-1.5 text-emerald-600 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="capitalize">{activeUser.status}</span>
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <Button type="button" onClick={handleLogout} className="cursor-pointer">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
