"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";

interface DashboardShellProps {
  email: string;
  children: React.ReactNode;
}

export function DashboardShell({ email, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <MobileNav onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex h-screen">
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col overflow-y-auto
            border-r border-line bg-surface px-4 py-5
            transition-transform duration-200 ease-in-out
            md:relative md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3"
            onClick={() => setSidebarOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
              <circle cx="16" cy="14" r="2.5" fill="white"/>
              <path d="M11,18 L7,23 L11,22Z" fill="#818cf8"/>
              <path d="M21,18 L25,23 L21,22Z" fill="#818cf8"/>
              <path d="M14,24 L16,28 L18,24Z" fill="#a78bfa"/>
              <path d="M27,4 L28,6.5 L30,7 L28,7.5 L27,10 L26,7.5 L24,7 L26,6.5Z" fill="#a78bfa"/>
              <path d="M4,21 L4.7,22.5 L6,23 L4.7,23.5 L4,25 L3.3,23.5 L2,23 L3.3,22.5Z" fill="#c4b5fd"/>
            </svg>
            <span className="font-heading text-sm font-semibold">
              Easy Micro SaaS
            </span>
          </Link>

          {/* Nav */}
          <SidebarNav />

          {/* User footer */}
          <div className="mt-auto border-t border-line px-3 pt-4">
            <p className="truncate text-xs text-content-muted">{email}</p>
            <SignOutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 pt-[56px] md:p-8 md:pt-8">
          {children}
        </main>
      </div>
    </>
  );
}
