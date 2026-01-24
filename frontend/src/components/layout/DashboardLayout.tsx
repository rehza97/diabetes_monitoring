import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useKeyboardShortcuts, commonShortcuts } from "@/hooks/useKeyboardShortcuts";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Enable keyboard shortcuts globally
  useKeyboardShortcuts(commonShortcuts, true);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9fa]">
          {children}
        </main>
      </div>
    </div>
  );
}
