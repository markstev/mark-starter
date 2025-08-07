"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="relative sticky top-0 z-50 border-b bg-background">
      <div className="w-full px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/globe.svg"
                alt="App Logo"
                width={120}
                height={36}
                className="h-12 -my-6 w-auto"
              />
            </Link>
          </div>
          <nav className="hidden space-x-6 md:flex">
            <Link
              href="#features"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#use-cases"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="#pricing"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#contact"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>
          <div className="hidden items-center space-x-4 md:flex">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link href="/signin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </SignedOut>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Open menu</span>
            {isMenuOpen ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-[68px] bottom-0 bg-background md:hidden",
          "border-t",
          isMenuOpen ? "block" : "hidden",
        )}
        id="mobile-menu"
        aria-labelledby="mobile-menu-button"
      >
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex flex-col space-y-2">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                href="/signin"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ size: "sm" })}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </SignedOut>
          </div>
          <nav className="flex flex-col space-y-2">
            <Link
              href="#features"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#use-cases"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Use Cases
            </Link>
            <Link
              href="#pricing"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#contact"
              className="font-medium text-muted-foreground text-sm hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
