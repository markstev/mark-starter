"use client";

import { Header } from "./header";
import { LeftNav } from "./left_nav";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  showLeftNav?: boolean;
}

export function Layout({ children, showLeftNav = true }: LayoutProps) {
  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />
      <div className="h-full flex flex-1 pb-8 overflow-auto">
        {showLeftNav && <LeftNav />}
        <main 
          className={cn(
            "transition-all duration-300 ease-in-out flex-1",
            showLeftNav ? "ml-16" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
} 