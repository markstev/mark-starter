"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  FileTextIcon, 
  SettingsIcon, 
  UsersIcon,
  BarChart3Icon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ReplyIcon,
  FileCheckIcon,
  TableIcon,
  GridIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  featureFlag?: string; // Optional feature flag to gate this item
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: HomeIcon,
    description: "Home"
  },
  {
    title: "Grid Demo",
    href: "/grid_example",
    icon: GridIcon,
    description: "Grid"
  },
  {
    title: "SSE Demo",
    href: "/sse_demo",
    icon: ClipboardListIcon,
    description: "SSE Demo"
  },
  {
    title: "GraphQL Demo",
    href: "/graphql_example",
    icon: ReplyIcon,
    description: "GraphQL Demo"
  },
  {
    title: "Users",
    href: "/users",
    icon: UsersIcon,
    description: "User management",
    featureFlag: "dev_pages" // Gate this item
  },
  {
    title: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    description: "Application settings"
    // Removed featureFlag requirement
  }
];

interface LeftNavProps {
  className?: string;
}

export function LeftNav({ className }: LeftNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { isFlagEnabled, isLoading } = useFeatureFlags();

  // Don't render navigation until flags are loaded to prevent flickering
  if (isLoading) {
    return (
      <nav
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-300 ease-in-out w-16",
          className
        )}
      >
        <div className="flex flex-col h-full pt-20 pb-4">
          <div className="flex-1 px-3 space-y-2">
            {/* Loading skeleton */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Filter nav items based on feature flags
  const visibleItems = navItems.filter(item => {
    if (!item.featureFlag) return true;
    return isFlagEnabled(item.featureFlag);
  });

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Set a new timeout to expand after 2 seconds
    const timeout = setTimeout(() => {
      setIsExpanded(true);
    }, 1000);
    
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if mouse leaves before 2 seconds
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsExpanded(false);
  };

  return (
    <nav
      className={cn(
        "fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle button for mobile/desktop control */}
      <div className="absolute -right-3 top-8 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full bg-background border shadow-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronLeftIcon className="h-3 w-3" />
          ) : (
            <ChevronRightIcon className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation items */}
      <div className="flex flex-col h-full pt-20 pb-4">
        <div className="flex-1 px-3 space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span 
                  className={cn(
                    "transition-opacity duration-200",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom section for additional items if needed */}
        <div className="px-3 pt-4 border-t">
          <div className="space-y-2">
            {/* You can add additional items here like user profile, logout, etc. */}
          </div>
        </div>
      </div>
    </nav>
  );
}
